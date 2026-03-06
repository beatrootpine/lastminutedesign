// Vercel Serverless Function — /api/db
// All database operations via Supabase REST API (no imports needed)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPA || !KEY) return res.status(500).json({ error: "Supabase not configured" });

  const { action } = req.method === "GET" ? req.query : req.body;

  // Email helper — fire and forget
  const notify = async (type, data) => {
    try {
      const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
      const FROM = process.env.SENDGRID_FROM_EMAIL;
      if (!SENDGRID_KEY || !FROM || !data.to) return;

      const subjects = {
        gig_accepted: `A designer has accepted your gig: ${data.service || ""}`,
        new_message: `New message on your ${data.service || ""} gig`,
        file_uploaded: `New file uploaded to your ${data.service || ""} gig`,
        gig_delivered: `Your ${data.service || ""} design is ready to review`,
        new_rating: `You received a ${data.rating || ""}★ rating`,
      };

      const bodies = {
        gig_accepted: `<p>Hi ${data.customerName || "there"},</p><p><strong>${data.designerName}</strong> has accepted your <strong>${data.service}</strong> gig and is working on it now.</p><p>Turnaround: <strong>${data.turnaround}h</strong></p><p><a href="https://lastminutedesigns.co.za">View your dashboard →</a></p>`,
        new_message: `<p>Hi ${data.recipientName || "there"},</p><p><strong>${data.senderName}</strong> sent a message on your <strong>${data.service}</strong> gig:</p><p style="padding:12px;background:#f5f5f5;border-radius:8px;color:#333">"${(data.message || "").slice(0, 200)}"</p><p><a href="https://lastminutedesigns.co.za">Reply now →</a></p>`,
        file_uploaded: `<p>Hi ${data.recipientName || "there"},</p><p><strong>${data.uploaderName}</strong> uploaded a file to your <strong>${data.service}</strong> gig:</p><p>📎 <strong>${data.fileName || "file"}</strong></p><p><a href="https://lastminutedesigns.co.za">View files →</a></p>`,
        gig_delivered: `<p>Hi ${data.customerName || "there"},</p><p><strong>${data.designerName}</strong> has delivered your <strong>${data.service}</strong> design.</p><p>Head to your dashboard to review, accept, and rate.</p><p><a href="https://lastminutedesigns.co.za">Review now →</a></p>`,
        new_rating: `<p>Hi ${data.designerName || "there"},</p><p>You received a <strong>${data.rating}★</strong> rating for <strong>${data.service}</strong>.</p>${data.feedback ? `<p>"${data.feedback}"</p>` : ""}<p><a href="https://lastminutedesigns.co.za">View dashboard →</a></p>`,
      };

      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${SENDGRID_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: data.to }] }],
          from: { email: FROM, name: "Last Minute Designs" },
          subject: subjects[type] || "Update on your gig",
          content: [{ type: "text/html", value: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">${bodies[type] || ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:11px">Last Minute Designs · lastminutedesigns.co.za</p></div>` }],
        }),
      });
    } catch (e) { console.error("Notify error:", e.message); }
  };
  if (!action) return res.status(400).json({ error: "Missing action" });

  // Helper: query Supabase REST API
  async function db(path, opts = {}) {
    const r = await fetch(`${SUPA}/rest/v1/${path}`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: opts.prefer || "return=representation",
      },
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(txt);
    return txt ? JSON.parse(txt) : null;
  }

  try {
    switch (action) {

      case "customer_login": {
        const { email, name } = req.body;
        const ex = await db(`customers?email=eq.${encodeURIComponent(email)}&limit=1`);
        if (ex && ex.length > 0) return res.json({ customer: ex[0] });
        const c = await db("customers", { method: "POST", body: { email, name } });
        return res.json({ customer: c[0] });
      }

      case "designer_register": {
        const { email, name, city, bio, skills } = req.body;
        const ex = await db(`designers?email=eq.${encodeURIComponent(email)}&limit=1`);
        if (ex && ex.length > 0) return res.json({ designer: ex[0], existing: true });
        const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        const d = await db("designers", { method: "POST", body: { email, name, city, bio, skills, avatar_initials: initials, is_online: true, is_approved: true } });
        return res.json({ designer: d[0] });
      }

      case "designer_login": {
        const { email } = req.body;
        const d = await db(`designers?email=eq.${encodeURIComponent(email)}&limit=1`);
        if (!d || d.length === 0) return res.status(404).json({ error: "Designer not found. Please register first." });
        await db(`designers?id=eq.${d[0].id}`, { method: "PATCH", body: { is_online: true } });
        return res.json({ designer: { ...d[0], is_online: true } });
      }

      case "create_gig": {
        const { customer_id, service, category, brief, turnaround, price } = req.body;
        const deadline = new Date(Date.now() + turnaround * 3600000).toISOString();
        // Find available designer with matching skill
        const designers = await db(`designers?is_online=eq.true&is_approved=eq.true&skills=cs.{${encodeURIComponent(service)}}&order=rating.desc&limit=1`);
        let designer_id = null;
        let status = "pending";
        if (designers && designers.length > 0) {
          designer_id = designers[0].id;
          status = "in_progress";
        }
        const gig = await db("gigs", { method: "POST", body: { customer_id, designer_id, service, category: category || "", brief, turnaround, price, status, deadline } });
        return res.json({ gig: gig[0], designer: designers?.[0] || null });
      }

      case "get_customer_gigs": {
        const { customer_id } = req.query;
        const gigs = await db(`gigs?customer_id=eq.${customer_id}&order=created_at.desc`);
        const dIds = [...new Set(gigs.filter(g => g.designer_id).map(g => g.designer_id))];
        let designers = [];
        if (dIds.length > 0) designers = await db(`designers?id=in.(${dIds.join(",")})`);
        const gIds = gigs.map(g => g.id);
        let ratings = [];
        if (gIds.length > 0) ratings = await db(`ratings?gig_id=in.(${gIds.join(",")})`);
        return res.json({ gigs, designers, ratings });
      }

      case "get_available_gigs": {
        const gigs = await db("gigs?status=eq.pending&order=created_at.desc");
        return res.json({ gigs });
      }

      case "get_designer_gigs": {
        const { designer_id } = req.query;
        const gigs = await db(`gigs?designer_id=eq.${designer_id}&order=created_at.desc`);
        let ratings = [];
        if (gigs.length > 0) ratings = await db(`ratings?gig_id=in.(${gigs.map(g => g.id).join(",")})`);
        return res.json({ gigs, ratings });
      }

      case "accept_gig": {
        const { gig_id, designer_id, turnaround } = req.body;
        const deadline = new Date(Date.now() + turnaround * 3600000).toISOString();
        await db(`gigs?id=eq.${gig_id}`, { method: "PATCH", body: { designer_id, status: "in_progress", deadline } });
        // Notify customer
        const agig = await db(`gigs?id=eq.${gig_id}&limit=1`);
        if (agig?.[0]?.customer_id) {
          const acust = await db(`customers?id=eq.${agig[0].customer_id}&limit=1`);
          const ades = await db(`designers?id=eq.${designer_id}&limit=1`);
          if (acust?.[0] && ades?.[0]) notify("gig_accepted", { to: acust[0].email, customerName: acust[0].name, designerName: ades[0].name, service: agig[0].service, turnaround });
        }
        return res.json({ success: true });
      }

      case "deliver_gig": {
        const { gig_id } = req.body;
        await db(`gigs?id=eq.${gig_id}`, { method: "PATCH", body: { status: "delivered", delivered_at: new Date().toISOString() } });
        // Notify customer
        const dgig = await db(`gigs?id=eq.${gig_id}&limit=1`);
        if (dgig?.[0]?.customer_id) {
          const dcust = await db(`customers?id=eq.${dgig[0].customer_id}&limit=1`);
          const ddes = dgig[0].designer_id ? await db(`designers?id=eq.${dgig[0].designer_id}&limit=1`) : [];
          if (dcust?.[0]) notify("gig_delivered", { to: dcust[0].email, customerName: dcust[0].name, designerName: ddes?.[0]?.name || "Your designer", service: dgig[0].service });
        }
        return res.json({ success: true });
      }

      case "rate_gig": {
        const { gig_id, customer_id, designer_id, score, feedback } = req.body;
        await db("ratings", { method: "POST", body: { gig_id, customer_id, designer_id, score, feedback } });
        await db(`gigs?id=eq.${gig_id}`, { method: "PATCH", body: { status: "completed", completed_at: new Date().toISOString() } });
        // Notify designer
        const rgig = await db(`gigs?id=eq.${gig_id}&limit=1`);
        const rdes = await db(`designers?id=eq.${designer_id}&limit=1`);
        if (rdes?.[0]) notify("new_rating", { to: rdes[0].email, designerName: rdes[0].name, service: rgig?.[0]?.service || "", rating: score, feedback });
        return res.json({ success: true });
      }

      case "get_gig_files": {
        const { gig_id } = req.query;
        const files = await db(`files?gig_id=eq.${gig_id}&order=created_at.desc`);
        return res.json({ files });
      }

      case "register_file": {
        const { gig_id, uploaded_by_role, uploaded_by_id, file_name, file_path, file_size, file_type } = req.body;
        const f = await db("files", { method: "POST", body: { gig_id, uploaded_by_role, uploaded_by_id, file_name, file_path, file_size, file_type } });
        // Notify the other party
        const fgig = await db(`gigs?id=eq.${gig_id}&limit=1`);
        if (fgig?.[0]) {
          if (uploaded_by_role === "designer" && fgig[0].customer_id) {
            const fcust = await db(`customers?id=eq.${fgig[0].customer_id}&limit=1`);
            const fdes = await db(`designers?id=eq.${uploaded_by_id}&limit=1`);
            if (fcust?.[0]) notify("file_uploaded", { to: fcust[0].email, recipientName: fcust[0].name, uploaderName: fdes?.[0]?.name || "Your designer", service: fgig[0].service, fileName: file_name });
          } else if (uploaded_by_role === "customer" && fgig[0].designer_id) {
            const fdes2 = await db(`designers?id=eq.${fgig[0].designer_id}&limit=1`);
            const fcust2 = await db(`customers?id=eq.${uploaded_by_id}&limit=1`);
            if (fdes2?.[0]) notify("file_uploaded", { to: fdes2[0].email, recipientName: fdes2[0].name, uploaderName: fcust2?.[0]?.name || "Your client", service: fgig[0].service, fileName: file_name });
          }
        }
        return res.json({ file: f[0] });
      }

      // ─── PROFILE UPDATES ──────────────────────────────────────
      case "update_customer_profile": {
        const { customer_id, ...fields } = req.body;
        const allowed = ["name", "phone", "company_name", "company_email", "company_phone", "company_address", "company_website", "company_logo_path", "social_facebook", "social_instagram", "social_twitter", "social_linkedin", "brand_colors", "tagline", "registration_number"];
        const clean = {};
        for (const k of allowed) { if (fields[k] !== undefined) clean[k] = fields[k]; }
        await db(`customers?id=eq.${customer_id}`, { method: "PATCH", body: clean });
        const updated = await db(`customers?id=eq.${customer_id}&limit=1`);
        return res.json({ customer: updated[0] });
      }

      case "get_customer_profile": {
        const { customer_id: cpId } = req.query;
        const c = await db(`customers?id=eq.${cpId}&limit=1`);
        return res.json({ customer: c?.[0] || null });
      }

      case "update_designer_profile": {
        const { designer_id, ...dFields } = req.body;
        const dAllowed = ["name", "phone", "city", "bio", "skills", "id_number", "address", "bank_name", "bank_account", "bank_branch", "id_document_path", "address_proof_path", "bank_proof_path", "profile_complete", "is_online"];
        const dClean = {};
        for (const k of dAllowed) { if (dFields[k] !== undefined) dClean[k] = dFields[k]; }
        await db(`designers?id=eq.${designer_id}`, { method: "PATCH", body: dClean });
        const dUpdated = await db(`designers?id=eq.${designer_id}&limit=1`);
        return res.json({ designer: dUpdated[0] });
      }

      case "get_designer_profile": {
        const { designer_id: dpId } = req.query;
        const d = await db(`designers?id=eq.${dpId}&limit=1`);
        return res.json({ designer: d?.[0] || null });
      }

      case "get_designer_earnings": {
        const { designer_id: eId } = req.query;
        const gigs = await db(`gigs?designer_id=eq.${eId}&status=in.(completed,delivered)&order=created_at.desc`);
        const total = gigs.reduce((s, g) => s + (g.price || 0) * 0.75, 0);
        const thisMonth = gigs.filter(g => new Date(g.created_at).getMonth() === new Date().getMonth()).reduce((s, g) => s + (g.price || 0) * 0.75, 0);
        const thisWeek = gigs.filter(g => (Date.now() - new Date(g.created_at).getTime()) < 7 * 86400000).reduce((s, g) => s + (g.price || 0) * 0.75, 0);
        return res.json({ total: Math.round(total), thisMonth: Math.round(thisMonth), thisWeek: Math.round(thisWeek), gigCount: gigs.length, gigs });
      }

      // ─── COMMENTS ─────────────────────────────────────────────
      case "get_comments": {
        const { gig_id: cGigId } = req.query;
        const comments = await db(`comments?gig_id=eq.${cGigId}&order=created_at.asc`);
        return res.json({ comments });
      }

      case "add_comment": {
        const { gig_id: acGigId, author_id, author_role, author_name, message } = req.body;
        const c = await db("comments", { method: "POST", body: { gig_id: acGigId, author_id, author_role, author_name, message } });
        // Notify the other party
        const cgig = await db(`gigs?id=eq.${acGigId}&limit=1`);
        if (cgig?.[0]) {
          if (author_role === "designer" && cgig[0].customer_id) {
            const ccust = await db(`customers?id=eq.${cgig[0].customer_id}&limit=1`);
            if (ccust?.[0]) notify("new_message", { to: ccust[0].email, recipientName: ccust[0].name, senderName: author_name, service: cgig[0].service, message });
          } else if (author_role === "customer" && cgig[0].designer_id) {
            const cdes = await db(`designers?id=eq.${cgig[0].designer_id}&limit=1`);
            if (cdes?.[0]) notify("new_message", { to: cdes[0].email, recipientName: cdes[0].name, senderName: author_name, service: cgig[0].service, message });
          }
        }
        return res.json({ comment: c[0] });
      }

      // ─── SUPPORT ──────────────────────────────────────────────
      case "send_support": {
        const { user_id, user_role, user_name, user_email, subject, message } = req.body;
        const s = await db("support_messages", { method: "POST", body: { user_id, user_role, user_name, user_email, subject, message } });
        return res.json({ ticket: s[0] });
      }

      case "get_support_tickets": {
        const { user_id: sUid } = req.query;
        const tickets = await db(`support_messages?user_id=eq.${sUid}&order=created_at.desc`);
        return res.json({ tickets });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("DB error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

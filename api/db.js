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
        return res.json({ success: true });
      }

      case "deliver_gig": {
        const { gig_id } = req.body;
        await db(`gigs?id=eq.${gig_id}`, { method: "PATCH", body: { status: "delivered", delivered_at: new Date().toISOString() } });
        return res.json({ success: true });
      }

      case "rate_gig": {
        const { gig_id, customer_id, designer_id, score, feedback } = req.body;
        await db("ratings", { method: "POST", body: { gig_id, customer_id, designer_id, score, feedback } });
        await db(`gigs?id=eq.${gig_id}`, { method: "PATCH", body: { status: "completed", completed_at: new Date().toISOString() } });
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
        return res.json({ file: f[0] });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("DB error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

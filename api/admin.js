// Vercel Serverless Function — /api/admin
// Admin operations: stats, user management, payouts

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-email");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA || !KEY) return res.status(500).json({ error: "Not configured" });

  // Verify admin
  const adminEmail = req.headers["x-admin-email"];
  if (!adminEmail) return res.status(401).json({ error: "Unauthorized" });

  async function db(path, opts = {}) {
    const r = await fetch(`${SUPA}/rest/v1/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" },
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(txt);
    return txt ? JSON.parse(txt) : null;
  }

  // Check if user is admin
  const admins = await db(`admins?email=eq.${encodeURIComponent(adminEmail)}&limit=1`);
  if (!admins || admins.length === 0) return res.status(403).json({ error: "Not an admin" });

  const { action } = req.method === "GET" ? req.query : req.body;

  try {
    switch (action) {

      case "dashboard_stats": {
        const [customers, designers, gigs, ratings] = await Promise.all([
          db("customers?select=id,created_at"),
          db("designers?select=id,is_online,is_approved,created_at"),
          db("gigs?select=id,price,status,created_at,turnaround"),
          db("ratings?select=id,score"),
        ]);

        const totalRevenue = gigs.reduce((s, g) => s + (g.price || 0), 0);
        const platformFee = Math.round(totalRevenue * 0.25);
        const designerPayouts = Math.round(totalRevenue * 0.75);
        const onlineDesigners = designers.filter(d => d.is_online).length;
        const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : 0;
        const activeGigs = gigs.filter(g => g.status === "in_progress").length;
        const pendingGigs = gigs.filter(g => g.status === "pending").length;
        const completedGigs = gigs.filter(g => g.status === "completed").length;

        // Revenue by month
        const monthlyRevenue = {};
        gigs.forEach(g => {
          const m = new Date(g.created_at).toISOString().slice(0, 7);
          monthlyRevenue[m] = (monthlyRevenue[m] || 0) + (g.price || 0);
        });

        // New users this week
        const weekAgo = Date.now() - 7 * 86400000;
        const newCustomers = customers.filter(c => new Date(c.created_at).getTime() > weekAgo).length;
        const newDesigners = designers.filter(d => new Date(d.created_at).getTime() > weekAgo).length;

        return res.json({
          customers: customers.length,
          designers: designers.length,
          onlineDesigners,
          totalGigs: gigs.length,
          activeGigs,
          pendingGigs,
          completedGigs,
          totalRevenue,
          platformFee,
          designerPayouts,
          avgRating,
          newCustomers,
          newDesigners,
          monthlyRevenue,
        });
      }

      case "get_customers": {
        const customers = await db("customers?order=created_at.desc");
        return res.json({ customers });
      }

      case "get_designers": {
        const designers = await db("designers?order=created_at.desc");
        return res.json({ designers });
      }

      case "get_all_gigs": {
        const gigs = await db("gigs?order=created_at.desc&limit=50");
        return res.json({ gigs });
      }

      case "delete_customer": {
        const { customer_id } = req.body;
        // Delete related gigs first
        await db(`gigs?customer_id=eq.${customer_id}`, { method: "DELETE", prefer: "return=minimal" });
        await db(`customers?id=eq.${customer_id}`, { method: "DELETE", prefer: "return=minimal" });
        return res.json({ success: true });
      }

      case "delete_designer": {
        const { designer_id } = req.body;
        await db(`gigs?designer_id=eq.${designer_id}`, { method: "PATCH", body: { designer_id: null, status: "pending" } });
        await db(`designers?id=eq.${designer_id}`, { method: "DELETE", prefer: "return=minimal" });
        return res.json({ success: true });
      }

      case "toggle_designer_approval": {
        const { designer_id, is_approved } = req.body;
        await db(`designers?id=eq.${designer_id}`, { method: "PATCH", body: { is_approved } });
        return res.json({ success: true });
      }

      case "get_payout_queue": {
        // Get designers with unpaid completed gigs
        const designers = await db("designers?is_approved=eq.true&order=name.asc");
        const result = [];
        for (const d of designers) {
          const gigs = await db(`gigs?designer_id=eq.${d.id}&status=in.(completed,delivered)&order=created_at.desc`);
          const earnings = gigs.reduce((s, g) => s + (g.price || 0) * 0.75, 0);
          // Get existing payouts
          const payouts = await db(`payouts?designer_id=eq.${d.id}&order=created_at.desc`);
          const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
          const owing = Math.round(earnings - totalPaid);
          if (owing > 0 || payouts.length > 0) {
            result.push({ ...d, earnings: Math.round(earnings), totalPaid: Math.round(totalPaid), owing, gigCount: gigs.length, payouts });
          }
        }
        return res.json({ designers: result });
      }

      case "create_payout": {
        const { designer_id, amount, bank_name, bank_account, reference, notes } = req.body;
        const p = await db("payouts", { method: "POST", body: { designer_id, amount, bank_name, bank_account, reference, notes, status: "pending" } });
        return res.json({ payout: p[0] });
      }

      case "update_payout": {
        const { payout_id, status, reference } = req.body;
        const body = { status };
        if (reference) body.reference = reference;
        if (status === "paid") body.paid_at = new Date().toISOString();
        await db(`payouts?id=eq.${payout_id}`, { method: "PATCH", body });
        return res.json({ success: true });
      }

      case "get_online_designers": {
        const designers = await db("designers?is_online=eq.true&order=name.asc");
        return res.json({ designers });
      }

      case "get_support_tickets": {
        const tickets = await db("support_messages?order=created_at.desc");
        return res.json({ tickets });
      }

      case "reply_support": {
        const { ticket_id, status } = req.body;
        await db(`support_messages?id=eq.${ticket_id}`, { method: "PATCH", body: { status: status || "replied" } });
        return res.json({ success: true });
      }

      case "close_support": {
        const { ticket_id } = req.body;
        await db(`support_messages?id=eq.${ticket_id}`, { method: "PATCH", body: { status: "closed" } });
        return res.json({ success: true });
      }

      // ─── SERVICES & PRICING ─────────────────────────────────────
      case "get_services": {
        const services = await db("services?order=sort_order.asc");
        return res.json({ services });
      }

      case "create_service": {
        const { category, name, price_4h, price_12h, price_24h, sort_order } = req.body;
        const s = await db("services", { method: "POST", body: { category, name, price_4h, price_12h, price_24h, sort_order: sort_order || 99 } });
        return res.json({ service: s[0] });
      }

      case "update_service": {
        const { service_id, ...fields } = req.body;
        const allowed = ["category", "name", "price_4h", "price_12h", "price_24h", "is_active", "sort_order"];
        const clean = {};
        for (const k of allowed) { if (fields[k] !== undefined) clean[k] = fields[k]; }
        await db(`services?id=eq.${service_id}`, { method: "PATCH", body: clean });
        return res.json({ success: true });
      }

      case "delete_service": {
        const { service_id } = req.body;
        await db(`services?id=eq.${service_id}`, { method: "DELETE", prefer: "return=minimal" });
        return res.json({ success: true });
      }

      // ─── MANUAL USER CREATION ──────────────────────────────────
      case "create_user": {
        const { email, name, role: userRole, city, skills, password } = req.body;
        // Create auth user via Supabase Admin API
        const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const authRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
          method: "POST",
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: password || "Welcome123!", email_confirm: true }),
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.msg || authData.message || "Failed to create auth user");
        const userId = authData.id;

        if (userRole === "customer") {
          const c = await db("customers", { method: "POST", body: { id: userId, email, name } });
          return res.json({ success: true, role: "customer", profile: c[0] });
        } else if (userRole === "designer") {
          const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
          const d = await db("designers", { method: "POST", body: { id: userId, email, name, city: city || "", skills: skills || [], avatar_initials: initials, is_online: false, is_approved: true } });
          return res.json({ success: true, role: "designer", profile: d[0] });
        } else if (userRole === "admin") {
          const a = await db("admins", { method: "POST", body: { email, name } });
          return res.json({ success: true, role: "admin", admin: a[0] });
        }
        return res.json({ error: "Invalid role" });
      }

      case "get_admins": {
        const admins = await db("admins?order=created_at.desc");
        return res.json({ admins });
      }

      case "delete_admin": {
        const { admin_id } = req.body;
        await db(`admins?id=eq.${admin_id}`, { method: "DELETE", prefer: "return=minimal" });
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("Admin error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

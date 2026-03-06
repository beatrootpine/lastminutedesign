// Vercel Serverless Function — /api/auth
// Handles signup, login, session verification

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPA || !KEY) return res.status(500).json({ error: "Not configured" });

  const { action } = req.body;

  // Helper for Supabase Auth API
  async function authFetch(path, body, useAnon) {
    const r = await fetch(`${SUPA}/auth/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: useAnon ? ANON : KEY,
        Authorization: `Bearer ${useAnon ? ANON : KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || data.error || "Auth error");
    return data;
  }

  // Helper for DB operations
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

  try {
    switch (action) {

      case "signup_customer": {
        const { email, password, name, phone } = req.body;
        // Create auth user
        const auth = await authFetch("signup", { email, password }, true);
        if (!auth.user) throw new Error("Signup failed");
        // Create customer record linked to auth user
        const customer = await db("customers", {
          method: "POST",
          body: { id: auth.user.id, email, name, phone },
        });
        return res.json({ user: auth.user, session: auth.session, customer: customer[0] });
      }

      case "signup_designer": {
        const { email, password, name, city, bio, skills } = req.body;
        const auth = await authFetch("signup", { email, password }, true);
        if (!auth.user) throw new Error("Signup failed");
        const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        const designer = await db("designers", {
          method: "POST",
          body: { id: auth.user.id, email, name, city, bio, skills, avatar_initials: initials, is_online: true, is_approved: true },
        });
        return res.json({ user: auth.user, session: auth.session, designer: designer[0] });
      }

      case "login": {
        const { email, password } = req.body;
        const auth = await authFetch("token?grant_type=password", { email, password }, true);
        if (!auth.user) throw new Error("Login failed");
        // Check if customer or designer
        const customers = await db(`customers?id=eq.${auth.user.id}&limit=1`);
        if (customers && customers.length > 0) {
          return res.json({ user: auth.user, session: auth.access_token, role: "customer", profile: customers[0] });
        }
        const designers = await db(`designers?id=eq.${auth.user.id}&limit=1`);
        if (designers && designers.length > 0) {
          await db(`designers?id=eq.${auth.user.id}`, { method: "PATCH", body: { is_online: true } });
          return res.json({ user: auth.user, session: auth.access_token, role: "designer", profile: { ...designers[0], is_online: true } });
        }
        return res.json({ user: auth.user, session: auth.access_token, role: null, profile: null });
      }

      case "get_profile": {
        const { user_id } = req.body;
        const customers = await db(`customers?id=eq.${user_id}&limit=1`);
        if (customers && customers.length > 0) return res.json({ role: "customer", profile: customers[0] });
        const designers = await db(`designers?id=eq.${user_id}&limit=1`);
        if (designers && designers.length > 0) return res.json({ role: "designer", profile: designers[0] });
        return res.json({ role: null, profile: null });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

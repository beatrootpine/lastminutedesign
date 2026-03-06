// Vercel Serverless Function — /api/pay
// Handles Paystack payment initialization and verification

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!PAYSTACK_SECRET) return res.status(500).json({ error: "Paystack not configured" });

  const { action } = req.body;

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

  async function paystack(path, body) {
    const r = await fetch(`https://api.paystack.co${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return r.json();
  }

  async function paystackGet(path) {
    const r = await fetch(`https://api.paystack.co${path}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    return r.json();
  }

  try {
    switch (action) {

      case "initialize": {
        const { email, amount, gig_id, customer_id, service, turnaround, brief, category } = req.body;
        // amount is in Rands, Paystack expects kobo (cents)
        const amountInKobo = amount * 100;

        const result = await paystack("/transaction/initialize", {
          email,
          amount: amountInKobo,
          currency: "ZAR",
          callback_url: `${req.headers.origin || "https://lastminutedesigns.co.za"}/`,
          metadata: {
            gig_id: gig_id || "pending",
            customer_id,
            service,
            turnaround,
            brief: brief?.slice(0, 200),
            category,
            custom_fields: [
              { display_name: "Service", variable_name: "service", value: service },
              { display_name: "Turnaround", variable_name: "turnaround", value: `${turnaround} hours` },
            ],
          },
        });

        if (result.status) {
          return res.json({
            success: true,
            authorization_url: result.data.authorization_url,
            reference: result.data.reference,
            access_code: result.data.access_code,
          });
        }
        throw new Error(result.message || "Failed to initialize payment");
      }

      case "verify": {
        const { reference } = req.body;
        const result = await paystackGet(`/transaction/verify/${reference}`);

        if (result.status && result.data.status === "success") {
          const meta = result.data.metadata;

          // Create the gig now that payment is confirmed
          if (meta && meta.customer_id) {
            const turnaround = parseInt(meta.turnaround);
            const deadline = new Date(Date.now() + turnaround * 3600000).toISOString();
            const amount = result.data.amount / 100; // convert back from kobo

            // Find available designer
            const designers = await db(
              `designers?is_online=eq.true&is_approved=eq.true&skills=cs.{${encodeURIComponent(meta.service)}}&order=rating.desc&limit=1`
            );

            let designer_id = null;
            let status = "pending";
            if (designers && designers.length > 0) {
              designer_id = designers[0].id;
              status = "in_progress";
            }

            const gig = await db("gigs", {
              method: "POST",
              body: {
                customer_id: meta.customer_id,
                designer_id,
                service: meta.service,
                category: meta.category || "",
                brief: meta.brief || "",
                turnaround,
                price: amount,
                status,
                deadline,
              },
            });

            return res.json({
              success: true,
              paid: true,
              amount,
              gig: gig?.[0] || null,
              designer: designers?.[0] || null,
              reference,
            });
          }

          return res.json({ success: true, paid: true, amount: result.data.amount / 100, reference });
        }

        return res.json({ success: false, paid: false, message: "Payment not successful" });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("Pay error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

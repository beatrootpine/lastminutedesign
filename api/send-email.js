// Vercel Serverless Function — /api/send-email
// Handles all email notifications for Last Minute Designs

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: "Missing type or data" });
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    return res.status(500).json({ error: "SendGrid not configured" });
  }

  // Build email based on type
  let emailConfig;

  try {
    switch (type) {
      case "gig_created":
        emailConfig = gigCreatedEmail(data, FROM_EMAIL);
        break;
      case "designer_matched":
        emailConfig = designerMatchedEmail(data, FROM_EMAIL);
        break;
      case "gig_accepted":
        emailConfig = gigAcceptedEmail(data, FROM_EMAIL);
        break;
      case "gig_delivered":
        emailConfig = gigDeliveredEmail(data, FROM_EMAIL);
        break;
      case "gig_rated":
        emailConfig = gigRatedEmail(data, FROM_EMAIL);
        break;
      case "designer_welcome":
        emailConfig = designerWelcomeEmail(data, FROM_EMAIL);
        break;
      default:
        return res.status(400).json({ error: `Unknown email type: ${type}` });
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailConfig),
    });

    if (response.ok || response.status === 202) {
      return res.status(200).json({ success: true, type });
    } else {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return res.status(500).json({ error: "Failed to send email", details: error });
    }
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── BRANDED EMAIL WRAPPER ──────────────────────────────────────────────────
function brandedTemplate(title, preheader, bodyContent) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 12px; padding: 32px; margin-bottom: 16px; }
    .logo { text-align: center; padding: 24px 0; }
    .logo span { font-size: 22px; font-weight: 800; color: #FFF8F0; }
    .logo .accent { color: #FF8C00; }
    h1 { color: #FFF8F0; font-size: 24px; font-weight: 800; margin: 0 0 8px; }
    h2 { color: #FFF8F0; font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    p { color: #888888; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .highlight { color: #E8E8E8; }
    .badge { display: inline-block; background: rgba(255,140,0,0.15); color: #FF8C00; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,140,0,0.2); }
    .badge-success { background: rgba(34,197,94,0.15); color: #22C55E; border-color: rgba(34,197,94,0.2); }
    .badge-rush { background: rgba(239,68,68,0.15); color: #EF4444; border-color: rgba(239,68,68,0.2); }
    .badge-express { background: rgba(245,158,11,0.15); color: #F59E0B; border-color: rgba(245,158,11,0.2); }
    .price { font-size: 28px; font-weight: 800; color: #FFBD59; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FF8C00, #FFBD59); color: #0D0D0D; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .divider { border: none; border-top: 1px solid #2A2A2A; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2A2A2A; }
    .detail-label { color: #888888; font-size: 13px; }
    .detail-value { color: #E8E8E8; font-size: 13px; font-weight: 600; }
    .stars { color: #FF8C00; font-size: 18px; }
    .footer { text-align: center; padding: 24px 0; }
    .footer p { color: #555; font-size: 11px; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="logo">
      <span><span class="accent">last</span>minute<span class="accent">.</span>designs</span>
    </div>
    <div class="card">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>Last Minute Designs — 24/7 Rush Design Studio<br>
      <a href="https://lastminutedesigns.co.za" style="color: #FF8C00; text-decoration: none;">lastminutedesigns.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── EMAIL TEMPLATES ────────────────────────────────────────────────────────

function gigCreatedEmail(data, from) {
  const { customerEmail, customerName, gigType, turnaround, price, brief } = data;
  const tagMap = { 4: "RUSH", 12: "EXPRESS", 24: "STANDARD" };
  const badgeClass = turnaround === 4 ? "badge-rush" : turnaround === 12 ? "badge-express" : "badge";

  const body = `
    <h1>Gig submitted! 🎨</h1>
    <p>Hey ${customerName || "there"}, your design request is live. We're matching you with a designer right now.</p>
    <hr class="divider">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="detail-label" style="padding:8px 0">Type</td><td class="detail-value" style="padding:8px 0;text-align:right">${gigType}</td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Turnaround</td><td style="padding:8px 0;text-align:right"><span class="${badgeClass}">${tagMap[turnaround] || turnaround + "h"}</span></td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Price</td><td class="detail-value" style="padding:8px 0;text-align:right"><span class="price">R${price}</span></td></tr>
    </table>
    ${brief ? `<hr class="divider"><p class="highlight" style="font-style:italic">"${brief}"</p>` : ""}
    <hr class="divider">
    <p>You'll get another email as soon as a designer picks up your gig. Hang tight.</p>
    <div style="text-align:center;padding-top:8px">
      <a href="https://lastminutedesigns.co.za" class="btn">View Dashboard →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: customerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: `Your ${gigType} gig is live — ${tagMap[turnaround]} turnaround`,
    content: [{ type: "text/html", value: brandedTemplate("Gig Submitted", `Your ${gigType} request has been submitted`, body) }],
  };
}

function designerMatchedEmail(data, from) {
  const { customerEmail, customerName, designerName, gigType, turnaround, price } = data;
  const tagMap = { 4: "RUSH", 12: "EXPRESS", 24: "STANDARD" };

  const body = `
    <h1>Designer matched! ✨</h1>
    <p>Hey ${customerName || "there"}, great news — <span class="highlight" style="font-weight:700">${designerName}</span> has been assigned to your ${gigType} gig.</p>
    <hr class="divider">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="detail-label" style="padding:8px 0">Designer</td><td class="detail-value" style="padding:8px 0;text-align:right">${designerName}</td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Gig</td><td class="detail-value" style="padding:8px 0;text-align:right">${gigType}</td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Deadline</td><td class="detail-value" style="padding:8px 0;text-align:right">${turnaround} hours from now</td></tr>
    </table>
    <hr class="divider">
    <p>Your designer is working on it right now. You can track progress from your dashboard.</p>
    <div style="text-align:center;padding-top:8px">
      <a href="https://lastminutedesigns.co.za" class="btn">Track Progress →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: customerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: `${designerName} is on your ${gigType} gig`,
    content: [{ type: "text/html", value: brandedTemplate("Designer Matched", `${designerName} has started your gig`, body) }],
  };
}

function gigAcceptedEmail(data, from) {
  const { designerEmail, designerName, gigType, turnaround, price, brief } = data;
  const tagMap = { 4: "RUSH", 12: "EXPRESS", 24: "STANDARD" };
  const badgeClass = turnaround === 4 ? "badge-rush" : turnaround === 12 ? "badge-express" : "badge";

  const body = `
    <h1>New gig accepted! 🔥</h1>
    <p>Hey ${designerName}, the clock is ticking. Here are the details:</p>
    <hr class="divider">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="detail-label" style="padding:8px 0">Type</td><td class="detail-value" style="padding:8px 0;text-align:right">${gigType}</td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Turnaround</td><td style="padding:8px 0;text-align:right"><span class="${badgeClass}">${tagMap[turnaround] || turnaround + "h"}</span></td></tr>
      <tr><td class="detail-label" style="padding:8px 0">Your Earnings</td><td class="detail-value" style="padding:8px 0;text-align:right"><span class="price">R${Math.round(price * 0.75)}</span></td></tr>
    </table>
    ${brief ? `<hr class="divider"><p><strong style="color:#E8E8E8">Client Brief:</strong></p><p class="highlight" style="font-style:italic">"${brief}"</p>` : ""}
    <hr class="divider">
    <p>Deliver on time and keep that rating up. Let's go!</p>
    <div style="text-align:center;padding-top:8px">
      <a href="https://lastminutedesigns.co.za" class="btn">Open Dashboard →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: designerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: `Gig accepted: ${gigType} — ${tagMap[turnaround]} (R${Math.round(price * 0.75)} earnings)`,
    content: [{ type: "text/html", value: brandedTemplate("Gig Accepted", `You accepted a ${gigType} gig`, body) }],
  };
}

function gigDeliveredEmail(data, from) {
  const { customerEmail, customerName, designerName, gigType } = data;

  const body = `
    <h1>Your design is ready! 🎉</h1>
    <p>Hey ${customerName || "there"}, <span class="highlight" style="font-weight:700">${designerName}</span> just delivered your ${gigType}.</p>
    <hr class="divider">
    <p>Head to your dashboard to review the work. If you're happy, accept the delivery and leave a rating.</p>
    <div style="text-align:center;padding-top:16px">
      <a href="https://lastminutedesigns.co.za" class="btn">Review & Accept →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: customerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: `Your ${gigType} is ready — review now`,
    content: [{ type: "text/html", value: brandedTemplate("Delivery Ready", `Your ${gigType} has been delivered`, body) }],
  };
}

function gigRatedEmail(data, from) {
  const { designerEmail, designerName, gigType, rating, feedback } = data;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const body = `
    <h1>You got a rating! ⭐</h1>
    <p>Hey ${designerName}, your client just reviewed your ${gigType} delivery.</p>
    <hr class="divider">
    <div style="text-align:center;padding:16px 0">
      <div class="stars">${stars}</div>
      <div style="color:#FFBD59;font-size:24px;font-weight:800;margin-top:4px">${rating}/5</div>
    </div>
    ${feedback ? `<p class="highlight" style="font-style:italic;text-align:center">"${feedback}"</p>` : ""}
    <hr class="divider">
    <p>${rating >= 4 ? "Amazing work! Keep it up and the gigs will keep coming." : "Every delivery is a chance to improve. Keep going!"}</p>
    <div style="text-align:center;padding-top:8px">
      <a href="https://lastminutedesigns.co.za" class="btn">View Dashboard →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: designerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: `You received a ${rating}★ rating for ${gigType}`,
    content: [{ type: "text/html", value: brandedTemplate("New Rating", `You received ${rating} stars`, body) }],
  };
}

function designerWelcomeEmail(data, from) {
  const { designerEmail, designerName } = data;

  const body = `
    <h1>Welcome to the crew! 🤝</h1>
    <p>Hey ${designerName}, your designer application has been received. Welcome to Last Minute Designs.</p>
    <hr class="divider">
    <h2>How it works</h2>
    <p class="highlight">1. Go online when you're ready to work</p>
    <p class="highlight">2. New gigs matching your skills appear in real-time</p>
    <p class="highlight">3. Accept a gig and the countdown starts</p>
    <p class="highlight">4. Deliver on time, get rated, get paid</p>
    <hr class="divider">
    <p><strong style="color:#FFBD59">Earnings:</strong> <span class="highlight">You keep 75% of every gig.</span></p>
    <p>Payments are processed weekly. The faster and better you deliver, the more gigs you'll get.</p>
    <div style="text-align:center;padding-top:16px">
      <a href="https://lastminutedesigns.co.za" class="btn">Go to Dashboard →</a>
    </div>
  `;

  return {
    personalizations: [{ to: [{ email: designerEmail }] }],
    from: { email: from, name: "Last Minute Designs" },
    subject: "Welcome to Last Minute Designs — let's get you earning",
    content: [{ type: "text/html", value: brandedTemplate("Welcome", "Your designer account is ready", body) }],
  };
}

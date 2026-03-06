import { useState, useEffect } from "react";

// ─── REAL PRICING DATA FROM LMD PRICE LIST ─────────────────────────────────
const SERVICES = {
  "Brand Identity": [
    { name: "Logo Design", prices: { 4: 1750, 12: 1200, 24: 1000 } },
    { name: "Brand Identity Pack", prices: { 4: 4500, 12: 3200, 24: 2800 } },
    { name: "Business Card Design", prices: { 4: 850, 12: 650, 24: 500 } },
    { name: "Letterhead & Envelope", prices: { 4: 1200, 12: 950, 24: 750 } },
    { name: "Brand Guidelines Document", prices: { 4: 3500, 12: 2800, 24: 2200 } },
  ],
  "Print & Marketing": [
    { name: "Flyer / Poster", prices: { 4: 950, 12: 750, 24: 600 } },
    { name: "Brochure (bi/tri-fold)", prices: { 4: 1800, 12: 1400, 24: 1100 } },
    { name: "Event Backdrop / Banner", prices: { 4: 2200, 12: 1700, 24: 1400 } },
    { name: "Company Profile (10pg)", prices: { 4: 5500, 12: 4200, 24: 3500 } },
    { name: "Menu Design", prices: { 4: 1400, 12: 1100, 24: 900 } },
  ],
  "Digital & Social Media": [
    { name: "Social Media Graphics (x5)", prices: { 4: 1200, 12: 950, 24: 750 } },
    { name: "Email Signature", prices: { 4: 750, 12: 600, 24: 450 } },
    { name: "PowerPoint Template", prices: { 4: 2500, 12: 2000, 24: 1600 } },
    { name: "Web Banner Set (x3)", prices: { 4: 1500, 12: 1200, 24: 950 } },
    { name: "WhatsApp Marketing Card", prices: { 4: 650, 12: 500, 24: 400 } },
  ],
  "Documents & Presentations": [
    { name: "Proposal / Quote Template", prices: { 4: 1800, 12: 1400, 24: 1100 } },
    { name: "Report / Document Design", prices: { 4: 2800, 12: 2200, 24: 1700 } },
    { name: "Certificate Design", prices: { 4: 900, 12: 700, 24: 550 } },
    { name: "Invoice Template", prices: { 4: 750, 12: 600, 24: 450 } },
    { name: "Presentation Deck (10 slides)", prices: { 4: 3500, 12: 2800, 24: 2200 } },
  ],
};

const ALL_SERVICES = Object.values(SERVICES).flat();
const TIERS = {
  4: { label: "4 Hours", tag: "RUSH", desc: "Ultra-priority. Work starts immediately." },
  12: { label: "12 Hours", tag: "EXPRESS", desc: "Same-day delivery. Starts within 2 hours." },
  24: { label: "24 Hours", tag: "STANDARD", desc: "Next-day delivery. Best value." },
};

const DESIGNERS = [
  { id: "d1", name: "Thando Mokoena", initials: "TM", rating: 4.9, reviews: 127, gigs: 143, online: true, city: "Johannesburg", skills: ["Logo Design", "Brand Identity Pack", "Business Card Design", "Brand Guidelines Document"] },
  { id: "d2", name: "Lerato Ndlovu", initials: "LN", rating: 4.7, reviews: 89, gigs: 98, online: true, city: "Cape Town", skills: ["Social Media Graphics (x5)", "Web Banner Set (x3)", "Flyer / Poster", "WhatsApp Marketing Card"] },
  { id: "d3", name: "Sipho Dlamini", initials: "SD", rating: 4.8, reviews: 201, gigs: 215, online: false, city: "Pretoria", skills: ["Presentation Deck (10 slides)", "PowerPoint Template", "Company Profile (10pg)", "Report / Document Design"] },
  { id: "d4", name: "Naledi Khumalo", initials: "NK", rating: 5.0, reviews: 56, gigs: 61, online: true, city: "Durban", skills: ["Menu Design", "Brochure (bi/tri-fold)", "Event Backdrop / Banner", "Letterhead & Envelope"] },
  { id: "d5", name: "Kagiso Modise", initials: "KM", rating: 4.6, reviews: 74, gigs: 82, online: true, city: "Sandton", skills: ["Certificate Design", "Invoice Template", "Proposal / Quote Template", "Email Signature"] },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const sendEmail = async (type, data) => {
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
  } catch (e) { console.error("Email error:", e); }
};

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090b;color:#fafafa;font-family:Inter,sans-serif}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::selection{background:#f97316;color:#09090b}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

const C = {
  bg: "#09090b", card: "#131316", border: "#1e1e24", hover: "#1a1a1f",
  orange: "#f97316", orangeLight: "#fb923c",
  orangeDim: "rgba(249,115,22,0.1)", orangeBorder: "rgba(249,115,22,0.2)",
  white: "#fafafa", gray: "#71717a", grayLight: "#a1a1aa",
  green: "#22c55e", red: "#ef4444", yellow: "#eab308",
};

// ─── PRIMITIVES ─────────────────────────────────────────────────────────────
const H = ({ children, size = 24, style }) => (
  <h2 style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: size, color: C.white, letterSpacing: "-0.02em", lineHeight: 1.2, ...style }}>{children}</h2>
);

const T = ({ children, dim, small, style }) => (
  <p style={{ fontSize: small ? 12 : 14, color: dim ? C.gray : C.grayLight, lineHeight: 1.5, ...style }}>{children}</p>
);

const Pill = ({ children, color = C.orange }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, fontFamily: "Outfit", textTransform: "uppercase",
    letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100,
    background: color + "18", color, border: `1px solid ${color}30`, display: "inline-block",
  }}>{children}</span>
);

const Stars = ({ n = 5, size = 13 }) => (
  <span style={{ letterSpacing: 1 }}>
    {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(n) ? C.orange : "#27272a", fontSize: size }}>★</span>)}
  </span>
);

const Av = ({ initials, size = 36, online }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Outfit", fontWeight: 700, fontSize: size * 0.35, color: C.bg, position: "relative",
  }}>
    {initials}
    {online !== undefined && <span style={{
      position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%",
      background: online ? C.green : "#555", border: `2px solid ${C.card}`,
    }} />}
  </div>
);

const Btn = ({ children, onClick, v = "primary", full, disabled, sm, style: s }) => {
  const vs = {
    primary: { background: C.orange, color: C.bg },
    secondary: { background: C.card, color: C.white, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.gray, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      fontFamily: "Outfit", fontWeight: 600, fontSize: sm ? 12 : 13,
      padding: sm ? "7px 14px" : "10px 20px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
      transition: "all 0.15s", width: full ? "100%" : "auto",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      ...vs[v], ...s,
    }}>{children}</button>
  );
};

const Card = ({ children, style: s, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: 20, cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s", ...s,
  }}>{children}</div>
);

const Field = ({ label, value, onChange, type = "text", placeholder, textarea }) => {
  const base = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "10px 14px", color: C.white, fontFamily: "Inter", fontSize: 14, outline: "none",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 600, color: C.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>}
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
};

const Bar = ({ pct }) => (
  <div style={{ width: "100%", height: 4, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: pct > 80 ? C.red : pct > 50 ? C.yellow : C.orange, transition: "width 0.4s" }} />
  </div>
);

const Toasty = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "12px 20px", fontFamily: "Outfit", fontWeight: 600, fontSize: 13, color: C.white,
      animation: "fadeIn 0.2s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ color: C.orange }}>●</span> {msg}
    </div>
  );
};

// ─── LAYOUT ─────────────────────────────────────────────────────────────────
const Nav = ({ go, minimal }) => (
  <nav style={{
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 28px", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)",
    borderBottom: `1px solid ${C.border}`,
  }}>
    <span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: C.white, cursor: "pointer", letterSpacing: "-0.02em" }}>
      <span style={{ color: C.orange }}>lastminute</span>.design
    </span>
    {!minimal && (
      <div style={{ display: "flex", gap: 8 }}>
        <Btn v="ghost" sm onClick={() => go("designer-register")}>Join as Designer</Btn>
        <Btn sm onClick={() => go("customer-login")}>Get Design</Btn>
      </div>
    )}
  </nav>
);

const Shell = ({ children, role, go }) => (
  <div style={{ minHeight: "100vh", background: C.bg }}>
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 28px", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100,
    }}>
      <span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: C.white, cursor: "pointer" }}>
        <span style={{ color: C.orange }}>lastminute</span>.design
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Pill color={role === "designer" ? C.green : C.orange}>{role}</Pill>
        <button onClick={() => go("landing")} style={{ background: "none", border: "none", color: C.gray, fontSize: 12, fontFamily: "Inter", cursor: "pointer" }}>Sign out</button>
      </div>
    </nav>
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>{children}</div>
  </div>
);

// ─── LANDING PAGE ───────────────────────────────────────────────────────────
const Landing = ({ go }) => {
  const [openCat, setOpenCat] = useState(null);
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav go={go} />

      <div style={{ paddingTop: 120, textAlign: "center", maxWidth: 600, margin: "0 auto", padding: "120px 20px 60px" }}>
        <Pill>24/7 Creative Services</Pill>
        <h1 style={{
          fontFamily: "Outfit", fontWeight: 800, fontSize: "clamp(36px, 6vw, 60px)",
          lineHeight: 1.08, color: C.white, margin: "20px 0 14px", letterSpacing: "-0.03em",
        }}>
          Design done<br /><span style={{ color: C.orange }}>before sunrise.</span>
        </h1>
        <T style={{ maxWidth: 420, margin: "0 auto 32px", fontSize: 15 }}>
          Pick your deadline. We match you with a vetted designer instantly. No back-and-forth. Just great design, fast.
        </T>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
          {Object.entries(TIERS).map(([hrs, { tag, desc }]) => (
            <Card key={hrs} onClick={() => go("customer-login")} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}>
              <Pill color={hrs === "4" ? C.red : hrs === "12" ? C.yellow : C.green}>{tag}</Pill>
              <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 28, color: C.white, margin: "8px 0 2px" }}>{hrs}h</div>
              <T small dim>{desc}</T>
            </Card>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={() => go("customer-login")}>Submit a Gig →</Btn>
          <Btn v="secondary" onClick={() => go("designer-register")}>I'm a Designer</Btn>
        </div>
      </div>

      {/* Price list */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <H size={26}>Services & Pricing</H>
          <T dim style={{ marginTop: 4 }}>All prices in ZAR · excl. VAT</T>
        </div>

        {Object.entries(SERVICES).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 6 }}>
            <button onClick={() => setOpenCat(openCat === cat ? null : cat)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 16px", background: C.card, border: `1px solid ${C.border}`,
              borderRadius: openCat === cat ? "10px 10px 0 0" : 10,
              color: C.white, fontFamily: "Outfit", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>
              {cat}
              <span style={{ color: C.gray, fontSize: 16, transition: "transform 0.2s", transform: openCat === cat ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {openCat === cat && (
              <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px 72px", padding: "7px 16px", background: C.bg }}>
                  <T small dim>Service</T>
                  <T small dim style={{ textAlign: "right" }}>4h</T>
                  <T small dim style={{ textAlign: "right" }}>12h</T>
                  <T small dim style={{ textAlign: "right" }}>24h</T>
                </div>
                {items.map((item, i) => (
                  <div key={item.name} style={{
                    display: "grid", gridTemplateColumns: "1fr 72px 72px 72px",
                    padding: "9px 16px", background: i % 2 === 0 ? C.card : "transparent",
                    borderTop: `1px solid ${C.border}`,
                  }}>
                    <T style={{ color: C.white, fontSize: 13 }}>{item.name}</T>
                    <T small style={{ textAlign: "right", color: C.orangeLight }}>R{item.prices[4].toLocaleString()}</T>
                    <T small style={{ textAlign: "right", color: C.grayLight }}>R{item.prices[12].toLocaleString()}</T>
                    <T small style={{ textAlign: "right", color: C.grayLight }}>R{item.prices[24].toLocaleString()}</T>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
          {[["247+", "Designers"], ["1,200+", "Gigs Done"], ["4.8★", "Avg Rating"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: C.white }}>{v}</div>
              <T small dim>{l}</T>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
const CustLogin = ({ name, setName, email, setEmail, onGo, go }) => (
  <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ maxWidth: 360, width: "100%" }}>
      <Nav go={go} minimal />
      <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}>
        <H size={22}>Get started</H>
        <T dim style={{ marginTop: 4 }}>Enter your details to submit a gig</T>
      </div>
      <Card>
        <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
        <Btn full onClick={onGo} disabled={!name || !email}>Continue →</Btn>
      </Card>
    </div>
  </div>
);

const DesLogin = ({ email, setEmail, onGo, go }) => (
  <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ maxWidth: 360, width: "100%" }}>
      <Nav go={go} minimal />
      <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}>
        <H size={22}>Designer sign in</H>
      </div>
      <Card>
        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
        <Btn full onClick={onGo} disabled={!email}>Sign In →</Btn>
      </Card>
    </div>
  </div>
);

// ─── DESIGNER REGISTER ──────────────────────────────────────────────────────
const DesRegister = ({ onReg, go }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const flip = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <Nav go={go} minimal />
        <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}>
          <H size={22}>Join as a Designer</H>
          <T dim style={{ marginTop: 4 }}>Earn money doing what you love</T>
        </div>
        <Card>
          <Field label="Full Name" value={name} onChange={setName} placeholder="Thando Mokoena" />
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
          <Field label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
          <Field label="Short Bio" value={bio} onChange={setBio} textarea placeholder="What makes your work stand out..." />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: C.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ALL_SERVICES.map(s => (
                <button key={s.name} onClick={() => flip(s.name)} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter",
                  background: skills.includes(s.name) ? C.orangeDim : C.bg,
                  color: skills.includes(s.name) ? C.orange : C.gray,
                  border: `1px solid ${skills.includes(s.name) ? C.orangeBorder : C.border}`,
                  cursor: "pointer",
                }}>{s.name}</button>
              ))}
            </div>
          </div>
          <Btn full onClick={() => { if (name && email && skills.length) onReg({ name, email, city, bio, skills }); }} disabled={!name || !email || !skills.length}>Apply Now →</Btn>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => go("designer-login")} style={{ background: "none", border: "none", color: C.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>Already registered? Sign in →</button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── GIG CARD ───────────────────────────────────────────────────────────────
const GigCard = ({ gig, isCust, onAccept, onDeliver, onRate }) => {
  const des = DESIGNERS.find(d => d.id === gig.designerId);
  const pct = gig.status === "in_progress" ? Math.min(100, Math.max(0, Math.round(((Date.now() - gig.created) / (gig.deadline - gig.created)) * 100))) : 0;
  const hrs = Math.max(0, ((gig.deadline - Date.now()) / 3600000).toFixed(1));
  const sc = { pending: C.yellow, in_progress: C.orange, delivered: C.green, completed: C.green }[gig.status] || C.gray;

  return (
    <Card style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            <Pill color={sc}>{gig.status.replace("_", " ")}</Pill>
            <Pill color={gig.turnaround === 4 ? C.red : gig.turnaround === 12 ? C.yellow : C.green}>{TIERS[gig.turnaround]?.tag}</Pill>
          </div>
          <H size={15}>{gig.service}</H>
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 17, color: C.orange, whiteSpace: "nowrap" }}>R{gig.price?.toLocaleString()}</div>
      </div>

      {gig.brief && <T dim small style={{ marginBottom: 8 }}>{gig.brief}</T>}

      {gig.status === "in_progress" && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <T small dim>Progress</T>
            <T small style={{ color: hrs < 1 ? C.red : C.gray }}>{hrs}h left</T>
          </div>
          <Bar pct={pct} />
        </div>
      )}

      {des && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <Av initials={des.initials} size={30} online={des.online} />
          <div style={{ flex: 1 }}>
            <T style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{des.name}</T>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stars n={des.rating} size={10} /><T small dim>{des.rating}</T></div>
          </div>
          {isCust && gig.status === "delivered" && !gig.rated && <Btn sm onClick={() => onRate(gig.id)}>Accept & Rate</Btn>}
          {!isCust && gig.status === "in_progress" && <Btn sm onClick={() => onDeliver(gig.id)}>Deliver</Btn>}
        </div>
      )}

      {!isCust && gig.status === "pending" && (
        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <Btn sm onClick={() => onAccept(gig.id)}>Accept Gig</Btn>
        </div>
      )}

      {gig.rated && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 5 }}>
          <Stars n={gig.customerRating} size={12} /><T small dim>Rated {gig.customerRating}/5</T>
        </div>
      )}
    </Card>
  );
};

// ─── CREATE GIG ─────────────────────────────────────────────────────────────
const CreateGig = ({ onSubmit, onBack }) => {
  const [cat, setCat] = useState("");
  const [svc, setSvc] = useState("");
  const [brief, setBrief] = useState("");
  const [tier, setTier] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const sel = ALL_SERVICES.find(s => s.name === svc);
  const price = sel && tier ? sel.prices[tier] : null;

  const go = () => { setLoading(true); setTimeout(() => onSubmit({ service: svc, brief, turnaround: parseInt(tier), price }), 2000); };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, textAlign: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.orange, animation: "spin 0.8s linear infinite" }} />
      <div><H size={18}>Finding your designer...</H><T dim style={{ marginTop: 3 }}>Matching on skill & availability</T></div>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back</button>
      <H size={22}>Submit a Gig</H>
      <T dim style={{ marginBottom: 20 }}>Tell us what you need</T>

      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.orange : C.border }} />)}
      </div>

      {step === 1 && (
        <div>
          <H size={15} style={{ marginBottom: 10 }}>Category</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {Object.keys(SERVICES).map(c => (
              <button key={c} onClick={() => { setCat(c); setSvc(""); setStep(2); }} style={{
                padding: "11px 14px", borderRadius: 8, textAlign: "left",
                background: cat === c ? C.orangeDim : C.card,
                border: `1px solid ${cat === c ? C.orangeBorder : C.border}`,
                color: cat === c ? C.orange : C.white,
                fontFamily: "Inter", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <H size={15} style={{ marginBottom: 10 }}>{cat}</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {SERVICES[cat]?.map(s => (
              <button key={s.name} onClick={() => setSvc(s.name)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px", borderRadius: 8,
                background: svc === s.name ? C.orangeDim : C.card,
                border: `1px solid ${svc === s.name ? C.orangeBorder : C.border}`,
                color: svc === s.name ? C.orange : C.white,
                fontFamily: "Inter", fontSize: 13, cursor: "pointer",
              }}>
                <span>{s.name}</span>
                <span style={{ color: C.gray, fontSize: 11 }}>from R{s.prices[24].toLocaleString()}</span>
              </button>
            ))}
          </div>
          <Field label="Brief (optional)" value={brief} onChange={setBrief} textarea placeholder="Describe what you need..." />
          <div style={{ display: "flex", gap: 6 }}>
            <Btn v="ghost" sm onClick={() => setStep(1)}>Back</Btn>
            <Btn sm onClick={() => setStep(3)} disabled={!svc}>Next →</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <H size={15} style={{ marginBottom: 10 }}>Turnaround</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {Object.entries(TIERS).map(([h, { tag }]) => {
              const p = sel?.prices[h];
              return (
                <button key={h} onClick={() => setTier(h)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "13px 14px", borderRadius: 8,
                  background: tier === h ? C.orangeDim : C.card,
                  border: tier === h ? `2px solid ${C.orange}` : `1px solid ${C.border}`,
                  cursor: "pointer",
                }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, color: C.white, marginBottom: 2 }}>{h} Hours</div>
                    <Pill color={h === "4" ? C.red : h === "12" ? C.yellow : C.green}>{tag}</Pill>
                  </div>
                  <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: C.orange }}>R{p?.toLocaleString()}</div>
                </button>
              );
            })}
          </div>

          {tier && (
            <Card style={{ marginBottom: 14, background: C.bg, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T dim small>Service</T><T small style={{ color: C.white }}>{svc}</T></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T dim small>Turnaround</T><T small style={{ color: C.white }}>{tier}h — {TIERS[tier]?.tag}</T></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 6 }}>
                <T style={{ color: C.white, fontWeight: 600 }}>Total</T>
                <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: C.orange }}>R{price?.toLocaleString()}</span>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <Btn v="ghost" sm onClick={() => setStep(2)}>Back</Btn>
            <Btn sm onClick={go} disabled={!tier}>Submit Gig →</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CUSTOMER DASH ──────────────────────────────────────────────────────────
const CustDash = ({ gigs, onCreate, onRate }) => {
  const [tab, setTab] = useState("active");
  const active = gigs.filter(g => g.status !== "completed");
  const done = gigs.filter(g => g.status === "completed");
  const list = tab === "active" ? active : done;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div><H size={22}>My Gigs</H><T dim style={{ marginTop: 2 }}>Track your design requests</T></div>
        <Btn onClick={onCreate}>+ New Gig</Btn>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {["active", "completed"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px",
            borderRadius: 6, border: "none", cursor: "pointer", textTransform: "capitalize",
            background: tab === t ? C.orangeDim : "transparent", color: tab === t ? C.orange : C.gray,
          }}>{t} ({t === "active" ? active.length : done.length})</button>
        ))}
      </div>
      {list.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 36 }}>
          <T dim>{tab === "active" ? "No active gigs" : "No completed gigs"}</T>
          {tab === "active" && <Btn sm onClick={onCreate} style={{ marginTop: 10 }}>Submit your first gig</Btn>}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(g => <GigCard key={g.id} gig={g} isCust onRate={onRate} />)}
        </div>
      )}
    </div>
  );
};

// ─── DESIGNER DASH ──────────────────────────────────────────────────────────
const DesDash = ({ des, gigs, onAccept, onDeliver }) => {
  const [tab, setTab] = useState("available");
  const avail = gigs.filter(g => g.status === "pending");
  const mine = gigs.filter(g => g.designerId === des.id && g.status === "in_progress");
  const done = gigs.filter(g => g.designerId === des.id && (g.status === "completed" || g.status === "delivered"));
  const earned = done.reduce((s, g) => s + (g.price || 0) * 0.75, 0);

  const tabs = [{ k: "available", l: `Available (${avail.length})` }, { k: "active", l: `Active (${mine.length})` }, { k: "done", l: `Done (${done.length})` }];
  const list = tab === "available" ? avail : tab === "active" ? mine : done;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Av initials={des.initials} size={48} online={des.online} />
        <div style={{ flex: 1 }}>
          <H size={18}>{des.name}</H>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><Stars n={des.rating} size={13} /><T small dim>{des.rating} · {des.reviews} reviews</T></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {[{ l: "Completed", v: des.gigs }, { l: "Rating", v: des.rating + "★" }, { l: "Earned", v: `R${Math.round(earned).toLocaleString()}` }].map(s => (
          <Card key={s.l} style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: C.orange }}>{s.v}</div>
            <T small dim>{s.l}</T>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px",
            borderRadius: 6, border: "none", cursor: "pointer",
            background: tab === t.k ? C.orangeDim : "transparent", color: tab === t.k ? C.orange : C.gray,
          }}>{t.l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 36 }}><T dim>Nothing here yet</T></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(g => <GigCard key={g.id} gig={g} onAccept={onAccept} onDeliver={onDeliver} />)}
        </div>
      )}
    </div>
  );
};

// ─── RATING MODAL ───────────────────────────────────────────────────────────
const RateModal = ({ gig, onDone, onClose }) => {
  const [r, setR] = useState(5);
  const [fb, setFb] = useState("");
  const d = DESIGNERS.find(x => x.id === gig.designerId);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <Card onClick={e => e.stopPropagation()} style={{ maxWidth: 360, width: "100%", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Av initials={d?.initials || "?"} size={44} />
          <H size={17} style={{ marginTop: 8 }}>Rate {d?.name}</H>
          <T dim small>{gig.service}</T>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setR(s)} style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: s <= r ? C.orange : "#27272a" }}>★</button>
          ))}
        </div>
        <Field label="Feedback" value={fb} onChange={setFb} textarea placeholder="How was it?" />
        <div style={{ display: "flex", gap: 6 }}>
          <Btn v="ghost" full onClick={onClose}>Cancel</Btn>
          <Btn full onClick={() => onDone(r, fb)}>Submit</Btn>
        </div>
      </Card>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [pg, setPg] = useState("landing");
  const [gigs, setGigs] = useState([]);
  const [toast, setToast] = useState(null);
  const [rateId, setRateId] = useState(null);
  const [curDes, setCurDes] = useState(DESIGNERS[0]);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [dEmail, setDEmail] = useState("");

  const note = m => setToast(m);

  const create = (data) => {
    const m = DESIGNERS.find(d => d.online && d.skills.includes(data.service)) || DESIGNERS[0];
    const now = Date.now();
    setGigs(p => [{ id: uid(), ...data, status: "in_progress", designerId: m.id, created: now, deadline: now + data.turnaround * 3600000, rated: false, customerRating: null }, ...p]);
    note(`Matched with ${m.name}!`);
    setPg("customer-dash");
    sendEmail("gig_created", { customerEmail: cEmail, customerName: cName, gigType: data.service, turnaround: data.turnaround, price: data.price, brief: data.brief });
    sendEmail("designer_matched", { customerEmail: cEmail, customerName: cName, designerName: m.name, gigType: data.service, turnaround: data.turnaround, price: data.price });
  };

  const accept = (id) => {
    const g = gigs.find(x => x.id === id);
    setGigs(p => p.map(x => x.id === id ? { ...x, status: "in_progress", designerId: curDes.id, created: Date.now(), deadline: Date.now() + x.turnaround * 3600000 } : x));
    note("Gig accepted!");
    if (g) sendEmail("gig_accepted", { designerEmail: dEmail, designerName: curDes.name, gigType: g.service, turnaround: g.turnaround, price: g.price, brief: g.brief });
  };

  const deliver = (id) => {
    const g = gigs.find(x => x.id === id);
    setGigs(p => p.map(x => x.id === id ? { ...x, status: "delivered" } : x));
    note("Delivered!");
    if (g) sendEmail("gig_delivered", { customerEmail: cEmail, customerName: cName, designerName: curDes.name, gigType: g.service });
  };

  const rate = (r, fb) => {
    const g = gigs.find(x => x.id === rateId);
    const d = g ? DESIGNERS.find(x => x.id === g.designerId) : null;
    setGigs(p => p.map(x => x.id === rateId ? { ...x, status: "completed", rated: true, customerRating: r } : x));
    setRateId(null);
    note("Thanks for rating!");
    if (g && d) sendEmail("gig_rated", { designerEmail: dEmail, designerName: d.name, gigType: g.service, rating: r, feedback: fb });
  };

  useEffect(() => {
    if (!gigs.length) {
      const now = Date.now();
      setGigs([
        { id: "s1", service: "Logo Design", brief: "Modern fintech logo for PayFast", turnaround: 12, price: 1200, status: "pending", designerId: null, created: now - 1200000, deadline: now + 12 * 3600000, rated: false, customerRating: null },
        { id: "s2", service: "Social Media Graphics (x5)", brief: "Restaurant grand opening carousel", turnaround: 4, price: 1200, status: "pending", designerId: null, created: now - 600000, deadline: now + 4 * 3600000, rated: false, customerRating: null },
      ]);
    }
  }, []);

  const rg = gigs.find(g => g.id === rateId);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: C.white, background: C.bg, minHeight: "100vh" }}>
      <style>{CSS}</style>
      {toast && <Toasty msg={toast} onClose={() => setToast(null)} />}
      {rg && <RateModal gig={rg} onDone={rate} onClose={() => setRateId(null)} />}

      {pg === "landing" && <Landing go={setPg} />}
      {pg === "customer-login" && <CustLogin name={cName} setName={setCName} email={cEmail} setEmail={setCEmail} onGo={() => setPg("customer-dash")} go={setPg} />}
      {pg === "customer-dash" && <Shell role="customer" go={setPg}><CustDash gigs={gigs} onCreate={() => setPg("create-gig")} onRate={id => setRateId(id)} /></Shell>}
      {pg === "create-gig" && <Shell role="customer" go={setPg}><CreateGig onSubmit={create} onBack={() => setPg("customer-dash")} /></Shell>}
      {pg === "designer-register" && <DesRegister go={setPg} onReg={(d) => {
        setCurDes({ ...DESIGNERS[0], name: d.name, initials: d.name.split(" ").map(w => w[0]).join(""), skills: d.skills, city: d.city });
        setDEmail(d.email); note("Welcome aboard!"); setPg("designer-dash");
        sendEmail("designer_welcome", { designerEmail: d.email, designerName: d.name });
      }} />}
      {pg === "designer-login" && <DesLogin email={dEmail} setEmail={setDEmail} onGo={() => setPg("designer-dash")} go={setPg} />}
      {pg === "designer-dash" && <Shell role="designer" go={setPg}><DesDash des={curDes} gigs={gigs} onAccept={accept} onDeliver={deliver} /></Shell>}
    </div>
  );
}

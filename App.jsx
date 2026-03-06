import { useState, useEffect, useCallback } from "react";

// ─── PRICING DATA ───────────────────────────────────────────────────────────
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

// ─── API HELPER ─────────────────────────────────────────────────────────────
const api = async (action, data = {}, method = "POST") => {
  try {
    const isGet = method === "GET";
    const params = isGet ? "?" + new URLSearchParams({ action, ...data }).toString() : "";
    const res = await fetch(`/api/db${params}`, {
      method,
      headers: isGet ? {} : { "Content-Type": "application/json" },
      body: isGet ? undefined : JSON.stringify({ action, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "API error");
    return json;
  } catch (e) {
    console.error(`API [${action}]:`, e);
    return { error: e.message };
  }
};

const sendEmail = async (type, data) => {
  try { await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, data }) }); } catch (e) { console.error("Email:", e); }
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
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

const X = {
  bg: "#09090b", card: "#131316", border: "#1e1e24",
  orange: "#f97316", orangeLight: "#fb923c",
  orangeDim: "rgba(249,115,22,0.1)", orangeBorder: "rgba(249,115,22,0.2)",
  teal: "#06b6d4", tealLight: "#22d3ee",
  tealDim: "rgba(6,182,212,0.1)", tealBorder: "rgba(6,182,212,0.2)",
  white: "#fafafa", gray: "#71717a", grayLight: "#a1a1aa",
  green: "#22c55e", red: "#ef4444", yellow: "#eab308",
};

// ─── UI PRIMITIVES ──────────────────────────────────────────────────────────
const H = ({ children, s = 24, style }) => <h2 style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: s, color: X.white, letterSpacing: "-0.02em", lineHeight: 1.2, ...style }}>{children}</h2>;
const T = ({ children, dim, sm, style }) => <p style={{ fontSize: sm ? 12 : 14, color: dim ? X.gray : X.grayLight, lineHeight: 1.5, ...style }}>{children}</p>;
const Pill = ({ children, color = X.orange }) => <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: color + "18", color, border: `1px solid ${color}30`, display: "inline-block" }}>{children}</span>;
const Stars = ({ n = 5, s = 13 }) => <span style={{ letterSpacing: 1 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(n) ? X.orange : "#27272a", fontSize: s }}>★</span>)}</span>;
const Av = ({ text, s = 36, on }) => <div style={{ width: s, height: s, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${X.orange}, ${X.orangeLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, fontSize: s * 0.35, color: X.bg, position: "relative" }}>{text}{on !== undefined && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: on ? X.green : "#555", border: `2px solid ${X.card}` }} />}</div>;

const Btn = ({ children, onClick, v = "primary", full, disabled, sm, style: st }) => {
  const vs = { primary: { background: X.orange, color: X.bg }, secondary: { background: X.card, color: X.white, border: `1px solid ${X.border}` }, ghost: { background: "transparent", color: X.gray, border: `1px solid ${X.border}` } };
  return <button onClick={disabled ? undefined : onClick} style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: sm ? 12 : 13, padding: sm ? "7px 14px" : "10px 20px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, transition: "all 0.15s", width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, ...vs[v], ...st }}>{children}</button>;
};

const Card = ({ children, style: st, onClick }) => <div onClick={onClick} style={{ background: X.card, border: `1px solid ${X.border}`, borderRadius: 10, padding: 20, cursor: onClick ? "pointer" : "default", ...st }}>{children}</div>;

const Field = ({ label, value, onChange, type = "text", placeholder, textarea }) => {
  const b = { width: "100%", background: X.bg, border: `1px solid ${X.border}`, borderRadius: 8, padding: "10px 14px", color: X.white, fontFamily: "Inter", fontSize: 14, outline: "none" };
  return <div style={{ marginBottom: 14 }}>{label && <label style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 600, color: X.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>}{textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...b, resize: "vertical" }} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={b} />}</div>;
};

const Bar = ({ pct }) => <div style={{ width: "100%", height: 4, background: X.bg, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: pct > 80 ? X.red : pct > 50 ? X.yellow : X.orange, transition: "width 0.4s" }} /></div>;

const Toasty = ({ msg, onClose }) => { useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]); return <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: X.card, border: `1px solid ${X.border}`, borderRadius: 10, padding: "12px 20px", fontFamily: "Outfit", fontWeight: 600, fontSize: 13, color: X.white, animation: "fadeIn 0.2s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: X.orange }}>●</span> {msg}</div>; };

const Spinner = ({ text }) => <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 14 }}><div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${X.border}`, borderTopColor: X.orange, animation: "spin 0.8s linear infinite" }} /><T dim>{text || "Loading..."}</T></div>;

// ─── LAYOUT ─────────────────────────────────────────────────────────────────
const Nav = ({ go, minimal }) => <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}` }}><span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer", letterSpacing: "-0.02em" }}><span style={{ color: X.orange }}>lastminute</span>.design</span>{!minimal && <div style={{ display: "flex", gap: 8 }}><Btn v="ghost" sm onClick={() => go("designer-register")} style={{ color: X.teal, borderColor: X.tealBorder }}>Join as Designer</Btn><Btn sm onClick={() => go("customer-login")}>Get Design</Btn></div>}</nav>;

const Shell = ({ children, role, go }) => <div style={{ minHeight: "100vh", background: X.bg }}><nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 28px", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}`, position: "sticky", top: 0, zIndex: 100 }}><span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer" }}><span style={{ color: X.orange }}>lastminute</span>.design</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Pill color={role === "designer" ? X.teal : X.orange}>{role}</Pill><button onClick={() => go("landing")} style={{ background: "none", border: "none", color: X.gray, fontSize: 12, fontFamily: "Inter", cursor: "pointer" }}>Sign out</button></div></nav><div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>{children}</div></div>;

// ─── LANDING ────────────────────────────────────────────────────────────────
const Landing = ({ go }) => {
  const [openCat, setOpenCat] = useState(null);
  const Section = ({ children, style: s }) => <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", ...s }}>{children}</div>;
  const SectionLabel = ({ children }) => <Pill>{children}</Pill>;
  const SectionH = ({ children }) => <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "clamp(26px, 4vw, 38px)", color: X.white, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "14px 0 10px" }}>{children}</h2>;
  const SectionP = ({ children }) => <p style={{ fontSize: 16, color: X.grayLight, lineHeight: 1.6, maxWidth: 540 }}>{children}</p>;
  const FeatureCard = ({ icon, title, desc }) => <Card style={{ padding: 24, flex: "1 1 200px" }}><div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div><div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.white, marginBottom: 6 }}>{title}</div><T dim sm>{desc}</T></Card>;

  return (
    <div style={{ background: X.bg, minHeight: "100vh" }}>
      <Nav go={go} />

      {/* ─── HERO ─── */}
      <div style={{ paddingTop: 100, textAlign: "center", maxWidth: 680, margin: "0 auto", padding: "100px 20px 40px" }}>
        <Pill>24/7 Rush Creative Studio</Pill>
        <h1 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "clamp(38px, 7vw, 68px)", lineHeight: 1.06, color: X.white, margin: "20px 0 16px", letterSpacing: "-0.03em" }}>
          Never miss a<br />deadline <span style={{ color: X.orange }}>again.</span>
        </h1>
        <p style={{ fontSize: 17, color: X.grayLight, maxWidth: 480, margin: "0 auto 16px", lineHeight: 1.6 }}>
          On-demand graphic design with guaranteed 4, 12 or 24-hour delivery. Vetted South African designers matched to your project instantly.
        </p>
        <p style={{ fontSize: 13, color: X.gray, marginBottom: 36 }}>
          No contracts · No subscriptions · Pay per project
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={() => go("customer-login")} style={{ padding: "14px 28px", fontSize: 15 }}>Get Design Now →</Btn>
          <Btn v="secondary" onClick={() => go("designer-register")} style={{ padding: "14px 28px", fontSize: 15, background: X.tealDim, color: X.teal, border: `1px solid ${X.tealBorder}` }}>Earn as a Designer</Btn>
        </div>
      </div>

      {/* ─── TRUST BAR ─── */}
      <div style={{ borderTop: `1px solid ${X.border}`, borderBottom: `1px solid ${X.border}`, padding: "20px 20px", marginTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
          {[["247+", "Vetted Designers"], ["1,200+", "Gigs Delivered"], ["4.8★", "Avg Rating"], ["98%", "On-Time Delivery"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 22, color: X.orange }}>{v}</div>
              <T sm dim>{l}</T>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel>How It Works</SectionLabel>
          <SectionH>Design in 3 simple steps</SectionH>
          <SectionP style={{ margin: "0 auto" }}>No meetings. No endless revisions. Just fast, professional design when you need it most.</SectionP>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <Card style={{ padding: 24, textAlign: "center", borderTop: `2px solid ${X.orange}` }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 36, color: X.orange, marginBottom: 8 }}>01</div>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.white, marginBottom: 6 }}>Choose & Brief</div>
            <T dim sm>Pick your services, upload your brief, choose 4h, 12h or 24h delivery.</T>
          </Card>
          <Card style={{ padding: 24, textAlign: "center", borderTop: `2px solid ${X.orangeLight}` }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 36, color: X.orangeLight, marginBottom: 8 }}>02</div>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.white, marginBottom: 6 }}>We Match & Create</div>
            <T dim sm>We instantly assign a designer with the right skills. They start working immediately.</T>
          </Card>
          <Card style={{ padding: 24, textAlign: "center", borderTop: `2px solid ${X.green}` }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 36, color: X.green, marginBottom: 8 }}>03</div>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.white, marginBottom: 6 }}>Receive & Approve</div>
            <T dim sm>Get your files delivered on time. Review, rate, and download — done.</T>
          </Card>
        </div>
      </Section>

      {/* ─── FOR BUSINESSES & INDIVIDUALS ─── */}
      <div style={{ borderTop: `1px solid ${X.border}` }}>
        <Section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            <div>
              <SectionLabel>For Businesses</SectionLabel>
              <SectionH>The deadline is tomorrow.<br />We've got you.</SectionH>
              <SectionP style={{ marginBottom: 20 }}>
                Your printer needs files by 8am. The event is this weekend. The client changed the brief at 5pm. Sound familiar? We exist for exactly these moments.
              </SectionP>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["⚡", "Rush jobs handled 24/7 — even weekends and holidays"],
                  ["📐", "Professional, print-ready files every time"],
                  ["🔒", "Consistent quality from vetted, rated designers"],
                  ["📦", "Bundle multiple services in one order"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <T style={{ color: X.grayLight, fontSize: 14 }}>{text}</T>
                  </div>
                ))}
              </div>
              <Btn onClick={() => go("customer-login")} style={{ marginTop: 20 }}>Submit a Gig →</Btn>
            </div>
            <div>
              <SectionLabel>For Individuals</SectionLabel>
              <SectionH>That thing you've been putting off? Done by morning.</SectionH>
              <SectionP style={{ marginBottom: 20 }}>
                Wedding invites. Your startup logo. A CV that actually stands out. A tombstone unveiling programme. Whatever you need designed — stop stressing and let a pro handle it.
              </SectionP>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["💰", "Transparent pricing — see your total before you pay"],
                  ["🎯", "No design jargon — just describe what you need"],
                  ["🕐", "Pick your deadline: 4 hours, 12 hours, or 24 hours"],
                  ["⭐", "Rate your designer and see reviews before they start"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <T style={{ color: X.grayLight, fontSize: 14 }}>{text}</T>
                  </div>
                ))}
              </div>
              <Btn onClick={() => go("customer-login")} style={{ marginTop: 20 }}>Get Started →</Btn>
            </div>
          </div>
        </Section>
      </div>

      {/* ─── TURNAROUND TIERS ─── */}
      <div style={{ borderTop: `1px solid ${X.border}` }}>
        <Section style={{ textAlign: "center" }}>
          <SectionLabel>Delivery Options</SectionLabel>
          <SectionH>Pick your speed</SectionH>
          <SectionP style={{ margin: "0 auto 32px" }}>Every tier gets the same quality. The only difference is how fast you need it.</SectionP>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { h: "4", tag: "RUSH", color: X.red, desc: "Ultra-priority. Your designer starts within minutes. For when it absolutely cannot wait.", icon: "⚡" },
              { h: "12", tag: "EXPRESS", color: X.yellow, desc: "Same-day delivery. Perfect for that thing you forgot about this morning.", icon: "🔥" },
              { h: "24", tag: "STANDARD", color: X.green, desc: "Next-day delivery. Best value. Great for planned projects with tight timelines.", icon: "🕐" },
            ].map(t => (
              <Card key={t.h} onClick={() => go("customer-login")} style={{ cursor: "pointer", padding: 24, textAlign: "center", borderTop: `2px solid ${t.color}` }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                <Pill color={t.color}>{t.tag}</Pill>
                <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 36, color: X.white, margin: "10px 0 4px" }}>{t.h}h</div>
                <T dim sm>{t.desc}</T>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── FOR DESIGNERS ─── */}
      <div style={{ borderTop: `1px solid ${X.border}`, background: "linear-gradient(180deg, rgba(6,182,212,0.04), transparent)" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Pill color={X.teal}>For Designers</Pill>
            <SectionH>Turn your talent into income.<br />On your terms.</SectionH>
            <SectionP style={{ margin: "0 auto" }}>
              No cold pitching. No client chasing. No unpaid quotes. Just open your dashboard, accept a gig, deliver great work, and get paid. Simple.
            </SectionP>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 32 }}>
            {[
              { icon: "💸", title: "75% Earnings", desc: "You keep 75% of every gig. Weekly payouts straight to your bank account." },
              { icon: "🕐", title: "Work When You Want", desc: "Go online when you're available, go offline when you're not. No minimums, no schedules." },
              { icon: "📈", title: "Build Your Rep", desc: "Every delivery earns you ratings. Higher ratings = more gigs = more money." },
              { icon: "🎯", title: "Matched to Your Skills", desc: "Only see gigs that match your skillset. No wasted time on work you don't do." },
            ].map(f => (
              <Card key={f.title} style={{ padding: 24, flex: "1 1 200px", borderTop: `2px solid ${X.teal}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.white, marginBottom: 6 }}>{f.title}</div>
                <T dim sm>{f.desc}</T>
              </Card>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[
              { v: "R12,000+", l: "Avg monthly earnings" },
              { v: "15 min", l: "Avg time to first gig" },
              { v: "247+", l: "Active designers" },
              { v: "Weekly", l: "Payouts" },
            ].map(s => (
              <Card key={s.l} style={{ textAlign: "center", padding: 16 }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 22, color: X.teal }}>{s.v}</div>
                <T sm dim>{s.l}</T>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Btn onClick={() => go("designer-register")} style={{ padding: "14px 32px", fontSize: 15, background: X.teal, color: X.bg }}>Apply as a Designer →</Btn>
            <T dim sm style={{ marginTop: 10 }}>Free to join · Takes 2 minutes · Start earning today</T>
          </div>
        </Section>
      </div>

      {/* ─── SERVICES & PRICING ─── */}
      <div style={{ borderTop: `1px solid ${X.border}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <SectionLabel>Pricing</SectionLabel>
            <SectionH>Transparent pricing. No surprises.</SectionH>
            <SectionP style={{ margin: "0 auto" }}>20 services across 4 categories. All prices in ZAR.</SectionP>
          </div>
          {Object.entries(SERVICES).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <button onClick={() => setOpenCat(openCat === cat ? null : cat)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: X.card, border: `1px solid ${X.border}`, borderRadius: openCat === cat ? "10px 10px 0 0" : 10, color: X.white, fontFamily: "Outfit", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {cat}<span style={{ color: X.gray, fontSize: 16, transition: "transform 0.2s", transform: openCat === cat ? "rotate(180deg)" : "none" }}>▾</span>
              </button>
              {openCat === cat && (
                <div style={{ border: `1px solid ${X.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px 72px", padding: "7px 16px", background: X.bg }}><T sm dim>Service</T><T sm dim style={{ textAlign: "right" }}>4h</T><T sm dim style={{ textAlign: "right" }}>12h</T><T sm dim style={{ textAlign: "right" }}>24h</T></div>
                  {items.map((item, i) => (
                    <div key={item.name} style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px 72px", padding: "9px 16px", background: i % 2 === 0 ? X.card : "transparent", borderTop: `1px solid ${X.border}` }}>
                      <T style={{ color: X.white, fontSize: 13 }}>{item.name}</T>
                      <T sm style={{ textAlign: "right", color: X.orangeLight }}>R{item.prices[4].toLocaleString()}</T>
                      <T sm style={{ textAlign: "right", color: X.grayLight }}>R{item.prices[12].toLocaleString()}</T>
                      <T sm style={{ textAlign: "right", color: X.grayLight }}>R{item.prices[24].toLocaleString()}</T>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      </div>

      {/* ─── FINAL CTA ─── */}
      <div style={{ borderTop: `1px solid ${X.border}`, background: "linear-gradient(180deg, rgba(249,115,22,0.06), transparent)" }}>
        <Section style={{ textAlign: "center", paddingTop: 60, paddingBottom: 60 }}>
          <SectionH>Ready to stop missing deadlines?</SectionH>
          <SectionP style={{ margin: "0 auto 28px" }}>
            Whether you need a logo by morning or a full brand pack by Friday — we've got a designer ready right now.
          </SectionP>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => go("customer-login")} style={{ padding: "14px 28px", fontSize: 15 }}>Submit a Gig →</Btn>
            <Btn v="ghost" onClick={() => go("designer-register")} style={{ padding: "14px 28px", fontSize: 15, color: X.teal, borderColor: X.tealBorder }}>Join as Designer</Btn>
          </div>
        </Section>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ borderTop: `1px solid ${X.border}`, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, marginBottom: 12 }}>
          <span style={{ color: X.orange }}>lastminute</span>.design
        </div>
        <T dim sm>24/7 Rush Creative Studio · Based in South Africa</T>
        <T dim sm style={{ marginTop: 4 }}>hello@lastminutedesigns.co.za · +27 82 000 0000</T>
        <T dim sm style={{ marginTop: 12 }}>© {new Date().getFullYear()} Last Minute Designs. All rights reserved.</T>
      </div>
    </div>
  );
};

// ─── FILE UPLOAD COMPONENT ──────────────────────────────────────────────────
const SUPA_URL = typeof window !== "undefined" ? (window.__LMD_SUPA_URL__ || "") : "";

const FileSection = ({ gigId, role, userId, label, uploadRole, files, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const canUpload = role === uploadRole;
  const filtered = files.filter(f => f.uploaded_by_role === uploadRole);
  const supaUrl = SUPA_URL;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${gigId}/${Date.now()}_${file.name}`;
      // Upload via our API to avoid exposing keys
      await api("register_file", {
        gig_id: gigId,
        uploaded_by_role: role,
        uploaded_by_id: userId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  const iconFor = (type) => {
    if (!type) return "📄";
    if (type.startsWith("image")) return "🖼";
    if (type.includes("pdf")) return "📑";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    if (type.includes("psd") || type.includes("illustrator") || type.includes("ai")) return "🎨";
    return "📄";
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <T sm style={{ color: X.white, fontWeight: 600 }}>{label}</T>
          <T sm dim>({filtered.length})</T>
        </div>
        {canUpload && (
          <label style={{ cursor: uploading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: uploadRole === "designer" ? X.tealDim : X.orangeDim, color: uploadRole === "designer" ? X.teal : X.orange, fontSize: 11, fontFamily: "Outfit", fontWeight: 600, border: `1px solid ${uploadRole === "designer" ? X.tealBorder : X.orangeBorder}` }}>
            {uploading ? "Uploading..." : "＋ Upload"}
            <input type="file" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
          </label>
        )}
      </div>
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {filtered.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: X.bg, borderRadius: 6, border: `1px solid ${X.border}` }}>
              <span style={{ fontSize: 14 }}>{iconFor(f.file_type)}</span>
              <T sm style={{ color: X.white, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name}</T>
              <T sm dim>{f.file_size ? (f.file_size / 1024).toFixed(0) + "KB" : ""}</T>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "10px", background: X.bg, borderRadius: 6, border: `1px dashed ${X.border}`, textAlign: "center" }}>
          <T sm dim>{canUpload ? `Drag or click upload to add ${uploadRole === "customer" ? "reference" : "design"} files` : `No ${uploadRole === "customer" ? "reference" : "design"} files yet`}</T>
        </div>
      )}
    </div>
  );
};

const GigFiles = ({ gigId, role, userId }) => {
  const [files, setFiles] = useState([]);

  const load = useCallback(async () => {
    const res = await api("get_gig_files", { gig_id: gigId }, "GET");
    if (res.files) setFiles(res.files);
  }, [gigId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ borderTop: `1px solid ${X.border}`, paddingTop: 10, marginTop: 10 }}>
      <FileSection gigId={gigId} role={role} userId={userId} label="📎 Reference Files" uploadRole="customer" files={files} onRefresh={load} />
      <FileSection gigId={gigId} role={role} userId={userId} label="🎨 Submitted Designs" uploadRole="designer" files={files} onRefresh={load} />
    </div>
  );
};

// ─── GIG CARD ───────────────────────────────────────────────────────────────
const GigCard = ({ gig, designer, rating, isCust, onAccept, onDeliver, onRate, userId }) => {
  const [showFiles, setShowFiles] = useState(false);
  const pct = gig.status === "in_progress" && gig.deadline ? Math.min(100, Math.max(0, Math.round(((Date.now() - new Date(gig.created_at).getTime()) / (new Date(gig.deadline).getTime() - new Date(gig.created_at).getTime())) * 100))) : 0;
  const hrs = gig.deadline ? Math.max(0, ((new Date(gig.deadline).getTime() - Date.now()) / 3600000).toFixed(1)) : 0;
  const sc = { pending: X.yellow, matched: X.orange, in_progress: X.orange, delivered: X.green, completed: X.green }[gig.status] || X.gray;
  const isPaid = gig.status !== "pending" || gig.price > 0;

  return (
    <Card style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
            <Pill color={sc}>{gig.status.replace("_", " ")}</Pill>
            <Pill color={gig.turnaround === 4 ? X.red : gig.turnaround === 12 ? X.yellow : X.green}>{TIERS[gig.turnaround]?.tag}</Pill>
            {isPaid && <Pill color={X.green}>PAID</Pill>}
          </div>
          <H s={15}>{gig.service}</H>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 17, color: X.orange }}>R{gig.price?.toLocaleString()}</div>
          {!isCust && <T sm dim style={{ marginTop: 2 }}>You earn R{Math.round((gig.price || 0) * 0.75).toLocaleString()}</T>}
        </div>
      </div>

      {gig.brief && <T dim sm style={{ marginBottom: 8 }}>{gig.brief}</T>}

      {/* Progress bar */}
      {gig.status === "in_progress" && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T sm dim>Progress</T><T sm style={{ color: hrs < 1 ? X.red : X.gray }}>{hrs}h left</T></div>
          <Bar pct={pct} />
        </div>
      )}

      {/* Designer info */}
      {designer && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: `1px solid ${X.border}` }}>
          <Av text={designer.avatar_initials || "?"} s={30} on={designer.is_online} />
          <div style={{ flex: 1 }}>
            <T style={{ color: X.white, fontSize: 13, fontWeight: 600 }}>{designer.name}</T>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stars n={designer.rating} s={10} /><T sm dim>{designer.rating || "New"}</T></div>
          </div>
          {isCust && gig.status === "delivered" && !rating && <Btn sm onClick={() => onRate(gig.id)}>Accept & Rate</Btn>}
          {!isCust && gig.status === "in_progress" && <Btn sm onClick={() => onDeliver(gig.id)}>Deliver</Btn>}
        </div>
      )}

      {/* Accept button for designers */}
      {!isCust && gig.status === "pending" && (
        <div style={{ paddingTop: 10, borderTop: `1px solid ${X.border}` }}>
          <Btn sm onClick={() => onAccept(gig.id, gig.turnaround)}>Accept Gig</Btn>
        </div>
      )}

      {/* Rating */}
      {rating && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${X.border}`, display: "flex", alignItems: "center", gap: 5 }}>
          <Stars n={rating.score} s={12} /><T sm dim>Rated {rating.score}/5</T>
        </div>
      )}

      {/* Files toggle — show for any gig that's been paid/active */}
      {(gig.status === "in_progress" || gig.status === "delivered" || gig.status === "completed") && userId && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowFiles(!showFiles)} style={{
            background: "none", border: `1px solid ${X.border}`, borderRadius: 6,
            padding: "6px 12px", cursor: "pointer", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            color: X.grayLight, fontSize: 12, fontFamily: "Outfit", fontWeight: 600,
          }}>
            {showFiles ? "Hide Files ▴" : "View Files & Designs ▾"}
          </button>
          {showFiles && <GigFiles gigId={gig.id} role={isCust ? "customer" : "designer"} userId={userId} />}
        </div>
      )}
    </Card>
  );
};

// ─── CREATE GIG ─────────────────────────────────────────────────────────────
const CreateGig = ({ onSubmit, onBack }) => {
  const [selected, setSelected] = useState([]); // array of service names
  const [brief, setBrief] = useState("");
  const [tier, setTier] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [openCats, setOpenCats] = useState([]);

  const toggleCat = c => setOpenCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleSvc = name => setSelected(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  // Calculate total price for selected services at chosen tier
  const getTotal = (t) => {
    if (!t) return 0;
    return selected.reduce((sum, name) => {
      const svc = ALL_SERVICES.find(s => s.name === name);
      return sum + (svc ? svc.prices[t] : 0);
    }, 0);
  };

  const total = getTotal(tier);
  const serviceLabel = selected.length === 1 ? selected[0] : `${selected.length} services`;
  const category = selected.length > 0 ? Object.entries(SERVICES).find(([, items]) => items.some(i => i.name === selected[0]))?.[0] || "" : "";

  const go = () => {
    setLoading(true);
    onSubmit({
      service: selected.join(" + "),
      services: selected,
      category,
      brief,
      turnaround: parseInt(tier),
      price: total,
    });
  };

  if (loading) return <Spinner text="Finding your designer..." />;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back</button>
      <H s={22}>Submit a Gig</H>
      <T dim style={{ marginBottom: 20 }}>Select one or more services</T>
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? X.orange : X.border }} />)}
      </div>

      {/* Step 1: Pick services (multi-select across all categories) */}
      {step === 1 && (
        <div>
          <H s={15} style={{ marginBottom: 10 }}>What do you need?</H>
          <T dim sm style={{ marginBottom: 14 }}>Select all that apply — prices shown are for 24h turnaround</T>

          {Object.entries(SERVICES).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <button onClick={() => toggleCat(cat)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px", background: X.card, border: `1px solid ${X.border}`,
                borderRadius: openCats.includes(cat) ? "8px 8px 0 0" : 8,
                color: X.white, fontFamily: "Outfit", fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                <span>{cat}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selected.some(s => items.some(i => i.name === s)) && (
                    <Pill color={X.green}>{selected.filter(s => items.some(i => i.name === s)).length} selected</Pill>
                  )}
                  <span style={{ color: X.gray, fontSize: 14, transition: "transform 0.2s", transform: openCats.includes(cat) ? "rotate(180deg)" : "none" }}>▾</span>
                </div>
              </button>
              {openCats.includes(cat) && (
                <div style={{ border: `1px solid ${X.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                  {items.map((item, i) => {
                    const isSelected = selected.includes(item.name);
                    return (
                      <button key={item.name} onClick={() => toggleSvc(item.name)} style={{
                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", background: isSelected ? X.orangeDim : (i % 2 === 0 ? X.card : "transparent"),
                        border: "none", borderTop: i > 0 ? `1px solid ${X.border}` : "none",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${isSelected ? X.orange : X.border}`,
                            background: isSelected ? X.orange : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: X.bg, fontWeight: 800,
                          }}>{isSelected ? "✓" : ""}</div>
                          <span style={{ fontFamily: "Inter", fontSize: 13, color: isSelected ? X.orange : X.white }}>{item.name}</span>
                        </div>
                        <span style={{ fontFamily: "Outfit", fontSize: 12, color: X.grayLight }}>R{item.prices[24].toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Selected summary */}
          {selected.length > 0 && (
            <Card style={{ marginTop: 14, padding: 14, background: X.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <T sm style={{ color: X.white, fontWeight: 600 }}>{selected.length} service{selected.length > 1 ? "s" : ""} selected</T>
                <button onClick={() => setSelected([])} style={{ background: "none", border: "none", color: X.red, fontSize: 11, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer" }}>Clear all</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {selected.map(s => (
                  <span key={s} onClick={() => toggleSvc(s)} style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter",
                    background: X.orangeDim, color: X.orange, border: `1px solid ${X.orangeBorder}`,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>{s} ✕</span>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            <Btn sm onClick={() => setStep(2)} disabled={selected.length === 0}>Next →</Btn>
          </div>
        </div>
      )}

      {/* Step 2: Brief */}
      {step === 2 && (
        <div>
          <H s={15} style={{ marginBottom: 4 }}>Project brief</H>
          <T dim sm style={{ marginBottom: 14 }}>Tell the designer what you need for: {serviceLabel}</T>
          <Field label="Brief" value={brief} onChange={setBrief} textarea placeholder="Describe what you need — colors, style, dimensions, references..." />
          <div style={{ display: "flex", gap: 6 }}>
            <Btn v="ghost" sm onClick={() => setStep(1)}>Back</Btn>
            <Btn sm onClick={() => setStep(3)}>Next →</Btn>
          </div>
        </div>
      )}

      {/* Step 3: Turnaround + order summary */}
      {step === 3 && (
        <div>
          <H s={15} style={{ marginBottom: 10 }}>Choose turnaround</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {Object.entries(TIERS).map(([h, { tag }]) => {
              const tierTotal = getTotal(h);
              return (
                <button key={h} onClick={() => setTier(h)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "13px 14px", borderRadius: 8,
                  background: tier === h ? X.orangeDim : X.card,
                  border: tier === h ? `2px solid ${X.orange}` : `1px solid ${X.border}`,
                  cursor: "pointer",
                }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, color: X.white, marginBottom: 2 }}>{h} Hours</div>
                    <Pill color={h === "4" ? X.red : h === "12" ? X.yellow : X.green}>{tag}</Pill>
                  </div>
                  <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: X.orange }}>R{tierTotal.toLocaleString()}</div>
                </button>
              );
            })}
          </div>

          {/* Order summary */}
          {tier && (
            <Card style={{ marginBottom: 14, background: X.bg, padding: 14 }}>
              <T dim sm style={{ marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Order Summary</T>
              {selected.map(name => {
                const svc = ALL_SERVICES.find(s => s.name === name);
                return (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <T sm style={{ color: X.grayLight }}>{name}</T>
                    <T sm style={{ color: X.white }}>R{svc?.prices[tier]?.toLocaleString()}</T>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, paddingTop: 4 }}>
                <T dim sm>Turnaround</T>
                <T sm style={{ color: X.white }}>{tier}h — {TIERS[tier]?.tag}</T>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${X.border}`, paddingTop: 8, marginTop: 8 }}>
                <T style={{ color: X.white, fontWeight: 700 }}>Total</T>
                <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: X.orange }}>R{total.toLocaleString()}</span>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <Btn v="ghost" sm onClick={() => setStep(2)}>Back</Btn>
            <Btn sm onClick={go} disabled={!tier}>Submit Gig — R{total.toLocaleString()} →</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CUSTOMER PROFILE ───────────────────────────────────────────────────────
const CustProfile = ({ customer, onUpdate }) => {
  const [f, setF] = useState({ ...customer });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const res = await api("update_customer_profile", { customer_id: customer.id, ...f });
    if (res.customer) { onUpdate(res.customer); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  return (
    <div>
      <H s={20} style={{ marginBottom: 16 }}>Business Details</H>
      <T dim sm style={{ marginBottom: 20 }}>These details will be used on your design elements (letterheads, business cards, etc.)</T>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Personal</T>
          <Field label="Full Name" value={f.name || ""} onChange={v => set("name", v)} placeholder="Your name" />
          <Field label="Phone" value={f.phone || ""} onChange={v => set("phone", v)} placeholder="+27 82 000 0000" />
        </Card>
        <Card style={{ padding: 16 }}>
          <T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Company</T>
          <Field label="Company Name" value={f.company_name || ""} onChange={v => set("company_name", v)} placeholder="Your Company (Pty) Ltd" />
          <Field label="Registration Number" value={f.registration_number || ""} onChange={v => set("registration_number", v)} placeholder="2024/000000/07" />
          <Field label="Tagline / Slogan" value={f.tagline || ""} onChange={v => set("tagline", v)} placeholder="We make things happen" />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
        <Card style={{ padding: 16 }}>
          <T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Contact Details</T>
          <Field label="Company Email" value={f.company_email || ""} onChange={v => set("company_email", v)} placeholder="info@company.co.za" />
          <Field label="Company Phone" value={f.company_phone || ""} onChange={v => set("company_phone", v)} placeholder="+27 11 000 0000" />
          <Field label="Website" value={f.company_website || ""} onChange={v => set("company_website", v)} placeholder="www.company.co.za" />
          <Field label="Physical Address" value={f.company_address || ""} onChange={v => set("company_address", v)} textarea placeholder="123 Main Road, Sandton, 2196" />
        </Card>
        <Card style={{ padding: 16 }}>
          <T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Brand & Social</T>
          <Field label="Brand Colors" value={f.brand_colors || ""} onChange={v => set("brand_colors", v)} placeholder="e.g. Navy #1B2A4A, Gold #D4AF37" />
          <Field label="Facebook" value={f.social_facebook || ""} onChange={v => set("social_facebook", v)} placeholder="facebook.com/yourpage" />
          <Field label="Instagram" value={f.social_instagram || ""} onChange={v => set("social_instagram", v)} placeholder="@yourhandle" />
          <Field label="Twitter / X" value={f.social_twitter || ""} onChange={v => set("social_twitter", v)} placeholder="@yourhandle" />
          <Field label="LinkedIn" value={f.social_linkedin || ""} onChange={v => set("social_linkedin", v)} placeholder="linkedin.com/company/yours" />
        </Card>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : saved ? "✓ Saved!" : "Save Details"}</Btn>
        <T sm dim>Your details auto-populate into design briefs</T>
      </div>
    </div>
  );
};

// ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────────
const CustDash = ({ customer, onCreateGig, onRate, onUpdateCustomer }) => {
  const [tab, setTab] = useState("active");
  const [gigs, setGigs] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api("get_customer_gigs", { customer_id: customer.id }, "GET");
    if (res.gigs) { setGigs(res.gigs); setDesigners(res.designers || []); setRatings(res.ratings || []); }
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);

  const active = gigs.filter(g => g.status !== "completed");
  const done = gigs.filter(g => g.status === "completed");
  const totalSpent = gigs.reduce((s, g) => s + (g.price || 0), 0);

  if (loading) return <Spinner text="Loading gigs..." />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div><H s={22}>Dashboard</H><T dim style={{ marginTop: 2 }}>Welcome back, {customer.name}</T></div>
        <Btn onClick={onCreateGig}>+ New Gig</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 20 }}>
        {[
          { l: "Active", v: active.length, c: X.orange },
          { l: "Completed", v: done.length, c: X.green },
          { l: "Total Spent", v: `R${totalSpent.toLocaleString()}`, c: X.orangeLight },
        ].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 12 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: s.c }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {[
          { k: "active", l: `Active (${active.length})` },
          { k: "completed", l: `Completed (${done.length})` },
          { k: "profile", l: "Business Profile" },
        ].map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === t.k ? X.orangeDim : "transparent", color: tab === t.k ? X.orange : X.gray }}>{t.l}</button>)}
      </div>

      {tab === "profile" && <CustProfile customer={customer} onUpdate={onUpdateCustomer} />}

      {(tab === "active" || tab === "completed") && (
        (tab === "active" ? active : done).length === 0 ? (
          <Card style={{ textAlign: "center", padding: 36 }}><T dim>{tab === "active" ? "No active gigs" : "No completed gigs"}</T>{tab === "active" && <Btn sm onClick={onCreateGig} style={{ marginTop: 10 }}>Submit your first gig</Btn>}</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(tab === "active" ? active : done).map(g => <GigCard key={g.id} gig={g} designer={designers.find(d => d.id === g.designer_id)} rating={ratings.find(r => r.gig_id === g.id)} isCust onRate={onRate} userId={customer.id} />)}
          </div>
        )
      )}
    </div>
  );
};

// ─── DESIGNER PROFILE ───────────────────────────────────────────────────────
const DesProfile = ({ designer, onUpdate }) => {
  const [f, setF] = useState({ ...designer });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const res = await api("update_designer_profile", { designer_id: designer.id, ...f });
    if (res.designer) { onUpdate(res.designer); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  const completeness = [f.phone, f.id_number, f.address, f.bank_name, f.bank_account].filter(Boolean).length;
  const pct = Math.round((completeness / 5) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <H s={20}>My Profile</H>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 6, background: X.bg, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? X.green : X.teal, borderRadius: 3 }} />
          </div>
          <T sm style={{ color: pct === 100 ? X.green : X.teal }}>{pct}%</T>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 16, borderTop: `2px solid ${X.teal}` }}>
          <T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Personal Details</T>
          <Field label="Full Name" value={f.name || ""} onChange={v => set("name", v)} placeholder="Your name" />
          <Field label="Phone" value={f.phone || ""} onChange={v => set("phone", v)} placeholder="+27 82 000 0000" />
          <Field label="ID Number" value={f.id_number || ""} onChange={v => set("id_number", v)} placeholder="Your SA ID number" />
          <Field label="City" value={f.city || ""} onChange={v => set("city", v)} placeholder="Johannesburg" />
          <Field label="Address" value={f.address || ""} onChange={v => set("address", v)} textarea placeholder="Full residential address" />
        </Card>
        <Card style={{ padding: 16, borderTop: `2px solid ${X.teal}` }}>
          <T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Banking Details</T>
          <T dim sm style={{ marginBottom: 12 }}>Required for weekly payouts</T>
          <Field label="Bank Name" value={f.bank_name || ""} onChange={v => set("bank_name", v)} placeholder="e.g. FNB, Capitec, Standard Bank" />
          <Field label="Account Number" value={f.bank_account || ""} onChange={v => set("bank_account", v)} placeholder="Your account number" />
          <Field label="Branch Code" value={f.bank_branch || ""} onChange={v => set("bank_branch", v)} placeholder="e.g. 250655" />
        </Card>
      </div>

      <Card style={{ padding: 16, marginTop: 12, borderTop: `2px solid ${X.teal}` }}>
        <T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Document Uploads</T>
        <T dim sm style={{ marginBottom: 12 }}>Upload the following for account verification. These are kept private and secure.</T>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { key: "id_document_path", label: "ID Document", icon: "🪪", desc: "SA ID or Passport copy" },
            { key: "address_proof_path", label: "Proof of Address", icon: "📬", desc: "Utility bill or bank statement" },
            { key: "bank_proof_path", label: "Banking Confirmation", icon: "🏦", desc: "Bank confirmation letter" },
          ].map(doc => (
            <div key={doc.key} style={{ padding: 14, background: X.bg, borderRadius: 8, border: `1px solid ${f[doc.key] ? X.green + "40" : X.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{doc.icon}</div>
              <T sm style={{ color: X.white, fontWeight: 600 }}>{doc.label}</T>
              <T sm dim style={{ marginBottom: 8 }}>{doc.desc}</T>
              {f[doc.key] ? (
                <Pill color={X.green}>Uploaded ✓</Pill>
              ) : (
                <label style={{ cursor: "pointer", display: "inline-block", padding: "5px 12px", borderRadius: 6, background: X.tealDim, color: X.teal, fontSize: 11, fontFamily: "Outfit", fontWeight: 600, border: `1px solid ${X.tealBorder}` }}>
                  Upload
                  <input type="file" onChange={(e) => { if (e.target.files[0]) set(doc.key, `uploaded_${Date.now()}`); }} style={{ display: "none" }} />
                </label>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 16, marginTop: 12 }}>
        <T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Bio & Skills</T>
        <Field label="Bio" value={f.bio || ""} onChange={v => set("bio", v)} textarea placeholder="What makes your work stand out..." />
      </Card>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Btn onClick={save} disabled={saving} style={{ background: X.teal, color: X.bg }}>{saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}</Btn>
        {pct < 100 && <T sm style={{ color: X.yellow }}>Complete your profile to receive payouts</T>}
      </div>
    </div>
  );
};

// ─── DESIGNER EARNINGS ──────────────────────────────────────────────────────
const DesEarnings = ({ designer }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api("get_designer_earnings", { designer_id: designer.id }, "GET");
      if (!res.error) setData(res);
      setLoading(false);
    })();
  }, [designer.id]);

  if (loading) return <Spinner text="Loading earnings..." />;
  if (!data) return <Card style={{ padding: 24, textAlign: "center" }}><T dim>Could not load earnings</T></Card>;

  return (
    <div>
      <H s={20} style={{ marginBottom: 16 }}>Earnings</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 20 }}>
        {[
          { l: "This Week", v: `R${data.thisWeek.toLocaleString()}`, c: X.teal },
          { l: "This Month", v: `R${data.thisMonth.toLocaleString()}`, c: X.tealLight },
          { l: "All Time", v: `R${data.total.toLocaleString()}`, c: X.green },
          { l: "Gigs Done", v: data.gigCount, c: X.grayLight },
        ].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 14 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}
      </div>

      {data.gigs && data.gigs.length > 0 && (
        <Card style={{ padding: 16 }}>
          <T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Recent Earnings</T>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.gigs.slice(0, 10).map(g => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${X.border}` }}>
                <div>
                  <T sm style={{ color: X.white }}>{g.service}</T>
                  <T sm dim>{new Date(g.created_at).toLocaleDateString("en-ZA")}</T>
                </div>
                <div style={{ textAlign: "right" }}>
                  <T sm style={{ color: X.teal, fontWeight: 700 }}>R{Math.round((g.price || 0) * 0.75).toLocaleString()}</T>
                  <T sm dim>of R{g.price?.toLocaleString()}</T>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── DESIGNER DASHBOARD ─────────────────────────────────────────────────────
const DesDash = ({ designer, onAccept, onDeliver, onUpdateDesigner }) => {
  const [tab, setTab] = useState("available");
  const [avail, setAvail] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [availRes, myRes] = await Promise.all([
      api("get_available_gigs", {}, "GET"),
      api("get_designer_gigs", { designer_id: designer.id }, "GET"),
    ]);
    if (availRes.gigs) setAvail(availRes.gigs);
    if (myRes.gigs) setMyGigs(myRes.gigs);
    if (myRes.ratings) setRatings(myRes.ratings);
    setLoading(false);
  }, [designer.id]);

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, [load]);

  const active = myGigs.filter(g => g.status === "in_progress");
  const done = myGigs.filter(g => g.status === "completed" || g.status === "delivered");
  const earned = done.reduce((s, g) => s + (g.price || 0) * 0.75, 0);

  const tabs = [{ k: "available", l: `Available (${avail.length})` }, { k: "active", l: `Active (${active.length})` }, { k: "done", l: `Done (${done.length})` }, { k: "earnings", l: "Earnings" }, { k: "profile", l: "Profile" }];
  const list = tab === "available" ? avail : tab === "active" ? active : done;

  if (loading) return <Spinner text="Loading dashboard..." />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${X.teal}, ${X.tealLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, fontSize: 17, color: X.bg, position: "relative" }}>
          {designer.avatar_initials || "?"}
          {designer.is_online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: X.green, border: `2px solid ${X.card}` }} />}
        </div>
        <div style={{ flex: 1 }}><H s={18}>{designer.name}</H><div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><Stars n={designer.rating || 0} s={13} /><T sm dim>{designer.rating || "New"} · {designer.total_reviews || 0} reviews</T></div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {[{ l: "Completed", v: designer.completed_gigs || 0 }, { l: "Rating", v: (designer.rating || 0) + "★" }, { l: "Earned", v: `R${Math.round(earned).toLocaleString()}` }].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 12 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: X.teal }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === t.k ? X.tealDim : "transparent", color: tab === t.k ? X.teal : X.gray }}>{t.l}</button>)}
      </div>

      {tab === "earnings" && <DesEarnings designer={designer} />}
      {tab === "profile" && <DesProfile designer={designer} onUpdate={onUpdateDesigner} />}

      {(tab === "available" || tab === "active" || tab === "done") && (
        list.length === 0 ? <Card style={{ textAlign: "center", padding: 36 }}><T dim>Nothing here yet</T></Card> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map(g => <GigCard key={g.id} gig={g} onAccept={onAccept} onDeliver={onDeliver} userId={designer.id} />)}
          </div>
        )
      )}
    </div>
  );
};

// ─── DESIGNER REGISTER FORM ─────────────────────────────────────────────────
const DesRegForm = ({ go, onReg }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const flip = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  return (
    <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <Nav go={go} minimal />
        <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}>
          <button onClick={() => go("landing")} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4, margin: "0 auto 16px" }}>← Back</button>
          <Pill color={X.teal}>Designer</Pill>
          <H s={22} style={{ marginTop: 8 }}>Join as a Designer</H><T dim style={{ marginTop: 4 }}>Earn money doing what you love</T></div>
        <Card style={{ borderTop: `2px solid ${X.teal}` }}>
          <Field label="Full Name" value={name} onChange={setName} placeholder="Thando Mokoena" />
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
          <Field label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
          <Field label="Short Bio" value={bio} onChange={setBio} textarea placeholder="What makes your work stand out..." />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: X.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ALL_SERVICES.map(s => <button key={s.name} onClick={() => flip(s.name)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter", background: skills.includes(s.name) ? X.tealDim : X.bg, color: skills.includes(s.name) ? X.teal : X.gray, border: `1px solid ${skills.includes(s.name) ? X.tealBorder : X.border}`, cursor: "pointer" }}>{s.name}</button>)}
            </div>
          </div>
          <Btn full onClick={() => { if (name && email && skills.length) onReg({ name, email, city, bio, skills }); }} disabled={!name || !email || !skills.length} style={{ background: X.teal, color: X.bg }}>Apply Now →</Btn>
          <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={() => go("designer-login")} style={{ background: "none", border: "none", color: X.teal, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>Already registered? Sign in →</button></div>
        </Card>
      </div>
    </div>
  );
};

// ─── RATING MODAL ───────────────────────────────────────────────────────────
const RateModal = ({ gigId, designerId, onDone, onClose }) => {
  const [r, setR] = useState(5);
  const [fb, setFb] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card onClick={e => e.stopPropagation()} style={{ maxWidth: 360, width: "100%", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}><H s={17}>Rate this designer</H></div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
          {[1,2,3,4,5].map(s => <button key={s} onClick={() => setR(s)} style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: s <= r ? X.orange : "#27272a" }}>★</button>)}
        </div>
        <Field label="Feedback" value={fb} onChange={setFb} textarea placeholder="How was it?" />
        <div style={{ display: "flex", gap: 6 }}><Btn v="ghost" full onClick={onClose}>Cancel</Btn><Btn full onClick={() => onDone(r, fb)}>Submit</Btn></div>
      </Card>
    </div>
  );
};

// ─── AUTH API HELPER ────────────────────────────────────────────────────────
const auth = async (action, data) => {
  try {
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...data }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Auth error");
    return j;
  } catch (e) { return { error: e.message }; }
};

const pay = async (action, data) => {
  try {
    const r = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...data }) });
    return r.json();
  } catch (e) { return { error: e.message }; }
};

// ─── AUTH SCREENS ───────────────────────────────────────────────────────────
const AuthScreen = ({ go, onAuth, mode: initMode, role: initRole }) => {
  const [mode, setMode] = useState(initMode || "login"); // login or signup
  const [role, setRole] = useState(initRole || "customer"); // customer or designer
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const flip = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (role === "customer") {
          const res = await auth("signup_customer", { email, password, name });
          if (res.error) throw new Error(res.error);
          if (res.customer) onAuth("customer", res.customer, res.session);
        } else {
          if (!skills.length) throw new Error("Select at least one skill");
          const res = await auth("signup_designer", { email, password, name, city, bio, skills });
          if (res.error) throw new Error(res.error);
          if (res.designer) {
            onAuth("designer", res.designer, res.session);
            sendEmail("designer_welcome", { designerEmail: email, designerName: name });
          }
        }
      } else {
        const res = await auth("login", { email, password });
        if (res.error) throw new Error(res.error);
        if (res.profile) onAuth(res.role, res.profile, res.session);
        else throw new Error("Account not found");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const isDesignerSignup = mode === "signup" && role === "designer";

  return (
    <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: isDesignerSignup ? 460 : 360, width: "100%" }}>
        <Nav go={go} minimal />
        <div style={{ paddingTop: 80 }}>
          <button onClick={() => go("landing")} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back</button>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <H s={22}>{mode === "login" ? "Welcome back" : role === "designer" ? "Join as a Designer" : "Create an account"}</H>
            <T dim style={{ marginTop: 4 }}>{mode === "login" ? "Sign in to your account" : role === "designer" ? "Start earning today" : "Get your first design delivered fast"}</T>
          </div>

          {/* Role toggle for signup */}
          {mode === "signup" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: X.card, borderRadius: 8, padding: 4, border: `1px solid ${X.border}` }}>
              {["customer", "designer"].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex: 1, padding: "8px", borderRadius: 6, border: "none", fontFamily: "Outfit", fontWeight: 600, fontSize: 12, cursor: "pointer",
                  background: role === r ? (r === "designer" ? X.teal : X.orange) : "transparent", color: role === r ? X.bg : X.gray, textTransform: "capitalize",
                }}>{r === "customer" ? "I need design" : "I'm a designer"}</button>
              ))}
            </div>
          )}

          <Card>
            {error && <div style={{ padding: "8px 12px", marginBottom: 12, borderRadius: 6, background: X.red + "18", border: `1px solid ${X.red}30`, color: X.red, fontSize: 12, fontFamily: "Inter" }}>{error}</div>}

            {mode === "signup" && <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />}
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
            <Field label="Password" value={password} onChange={setPassword} type="password" placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Your password"} />

            {isDesignerSignup && (
              <>
                <Field label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
                <Field label="Short Bio" value={bio} onChange={setBio} textarea placeholder="What makes your work stand out..." />
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: X.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {ALL_SERVICES.map(s => <button key={s.name} onClick={() => flip(s.name)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter", background: skills.includes(s.name) ? X.tealDim : X.bg, color: skills.includes(s.name) ? X.teal : X.gray, border: `1px solid ${skills.includes(s.name) ? X.tealBorder : X.border}`, cursor: "pointer" }}>{s.name}</button>)}
                  </div>
                </div>
              </>
            )}

            <Btn full onClick={handleSubmit} disabled={loading || !email || !password || (mode === "signup" && !name)} style={role === "designer" ? { background: X.teal, color: X.bg } : {}}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </Btn>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ background: "none", border: "none", color: role === "designer" ? X.teal : X.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>
                {mode === "login" ? "Don't have an account? Sign up →" : "Already have an account? Sign in →"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [pg, setPg] = useState("landing");
  const [toast, setToast] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [designer, setDesigner] = useState(null);
  const [rateGig, setRateGig] = useState(null);
  const [session, setSession] = useState(null);

  const note = m => setToast(m);

  // Check for saved session on load
  useEffect(() => {
    const saved = localStorage.getItem("lmd_session");
    if (saved) {
      try {
        const { role, profile } = JSON.parse(saved);
        if (role === "customer") { setCustomer(profile); setPg("customer-dash"); }
        else if (role === "designer") { setDesigner(profile); setPg("designer-dash"); }
      } catch (e) { localStorage.removeItem("lmd_session"); }
    }

    // Check for Paystack callback
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref) {
      window.history.replaceState({}, "", "/");
      verifyPayment(ref);
    }
  }, []);

  const verifyPayment = async (ref) => {
    note("Verifying payment...");
    const res = await pay("verify", { reference: ref });
    if (res.success && res.paid) {
      note(res.designer ? `Paid! Matched with ${res.designer.name}!` : "Payment confirmed! Gig posted.");
      if (customer) setPg("customer-dash");
      if (res.gig && customer) {
        sendEmail("gig_created", { customerEmail: customer.email, customerName: customer.name, gigType: res.gig.service, turnaround: res.gig.turnaround, price: res.gig.price, brief: res.gig.brief });
        if (res.designer) sendEmail("designer_matched", { customerEmail: customer.email, customerName: customer.name, designerName: res.designer.name, gigType: res.gig.service, turnaround: res.gig.turnaround, price: res.gig.price });
      }
    } else {
      note("Payment could not be verified. Please contact support.");
    }
  };

  const handleAuth = (role, profile, sess) => {
    if (role === "customer") { setCustomer(profile); setPg("customer-dash"); }
    else if (role === "designer") { setDesigner(profile); setPg("designer-dash"); }
    setSession(sess);
    localStorage.setItem("lmd_session", JSON.stringify({ role, profile }));
    note(`Welcome${profile.name ? ", " + profile.name : ""}!`);
  };

  const logout = () => {
    setCustomer(null);
    setDesigner(null);
    setSession(null);
    localStorage.removeItem("lmd_session");
    setPg("landing");
  };

  // Create gig with Paystack payment
  const createGig = async (data) => {
    if (!customer) return;
    note("Initiating payment...");
    const res = await pay("initialize", {
      email: customer.email,
      amount: data.price,
      customer_id: customer.id,
      service: data.service,
      turnaround: data.turnaround,
      brief: data.brief,
      category: data.category,
    });

    if (res.success && res.authorization_url) {
      // Save session before redirecting to Paystack
      localStorage.setItem("lmd_session", JSON.stringify({ role: "customer", profile: customer }));
      window.location.href = res.authorization_url;
    } else {
      note(res.error || "Payment failed to initialize");
    }
  };

  // Accept gig
  const acceptGig = async (id, turnaround) => {
    await api("accept_gig", { gig_id: id, designer_id: designer.id, turnaround });
    note("Gig accepted!");
  };

  // Deliver gig
  const deliverGig = async (id) => {
    await api("deliver_gig", { gig_id: id });
    note("Delivered!");
  };

  // Rate
  const rateSubmit = async (score, feedback) => {
    if (!rateGig) return;
    await api("rate_gig", { gig_id: rateGig.id, customer_id: customer.id, designer_id: rateGig.designer_id, score, feedback });
    setRateGig(null);
    note("Thanks for rating!");
  };

  // Modified Shell with logout
  const AppShell = ({ children, role }) => (
    <div style={{ minHeight: "100vh", background: X.bg }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 28px", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <span onClick={() => setPg("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer" }}><span style={{ color: X.orange }}>lastminute</span>.design</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pill color={role === "designer" ? X.teal : X.orange}>{role}</Pill>
          <button onClick={logout} style={{ background: "none", border: "none", color: X.gray, fontSize: 12, fontFamily: "Inter", cursor: "pointer" }}>Sign out</button>
        </div>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: X.white, background: X.bg, minHeight: "100vh" }}>
      <style>{CSS}</style>
      {toast && <Toasty msg={toast} onClose={() => setToast(null)} />}
      {rateGig && <RateModal gigId={rateGig.id} designerId={rateGig.designer_id} onDone={rateSubmit} onClose={() => setRateGig(null)} />}

      {pg === "landing" && <Landing go={setPg} />}

      {pg === "customer-login" && <AuthScreen go={setPg} onAuth={handleAuth} mode="login" role="customer" />}
      {pg === "customer-signup" && <AuthScreen go={setPg} onAuth={handleAuth} mode="signup" role="customer" />}
      {pg === "designer-register" && <AuthScreen go={setPg} onAuth={handleAuth} mode="signup" role="designer" />}
      {pg === "designer-login" && <AuthScreen go={setPg} onAuth={handleAuth} mode="login" role="designer" />}

      {pg === "customer-dash" && customer && <AppShell role="customer"><CustDash customer={customer} onCreateGig={() => setPg("create-gig")} onRate={(id) => setRateGig({ id, designer_id: null, service: "" })} onUpdateCustomer={(c) => { setCustomer(c); localStorage.setItem("lmd_session", JSON.stringify({ role: "customer", profile: c })); }} /></AppShell>}
      {pg === "create-gig" && customer && <AppShell role="customer"><CreateGig onSubmit={createGig} onBack={() => setPg("customer-dash")} /></AppShell>}
      {pg === "designer-dash" && designer && <AppShell role="designer"><DesDash designer={designer} onAccept={acceptGig} onDeliver={deliverGig} onUpdateDesigner={(d) => { setDesigner(d); localStorage.setItem("lmd_session", JSON.stringify({ role: "designer", profile: d })); }} /></AppShell>}
    </div>
  );
}

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
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::selection{background:#f97316;color:#09090b}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

const themes = {
  dark: {
    bg: "#09090b", card: "#131316", border: "#1e1e24", hover: "#1a1a1f",
    white: "#fafafa", gray: "#71717a", grayLight: "#a1a1aa",
    navBg: "rgba(9,9,11,0.85)", cardBg: "#131316",
  },
  light: {
    bg: "#f8f8fa", card: "#ffffff", border: "#e4e4e7", hover: "#f0f0f2",
    white: "#09090b", gray: "#71717a", grayLight: "#52525b",
    navBg: "rgba(255,255,255,0.9)", cardBg: "#ffffff",
  },
};

const accents = {
  orange: "#f97316", orangeLight: "#fb923c",
  orangeDim: "rgba(249,115,22,0.1)", orangeBorder: "rgba(249,115,22,0.2)",
  teal: "#06b6d4", tealLight: "#22d3ee",
  tealDim: "rgba(6,182,212,0.1)", tealBorder: "rgba(6,182,212,0.2)",
  green: "#22c55e", red: "#ef4444", yellow: "#eab308",
};

// Theme context — mutable reference
let X = { ...themes.dark, ...accents };
const setTheme = (t) => { Object.assign(X, themes[t], accents); };

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
const Nav = ({ go, minimal }) => <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}` }}><span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer", letterSpacing: "-0.02em" }}><span style={{ color: X.orange }}>lastminute</span>.design</span>{!minimal && <div style={{ display: "flex", gap: 8 }}><Btn v="ghost" sm onClick={() => go("customer-login")}>Log In</Btn><Btn sm onClick={() => go("customer-signup")}>Register</Btn></div>}</nav>;

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

      {/* ─── HERO BANNER ─── */}
      <div style={{
        position: "relative", overflow: "hidden", minHeight: 520,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 20px 60px",
        background: `linear-gradient(135deg, ${X.bg} 0%, #1a1000 40%, #0a0a12 70%, ${X.bg} 100%)`,
      }}>
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: 40, right: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${X.orange}12, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 20, left: "5%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${X.teal}10, transparent 70%)`, filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "15%", left: "8%", width: 1, height: 120, background: `linear-gradient(to bottom, ${X.orange}40, transparent)`, transform: "rotate(20deg)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "12%", width: 1, height: 80, background: `linear-gradient(to bottom, ${X.teal}30, transparent)`, transform: "rotate(-15deg)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "20%", width: 60, height: 60, border: `1px solid ${X.orange}15`, borderRadius: 12, transform: "rotate(45deg)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "15%", width: 40, height: 40, border: `1px solid ${X.teal}15`, borderRadius: 8, transform: "rotate(30deg)", pointerEvents: "none" }} />

        {/* Banner grid pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${X.border}08 1px, transparent 1px), linear-gradient(90deg, ${X.border}08 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 700 }}>
          <Pill>24/7 Rush Creative Studio</Pill>
          <h1 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.04, color: X.white, margin: "20px 0 16px", letterSpacing: "-0.03em" }}>
            Never miss a<br />deadline <span style={{ color: X.orange }}>again.</span>
          </h1>
          <p style={{ fontSize: 17, color: X.grayLight, maxWidth: 500, margin: "0 auto 16px", lineHeight: 1.6 }}>
            On-demand graphic design with guaranteed 4, 12 or 24-hour delivery. Vetted South African designers matched to your project instantly.
          </p>
          <p style={{ fontSize: 13, color: X.gray, marginBottom: 32 }}>
            No contracts · No subscriptions · Pay per project
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => go("customer-signup")} style={{ padding: "14px 28px", fontSize: 15 }}>Get Design Now →</Btn>
            <Btn v="secondary" onClick={() => go("designer-register")} style={{ padding: "14px 28px", fontSize: 15, background: X.tealDim, color: X.teal, border: `1px solid ${X.tealBorder}` }}>Earn as a Designer</Btn>
          </div>

          {/* Mini trust line */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32, opacity: 0.5 }}>
            {["⚡ 4h Rush Delivery", "🎯 247+ Designers", "⭐ 4.8 Avg Rating"].map(t => (
              <T key={t} sm dim>{t}</T>
            ))}
          </div>
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


// ─── SIDEBAR ICON ───────────────────────────────────────────────────────────
const SideIcon = ({ icon, label, active, color = X.orange, onClick, badge }) => (
  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", position: "relative", background: active ? (color + "15") : "transparent", color: active ? color : X.gray, transition: "all 0.15s" }}>
    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
    <span style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 13 }}>{label}</span>
    {badge > 0 && <span style={{ position: "absolute", right: 12, background: color, color: X.bg, fontSize: 10, fontWeight: 800, fontFamily: "Outfit", padding: "1px 7px", borderRadius: 100 }}>{badge}</span>}
  </button>
);

// ─── COMMENT THREAD ─────────────────────────────────────────────────────────
const CommentThread = ({ gigId, userId, userRole, userName }) => {
  const [comments, setComments] = useState([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => { const r = await api("get_comments", { gig_id: gigId }, "GET"); if (r.comments) setComments(r.comments); }, [gigId]);
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [load]);
  const send = async () => { if (!msg.trim()) return; setSending(true); await api("add_comment", { gig_id: gigId, author_id: userId, author_role: userRole, author_name: userName, message: msg.trim() }); setMsg(""); await load(); setSending(false); };

  return (
    <div>
      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {comments.length === 0 && <T dim sm style={{ textAlign: "center", padding: 16 }}>No messages yet</T>}
        {comments.map(c => {
          const isMe = c.author_id === userId;
          return (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 10, background: isMe ? (userRole === "designer" ? X.tealDim : X.orangeDim) : X.bg, border: `1px solid ${isMe ? (userRole === "designer" ? X.tealBorder : X.orangeBorder) : X.border}` }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 2 }}><T sm style={{ color: c.author_role === "designer" ? X.teal : X.orange, fontWeight: 600 }}>{c.author_name}</T><T sm dim>{new Date(c.created_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</T></div>
                <T sm style={{ color: X.white }}>{c.message}</T>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1, background: X.bg, border: `1px solid ${X.border}`, borderRadius: 8, padding: "8px 12px", color: X.white, fontFamily: "Inter", fontSize: 13, outline: "none" }} />
        <Btn sm onClick={send} disabled={sending || !msg.trim()} style={{ background: userRole === "designer" ? X.teal : X.orange, color: X.bg }}>Send</Btn>
      </div>
    </div>
  );
};

// ─── PROJECT VIEW ───────────────────────────────────────────────────────────
const ProjectView = ({ gig, designer, rating, isCust, userId, userName, onBack, onRate, onDeliver, onAccept }) => {
  const pct = gig.status === "in_progress" && gig.deadline ? Math.min(100, Math.max(0, Math.round(((Date.now() - new Date(gig.created_at).getTime()) / (new Date(gig.deadline).getTime() - new Date(gig.created_at).getTime())) * 100))) : 0;
  const hrs = gig.deadline ? Math.max(0, ((new Date(gig.deadline).getTime() - Date.now()) / 3600000).toFixed(1)) : 0;
  const sc = { pending: X.yellow, in_progress: isCust ? X.orange : X.teal, delivered: X.green, completed: X.green }[gig.status] || X.gray;

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back to Projects</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}><Pill color={sc}>{gig.status.replace("_", " ")}</Pill><Pill color={gig.turnaround === 4 ? X.red : gig.turnaround === 12 ? X.yellow : X.green}>{TIERS[gig.turnaround]?.tag}</Pill><Pill color={X.green}>PAID</Pill></div>
          <H s={22}>{gig.service}</H>
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 24, color: isCust ? X.orange : X.teal }}>R{gig.price?.toLocaleString()}</div>
      </div>
      {gig.brief && <Card style={{ marginBottom: 16, padding: 16 }}><T sm style={{ color: X.gray, fontWeight: 600, marginBottom: 4 }}>BRIEF</T><T style={{ color: X.white }}>{gig.brief}</T></Card>}
      {gig.status === "in_progress" && <Card style={{ marginBottom: 16, padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><T sm style={{ color: X.gray, fontWeight: 600 }}>PROGRESS</T><T sm style={{ color: hrs < 1 ? X.red : X.grayLight }}>{hrs}h remaining</T></div><Bar pct={pct} /><T dim sm style={{ marginTop: 6 }}>Deadline: {new Date(gig.deadline).toLocaleString("en-ZA")}</T></Card>}
      {designer && <Card style={{ marginBottom: 16, padding: 16 }}><T sm style={{ color: X.gray, fontWeight: 600, marginBottom: 8 }}>DESIGNER</T><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${X.teal}, ${X.tealLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: X.bg }}>{designer.avatar_initials || "?"}</div><div style={{ flex: 1 }}><T style={{ color: X.white, fontWeight: 600 }}>{designer.name}</T><div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stars n={designer.rating} s={12} /><T sm dim>{designer.rating || "New"}</T></div></div>{isCust && gig.status === "delivered" && !rating && <Btn sm onClick={() => onRate(gig.id)}>Accept & Rate</Btn>}{!isCust && gig.status === "in_progress" && <Btn sm onClick={() => onDeliver(gig.id)} style={{ background: X.teal, color: X.bg }}>Mark Delivered</Btn>}</div></Card>}
      {!isCust && gig.status === "pending" && <Card style={{ marginBottom: 16, padding: 16, textAlign: "center" }}><Btn onClick={() => onAccept(gig.id, gig.turnaround)} style={{ background: X.teal, color: X.bg }}>Accept This Gig</Btn></Card>}
      {rating && <Card style={{ marginBottom: 16, padding: 16 }}><T sm style={{ color: X.gray, fontWeight: 600, marginBottom: 6 }}>RATING</T><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Stars n={rating.score} s={16} /><T style={{ color: X.white }}>{rating.score}/5</T></div>{rating.feedback && <T dim style={{ marginTop: 4 }}>{rating.feedback}</T>}</Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {gig.status !== "pending" && <Card style={{ padding: 16 }}><T sm style={{ color: X.gray, fontWeight: 600, marginBottom: 10 }}>FILES</T><GigFiles gigId={gig.id} role={isCust ? "customer" : "designer"} userId={userId} /></Card>}
        {gig.status !== "pending" && <Card style={{ padding: 16 }}><T sm style={{ color: X.gray, fontWeight: 600, marginBottom: 10 }}>MESSAGES</T><CommentThread gigId={gig.id} userId={userId} userRole={isCust ? "customer" : "designer"} userName={userName} /></Card>}
      </div>
    </div>
  );
};

// ─── SUPPORT ────────────────────────────────────────────────────────────────
const SupportPage = ({ userId, userRole, userName, userEmail, accent }) => {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => { (async () => { const r = await api("get_support_tickets", { user_id: userId }, "GET"); if (r.tickets) setTickets(r.tickets); })(); }, [userId, sent]);
  const send = async () => { if (!message.trim()) return; setSending(true); await api("send_support", { user_id: userId, user_role: userRole, user_name: userName, user_email: userEmail, subject, message }); setSubject(""); setMessage(""); setSent(true); setSending(false); setTimeout(() => setSent(false), 3000); };

  return (
    <div>
      <H s={20} style={{ marginBottom: 16 }}>Support</H>
      <Card style={{ padding: 16, marginBottom: 16 }}><T sm style={{ color: accent, fontWeight: 600, marginBottom: 10 }}>New Message</T><Field label="Subject" value={subject} onChange={setSubject} placeholder="What do you need help with?" /><Field label="Message" value={message} onChange={setMessage} textarea placeholder="Describe your issue..." /><Btn onClick={send} disabled={sending || !message.trim()} style={{ background: accent, color: X.bg }}>{sent ? "✓ Sent!" : sending ? "Sending..." : "Send Message"}</Btn></Card>
      {tickets.length > 0 && <Card style={{ padding: 16 }}><T sm style={{ color: accent, fontWeight: 600, marginBottom: 10 }}>Previous ({tickets.length})</T>{tickets.map(t => <div key={t.id} style={{ padding: "10px 0", borderBottom: `1px solid ${X.border}` }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T sm style={{ color: X.white, fontWeight: 600 }}>{t.subject || "General"}</T><Pill color={t.status === "open" ? X.yellow : X.green}>{t.status}</Pill></div><T sm dim>{t.message.slice(0, 100)}</T><T sm dim style={{ marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString("en-ZA")}</T></div>)}</Card>}
    </div>
  );
};

// ─── PROFILES ───────────────────────────────────────────────────────────────
const CustProfile = ({ customer, onUpdate }) => {
  const [f, setF] = useState({ ...customer }); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = async () => { setSaving(true); const r = await api("update_customer_profile", { customer_id: customer.id, ...f }); if (r.customer) { onUpdate(r.customer); setSaved(true); setTimeout(() => setSaved(false), 2000); } setSaving(false); };
  return (
    <div>
      <H s={20} style={{ marginBottom: 4 }}>Business Details</H><T dim sm style={{ marginBottom: 20 }}>Auto-populates into design briefs</T>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 16 }}><T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Personal</T><Field label="Name" value={f.name || ""} onChange={v => set("name", v)} /><Field label="Phone" value={f.phone || ""} onChange={v => set("phone", v)} placeholder="+27 82 000 0000" /></Card>
        <Card style={{ padding: 16 }}><T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Company</T><Field label="Company Name" value={f.company_name || ""} onChange={v => set("company_name", v)} /><Field label="Reg Number" value={f.registration_number || ""} onChange={v => set("registration_number", v)} /><Field label="Tagline" value={f.tagline || ""} onChange={v => set("tagline", v)} /></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
        <Card style={{ padding: 16 }}><T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Contact</T><Field label="Email" value={f.company_email || ""} onChange={v => set("company_email", v)} /><Field label="Phone" value={f.company_phone || ""} onChange={v => set("company_phone", v)} /><Field label="Website" value={f.company_website || ""} onChange={v => set("company_website", v)} /><Field label="Address" value={f.company_address || ""} onChange={v => set("company_address", v)} textarea /></Card>
        <Card style={{ padding: 16 }}><T sm style={{ color: X.orange, fontWeight: 600, marginBottom: 10 }}>Brand & Social</T><Field label="Brand Colors" value={f.brand_colors || ""} onChange={v => set("brand_colors", v)} placeholder="#1B2A4A, #D4AF37" /><Field label="Instagram" value={f.social_instagram || ""} onChange={v => set("social_instagram", v)} /><Field label="Facebook" value={f.social_facebook || ""} onChange={v => set("social_facebook", v)} /><Field label="LinkedIn" value={f.social_linkedin || ""} onChange={v => set("social_linkedin", v)} /></Card>
      </div>
      <Btn onClick={save} disabled={saving} style={{ marginTop: 16 }}>{saving ? "Saving..." : saved ? "✓ Saved!" : "Save Details"}</Btn>
    </div>
  );
};

const DesProfile = ({ designer, onUpdate }) => {
  const [f, setF] = useState({ ...designer }); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = async () => { setSaving(true); const r = await api("update_designer_profile", { designer_id: designer.id, ...f }); if (r.designer) { onUpdate(r.designer); setSaved(true); setTimeout(() => setSaved(false), 2000); } setSaving(false); };
  const pct = Math.round(([f.phone, f.id_number, f.address, f.bank_name, f.bank_account].filter(Boolean).length / 5) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><H s={20}>My Profile</H><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 80, height: 6, background: X.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? X.green : X.teal, borderRadius: 3 }} /></div><T sm style={{ color: pct === 100 ? X.green : X.teal }}>{pct}%</T></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 16, borderTop: `2px solid ${X.teal}` }}><T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Personal</T><Field label="Name" value={f.name || ""} onChange={v => set("name", v)} /><Field label="Phone" value={f.phone || ""} onChange={v => set("phone", v)} /><Field label="ID Number" value={f.id_number || ""} onChange={v => set("id_number", v)} /><Field label="City" value={f.city || ""} onChange={v => set("city", v)} /><Field label="Address" value={f.address || ""} onChange={v => set("address", v)} textarea /></Card>
        <Card style={{ padding: 16, borderTop: `2px solid ${X.teal}` }}><T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Banking</T><Field label="Bank" value={f.bank_name || ""} onChange={v => set("bank_name", v)} /><Field label="Account" value={f.bank_account || ""} onChange={v => set("bank_account", v)} /><Field label="Branch" value={f.bank_branch || ""} onChange={v => set("bank_branch", v)} /></Card>
      </div>
      <Card style={{ padding: 16, marginTop: 12, borderTop: `2px solid ${X.teal}` }}><T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Documents</T><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{[{ k: "id_document_path", l: "ID", i: "🪪" }, { k: "address_proof_path", l: "Address Proof", i: "📬" }, { k: "bank_proof_path", l: "Bank Confirm", i: "🏦" }].map(d => <div key={d.k} style={{ padding: 12, background: X.bg, borderRadius: 8, border: `1px solid ${f[d.k] ? X.green + "40" : X.border}`, textAlign: "center" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{d.i}</div><T sm style={{ color: X.white, fontWeight: 600, marginBottom: 6 }}>{d.l}</T>{f[d.k] ? <Pill color={X.green}>✓</Pill> : <label style={{ cursor: "pointer", padding: "3px 8px", borderRadius: 6, background: X.tealDim, color: X.teal, fontSize: 10, fontFamily: "Outfit", fontWeight: 600 }}>Upload<input type="file" onChange={() => set(d.k, `up_${Date.now()}`)} style={{ display: "none" }} /></label>}</div>)}</div></Card>
      <Card style={{ padding: 16, marginTop: 12 }}><Field label="Bio" value={f.bio || ""} onChange={v => set("bio", v)} textarea /></Card>
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}><Btn onClick={save} disabled={saving} style={{ background: X.teal, color: X.bg }}>{saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}</Btn>{pct < 100 && <T sm style={{ color: X.yellow, alignSelf: "center" }}>Complete for payouts</T>}</div>
    </div>
  );
};

const DesEarnings = ({ designer }) => {
  const [d, setD] = useState(null); const [l, setL] = useState(true);
  useEffect(() => { (async () => { const r = await api("get_designer_earnings", { designer_id: designer.id }, "GET"); if (!r.error) setD(r); setL(false); })(); }, [designer.id]);
  if (l) return <Spinner text="Loading earnings..." />;
  if (!d) return <Card style={{ padding: 24, textAlign: "center" }}><T dim>Could not load</T></Card>;
  return (
    <div>
      <H s={20} style={{ marginBottom: 16 }}>Earnings</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 20 }}>{[{ l: "This Week", v: `R${d.thisWeek.toLocaleString()}`, c: X.teal }, { l: "This Month", v: `R${d.thisMonth.toLocaleString()}`, c: X.tealLight }, { l: "All Time", v: `R${d.total.toLocaleString()}`, c: X.green }, { l: "Gigs", v: d.gigCount, c: X.grayLight }].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 12 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: s.c }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}</div>
      {d.gigs?.length > 0 && <Card style={{ padding: 16 }}><T sm style={{ color: X.teal, fontWeight: 600, marginBottom: 10 }}>Recent</T>{d.gigs.slice(0, 10).map(g => <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${X.border}` }}><div><T sm style={{ color: X.white }}>{g.service}</T><T sm dim>{new Date(g.created_at).toLocaleDateString("en-ZA")}</T></div><T sm style={{ color: X.teal, fontWeight: 700 }}>R{Math.round((g.price||0)*0.75).toLocaleString()}</T></div>)}</Card>}
    </div>
  );
};

// ─── SIDEBAR DASHBOARD ──────────────────────────────────────────────────────
const Dashboard = ({ role, profile, onLogout, createGig, acceptGig, deliverGig, onUpdateProfile, rateGig, rateSubmit, setRateGig }) => {
  const [section, setSection] = useState("projects");
  const [gigs, setGigs] = useState([]); const [availGigs, setAvailGigs] = useState([]); const [designers, setDesigners] = useState([]); const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true); const [selectedGig, setSelectedGig] = useState(null); const [showCreate, setShowCreate] = useState(false); const [sideOpen, setSideOpen] = useState(true);

  const isCust = role === "customer"; const accent = isCust ? X.orange : X.teal;

  const load = useCallback(async () => {
    if (isCust) { const r = await api("get_customer_gigs", { customer_id: profile.id }, "GET"); if (r.gigs) { setGigs(r.gigs); setDesigners(r.designers||[]); setRatings(r.ratings||[]); } }
    else { const [a, m] = await Promise.all([api("get_available_gigs", {}, "GET"), api("get_designer_gigs", { designer_id: profile.id }, "GET")]); if (a.gigs) setAvailGigs(a.gigs); if (m.gigs) { setGigs(m.gigs); setRatings(m.ratings||[]); } }
    setLoading(false);
  }, [profile.id, isCust]);

  useEffect(() => { load(); const i = setInterval(load, 12000); return () => clearInterval(i); }, [load]);

  const active = gigs.filter(g => g.status === "in_progress"); const delivered = gigs.filter(g => g.status === "delivered"); const completed = gigs.filter(g => g.status === "completed");
  const earned = gigs.filter(g => g.status === "completed" || g.status === "delivered").reduce((s, g) => s + (g.price||0) * (isCust ? 1 : 0.75), 0);

  const sideItems = isCust ? [
    { icon: "📋", label: "Projects", key: "projects", badge: active.length + delivered.length },
    { icon: "🏢", label: "Business Profile", key: "profile" },
    { icon: "💬", label: "Support", key: "support" },
  ] : [
    { icon: "🔥", label: "Available", key: "available", badge: availGigs.length },
    { icon: "📋", label: "My Gigs", key: "projects", badge: active.length },
    { icon: "💰", label: "Earnings", key: "earnings" },
    { icon: "👤", label: "Profile", key: "profile" },
    { icon: "💬", label: "Support", key: "support" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: X.bg }}>
      {/* Sidebar */}
      <div style={{ width: sideOpen ? 220 : 0, flexShrink: 0, background: X.card, borderRight: `1px solid ${X.border}`, transition: "width 0.2s", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 14px", borderBottom: `1px solid ${X.border}` }}><span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 16, color: X.white }}><span style={{ color: accent }}>lastminute</span>.design</span></div>
        <div style={{ padding: 14, borderBottom: `1px solid ${X.border}` }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${isCust ? X.orangeLight : X.tealLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, fontSize: 12, color: X.bg }}>{(profile.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}</div><div style={{ overflow: "hidden" }}><T sm style={{ color: X.white, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</T><Pill color={accent}>{role}</Pill></div></div></div>
        <div style={{ padding: "8px 6px", flex: 1 }}>{sideItems.map(i => <SideIcon key={i.key} icon={i.icon} label={i.label} active={section === i.key && !showCreate && !selectedGig} color={accent} onClick={() => { setSection(i.key); setShowCreate(false); setSelectedGig(null); }} badge={i.badge} />)}</div>
        {isCust && <div style={{ padding: "8px 10px", borderTop: `1px solid ${X.border}` }}><Btn full sm onClick={() => { setShowCreate(true); setSelectedGig(null); }}>+ New Gig</Btn></div>}
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${X.border}` }}><button onClick={onLogout} style={{ background: "none", border: "none", color: X.gray, fontSize: 12, fontFamily: "Inter", cursor: "pointer", padding: "6px 0" }}>Sign out</button></div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${X.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(9,9,11,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background: "none", border: "none", color: X.gray, fontSize: 18, cursor: "pointer" }}>☰</button>
          {!isCust && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: profile.is_online ? X.green : X.gray }} /><T sm dim>{profile.is_online ? "Online" : "Offline"}</T></div>}
        </div>
        <div style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>
          {loading && <Spinner />}
          {rateGig && <RateModal gigId={rateGig.id} designerId={rateGig.designer_id} onDone={rateSubmit} onClose={() => setRateGig(null)} />}

          {!loading && showCreate && <CreateGig onSubmit={(data) => { createGig(data); setShowCreate(false); }} onBack={() => setShowCreate(false)} />}

          {!loading && !showCreate && selectedGig && <ProjectView gig={selectedGig} designer={designers.find(d => d.id === selectedGig.designer_id)} rating={ratings.find(r => r.gig_id === selectedGig.id)} isCust={isCust} userId={profile.id} userName={profile.name} onBack={() => setSelectedGig(null)} onRate={(id) => setRateGig({ id, designer_id: selectedGig.designer_id, service: selectedGig.service })} onDeliver={deliverGig} onAccept={acceptGig} />}

          {!loading && !showCreate && !selectedGig && section === "projects" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><H s={20}>{isCust ? "My Projects" : "My Gigs"}</H>{isCust && <Btn sm onClick={() => setShowCreate(true)}>+ New Gig</Btn>}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 20 }}>{[{ l: "Active", v: active.length, c: accent }, { l: "Delivered", v: delivered.length, c: X.green }, { l: "Done", v: completed.length, c: X.grayLight }, { l: isCust ? "Spent" : "Earned", v: `R${Math.round(earned).toLocaleString()}`, c: isCust ? X.orangeLight : X.tealLight }].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 10 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}</div>
              {gigs.length === 0 ? <Card style={{ textAlign: "center", padding: 36 }}><T dim>No projects yet</T>{isCust && <Btn sm onClick={() => setShowCreate(true)} style={{ marginTop: 10 }}>Submit your first gig</Btn>}</Card> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{gigs.map(g => <Card key={g.id} onClick={() => setSelectedGig(g)} style={{ cursor: "pointer", padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ display: "flex", gap: 4, marginBottom: 4 }}><Pill color={{ pending: X.yellow, in_progress: accent, delivered: X.green, completed: X.green }[g.status]||X.gray}>{g.status.replace("_"," ")}</Pill><Pill color={g.turnaround===4?X.red:g.turnaround===12?X.yellow:X.green}>{TIERS[g.turnaround]?.tag}</Pill></div><T style={{ color: X.white, fontWeight: 600 }}>{g.service}</T>{g.brief && <T sm dim style={{ marginTop: 2 }}>{g.brief.slice(0,60)}{g.brief.length>60?"...":""}</T>}</div><div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 16, color: accent }}>R{g.price?.toLocaleString()}</div><T sm dim>{new Date(g.created_at).toLocaleDateString("en-ZA")}</T><span style={{ fontSize: 11, fontFamily: "Outfit", fontWeight: 600, color: accent, display: "flex", alignItems: "center", gap: 4 }}>View Details →</span></div></div></Card>)}</div>
              )}
            </div>
          )}

          {!loading && !showCreate && !selectedGig && section === "available" && !isCust && (
            <div><H s={20} style={{ marginBottom: 16 }}>Available Gigs</H>{availGigs.length === 0 ? <Card style={{ textAlign: "center", padding: 36 }}><T dim>No gigs right now</T></Card> : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{availGigs.map(g => <Card key={g.id} onClick={() => setSelectedGig(g)} style={{ cursor: "pointer", padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ display: "flex", gap: 4, marginBottom: 4 }}><Pill color={X.yellow}>New</Pill><Pill color={g.turnaround===4?X.red:g.turnaround===12?X.yellow:X.green}>{TIERS[g.turnaround]?.tag}</Pill></div><T style={{ color: X.white, fontWeight: 600 }}>{g.service}</T>{g.brief && <T sm dim style={{ marginTop: 2 }}>{g.brief.slice(0,80)}{g.brief.length>80?"...":""}</T>}</div><div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 16, color: X.teal }}>R{Math.round((g.price||0)*0.75).toLocaleString()}</div><T sm dim>your earnings</T><span style={{ fontSize: 11, fontFamily: "Outfit", fontWeight: 600, color: X.teal, display: "flex", alignItems: "center", gap: 4 }}>View Details →</span></div></div></Card>)}</div>}</div>
          )}

          {!loading && !showCreate && !selectedGig && section === "profile" && isCust && <CustProfile customer={profile} onUpdate={onUpdateProfile} />}
          {!loading && !showCreate && !selectedGig && section === "profile" && !isCust && <DesProfile designer={profile} onUpdate={onUpdateProfile} />}
          {!loading && !showCreate && !selectedGig && section === "earnings" && !isCust && <DesEarnings designer={profile} />}
          {!loading && !showCreate && !selectedGig && section === "support" && <SupportPage userId={profile.id} userRole={role} userName={profile.name} userEmail={profile.email} accent={accent} />}
        </div>
      </div>
    </div>
  );
};

// ─── RATING MODAL ───────────────────────────────────────────────────────────
const RateModal = ({ gigId, designerId, onDone, onClose }) => {
  const [r, setR] = useState(5); const [fb, setFb] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card onClick={e => e.stopPropagation()} style={{ maxWidth: 360, width: "100%", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}><H s={17}>Rate this designer</H></div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <button key={s} onClick={() => setR(s)} style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: s <= r ? X.orange : "#27272a" }}>★</button>)}</div>
        <Field label="Feedback" value={fb} onChange={setFb} textarea placeholder="How was it?" />
        <div style={{ display: "flex", gap: 6 }}><Btn v="ghost" full onClick={onClose}>Cancel</Btn><Btn full onClick={() => onDone(r, fb)}>Submit</Btn></div>
      </Card>
    </div>
  );
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
const auth = async (a, d) => { try { const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, ...d }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; } catch (e) { return { error: e.message }; } };
const pay = async (a, d) => { try { const r = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, ...d }) }); return r.json(); } catch (e) { return { error: e.message }; } };

const AuthScreen = ({ go, onAuth, mode: im, role: ir }) => {
  const [mode, setMode] = useState(im||"login"); const [role, setRole] = useState(ir||"customer"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [city, setCity] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [resetSent, setResetSent] = useState(false); const [showReset, setShowReset] = useState(false);
  const flip = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const iDS = mode === "signup" && role === "designer";

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") { if (role === "customer") { const r = await auth("signup_customer", { email, password, name }); if (r.error) throw new Error(r.error); if (r.customer) onAuth("customer", r.customer); } else { if (!skills.length) throw new Error("Select skills"); const r = await auth("signup_designer", { email, password, name, city, bio, skills }); if (r.error) throw new Error(r.error); if (r.designer) { onAuth("designer", r.designer); sendEmail("designer_welcome", { designerEmail: email, designerName: name }); } } }
      else { const r = await auth("login", { email, password }); if (r.error) throw new Error(r.error); if (r.profile) onAuth(r.role, r.profile); else throw new Error("Account not found"); }
    } catch (e) { setError(e.message); } setLoading(false);
  };

  const forgotPassword = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setLoading(true); setError("");
    const r = await auth("forgot_password", { email });
    if (r.error) { setError(r.error); } else { setResetSent(true); }
    setLoading(false);
  };

  const googleSignIn = async () => {
    setLoading(true);
    const r = await auth("google_url", { role });
    if (r.url) { localStorage.setItem("lmd_google_role", role); window.location.href = r.url; }
    else { setError("Google sign in unavailable"); setLoading(false); }
  };

  const googleBtnStyle = { width: "100%", padding: "10px 16px", borderRadius: 8, border: `1px solid ${X.border}`, background: X.bg, color: X.white, fontFamily: "Inter", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: iDS ? 460 : 360, width: "100%" }}>
        <Nav go={go} minimal />
        <div style={{ paddingTop: 80 }}>
          <button onClick={() => go("landing")} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back</button>
          <div style={{ textAlign: "center", marginBottom: 20 }}><H s={22}>{showReset ? "Reset Password" : mode === "login" ? "Welcome back" : role === "designer" ? "Join as Designer" : "Create account"}</H></div>

          {mode === "signup" && !showReset && <div style={{ display: "flex", gap: 4, marginBottom: 16, background: X.card, borderRadius: 8, padding: 4, border: `1px solid ${X.border}` }}>{["customer","designer"].map(r => <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: 8, borderRadius: 6, border: "none", fontFamily: "Outfit", fontWeight: 600, fontSize: 12, cursor: "pointer", background: role===r?(r==="designer"?X.teal:X.orange):"transparent", color: role===r?X.bg:X.gray }}>{r==="customer"?"I need design":"I'm a designer"}</button>)}</div>}

          <Card>
            {error && <div style={{ padding: "8px 12px", marginBottom: 12, borderRadius: 6, background: X.red+"18", border: `1px solid ${X.red}30`, color: X.red, fontSize: 12 }}>{error}</div>}

            {/* Forgot password mode */}
            {showReset ? (
              resetSent ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📧</div>
                  <T style={{ color: X.white, fontWeight: 600, marginBottom: 6 }}>Check your email</T>
                  <T dim sm>We've sent a password reset link to <span style={{ color: X.white }}>{email}</span></T>
                  <button onClick={() => { setShowReset(false); setResetSent(false); }} style={{ background: "none", border: "none", color: X.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter", marginTop: 16 }}>← Back to sign in</button>
                </div>
              ) : (
                <>
                  <T dim sm style={{ marginBottom: 14 }}>Enter your email and we'll send you a reset link</T>
                  <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                  <Btn full onClick={forgotPassword} disabled={loading || !email}>{loading ? "Sending..." : "Send Reset Link"}</Btn>
                  <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={() => setShowReset(false)} style={{ background: "none", border: "none", color: X.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>← Back to sign in</button></div>
                </>
              )
            ) : (
              <>
                {/* Google sign in */}
                <button onClick={googleSignIn} disabled={loading} style={googleBtnStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: X.border }} />
                  <T sm dim>or</T>
                  <div style={{ flex: 1, height: 1, background: X.border }} />
                </div>

                {mode === "signup" && <Field label="Name" value={name} onChange={setName} placeholder="Your name" />}
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                <Field label="Password" value={password} onChange={setPassword} type="password" placeholder={mode==="signup"?"Min 6 chars":"Password"} />

                {/* Forgot password link */}
                {mode === "login" && <div style={{ textAlign: "right", marginTop: -8, marginBottom: 12 }}><button onClick={() => setShowReset(true)} style={{ background: "none", border: "none", color: X.gray, fontSize: 11, cursor: "pointer", fontFamily: "Inter" }}>Forgot password?</button></div>}

                {iDS && <><Field label="City" value={city} onChange={setCity} /><Field label="Bio" value={bio} onChange={setBio} textarea /><div style={{ marginBottom: 14 }}><label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: X.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</label><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{ALL_SERVICES.map(s => <button key={s.name} onClick={() => flip(s.name)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter", background: skills.includes(s.name)?X.tealDim:X.bg, color: skills.includes(s.name)?X.teal:X.gray, border: `1px solid ${skills.includes(s.name)?X.tealBorder:X.border}`, cursor: "pointer" }}>{s.name}</button>)}</div></div></>}

                <Btn full onClick={submit} disabled={loading||!email||!password||(mode==="signup"&&!name)}>{loading?"Please wait...":mode==="login"?"Sign In →":"Create Account →"}</Btn>
                <div style={{ textAlign: "center", marginTop: 14 }}><button onClick={() => { setMode(mode==="login"?"signup":"login"); setError(""); }} style={{ background: "none", border: "none", color: X.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>{mode==="login"?"Don't have an account? Sign up →":"Already have an account? Sign in →"}</button></div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [pg, setPg] = useState("landing"); const [toast, setToast] = useState(null); const [profile, setProfile] = useState(null); const [role, setRole] = useState(null); const [rateGig, setRateGig] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem("lmd_theme") || "dark");
  const note = m => setToast(m);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
    localStorage.setItem("lmd_theme", next);
  };

  // Apply theme on load
  useEffect(() => { setTheme(theme); }, []);

  // Force re-render when theme changes
  useEffect(() => {
    setTheme(theme);
    document.body.style.background = X.bg;
    document.body.style.color = X.white;
  }, [theme]);

  useEffect(() => {
    const s = localStorage.getItem("lmd_session");
    if (s) { try { const { role: r, profile: p } = JSON.parse(s); setRole(r); setProfile(p); setPg("dashboard"); } catch(e) { localStorage.removeItem("lmd_session"); } }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref) { window.history.replaceState({}, "", "/"); verifyPay(ref); }

    // Handle Google OAuth callback
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        window.history.replaceState({}, "", "/");
        handleGoogleCallback(accessToken);
      }
    }
  }, []);

  const handleGoogleCallback = async (token) => {
    note("Signing in with Google...");
    const r = await auth("google_session", { access_token: token });
    if (r.error) { note("Google sign in failed"); return; }
    if (r.profile && r.role) {
      handleAuth(r.role, r.profile);
    } else if (r.needsProfile) {
      // New Google user — create profile automatically as customer
      const savedRole = localStorage.getItem("lmd_google_role") || "customer";
      const userName = r.user.user_metadata?.full_name || r.user.email?.split("@")[0] || "User";
      const cr = await auth("create_google_profile", { user_id: r.user.id, email: r.user.email, name: userName, role: savedRole });
      localStorage.removeItem("lmd_google_role");
      if (cr.profile) handleAuth(cr.role, cr.profile);
      else note("Failed to create profile");
    }
  };

  const verifyPay = async (ref) => { note("Verifying payment..."); const r = await pay("verify", { reference: ref }); if (r.success && r.paid) { note(r.designer ? `Matched with ${r.designer.name}!` : "Payment confirmed!"); setPg("dashboard"); } else note("Payment verification failed"); };
  const handleAuth = (r, p) => { setRole(r); setProfile(p); setPg("dashboard"); localStorage.setItem("lmd_session", JSON.stringify({ role: r, profile: p })); note(`Welcome, ${p.name}!`); };
  const logout = () => { setProfile(null); setRole(null); localStorage.removeItem("lmd_session"); setPg("landing"); };
  const updateProfile = (p) => { setProfile(p); localStorage.setItem("lmd_session", JSON.stringify({ role, profile: p })); };

  const createGig = async (data) => { if (!profile) return; note("Initiating payment..."); const r = await pay("initialize", { email: profile.email, amount: data.price, customer_id: profile.id, service: data.service, turnaround: data.turnaround, brief: data.brief, category: data.category }); if (r.success && r.authorization_url) { localStorage.setItem("lmd_session", JSON.stringify({ role, profile })); window.location.href = r.authorization_url; } else note(r.error || "Payment failed"); };
  const acceptGig = async (id, t) => { await api("accept_gig", { gig_id: id, designer_id: profile.id, turnaround: t }); note("Gig accepted!"); };
  const deliverGig = async (id) => { await api("deliver_gig", { gig_id: id }); note("Delivered!"); };
  const rateSubmit = async (score, fb) => { if (!rateGig) return; await api("rate_gig", { gig_id: rateGig.id, customer_id: profile.id, designer_id: rateGig.designer_id, score, feedback: fb }); setRateGig(null); note("Thanks for rating!"); };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: X.white, background: X.bg, minHeight: "100vh", transition: "background 0.3s, color 0.3s" }}>
      <style>{CSS}{`body{background:${X.bg};color:${X.white};transition:background 0.3s,color 0.3s}`}</style>
      {toast && <Toasty msg={toast} onClose={() => setToast(null)} />}

      {/* Theme toggle — fixed bottom right */}
      <button onClick={toggleTheme} style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 9999,
        width: 40, height: 40, borderRadius: "50%",
        background: X.card, border: `1px solid ${X.border}`,
        color: X.white, fontSize: 18, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transition: "all 0.3s",
      }}>{theme === "dark" ? "☀️" : "🌙"}</button>

      {pg === "landing" && <Landing go={setPg} />}
      {pg === "customer-login" && <AuthScreen go={setPg} onAuth={handleAuth} mode="login" role="customer" />}
      {pg === "customer-signup" && <AuthScreen go={setPg} onAuth={handleAuth} mode="signup" role="customer" />}
      {pg === "designer-register" && <AuthScreen go={setPg} onAuth={handleAuth} mode="signup" role="designer" />}
      {pg === "designer-login" && <AuthScreen go={setPg} onAuth={handleAuth} mode="login" role="designer" />}
      {pg === "dashboard" && profile && role && <Dashboard role={role} profile={profile} onLogout={logout} createGig={createGig} acceptGig={acceptGig} deliverGig={deliverGig} onUpdateProfile={updateProfile} rateGig={rateGig} rateSubmit={rateSubmit} setRateGig={setRateGig} />}
    </div>
  );
}

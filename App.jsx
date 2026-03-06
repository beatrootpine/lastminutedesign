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
const Nav = ({ go, minimal }) => <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}` }}><span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer", letterSpacing: "-0.02em" }}><span style={{ color: X.orange }}>lastminute</span>.design</span>{!minimal && <div style={{ display: "flex", gap: 8 }}><Btn v="ghost" sm onClick={() => go("designer-register")}>Join as Designer</Btn><Btn sm onClick={() => go("customer-login")}>Get Design</Btn></div>}</nav>;

const Shell = ({ children, role, go }) => <div style={{ minHeight: "100vh", background: X.bg }}><nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 28px", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${X.border}`, position: "sticky", top: 0, zIndex: 100 }}><span onClick={() => go("landing")} style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white, cursor: "pointer" }}><span style={{ color: X.orange }}>lastminute</span>.design</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Pill color={role === "designer" ? X.green : X.orange}>{role}</Pill><button onClick={() => go("landing")} style={{ background: "none", border: "none", color: X.gray, fontSize: 12, fontFamily: "Inter", cursor: "pointer" }}>Sign out</button></div></nav><div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>{children}</div></div>;

// ─── LANDING ────────────────────────────────────────────────────────────────
const Landing = ({ go }) => {
  const [openCat, setOpenCat] = useState(null);
  return (
    <div style={{ background: X.bg, minHeight: "100vh" }}>
      <Nav go={go} />
      <div style={{ paddingTop: 120, textAlign: "center", maxWidth: 600, margin: "0 auto", padding: "120px 20px 60px" }}>
        <Pill>24/7 Creative Services</Pill>
        <h1 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.08, color: X.white, margin: "20px 0 14px", letterSpacing: "-0.03em" }}>
          Design done<br /><span style={{ color: X.orange }}>before sunrise.</span>
        </h1>
        <T style={{ maxWidth: 420, margin: "0 auto 32px", fontSize: 15 }}>Pick your deadline. We match you with a vetted designer instantly. No back-and-forth. Just great design, fast.</T>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
          {Object.entries(TIERS).map(([h, { tag, desc }]) => (
            <Card key={h} onClick={() => go("customer-login")} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}>
              <Pill color={h === "4" ? X.red : h === "12" ? X.yellow : X.green}>{tag}</Pill>
              <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 28, color: X.white, margin: "8px 0 2px" }}>{h}h</div>
              <T sm dim>{desc}</T>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={() => go("customer-login")}>Submit a Gig →</Btn>
          <Btn v="secondary" onClick={() => go("designer-register")}>I'm a Designer</Btn>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}><H s={26}>Services & Pricing</H><T dim style={{ marginTop: 4 }}>All prices in ZAR · excl. VAT</T></div>
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
      </div>
      <div style={{ borderTop: `1px solid ${X.border}`, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
          {[["247+", "Designers"], ["1,200+", "Gigs Done"], ["4.8★", "Avg Rating"]].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.white }}>{v}</div><T sm dim>{l}</T></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── FILE UPLOAD COMPONENT ──────────────────────────────────────────────────
const SUPABASE_URL_PUBLIC = typeof window !== "undefined" ? document.querySelector('meta[name="supabase-url"]')?.content : "";

const FileUpload = ({ gigId, role, userId, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const loadFiles = useCallback(async () => {
    const res = await api("get_gig_files", { gig_id: gigId }, "GET");
    if (res.files) setFiles(res.files);
  }, [gigId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const path = `${gigId}/${Date.now()}_${file.name}`;
      const SUPA_URL = window.__SUPABASE_URL__;
      const SUPA_KEY = window.__SUPABASE_KEY__;

      // Upload to Supabase Storage
      const uploadRes = await fetch(`${SUPA_URL}/storage/v1/object/deliverables/${path}`, {
        method: "POST",
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` },
        body: file,
      });

      if (uploadRes.ok) {
        // Register file in database
        await api("register_file", {
          gig_id: gigId,
          uploaded_by_role: role,
          uploaded_by_id: userId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          file_type: file.type,
        });
        await loadFiles();
        if (onUploaded) onUploaded();
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: X.orangeDim, color: X.orange, fontSize: 12, fontFamily: "Outfit", fontWeight: 600, border: `1px solid ${X.orangeBorder}` }}>
          {uploading ? "Uploading..." : "📎 Upload File"}
          <input type="file" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
        </label>
        <T sm dim>{files.length} file{files.length !== 1 ? "s" : ""}</T>
      </div>
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: X.bg, borderRadius: 6, border: `1px solid ${X.border}` }}>
              <span style={{ fontSize: 14 }}>{f.file_type?.startsWith("image") ? "🖼" : "📄"}</span>
              <T sm style={{ color: X.white, flex: 1 }}>{f.file_name}</T>
              <Pill color={f.uploaded_by_role === "designer" ? X.green : X.orange}>{f.uploaded_by_role}</Pill>
              <T sm dim>{(f.file_size / 1024).toFixed(0)}KB</T>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── GIG CARD ───────────────────────────────────────────────────────────────
const GigCard = ({ gig, designer, rating, isCust, onAccept, onDeliver, onRate, userId }) => {
  const pct = gig.status === "in_progress" && gig.deadline ? Math.min(100, Math.max(0, Math.round(((Date.now() - new Date(gig.created_at).getTime()) / (new Date(gig.deadline).getTime() - new Date(gig.created_at).getTime())) * 100))) : 0;
  const hrs = gig.deadline ? Math.max(0, ((new Date(gig.deadline).getTime() - Date.now()) / 3600000).toFixed(1)) : 0;
  const sc = { pending: X.yellow, in_progress: X.orange, delivered: X.green, completed: X.green }[gig.status] || X.gray;

  return (
    <Card style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            <Pill color={sc}>{gig.status.replace("_", " ")}</Pill>
            <Pill color={gig.turnaround === 4 ? X.red : gig.turnaround === 12 ? X.yellow : X.green}>{TIERS[gig.turnaround]?.tag}</Pill>
          </div>
          <H s={15}>{gig.service}</H>
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 17, color: X.orange, whiteSpace: "nowrap" }}>R{gig.price?.toLocaleString()}</div>
      </div>

      {gig.brief && <T dim sm style={{ marginBottom: 8 }}>{gig.brief}</T>}

      {gig.status === "in_progress" && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T sm dim>Progress</T><T sm style={{ color: hrs < 1 ? X.red : X.gray }}>{hrs}h left</T></div>
          <Bar pct={pct} />
        </div>
      )}

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

      {!isCust && gig.status === "pending" && (
        <div style={{ paddingTop: 10, borderTop: `1px solid ${X.border}` }}>
          <Btn sm onClick={() => onAccept(gig.id, gig.turnaround)}>Accept Gig</Btn>
        </div>
      )}

      {rating && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${X.border}`, display: "flex", alignItems: "center", gap: 5 }}>
          <Stars n={rating.score} s={12} /><T sm dim>Rated {rating.score}/5</T>
        </div>
      )}

      {/* File uploads for active/delivered gigs */}
      {(gig.status === "in_progress" || gig.status === "delivered") && userId && (
        <FileUpload gigId={gig.id} role={isCust ? "customer" : "designer"} userId={userId} />
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

  const go = () => { setLoading(true); onSubmit({ service: svc, category: cat, brief, turnaround: parseInt(tier), price }); };

  if (loading) return <Spinner text="Finding your designer..." />;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: X.gray, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>← Back</button>
      <H s={22}>Submit a Gig</H>
      <T dim style={{ marginBottom: 20 }}>Tell us what you need</T>
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>{[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? X.orange : X.border }} />)}</div>

      {step === 1 && <div><H s={15} style={{ marginBottom: 10 }}>Category</H><div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{Object.keys(SERVICES).map(c => <button key={c} onClick={() => { setCat(c); setSvc(""); setStep(2); }} style={{ padding: "11px 14px", borderRadius: 8, textAlign: "left", background: cat === c ? X.orangeDim : X.card, border: `1px solid ${cat === c ? X.orangeBorder : X.border}`, color: cat === c ? X.orange : X.white, fontFamily: "Inter", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{c}</button>)}</div></div>}

      {step === 2 && <div><H s={15} style={{ marginBottom: 10 }}>{cat}</H><div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>{SERVICES[cat]?.map(s => <button key={s.name} onClick={() => setSvc(s.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 8, background: svc === s.name ? X.orangeDim : X.card, border: `1px solid ${svc === s.name ? X.orangeBorder : X.border}`, color: svc === s.name ? X.orange : X.white, fontFamily: "Inter", fontSize: 13, cursor: "pointer" }}><span>{s.name}</span><span style={{ color: X.gray, fontSize: 11 }}>from R{s.prices[24].toLocaleString()}</span></button>)}</div><Field label="Brief (optional)" value={brief} onChange={setBrief} textarea placeholder="Describe what you need..." /><div style={{ display: "flex", gap: 6 }}><Btn v="ghost" sm onClick={() => setStep(1)}>Back</Btn><Btn sm onClick={() => setStep(3)} disabled={!svc}>Next →</Btn></div></div>}

      {step === 3 && <div><H s={15} style={{ marginBottom: 10 }}>Turnaround</H><div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>{Object.entries(TIERS).map(([h, { tag }]) => { const p = sel?.prices[h]; return <button key={h} onClick={() => setTier(h)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", borderRadius: 8, background: tier === h ? X.orangeDim : X.card, border: tier === h ? `2px solid ${X.orange}` : `1px solid ${X.border}`, cursor: "pointer" }}><div style={{ textAlign: "left" }}><div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, color: X.white, marginBottom: 2 }}>{h} Hours</div><Pill color={h === "4" ? X.red : h === "12" ? X.yellow : X.green}>{tag}</Pill></div><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: X.orange }}>R{p?.toLocaleString()}</div></button>; })}</div>{tier && <Card style={{ marginBottom: 14, background: X.bg, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T dim sm>Service</T><T sm style={{ color: X.white }}>{svc}</T></div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><T dim sm>Turnaround</T><T sm style={{ color: X.white }}>{tier}h — {TIERS[tier]?.tag}</T></div><div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${X.border}`, paddingTop: 6, marginTop: 6 }}><T style={{ color: X.white, fontWeight: 600 }}>Total</T><span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 18, color: X.orange }}>R{price?.toLocaleString()}</span></div></Card>}<div style={{ display: "flex", gap: 6 }}><Btn v="ghost" sm onClick={() => setStep(2)}>Back</Btn><Btn sm onClick={go} disabled={!tier}>Submit Gig →</Btn></div></div>}
    </div>
  );
};

// ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────────
const CustDash = ({ customer, onCreateGig, onRate }) => {
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
  const list = tab === "active" ? active : done;

  if (loading) return <Spinner text="Loading gigs..." />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div><H s={22}>My Gigs</H><T dim style={{ marginTop: 2 }}>Welcome back, {customer.name}</T></div>
        <Btn onClick={onCreateGig}>+ New Gig</Btn>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {["active", "completed"].map(t => <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", textTransform: "capitalize", background: tab === t ? X.orangeDim : "transparent", color: tab === t ? X.orange : X.gray }}>{t} ({t === "active" ? active.length : done.length})</button>)}
      </div>
      {list.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 36 }}><T dim>{tab === "active" ? "No active gigs" : "No completed gigs"}</T>{tab === "active" && <Btn sm onClick={onCreateGig} style={{ marginTop: 10 }}>Submit your first gig</Btn>}</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(g => <GigCard key={g.id} gig={g} designer={designers.find(d => d.id === g.designer_id)} rating={ratings.find(r => r.gig_id === g.id)} isCust onRate={onRate} userId={customer.id} />)}
        </div>
      )}
    </div>
  );
};

// ─── DESIGNER DASHBOARD ─────────────────────────────────────────────────────
const DesDash = ({ designer, onAccept, onDeliver }) => {
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

  const tabs = [{ k: "available", l: `Available (${avail.length})` }, { k: "active", l: `Active (${active.length})` }, { k: "done", l: `Done (${done.length})` }];
  const list = tab === "available" ? avail : tab === "active" ? active : done;

  if (loading) return <Spinner text="Loading dashboard..." />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Av text={designer.avatar_initials || "?"} s={48} on={designer.is_online} />
        <div style={{ flex: 1 }}><H s={18}>{designer.name}</H><div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><Stars n={designer.rating || 0} s={13} /><T sm dim>{designer.rating || "New"} · {designer.total_reviews || 0} reviews</T></div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {[{ l: "Completed", v: designer.completed_gigs || 0 }, { l: "Rating", v: (designer.rating || 0) + "★" }, { l: "Earned", v: `R${Math.round(earned).toLocaleString()}` }].map(s => <Card key={s.l} style={{ textAlign: "center", padding: 12 }}><div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 20, color: X.orange }}>{s.v}</div><T sm dim>{s.l}</T></Card>)}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === t.k ? X.orangeDim : "transparent", color: tab === t.k ? X.orange : X.gray }}>{t.l}</button>)}
      </div>
      {list.length === 0 ? <Card style={{ textAlign: "center", padding: 36 }}><T dim>Nothing here yet</T></Card> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(g => <GigCard key={g.id} gig={g} onAccept={onAccept} onDeliver={onDeliver} userId={designer.id} />)}
        </div>
      )}
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

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [pg, setPg] = useState("landing");
  const [toast, setToast] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [designer, setDesigner] = useState(null);
  const [rateGig, setRateGig] = useState(null);

  // Auth form state
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [dEmail, setDEmail] = useState("");

  const note = m => setToast(m);

  // Customer login
  const custLogin = async () => {
    const res = await api("customer_login", { email: cEmail, name: cName });
    if (res.customer) { setCustomer(res.customer); setPg("customer-dash"); }
    else note("Login failed");
  };

  // Designer login
  const desLogin = async () => {
    const res = await api("designer_login", { email: dEmail });
    if (res.designer) { setDesigner(res.designer); setPg("designer-dash"); }
    else note(res.error || "Not found. Register first.");
  };

  // Designer register
  const desRegister = async (data) => {
    const res = await api("designer_register", data);
    if (res.designer) {
      setDesigner(res.designer);
      setDEmail(data.email);
      note(res.existing ? "Welcome back!" : "Welcome aboard!");
      setPg("designer-dash");
      if (!res.existing) sendEmail("designer_welcome", { designerEmail: data.email, designerName: data.name });
    } else note("Registration failed");
  };

  // Create gig
  const createGig = async (data) => {
    const res = await api("create_gig", { ...data, customer_id: customer.id });
    if (res.gig) {
      note(res.designer ? `Matched with ${res.designer.name}!` : "Gig posted! Waiting for a designer.");
      setPg("customer-dash");
      sendEmail("gig_created", { customerEmail: customer.email, customerName: customer.name, gigType: data.service, turnaround: data.turnaround, price: data.price, brief: data.brief });
      if (res.designer) sendEmail("designer_matched", { customerEmail: customer.email, customerName: customer.name, designerName: res.designer.name, gigType: data.service, turnaround: data.turnaround, price: data.price });
    } else note("Failed to create gig");
  };

  // Accept gig
  const acceptGig = async (id, turnaround) => {
    await api("accept_gig", { gig_id: id, designer_id: designer.id, turnaround });
    note("Gig accepted!");
    sendEmail("gig_accepted", { designerEmail: designer.email, designerName: designer.name, gigType: "Gig", turnaround, price: 0 });
  };

  // Deliver gig
  const deliverGig = async (id) => {
    await api("deliver_gig", { gig_id: id });
    note("Delivered!");
    if (customer) sendEmail("gig_delivered", { customerEmail: customer.email, customerName: customer.name, designerName: designer?.name || "" });
  };

  // Rate
  const rateSubmit = async (score, feedback) => {
    if (!rateGig) return;
    await api("rate_gig", { gig_id: rateGig.id, customer_id: customer.id, designer_id: rateGig.designer_id, score, feedback });
    setRateGig(null);
    note("Thanks for rating!");
    sendEmail("gig_rated", { designerEmail: "", designerName: "", gigType: rateGig.service, rating: score, feedback });
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: X.white, background: X.bg, minHeight: "100vh" }}>
      <style>{CSS}</style>
      {toast && <Toasty msg={toast} onClose={() => setToast(null)} />}
      {rateGig && <RateModal gigId={rateGig.id} designerId={rateGig.designer_id} onDone={rateSubmit} onClose={() => setRateGig(null)} />}

      {pg === "landing" && <Landing go={setPg} />}

      {pg === "customer-login" && (
        <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 360, width: "100%" }}>
            <Nav go={setPg} minimal />
            <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}><H s={22}>Get started</H><T dim style={{ marginTop: 4 }}>Enter your details to submit a gig</T></div>
            <Card><Field label="Name" value={cName} onChange={setCName} placeholder="Your name" /><Field label="Email" value={cEmail} onChange={setCEmail} type="email" placeholder="you@email.com" /><Btn full onClick={custLogin} disabled={!cName || !cEmail}>Continue →</Btn></Card>
          </div>
        </div>
      )}

      {pg === "customer-dash" && customer && <Shell role="customer" go={setPg}><CustDash customer={customer} onCreateGig={() => setPg("create-gig")} onRate={(id) => { const g = document.querySelector(`[data-gig="${id}"]`); setRateGig({ id, designer_id: null, service: "" }); }} /></Shell>}

      {pg === "create-gig" && customer && <Shell role="customer" go={setPg}><CreateGig onSubmit={createGig} onBack={() => setPg("customer-dash")} /></Shell>}

      {pg === "designer-register" && (
        <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 460, width: "100%" }}>
            <Nav go={setPg} minimal />
            <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}><H s={22}>Join as a Designer</H><T dim style={{ marginTop: 4 }}>Earn money doing what you love</T></div>
            <Card>
              {(() => {
                const [name, setName] = useState("");
                const [email, setEmail] = useState("");
                const [city, setCity] = useState("");
                const [bio, setBio] = useState("");
                const [skills, setSkills] = useState([]);
                const flip = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
                return <>
                  <Field label="Full Name" value={name} onChange={setName} placeholder="Thando Mokoena" />
                  <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                  <Field label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
                  <Field label="Short Bio" value={bio} onChange={setBio} textarea placeholder="What makes your work stand out..." />
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 600, color: X.gray, fontFamily: "Outfit", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {ALL_SERVICES.map(s => <button key={s.name} onClick={() => flip(s.name)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "Inter", background: skills.includes(s.name) ? X.orangeDim : X.bg, color: skills.includes(s.name) ? X.orange : X.gray, border: `1px solid ${skills.includes(s.name) ? X.orangeBorder : X.border}`, cursor: "pointer" }}>{s.name}</button>)}
                    </div>
                  </div>
                  <Btn full onClick={() => { if (name && email && skills.length) desRegister({ name, email, city, bio, skills }); }} disabled={!name || !email || !skills.length}>Apply Now →</Btn>
                  <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={() => setPg("designer-login")} style={{ background: "none", border: "none", color: X.orange, fontSize: 12, cursor: "pointer", fontFamily: "Inter" }}>Already registered? Sign in →</button></div>
                </>;
              })()}
            </Card>
          </div>
        </div>
      )}

      {pg === "designer-login" && (
        <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 360, width: "100%" }}>
            <Nav go={setPg} minimal />
            <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 80 }}><H s={22}>Designer sign in</H></div>
            <Card><Field label="Email" value={dEmail} onChange={setDEmail} type="email" placeholder="you@email.com" /><Btn full onClick={desLogin} disabled={!dEmail}>Sign In →</Btn></Card>
          </div>
        </div>
      )}

      {pg === "designer-dash" && designer && <Shell role="designer" go={setPg}><DesDash designer={designer} onAccept={acceptGig} onDeliver={deliverGig} /></Shell>}
    </div>
  );
}

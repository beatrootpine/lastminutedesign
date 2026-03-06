import { useState, useEffect, useCallback, useRef } from "react";

// ─── DATA & CONFIG ──────────────────────────────────────────────────────────
const PRICING = {
  4: { label: "4 Hours", emoji: "⚡", price: 350, tag: "RUSH" },
  12: { label: "12 Hours", emoji: "🔥", price: 550, tag: "EXPRESS" },
  24: { label: "24 Hours", emoji: "🕐", price: 750, tag: "STANDARD" },
};

const GIG_TYPES = [
  "Logo Design", "Social Media Post", "Flyer / Poster", "Business Card",
  "Web Banner", "Email Template", "Presentation Deck", "Menu Design",
  "Invitation", "Brochure", "Packaging", "Other"
];

const MOCK_DESIGNERS = [
  { id: "d1", name: "Thando Mokoena", avatar: "TM", rating: 4.9, reviews: 127, skills: ["Logo Design", "Brochure", "Business Card"], completedGigs: 143, bio: "Brand identity specialist with 6 years experience.", online: true, city: "Johannesburg" },
  { id: "d2", name: "Lerato Ndlovu", avatar: "LN", rating: 4.7, reviews: 89, skills: ["Social Media Post", "Web Banner", "Flyer / Poster"], completedGigs: 98, bio: "Digital-first designer. Fast, bold, on-brand.", online: true, city: "Cape Town" },
  { id: "d3", name: "Sipho Dlamini", avatar: "SD", rating: 4.8, reviews: 201, skills: ["Presentation Deck", "Email Template", "Brochure"], completedGigs: 215, bio: "Corporate design expert. Pixel-perfect every time.", online: false, city: "Pretoria" },
  { id: "d4", name: "Naledi Khumalo", avatar: "NK", rating: 5.0, reviews: 56, skills: ["Packaging", "Menu Design", "Logo Design"], completedGigs: 61, bio: "Print & packaging specialist with a luxury eye.", online: true, city: "Durban" },
  { id: "d5", name: "Kagiso Modise", avatar: "KM", rating: 4.6, reviews: 74, skills: ["Invitation", "Flyer / Poster", "Social Media Post"], completedGigs: 82, bio: "Event & promo design. Making moments visual.", online: true, city: "Sandton" },
];

const genId = () => Math.random().toString(36).slice(2, 10);
const timeAgo = (ms) => {
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
};
const progressPercent = (created, deadline) => {
  const total = deadline - created;
  const elapsed = Date.now() - created;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

// ─── EMAIL HELPER ───────────────────────────────────────────────────────────
const sendEmail = async (type, data) => {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    if (!res.ok) console.error("Email failed:", await res.text());
    return res.ok;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const fonts = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');
`;

const cssVars = {
  "--mango": "#FF8C00",
  "--mango-light": "#FFA940",
  "--mango-dark": "#CC7000",
  "--papaya": "#FFBD59",
  "--dark": "#0D0D0D",
  "--dark-card": "#1A1A1A",
  "--dark-border": "#2A2A2A",
  "--dark-hover": "#252525",
  "--cream": "#FFF8F0",
  "--text": "#E8E8E8",
  "--text-dim": "#888888",
  "--success": "#22C55E",
  "--warning": "#F59E0B",
  "--danger": "#EF4444",
  "--radius": "12px",
};

// ─── REUSABLE COMPONENTS ────────────────────────────────────────────────────

function Badge({ children, color = "var(--mango)", small }) {
  return (
    <span style={{
      background: color + "22",
      color: color,
      padding: small ? "2px 8px" : "4px 12px",
      borderRadius: "100px",
      fontSize: small ? "10px" : "11px",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      fontFamily: "Syne, sans-serif",
      display: "inline-block",
      border: `1px solid ${color}33`,
    }}>{children}</span>
  );
}

function StarRating({ rating, size = 14 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= Math.round(rating) ? "var(--mango)" : "#333", fontSize: size }}>★</span>
    );
  }
  return <span style={{ display: "inline-flex", gap: 1 }}>{stars}</span>;
}

function Avatar({ initials, size = 40, online }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--mango), var(--papaya))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Syne", fontWeight: 800, fontSize: size * 0.35,
      color: "var(--dark)", position: "relative", flexShrink: 0,
    }}>
      {initials}
      {online !== undefined && (
        <span style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: online ? "var(--success)" : "#555",
          border: "2px solid var(--dark-card)",
        }} />
      )}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", style: extra, disabled }) {
  const base = {
    fontFamily: "Syne, sans-serif", fontWeight: 700, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "var(--radius)", transition: "all 0.2s", letterSpacing: "0.02em",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    opacity: disabled ? 0.4 : 1,
  };
  const sizes = {
    sm: { padding: "8px 16px", fontSize: 12 },
    md: { padding: "12px 24px", fontSize: 14 },
    lg: { padding: "16px 32px", fontSize: 16 },
  };
  const variants = {
    primary: { background: "linear-gradient(135deg, var(--mango), var(--papaya))", color: "var(--dark)" },
    secondary: { background: "var(--dark-border)", color: "var(--text)" },
    ghost: { background: "transparent", color: "var(--mango)", border: "1px solid var(--dark-border)" },
    danger: { background: "var(--danger)22", color: "var(--danger)", border: "1px solid var(--danger)33" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...extra }}>
      {children}
    </button>
  );
}

function Card({ children, style: extra, onClick, hover }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && hover ? "var(--dark-hover)" : "var(--dark-card)",
        border: "1px solid var(--dark-border)",
        borderRadius: "var(--radius)", padding: 24,
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...extra,
      }}
    >
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, textarea, options }) {
  const shared = {
    width: "100%", boxSizing: "border-box",
    background: "var(--dark)", border: "1px solid var(--dark-border)",
    borderRadius: "var(--radius)", padding: "12px 16px",
    color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: 14,
    outline: "none", transition: "border-color 0.2s",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", marginBottom: 6, fontFamily: "Syne", fontWeight: 600, fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...shared, appearance: "none" }}>
          <option value="">{placeholder || "Select..."}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...shared, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} />
      )}
    </div>
  );
}

function ProgressBar({ percent, color = "var(--mango)" }) {
  return (
    <div style={{ width: "100%", height: 6, background: "var(--dark)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${percent}%`, height: "100%",
        background: percent > 80 ? "var(--danger)" : percent > 50 ? "var(--warning)" : color,
        borderRadius: 3, transition: "width 0.5s",
      }} />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--mango)" }}>{value}</div>
      <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── NOTIFICATION TOAST ─────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: "var(--mango)", color: "var(--dark)",
      padding: "14px 24px", borderRadius: "var(--radius)",
      fontFamily: "Syne", fontWeight: 700, fontSize: 14,
      boxShadow: "0 8px 32px rgba(255,140,0,0.3)",
      animation: "slideIn 0.3s ease",
    }}>
      {message}
    </div>
  );
}

// ─── LANDING PAGE ───────────────────────────────────────────────────────────
function LandingPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--dark)" }}>
      {/* Hero */}
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "40px 20px", position: "relative", overflow: "hidden",
      }}>
        {/* BG decoration */}
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, var(--mango)08, transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, var(--papaya)06, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Nav */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 32px",
          background: "rgba(13,13,13,0.8)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--dark-border)",
        }}>
          <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "var(--cream)" }}>
            <span style={{ color: "var(--mango)" }}>last</span>minute<span style={{ color: "var(--mango)" }}>.</span>design
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("designer-register")}>Join as Designer</Button>
            <Button size="sm" onClick={() => onNavigate("customer-login")}>Get Design Now</Button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800 }}>
          <Badge>🔥 24/7 Rush Design Studio</Badge>
          <h1 style={{
            fontFamily: "Syne", fontWeight: 800,
            fontSize: "clamp(42px, 7vw, 80px)",
            lineHeight: 1.05, color: "var(--cream)",
            margin: "24px 0 16px",
          }}>
            Design done<br />
            <span style={{
              background: "linear-gradient(135deg, var(--mango), var(--papaya))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>before sunrise.</span>
          </h1>
          <p style={{
            fontFamily: "DM Sans", fontSize: 18, color: "var(--text-dim)",
            maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6,
          }}>
            Pick your deadline. We match you with a vetted designer instantly.
            No back-and-forth. No waiting days. Just great design, fast.
          </p>

          {/* Pricing cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16, marginBottom: 40,
          }}>
            {Object.entries(PRICING).map(([hrs, { label, emoji, price, tag }]) => (
              <Card key={hrs} hover onClick={() => onNavigate("customer-login")} style={{ textAlign: "center", padding: 20, cursor: "pointer" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
                <Badge small color={hrs === "4" ? "var(--danger)" : hrs === "12" ? "var(--warning)" : "var(--success)"}>{tag}</Badge>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 32, color: "var(--cream)", margin: "12px 0 4px" }}>
                  R{price}
                </div>
                <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--text-dim)" }}>{label} turnaround</div>
              </Card>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" onClick={() => onNavigate("customer-login")}>Submit a Gig →</Button>
            <Button size="lg" variant="ghost" onClick={() => onNavigate("designer-register")}>I'm a Designer</Button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 48, opacity: 0.6,
        }}>
          {[["247+", "Designers"], ["1,200+", "Gigs Done"], ["4.8★", "Avg Rating"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "var(--cream)" }}>{v}</div>
              <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "var(--text-dim)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────────
function CustomerDashboard({ gigs, onCreateGig, onNavigate, onRate }) {
  const [view, setView] = useState("active");
  const active = gigs.filter(g => g.status !== "completed" && g.status !== "cancelled");
  const completed = gigs.filter(g => g.status === "completed");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--cream)", margin: 0 }}>My Gigs</h2>
          <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: "4px 0 0", fontSize: 14 }}>Track your active design requests</p>
        </div>
        <Button onClick={onCreateGig}>+ New Gig</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { l: "Active", v: active.length, c: "var(--mango)" },
          { l: "Completed", v: completed.length, c: "var(--success)" },
          { l: "Total Spent", v: `R${gigs.reduce((s, g) => s + (g.price || 0), 0)}`, c: "var(--papaya)" },
        ].map(({ l, v, c }) => (
          <Card key={l} style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 24, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "Syne", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["active", "completed"].map(t => (
          <button key={t} onClick={() => setView(t)} style={{
            fontFamily: "Syne", fontWeight: 700, fontSize: 13,
            padding: "8px 20px", borderRadius: 100,
            background: view === t ? "var(--mango)22" : "transparent",
            color: view === t ? "var(--mango)" : "var(--text-dim)",
            border: view === t ? "1px solid var(--mango)33" : "1px solid transparent",
            cursor: "pointer", textTransform: "capitalize",
          }}>{t} ({t === "active" ? active.length : completed.length})</button>
        ))}
      </div>

      {/* Gig list */}
      {(view === "active" ? active : completed).length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{view === "active" ? "🎨" : "✅"}</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--cream)", marginBottom: 8 }}>
            {view === "active" ? "No active gigs" : "No completed gigs yet"}
          </div>
          {view === "active" && <Button size="sm" onClick={onCreateGig}>Submit your first gig</Button>}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(view === "active" ? active : completed).map(gig => (
            <GigCard key={gig.id} gig={gig} isCustomer onRate={onRate} />
          ))}
        </div>
      )}
    </div>
  );
}

function GigCard({ gig, isCustomer, onAccept, onRate, onDeliver }) {
  const designer = MOCK_DESIGNERS.find(d => d.id === gig.designerId);
  const pct = gig.status === "completed" ? 100 : gig.status === "in_progress" ? progressPercent(gig.created, gig.deadline) : 0;
  const hoursLeft = Math.max(0, Math.round((gig.deadline - Date.now()) / 3600000 * 10) / 10);
  const statusColors = {
    pending: "var(--warning)", matched: "var(--mango)", in_progress: "var(--mango-light)",
    delivered: "var(--success)", completed: "var(--success)", cancelled: "var(--danger)",
  };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Badge small color={statusColors[gig.status]}>{gig.status.replace("_", " ")}</Badge>
            <Badge small>{PRICING[gig.turnaround]?.tag}</Badge>
          </div>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "var(--cream)", margin: 0 }}>{gig.type}</h3>
        </div>
        <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "var(--papaya)" }}>R{gig.price}</div>
      </div>

      {gig.brief && (
        <p style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--text-dim)", margin: "0 0 12px", lineHeight: 1.5 }}>{gig.brief}</p>
      )}

      {/* Progress */}
      {gig.status === "in_progress" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "Syne", fontWeight: 600 }}>Time elapsed</span>
            <span style={{ fontSize: 11, color: hoursLeft < 1 ? "var(--danger)" : "var(--text-dim)", fontFamily: "Syne", fontWeight: 600 }}>{hoursLeft}h left</span>
          </div>
          <ProgressBar percent={pct} />
        </div>
      )}

      {/* Designer info */}
      {designer && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--dark-border)", marginTop: 8 }}>
          <Avatar initials={designer.avatar} size={36} online={designer.online} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, color: "var(--cream)" }}>{designer.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StarRating rating={designer.rating} size={12} />
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{designer.rating} ({designer.reviews})</span>
            </div>
          </div>
          {isCustomer && gig.status === "delivered" && !gig.rated && (
            <Button size="sm" onClick={() => onRate(gig.id)}>Rate & Accept</Button>
          )}
          {!isCustomer && gig.status === "in_progress" && (
            <Button size="sm" onClick={() => onDeliver(gig.id)}>Mark Delivered</Button>
          )}
        </div>
      )}

      {/* Accept button for designers */}
      {!isCustomer && gig.status === "pending" && (
        <div style={{ borderTop: "1px solid var(--dark-border)", paddingTop: 12, marginTop: 8 }}>
          <Button size="sm" onClick={() => onAccept(gig.id)}>Accept Gig</Button>
        </div>
      )}

      {/* Customer rating */}
      {gig.rated && (
        <div style={{ borderTop: "1px solid var(--dark-border)", paddingTop: 12, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <StarRating rating={gig.customerRating} size={14} />
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>You rated {gig.customerRating}/5</span>
        </div>
      )}
    </Card>
  );
}

// ─── CREATE GIG FLOW ────────────────────────────────────────────────────────
function CreateGig({ onSubmit, onBack }) {
  const [type, setType] = useState("");
  const [brief, setBrief] = useState("");
  const [turnaround, setTurnaround] = useState("");
  const [step, setStep] = useState(1);
  const [matching, setMatching] = useState(false);

  const handleSubmit = () => {
    setMatching(true);
    setTimeout(() => {
      onSubmit({ type, brief, turnaround: parseInt(turnaround) });
    }, 2500);
  };

  if (matching) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center", gap: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: "3px solid var(--dark-border)", borderTopColor: "var(--mango)",
          animation: "spin 1s linear infinite",
        }} />
        <div>
          <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 24, color: "var(--cream)", margin: "0 0 8px" }}>Finding your designer...</h3>
          <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: 0 }}>Matching based on skill, rating & availability</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-dim)", fontFamily: "Syne", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to dashboard
      </button>

      <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--cream)", margin: "0 0 8px" }}>Submit a Gig</h2>
      <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: "0 0 32px" }}>Tell us what you need, we'll handle the rest.</p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: s <= step ? "var(--mango)" : "var(--dark-border)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "var(--cream)", margin: "0 0 16px" }}>What do you need?</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {GIG_TYPES.map(g => (
              <button key={g} onClick={() => { setType(g); setStep(2); }} style={{
                padding: "14px 12px", borderRadius: "var(--radius)",
                background: type === g ? "var(--mango)22" : "var(--dark-card)",
                border: type === g ? "1px solid var(--mango)44" : "1px solid var(--dark-border)",
                color: type === g ? "var(--mango)" : "var(--text)",
                fontFamily: "DM Sans", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
              }}>{g}</button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "var(--cream)", margin: "0 0 16px" }}>Describe your brief</h3>
          <Input
            label="Project Brief"
            value={brief}
            onChange={setBrief}
            textarea
            placeholder="E.g. I need a modern logo for my coffee shop called 'Bean There'. Earth tones, minimalist vibe..."
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
            <Button size="sm" onClick={() => setStep(3)} disabled={!brief.trim()}>Continue →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "var(--cream)", margin: "0 0 16px" }}>Pick your turnaround</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(PRICING).map(([hrs, { label, emoji, price, tag }]) => (
              <button key={hrs} onClick={() => setTurnaround(hrs)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: "var(--radius)",
                background: turnaround === hrs ? "var(--mango)15" : "var(--dark-card)",
                border: turnaround === hrs ? "2px solid var(--mango)" : "1px solid var(--dark-border)",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: "var(--cream)" }}>{label}</div>
                    <Badge small color={hrs === "4" ? "var(--danger)" : hrs === "12" ? "var(--warning)" : "var(--success)"}>{tag}</Badge>
                  </div>
                </div>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--papaya)" }}>R{price}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!turnaround}>
              Submit Gig — R{PRICING[turnaround]?.price || "0"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DESIGNER REGISTRATION ──────────────────────────────────────────────────
function DesignerRegister({ onRegister, onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState("");

  const toggleSkill = (s) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--cream)", marginBottom: 8 }}>
            <span style={{ color: "var(--mango)" }}>last</span>minute<span style={{ color: "var(--mango)" }}>.</span>design
          </div>
          <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--cream)", margin: "0 0 4px" }}>Join as a Designer</h2>
          <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: 0 }}>Earn money doing what you love, on your own schedule.</p>
        </div>

        <Card>
          <Input label="Full Name" value={name} onChange={setName} placeholder="Thando Mokoena" />
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="thando@email.com" />
          <Input label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
          <Input label="Portfolio URL" value={portfolio} onChange={setPortfolio} placeholder="https://behance.net/yourname" />
          <Input label="Short Bio" value={bio} onChange={setBio} textarea placeholder="Tell clients what makes your work stand out..." />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontFamily: "Syne", fontWeight: 600, fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Skills (select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GIG_TYPES.filter(g => g !== "Other").map(s => (
                <button key={s} onClick={() => toggleSkill(s)} style={{
                  padding: "6px 14px", borderRadius: 100, fontSize: 12,
                  fontFamily: "DM Sans", fontWeight: 500,
                  background: skills.includes(s) ? "var(--mango)22" : "var(--dark)",
                  color: skills.includes(s) ? "var(--mango)" : "var(--text-dim)",
                  border: skills.includes(s) ? "1px solid var(--mango)44" : "1px solid var(--dark-border)",
                  cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <Button style={{ width: "100%", marginTop: 8 }} onClick={() => {
            if (name && email && skills.length) onRegister({ name, email, city, bio, skills, portfolio });
          }} disabled={!name || !email || !skills.length}>
            Apply Now →
          </Button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => onNavigate("designer-login")} style={{ background: "none", border: "none", color: "var(--mango)", fontFamily: "DM Sans", fontSize: 13, cursor: "pointer" }}>
              Already registered? Sign in →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── DESIGNER DASHBOARD ─────────────────────────────────────────────────────
function DesignerDashboard({ designer, gigs, onAccept, onDeliver }) {
  const [tab, setTab] = useState("available");
  const available = gigs.filter(g => g.status === "pending");
  const myGigs = gigs.filter(g => g.designerId === designer.id && g.status !== "pending");
  const myActive = myGigs.filter(g => g.status === "in_progress");
  const myDone = myGigs.filter(g => g.status === "completed" || g.status === "delivered");
  const earnings = myDone.reduce((s, g) => s + (g.price || 0) * 0.75, 0);

  return (
    <div>
      {/* Designer profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
        <Avatar initials={designer.avatar} size={64} online={designer.online} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 24, color: "var(--cream)", margin: 0 }}>{designer.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <StarRating rating={designer.rating} size={16} />
            <span style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--text-dim)" }}>{designer.rating} ({designer.reviews} reviews)</span>
          </div>
        </div>
        <Badge color="var(--success)">{designer.online ? "Online" : "Offline"}</Badge>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, marginBottom: 32 }}>
        <Card style={{ padding: 16 }}>
          <Stat label="Completed" value={designer.completedGigs} />
        </Card>
        <Card style={{ padding: 16 }}>
          <Stat label="Rating" value={designer.rating + "★"} />
        </Card>
        <Card style={{ padding: 16 }}>
          <Stat label="Active" value={myActive.length} />
        </Card>
        <Card style={{ padding: 16 }}>
          <Stat label="Earned" value={`R${Math.round(earnings)}`} sub="(75% split)" />
        </Card>
      </div>

      {/* Skills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {designer.skills.map(s => <Badge key={s} small>{s}</Badge>)}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "available", label: `Available Gigs (${available.length})` },
          { key: "active", label: `My Active (${myActive.length})` },
          { key: "done", label: `Completed (${myDone.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontFamily: "Syne", fontWeight: 700, fontSize: 12,
            padding: "8px 16px", borderRadius: 100,
            background: tab === t.key ? "var(--mango)22" : "transparent",
            color: tab === t.key ? "var(--mango)" : "var(--text-dim)",
            border: tab === t.key ? "1px solid var(--mango)33" : "1px solid transparent",
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Gig lists */}
      {tab === "available" && (
        available.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--cream)" }}>No gigs right now</div>
            <div style={{ fontFamily: "DM Sans", color: "var(--text-dim)", fontSize: 13, marginTop: 4 }}>Hang tight, new gigs drop constantly.</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {available.map(gig => (
              <GigCard key={gig.id} gig={gig} onAccept={onAccept} />
            ))}
          </div>
        )
      )}

      {tab === "active" && (
        myActive.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--cream)" }}>No active gigs</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {myActive.map(gig => (
              <GigCard key={gig.id} gig={gig} onDeliver={onDeliver} />
            ))}
          </div>
        )
      )}

      {tab === "done" && (
        myDone.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--cream)" }}>Nothing delivered yet</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {myDone.map(gig => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── RATING MODAL ───────────────────────────────────────────────────────────
function RatingModal({ gig, onSubmit, onClose }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const designer = MOCK_DESIGNERS.find(d => d.id === gig.designerId);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <Card style={{ maxWidth: 420, width: "100%", padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar initials={designer?.avatar || "?"} size={56} />
          <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "var(--cream)", margin: "12px 0 4px" }}>Rate {designer?.name}</h3>
          <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: 0, fontSize: 13 }}>{gig.type} — {PRICING[gig.turnaround]?.label}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} style={{
              background: "none", border: "none", fontSize: 32, cursor: "pointer",
              color: s <= rating ? "var(--mango)" : "#333",
              transition: "transform 0.15s",
              transform: s <= rating ? "scale(1.1)" : "scale(1)",
            }}>★</button>
          ))}
        </div>

        <Input label="Feedback (optional)" value={feedback} onChange={setFeedback} textarea placeholder="How was the experience?" />

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={() => onSubmit(rating, feedback)} style={{ flex: 1 }}>Submit Rating</Button>
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [gigs, setGigs] = useState([]);
  const [toast, setToast] = useState(null);
  const [ratingGigId, setRatingGigId] = useState(null);
  const [currentDesigner, setCurrentDesigner] = useState(MOCK_DESIGNERS[0]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [designerEmail, setDesignerEmail] = useState("");

  const showToast = (msg) => setToast(msg);

  const handleCreateGig = (data) => {
    const matchedDesigner = MOCK_DESIGNERS.find(d => d.online && d.skills.includes(data.type)) || MOCK_DESIGNERS[0];
    const now = Date.now();
    const newGig = {
      id: genId(),
      ...data,
      price: PRICING[data.turnaround].price,
      status: "in_progress",
      designerId: matchedDesigner.id,
      created: now,
      deadline: now + data.turnaround * 3600000,
      rated: false,
      customerRating: null,
    };
    setGigs(prev => [newGig, ...prev]);
    showToast(`Matched with ${matchedDesigner.name}!`);
    setPage("customer-dash");

    // Send emails: gig created + designer matched
    sendEmail("gig_created", {
      customerEmail: customerEmail,
      customerName: customerName,
      gigType: data.type,
      turnaround: data.turnaround,
      price: PRICING[data.turnaround].price,
      brief: data.brief,
    });
    sendEmail("designer_matched", {
      customerEmail: customerEmail,
      customerName: customerName,
      designerName: matchedDesigner.name,
      gigType: data.type,
      turnaround: data.turnaround,
      price: PRICING[data.turnaround].price,
    });
  };

  const handleAcceptGig = (gigId) => {
    const gig = gigs.find(g => g.id === gigId);
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: "in_progress", designerId: currentDesigner.id, created: Date.now(), deadline: Date.now() + g.turnaround * 3600000 } : g
    ));
    showToast("Gig accepted! Timer started.");

    // Send email to designer
    if (gig) {
      sendEmail("gig_accepted", {
        designerEmail: designerEmail,
        designerName: currentDesigner.name,
        gigType: gig.type,
        turnaround: gig.turnaround,
        price: gig.price,
        brief: gig.brief,
      });
    }
  };

  const handleDeliverGig = (gigId) => {
    const gig = gigs.find(g => g.id === gigId);
    const designer = gig ? MOCK_DESIGNERS.find(d => d.id === gig.designerId) : null;
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: "delivered" } : g
    ));
    showToast("Delivered! Waiting for client review.");

    // Send email to customer
    if (gig) {
      sendEmail("gig_delivered", {
        customerEmail: customerEmail,
        customerName: customerName,
        designerName: designer?.name || currentDesigner.name,
        gigType: gig.type,
      });
    }
  };

  const handleRate = (rating, feedback) => {
    const gig = gigs.find(g => g.id === ratingGigId);
    const designer = gig ? MOCK_DESIGNERS.find(d => d.id === gig.designerId) : null;
    setGigs(prev => prev.map(g =>
      g.id === ratingGigId ? { ...g, status: "completed", rated: true, customerRating: rating } : g
    ));
    setRatingGigId(null);
    showToast("Thanks for rating!");

    // Send rating email to designer
    if (gig && designer) {
      sendEmail("gig_rated", {
        designerEmail: designerEmail,
        designerName: designer.name,
        gigType: gig.type,
        rating,
        feedback,
      });
    }
  };

  // Seed some demo gigs
  useEffect(() => {
    if (gigs.length === 0) {
      const now = Date.now();
      setGigs([
        { id: "demo1", type: "Logo Design", brief: "Modern minimal logo for a fintech startup called PayFast", turnaround: 12, price: 550, status: "pending", designerId: null, created: now - 1200000, deadline: now + 12 * 3600000, rated: false, customerRating: null },
        { id: "demo2", type: "Social Media Post", brief: "Instagram carousel for a restaurant grand opening", turnaround: 4, price: 350, status: "pending", designerId: null, created: now - 600000, deadline: now + 4 * 3600000, rated: false, customerRating: null },
      ]);
    }
  }, []);

  const ratingGig = gigs.find(g => g.id === ratingGigId);

  // Dashboard shell
  const DashShell = ({ children, role }) => (
    <div style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 24px",
        background: "rgba(13,13,13,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--dark-border)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: "var(--cream)", cursor: "pointer" }} onClick={() => setPage("landing")}>
          <span style={{ color: "var(--mango)" }}>last</span>minute<span style={{ color: "var(--mango)" }}>.</span>design
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge small color={role === "designer" ? "var(--success)" : "var(--papaya)"}>{role}</Badge>
          <button onClick={() => setPage("landing")} style={{ background: "none", border: "none", color: "var(--text-dim)", fontFamily: "DM Sans", fontSize: 13, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{
      ...cssVars,
      fontFamily: "DM Sans, sans-serif",
      color: "var(--text)",
      background: "var(--dark)",
      minHeight: "100vh",
    }}>
      <style>{fonts}{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0D0D0D; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::selection { background: var(--mango); color: var(--dark); }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {ratingGig && <RatingModal gig={ratingGig} onSubmit={handleRate} onClose={() => setRatingGigId(null)} />}

      {page === "landing" && <LandingPage onNavigate={setPage} />}

      {page === "designer-register" && (
        <DesignerRegister
          onRegister={(data) => {
            showToast("Application submitted! Welcome aboard.");
            setCurrentDesigner({ ...MOCK_DESIGNERS[0], name: data.name, skills: data.skills, city: data.city, bio: data.bio });
            setDesignerEmail(data.email);
            setPage("designer-dash");
            sendEmail("designer_welcome", {
              designerEmail: data.email,
              designerName: data.name,
            });
          }}
          onNavigate={setPage}
        />
      )}

      {page === "customer-login" && (
        <div style={{ minHeight: "100vh", background: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--cream)", marginBottom: 8 }}>
                <span style={{ color: "var(--mango)" }}>last</span>minute<span style={{ color: "var(--mango)" }}>.</span>designs
              </div>
              <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--cream)", margin: "0 0 4px" }}>Welcome back</h2>
              <p style={{ fontFamily: "DM Sans", color: "var(--text-dim)", margin: 0 }}>Enter your details to continue</p>
            </div>
            <Card>
              <Input label="Your Name" value={customerName} onChange={setCustomerName} placeholder="John Smith" />
              <Input label="Email" value={customerEmail} onChange={setCustomerEmail} type="email" placeholder="john@email.com" />
              <Button style={{ width: "100%", marginTop: 8 }} onClick={() => {
                if (customerName && customerEmail) setPage("customer-dash");
              }} disabled={!customerName || !customerEmail}>
                Continue →
              </Button>
            </Card>
          </div>
        </div>
      )}

      {page === "customer-dash" && (
        <DashShell role="customer">
          <CustomerDashboard
            gigs={gigs}
            onCreateGig={() => setPage("create-gig")}
            onNavigate={setPage}
            onRate={(id) => setRatingGigId(id)}
          />
        </DashShell>
      )}

      {page === "create-gig" && (
        <DashShell role="customer">
          <CreateGig
            onSubmit={handleCreateGig}
            onBack={() => setPage("customer-dash")}
          />
        </DashShell>
      )}

      {page === "designer-login" && (
        <div style={{ minHeight: "100vh", background: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--cream)", marginBottom: 8 }}>
                <span style={{ color: "var(--mango)" }}>last</span>minute<span style={{ color: "var(--mango)" }}>.</span>designs
              </div>
              <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--cream)", margin: "0 0 4px" }}>Designer Sign In</h2>
            </div>
            <Card>
              <Input label="Email" value={designerEmail} onChange={setDesignerEmail} type="email" placeholder="your@email.com" />
              <Button style={{ width: "100%", marginTop: 8 }} onClick={() => {
                if (designerEmail) setPage("designer-dash");
              }} disabled={!designerEmail}>
                Sign In →
              </Button>
            </Card>
          </div>
        </div>
      )}

      {page === "designer-dash" && (
        <DashShell role="designer">
          <DesignerDashboard
            designer={currentDesigner}
            gigs={gigs}
            onAccept={handleAcceptGig}
            onDeliver={handleDeliverGig}
          />
        </DashShell>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

const API = "http://127.0.0.1:8000/api";

function getToken() { return localStorage.getItem("seobot_token"); }
function saveToken(t) { localStorage.setItem("seobot_token", t); }
function clearToken() { localStorage.removeItem("seobot_token"); localStorage.removeItem("seobot_project"); }
function getProject() { return localStorage.getItem("seobot_project"); }
function saveProject(id) { localStorage.setItem("seobot_project", String(id)); }

async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(API + path, { ...opts, headers });
    if (res.status === 401) { clearToken(); window.location.reload(); }
    return res;
}

// ── Icons (inline SVG) ──────────────────────────────────────────
const Icon = {
    dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    audit: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
    keywords: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>,
    articles: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    plan: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    links: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    tools: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
    bot: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" /><line x1="16" y1="16" x2="16" y2="16" strokeWidth="2" strokeLinecap="round" /></svg>,
    logout: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    arrow: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
    check: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
    x: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    spark: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" /></svg>,
    trend: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    user: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    admin: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    settings: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

// ── Global styles injected once ─────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fdfcfd; color: #0d0d12; -webkit-font-smoothing: antialiased; }
  input, select, textarea, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d8d6e3; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #b8b4cc; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  @keyframes ringFill { from { stroke-dashoffset: 251; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0px); } }
  .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .skeleton { background: linear-gradient(90deg, #ede9f4 25%, #f5f3fa 50%, #ede9f4 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  .nav-item:hover { background: #f0eeff !important; color: #2962ff !important; transform: translateX(2px); }
  .nav-item:hover svg { color: #2962ff; }
  .card-hover { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5) !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important; border-radius: 16px !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
  .card-hover:hover { border-color: rgba(91, 71, 224, 0.15) !important; box-shadow: 0 12px 32px rgba(91, 71, 224, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1) !important; transform: translateY(-2px); }
  .btn-primary { background: #2962ff; color: #fff; border: none; border-radius: 12px; padding: 11px 22px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(91, 71, 224, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(91, 71, 224, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  .btn-primary:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(91, 71, 224, 0.2); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; background: #c4bff0; }
  .btn-ghost { background: #fff; color: #4a4868; border: 1px solid #e2e0ec; border-radius: 12px; padding: 10px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
  .btn-ghost:hover { background: #f9f8fe; border-color: #c4bff0; color: #2962ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(91, 71, 224, 0.05); }
  .input-field { width: 100%; background: #fdfcfd; border: 1px solid #e2e0ec; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #0d0d12; outline: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.01); }
  .input-field:focus { background: #fff; border-color: #2962ff; box-shadow: 0 0 0 4px rgba(91, 71, 224, 0.08), inset 0 1px 2px rgba(0,0,0,0.01); }
  .input-field::placeholder { color: #b8b4cc; }
  select.input-field { cursor: pointer; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 11.5px; font-weight: 600; color: #9896aa; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1.5px solid #eeedf5; }
  td { padding: 12px 16px; font-size: 13.5px; color: #2d2b3d; border-bottom: 1px solid #f2f0f8; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #faf9fd; }
  .ring-animate { animation: ringFill 1s ease forwards; }
`;

// ── Primitives ──────────────────────────────────────────────────
function Spin({ size = 16 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" opacity="0.4" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 45" /></svg>;
}

function Card({ children, style = {}, className = "" }) {
    return <div className={`card-hover ${className}`} style={{ padding: 26, ...style }}>{children}</div>;
}

function Badge({ type = "blue", children }) {
    const map = {
        green: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
        yellow: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
        red: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
        blue: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
        purple: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
        gray: { bg: "#f9f9fb", color: "#6b7280", border: "#e5e7eb" },
    };
    const c = map[type] || map.blue;
    return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 99, padding: "3px 10px", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}

function ScoreRing({ score = 0, size = 72, label }) {
    const r = (size / 2) - 7;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
    const bg = pct >= 70 ? "#f0fdf4" : pct >= 40 ? "#fffbeb" : "#fef2f2";
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill={bg} stroke="#f0eef8" strokeWidth="5.5" />
                    <circle className="ring-animate" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5.5"
                        strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <span style={{ fontSize: size > 60 ? 18 : 13, fontWeight: 800, color, lineHeight: 1 }}>{pct}</span>
                </div>
            </div>
            {label && <span style={{ fontSize: 11, color: "#9896aa", fontWeight: 500 }}>{label}</span>}
        </div>
    );
}

function DiffBar({ value = 0 }) {
    const color = value < 35 ? "#16a34a" : value < 65 ? "#d97706" : "#dc2626";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 5, background: "#f0eef8", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 26 }}>{value}</span>
        </div>
    );
}

function Empty({ icon, title, desc, action }) {
    return (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: 56, height: 56, background: "#f0eeff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2d2b3d", marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#9896aa", marginBottom: 20 }}>{desc}</div>
            {action}
        </div>
    );
}

function Alert({ type = "info", msg }) {
    const map = { info: ["#eff6ff", "#2563eb", "#bfdbfe"], success: ["#f0fdf4", "#16a34a", "#bbf7d0"], warning: ["#fffbeb", "#d97706", "#fde68a"], error: ["#fef2f2", "#dc2626", "#fecaca"] };
    const [bg, text, border] = map[type];
    return <div style={{ background: bg, color: text, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 15px", fontSize: 13, marginBottom: 14, fontWeight: 500 }}>{msg}</div>;
}

// ── Sidebar ─────────────────────────────────────────────────────
const NAV = [
    { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
    { id: "audit", label: "SEO Audit", icon: Icon.audit },
    { id: "keywords", label: "Keywords", icon: Icon.keywords },
    { id: "articles", label: "Articles", icon: Icon.articles },
    { id: "plan", label: "Content Plan", icon: Icon.plan },
    { id: "links", label: "Internal Links", icon: Icon.links },
    { id: "tools", label: "SEO Tools", icon: Icon.tools },
];

function Sidebar({ page, setPage, onLogout, projects, projectId, setProjectId, user }) {
    const visibleNav = [...NAV];
    if (user?.is_superuser) {
        visibleNav.push({ id: "admin", label: "Admin Panel", icon: Icon.admin });
    }

    return (
        <div style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1.5px solid #eeedf5", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
            {/* Logo */}
            <div style={{ padding: "22px 20px 18px", borderBottom: "1.5px solid #eeedf5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 34, height: 34, background: "#2962ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Icon.bot}</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3 }}>SEO<span style={{ color: "#2962ff" }}>bot</span></div>
                        <div style={{ fontSize: 10, color: "#b8b4cc", fontWeight: 500, marginTop: -1 }}>AI SEO Agent</div>
                    </div>
                </div>
            </div>

            {/* Project picker */}
            {projects.length > 0 && (
                <div style={{ padding: "14px 16px", borderBottom: "1.5px solid #eeedf5" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#b8b4cc", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Project</div>
                    <select className="input-field" style={{ padding: "7px 10px", fontSize: 12, fontWeight: 500 }} value={projectId || ""} onChange={e => { setProjectId(e.target.value); saveProject(e.target.value); }}>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.domain}</option>)}
                    </select>
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
                {visibleNav.map(n => (
                    <button key={n.id} className="nav-item" onClick={() => setPage(n.id)}
                        style={{ width: "100%", textAlign: "left", background: page === n.id ? "#f0eeff" : "transparent", color: page === n.id ? "#2962ff" : "#6b6888", border: "none", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontSize: 13.5, fontWeight: page === n.id ? 600 : 500, display: "flex", alignItems: "center", gap: 10, marginBottom: 1, transition: "all 0.15s" }}>
                        <span style={{ color: page === n.id ? "#2962ff" : "#b8b4cc", transition: "color 0.15s" }}>{n.icon}</span>
                        {n.label}
                        {page === n.id && <div style={{ width: 4, height: 4, background: "#2962ff", borderRadius: "50%", marginLeft: "auto" }} />}
                    </button>
                ))}
            </nav>

            {/* Agent status */}
            <div style={{ padding: "14px 16px", borderTop: "1.5px solid #eeedf5" }}>
                {page !== "admin" && (
                    <button className="nav-item" onClick={() => setPage("profile")} style={{ width: "100%", textAlign: "left", background: page === "profile" ? "#f0eeff" : "transparent", color: page === "profile" ? "#2962ff" : "#6b6888", border: "none", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontSize: 13.5, fontWeight: page === "profile" ? 600 : 500, display: "flex", alignItems: "center", gap: 10, marginBottom: 10, transition: "all 0.15s" }}>
                        <span style={{ color: page === "profile" ? "#2962ff" : "#b8b4cc" }}>{Icon.user}</span>
                        My Profile
                    </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f3ff", borderRadius: 9, padding: "9px 12px", marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 2s infinite", flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#2962ff" }}>Agent active</div>
                        <div style={{ fontSize: 10, color: "#9896aa" }}>Ready to analyze</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Auth Page ───────────────────────────────────────────────────
function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        setLoading(true); setErr("");
        const endpoint = isLogin ? "/auth/login/" : "/auth/register/";
        try {
            const res = await fetch(API + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const d = await res.json();
            if (isLogin) {
                if (d.success && d.tokens && d.tokens.access) { saveToken(d.tokens.access); onLogin(); }
                else setErr(d.error || d.detail || "Invalid credentials");
            } else {
                if (res.ok) { setIsLogin(true); setErr("Registration successful! Please log in."); }
                else setErr(d.error || d.detail || JSON.stringify(d));
            }
        } catch { setErr("Cannot connect to server. Is Django running?"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0eeff 0%, #f5f4f8 50%, #eff6ff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="fade-up" style={{ width: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ width: 56, height: 56, background: "#2962ff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#fff", fontSize: 28 }}>{Icon.bot}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.5 }}>SEO<span style={{ color: "#2962ff" }}>bot</span></div>
                    <div style={{ fontSize: 14, color: "#9896aa", marginTop: 4 }}>Your autonomous SEO agent</div>
                </div>
                <Card style={{ padding: 32 }}>
                    
                    <div style={{ display: "flex", marginBottom: 20, background: "#f0eef8", borderRadius: 10, padding: 4 }}>
                        <button onClick={() => { setIsLogin(true); setErr(""); }} style={{ flex: 1, padding: "8px 0", border: "none", background: isLogin ? "#fff" : "transparent", color: isLogin ? "#2962ff" : "#6b6888", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: isLogin ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>Log In</button>
                        <button onClick={() => { setIsLogin(false); setErr(""); }} style={{ flex: 1, padding: "8px 0", border: "none", background: !isLogin ? "#fff" : "transparent", color: !isLogin ? "#2962ff" : "#6b6888", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: !isLogin ? "0 2px 8px rgba(0,0,0,0.05)" : "none" }}>Register</button>
                    </div>

                    {err && <Alert type={err.includes("successful") ? "success" : "error"} msg={err} />}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#4a4868", display: "block", marginBottom: 6 }}>Username</label>
                        <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter your username" onKeyDown={e => e.key === "Enter" && submit()} />
                    </div>
                    {!isLogin && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#4a4868", display: "block", marginBottom: 6 }}>Email</label>
                            <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" onKeyDown={e => e.key === "Enter" && submit()} />
                        </div>
                    )}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#4a4868", display: "block", marginBottom: 6 }}>Password</label>
                        <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} />
                    </div>
                    <button className="btn-primary" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                        {loading ? <><Spin /> {isLogin ? "Signing in..." : "Creating account..."}</> : <>{isLogin ? "Sign in" : "Create Account"} {Icon.arrow}</>}
                    </button>
                </Card>
            </div>
        </div>
    );
}

// ── Dashboard ───────────────────────────────────────────────────
function Dashboard({ projectId, setPage }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        Promise.all([
            api("/data/").then(r => r.json()).catch(() => []),
            api("/generator/articles/").then(r => r.json()).catch(() => []),
        ]).then(([projs, arts]) => {
            const projects = Array.isArray(projs) ? projs : projs.results || [];
            const articles = Array.isArray(arts) ? arts : arts.results || [];
            setData({ projects, articles });
        });
    }, []);

    const stats = [
        { label: "Projects", value: data?.projects?.length ?? "—", color: "#2962ff", bg: "#f5f3ff", icon: "📁" },
        { label: "Articles", value: data?.articles?.length ?? "—", color: "#16a34a", bg: "#f0fdf4", icon: "📝" },
        { label: "Keywords", value: "—", color: "#d97706", bg: "#fffbeb", icon: "🔑" },
        { label: "Audits", value: "—", color: "#2563eb", bg: "#eff6ff", icon: "🔍" },
    ];

    const actions = [
        { id: "audit", icon: "🔍", label: "Run SEO Audit", desc: "Analyze a URL for issues", color: "#eff6ff", border: "#bfdbfe" },
        { id: "keywords", icon: "🔑", label: "Research Keywords", desc: "Find content opportunities", color: "#f5f3ff", border: "#ddd6fe" },
        { id: "articles", icon: "✍️", label: "Generate Article", desc: "AI-powered long-form content", color: "#f0fdf4", border: "#bbf7d0" },
        { id: "plan", icon: "📅", label: "Build Content Plan", desc: "12-month editorial calendar", color: "#fffbeb", border: "#fde68a" },
    ];

    return (
        <div className="fade-up">
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3 }}>Good morning 👋</h1>
                <p style={{ fontSize: 14, color: "#9896aa", marginTop: 4 }}>Here's what's happening with your SEO today</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {stats.map(s => (
                    <Card key={s.label} style={{ padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9896aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{!data ? <div className="skeleton" style={{ width: 40, height: 32 }} /> : s.value}</div>
                            </div>
                            <div style={{ width: 38, height: 38, background: s.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 11.5, color: "#16a34a", fontWeight: 500 }}>
                            {Icon.trend} <span>—</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
                {/* Recent projects */}
                <Card>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d12", marginBottom: 16 }}>Recent Projects</div>
                    {!data ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)
                    ) : data.projects.length === 0 ? (
                        <Empty icon="📁" title="No projects yet" desc="Create your first project to get started" />
                    ) : data.projects.slice(0, 5).map(p => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f2f0f8" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, background: "#f0eeff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌐</div>
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2d2b3d" }}>{p.name || p.domain}</div>
                                    <div style={{ fontSize: 11.5, color: "#b8b4cc" }}>{p.domain}</div>
                                </div>
                            </div>
                            <Badge type="green">Active</Badge>
                        </div>
                    ))}
                </Card>

                {/* Quick actions */}
                <Card>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d12", marginBottom: 16 }}>Quick Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {actions.map(a => (
                            <div key={a.label} onClick={() => setPage(a.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: a.color, border: `1px solid ${a.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
                                <span style={{ fontSize: 18 }}>{a.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2d2b3d" }}>{a.label}</div>
                                    <div style={{ fontSize: 11.5, color: "#9896aa" }}>{a.desc}</div>
                                </div>
                                <span style={{ color: "#c4bff0" }}>{Icon.arrow}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ── SEO Audit ───────────────────────────────────────────────────
function Audit({ projectId }) {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState("");

    const run = async () => {
        if (!url) return;
        setLoading(true); setErr(""); setResult(null);
        try {
            const res = await api("/analyze/", { method: "POST", body: JSON.stringify({ url, project_id: projectId }) });
            const d = await res.json();
            if (!res.ok) setErr(d.error || d.detail || JSON.stringify(d));
            else setResult(d.data || d);
        } catch (e) { setErr(e.message); }
        setLoading(false);
    };

    const rawTechChecks = result?.technical_seo || result?.seo_checks || {};
    const techChecks = Object.entries(rawTechChecks).map(([key, value]) => {
        let status = null;

        if (typeof value === "boolean") {
            status = value;
        } else if (value && typeof value === "object") {
            if ("exists" in value) status = value.exists;
            else if ("https" in value) status = value.https;
            else if ("is_noindex" in value) status = !value.is_noindex;
            else if ("blocks_all_crawlers" in value) status = !value.blocks_all_crawlers;
        }

        return { key, value, status };
    });

    const issues = (result?.issues || []).map((issue) =>
        typeof issue === "string"
            ? { severity: "warning", message: issue }
            : issue
    );

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>SEO Audit</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>Deep technical analysis with PageSpeed, Core Web Vitals & readability</p>

            <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                    <input className="input-field" style={{ flex: 1, fontSize: 15 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourwebsite.com" onKeyDown={e => e.key === "Enter" && run()} />
                    <button className="btn-primary" onClick={run} disabled={loading} style={{ padding: "10px 24px", whiteSpace: "nowrap" }}>
                        {loading ? <><Spin /> Analyzing...</> : <>{Icon.audit} Analyze</>}
                    </button>
                </div>
            </Card>

            {err && <Alert type="error" msg={err} />}

            {result && (
                <div>
                    {/* Score row */}
                    <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                        <ScoreRing score={result.seo_score || result.score || 0} size={80} label="SEO Score" />
                        {result.performance_score && <ScoreRing score={result.performance_score} size={62} label="Performance" />}
                        {result.accessibility_score && <ScoreRing score={result.accessibility_score} size={62} label="Accessibility" />}
                        <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 17, fontWeight: 700, color: "#0d0d12", marginBottom: 4 }}>{result.url || url}</div>
                            <div style={{ fontSize: 13, color: "#9896aa" }}>Analysis complete · {new Date().toLocaleDateString()}</div>
                            {result.title && <div style={{ fontSize: 12.5, color: "#2962ff", marginTop: 6, fontWeight: 500 }}>{result.title}</div>}
                        </div>
                    </Card>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        {/* Technical checks */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 14 }}>Technical Checks</div>
                            {techChecks.length === 0 ? (
                                <div style={{ fontSize: 13, color: "#b8b4cc" }}>No technical data returned</div>
                            ) : techChecks.slice(0, 12).map((item) => (
                                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f3ff", fontSize: 13 }}>
                                    <span style={{ color: "#4a4868", textTransform: "capitalize" }}>{item.key.replace(/_/g, " ")}</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: item.status === true ? "#16a34a" : item.status === false ? "#dc2626" : "#d97706", fontWeight: 600 }}>
                                        {item.status === true ? Icon.check : item.status === false ? Icon.x : "—"}
                                    </span>
                                </div>
                            ))}
                        </Card>

                        {/* Page info + metrics */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {result.title && (
                                <Card style={{ padding: 18 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0d12", marginBottom: 10 }}>Page Info</div>
                                    {[["Title", result.title], ["Description", result.meta_description], ["H1", Array.isArray(result.h1_tags) ? result.h1_tags[0] : result.h1_tags]].map(([l, v]) => v && (
                                        <div key={l} style={{ marginBottom: 8 }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: "#b8b4cc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{l}</div>
                                            <div style={{ fontSize: 12.5, color: "#4a4868", lineHeight: 1.5 }}>{String(v).slice(0, 80)}</div>
                                        </div>
                                    ))}
                                </Card>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {result.readability && (
                                    <Card style={{ padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#b8b4cc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Readability</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{result.readability.score || "—"}</div>
                                        <div style={{ fontSize: 11.5, color: "#9896aa", marginTop: 2 }}>{result.readability.label || ""}</div>
                                    </Card>
                                )}
                                {result.keyword_density && (
                                    <Card style={{ padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#b8b4cc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Keyword Density</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "#2962ff" }}>
                                            {result.keyword_density.density || `${result.keyword_density.percentage || 0}%`}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: "#9896aa", marginTop: 2 }}>{result.keyword_density.recommendation || ""}</div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Issues */}
                    {issues.length > 0 && (
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 14 }}>Issues Found <Badge type="red">{issues.length}</Badge></div>
                            {issues.map((issue, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f5f3ff" }}>
                                    <Badge type={issue.severity === "critical" ? "red" : issue.severity === "warning" ? "yellow" : "blue"}>{issue.severity || "info"}</Badge>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2d2b3d" }}>{issue.message || issue.title}</div>
                                        {issue.recommendation && <div style={{ fontSize: 12, color: "#9896aa", marginTop: 3 }}>{issue.recommendation}</div>}
                                    </div>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>
            )}

            {!result && !loading && (
                <Card>
                    <Empty icon="🔍" title="Enter a URL to analyze" desc="We'll check technical SEO, performance, readability, keyword density and more" />
                </Card>
            )}
        </div>
    );
}

// ── Keywords ────────────────────────────────────────────────────
function Keywords({ projectId }) {
    const [kw, setKw] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const search = async () => {
        if (!kw || !projectId) return;
        setLoading(true); setErr(""); setResults(null);
        try {
            const res = await api("/audit/keyword-research/", { method: "POST", body: JSON.stringify({ keyword: kw, project_id: projectId }) });
            const d = await res.json();
            if (!res.ok) setErr(d.detail || JSON.stringify(d));
            else setResults(d);
        } catch (e) { setErr(e.message); }
        setLoading(false);
    };

    const intents = ["Informational", "Commercial", "Transactional", "Navigational"];

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>Keyword Research</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>Discover high-value keywords with volume, difficulty and intent data</p>

            {!projectId && <Alert type="warning" msg="Select a project first to research keywords" />}

            <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                    <input className="input-field" style={{ flex: 1, fontSize: 15 }} value={kw} onChange={e => setKw(e.target.value)} placeholder="Enter a keyword (e.g. best SEO tools 2026)" onKeyDown={e => e.key === "Enter" && search()} />
                    <button className="btn-primary" onClick={search} disabled={loading || !projectId} style={{ whiteSpace: "nowrap" }}>
                        {loading ? <><Spin /> Searching...</> : <>{Icon.spark} Research</>}
                    </button>
                </div>
            </Card>

            {err && <Alert type="error" msg={err} />}

            {results ? (
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12" }}>Results for "<span style={{ color: "#2962ff" }}>{results.keyword || kw}</span>"</div>
                        {results.related_keywords?.length && <Badge type="purple">{results.related_keywords.length} keywords</Badge>}
                    </div>
                    {results.related_keywords?.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th>Volume</th>
                                    <th style={{ width: 160 }}>Difficulty</th>
                                    <th>CPC</th>
                                    <th>Intent</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.related_keywords.map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{r.keyword}</td>
                                        <td><span style={{ color: "#2962ff", fontWeight: 600 }}>{r.volume?.toLocaleString() || "—"}</span></td>
                                        <td><DiffBar value={r.difficulty || 0} /></td>
                                        <td><span style={{ color: "#d97706", fontWeight: 600 }}>${r.cpc || "—"}</span></td>
                                        <td><Badge type={i % 4 === 0 ? "blue" : i % 4 === 1 ? "purple" : i % 4 === 2 ? "green" : "yellow"}>{intents[i % 4]}</Badge></td>
                                        <td><button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11.5 }}>Save</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <pre style={{ fontSize: 12, color: "#9896aa", fontFamily: "'JetBrains Mono', monospace", background: "#f9f9fb", borderRadius: 8, padding: 14, overflow: "auto" }}>
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    )}
                </Card>
            ) : !loading && (
                <Card>
                    <Empty icon="🔑" title="Research a keyword" desc="Enter any keyword above to see volume, difficulty, CPC and search intent" />
                </Card>
            )}
        </div>
    );
}

// ── Articles ─────────────────────────────────────────────────────
function Articles({ projectId }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [form, setForm] = useState({ title: "", keyword: "", tone: "professional", word_count: 2000, slug: "" });
    const [preview, setPreview] = useState(null);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");

    const load = () => {
        api("/generator/articles/").then(r => r.json()).then(d => {
            setList(Array.isArray(d) ? d : d.results || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const generate = async () => {
        if (!form.title || !projectId) return;
        setGenerating(true); setErr(""); setSuccess("");
        try {
            const res = await api("/generator/articles/generate/", { method: "POST", body: JSON.stringify({ ...form, slug: form.slug || slug(form.title), project_id: parseInt(projectId) }) });
            const d = await res.json();
            if (!res.ok) setErr(JSON.stringify(d));
            else { setSuccess("Article generated!"); load(); setForm({ title: "", keyword: "", tone: "professional", word_count: 2000, slug: "" }); }
        } catch (e) { setErr(e.message); }
        setGenerating(false);
    };

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>Articles</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>Generate long-form SEO articles up to 4000 words with AI</p>

            {!projectId && <Alert type="warning" msg="Select a project to generate articles" />}

            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, marginBottom: 20 }}>
                {/* Form */}
                <Card>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        {Icon.spark} New Article
                    </div>
                    {err && <Alert type="error" msg={err} />}
                    {success && <Alert type="success" msg={success} />}

                    {[{ label: "Title *", key: "title", placeholder: "Best SEO Tools for 2026" }, { label: "Target Keyword", key: "keyword", placeholder: "best seo tools 2026" }, { label: "Slug", key: "slug", placeholder: "auto-generated" }].map(f => (
                        <div key={f.key} style={{ marginBottom: 13 }}>
                            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#6b6888", display: "block", marginBottom: 5 }}>{f.label}</label>
                            <input className="input-field" value={form[f.key]} placeholder={f.placeholder}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value, ...(f.key === "title" ? { slug: slug(e.target.value) } : {}) })} />
                        </div>
                    ))}

                    <div style={{ marginBottom: 13 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#6b6888", display: "block", marginBottom: 7 }}>Tone</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {["professional", "casual", "authoritative", "conversational"].map(t => (
                                <button key={t} onClick={() => setForm({ ...form, tone: t })}
                                    style={{ background: form.tone === t ? "#2962ff" : "#f5f3ff", color: form.tone === t ? "#fff" : "#7c3aed", border: `1.5px solid ${form.tone === t ? "#2962ff" : "#ddd6fe"}`, borderRadius: 99, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#6b6888", display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span>Word Count</span><span style={{ color: "#2962ff", fontWeight: 700 }}>{form.word_count.toLocaleString()} words</span>
                        </label>
                        <input type="range" min="500" max="4000" step="500" value={form.word_count} onChange={e => setForm({ ...form, word_count: parseInt(e.target.value) })}
                            style={{ width: "100%", accentColor: "#2962ff" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#b8b4cc", marginTop: 3 }}>
                            <span>500</span><span>4000</span>
                        </div>
                    </div>

                    <button className="btn-primary" onClick={generate} disabled={generating || !projectId} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                        {generating ? <><Spin /> Generating article...</> : <>{Icon.spark} Generate Article</>}
                    </button>
                </Card>

                {/* Preview */}
                <Card>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 14 }}>Preview</div>
                    {preview ? (
                        <div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                                <Badge type="blue">{preview.word_count || "—"} words</Badge>
                                {preview.focus_keyword && <Badge type="purple">{preview.focus_keyword}</Badge>}
                                <Badge type={preview.status === "published" ? "green" : "yellow"}>{preview.status || "draft"}</Badge>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#0d0d12", marginBottom: 12 }}>{preview.title}</div>
                            <div style={{ fontSize: 13.5, color: "#4a4868", lineHeight: 1.75, maxHeight: 340, overflow: "auto" }}
                                dangerouslySetInnerHTML={{ __html: (preview.content || preview.body || "No content available").slice(0, 800) + "..." }} />
                        </div>
                    ) : (
                        <Empty icon="📄" title="No article selected" desc="Click Preview on any article below, or generate a new one" />
                    )}
                </Card>
            </div>

            {/* Table */}
            <Card>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 14 }}>All Articles {list.length > 0 && <Badge type="gray">{list.length}</Badge>}</div>
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)
                ) : list.length === 0 ? (
                    <Empty icon="✍️" title="No articles yet" desc="Generate your first article using the form above" />
                ) : (
                    <table>
                        <thead><tr><th>Title</th><th>Keyword</th><th>Words</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {list.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: "#0d0d12", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</td>
                                    <td style={{ color: "#2962ff", fontWeight: 500 }}>{a.focus_keyword || a.keyword || "—"}</td>
                                    <td>{a.word_count?.toLocaleString() || "—"}</td>
                                    <td><Badge type={a.status === "published" ? "green" : a.status === "draft" ? "yellow" : "blue"}>{a.status || "draft"}</Badge></td>
                                    <td><button className="btn-ghost" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setPreview(a)}>Preview</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}

// ── Content Plan ────────────────────────────────────────────────
function ContentPlan({ projectId }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const colors = ["#2962ff", "#7c3aed", "#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#db2777", "#7c3aed", "#2962ff", "#2563eb", "#0891b2"];

    const generate = async () => {
        if (!projectId) return;
        setLoading(true); setErr(""); setPlan(null);
        try {
            const res = await api("/generator/content-plans/", { method: "POST", body: JSON.stringify({ project_id: parseInt(projectId) }) });
            const d = await res.json();
            if (!res.ok) setErr(JSON.stringify(d));
            else setPlan(d);
        } catch (e) { setErr(e.message); }
        setLoading(false);
    };

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>Content Plan</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>AI-generated 12-month editorial calendar based on your keywords</p>

            {!projectId && <Alert type="warning" msg="Select a project first" />}

            <Card style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12" }}>12-Month Content Calendar</div>
                    <div style={{ fontSize: 13, color: "#9896aa", marginTop: 3 }}>AI analyzes your keywords and competitors to build a strategic plan</div>
                </div>
                <button className="btn-primary" onClick={generate} disabled={loading || !projectId}>
                    {loading ? <><Spin /> Building plan...</> : <>{Icon.spark} Generate Plan</>}
                </button>
            </Card>

            {err && <Alert type="error" msg={err} />}

            {plan ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {(plan.months || plan.plan || []).slice(0, 12).map((m, i) => (
                        <Card key={i} style={{ padding: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: colors[i] }}>{MONTHS[i]}</div>
                                <Badge type="purple">{(m.articles || m.topics || []).length} articles</Badge>
                            </div>
                            {(m.articles || m.topics || []).map((a, j) => (
                                <div key={j} style={{ fontSize: 12.5, color: "#4a4868", padding: "5px 0", borderBottom: j < (m.articles || m.topics || []).length - 1 ? "1px dashed #f0eef8" : "none", lineHeight: 1.4 }}>
                                    <span style={{ color: colors[i], marginRight: 6, fontSize: 10 }}>●</span>
                                    {a.title || a}
                                    {a.keyword && <div style={{ fontSize: 11, color: "#b8b4cc", marginTop: 1, paddingLeft: 14 }}>{a.keyword}</div>}
                                </div>
                            ))}
                        </Card>
                    ))}
                </div>
            ) : !loading && (
                <Card>
                    <Empty icon="📅" title="No content plan yet" desc="Click Generate Plan to create your 12-month editorial calendar" action={<button className="btn-primary" onClick={generate} disabled={!projectId}>Generate Plan</button>} />
                </Card>
            )}
        </div>
    );
}

// ── Internal Links ──────────────────────────────────────────────
function InternalLinks({ projectId }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const analyze = async () => {
        if (!projectId) return;
        setLoading(true); setErr(""); setResults(null);
        try {
            const res = await api("/generator/internal-links/", { method: "POST", body: JSON.stringify({ project_id: parseInt(projectId) }) });
            const d = await res.json();
            if (!res.ok) setErr(JSON.stringify(d));
            else setResults(d);
        } catch (e) { setErr(e.message); }
        setLoading(false);
    };

    const suggestions = results?.suggestions || results?.internal_links || [];

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>Internal Links</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>AI scans all articles and suggests optimal internal linking opportunities</p>

            {!projectId && <Alert type="warning" msg="Select a project first" />}

            <Card style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12" }}>Auto-detect linking opportunities</div>
                    <div style={{ fontSize: 13, color: "#9896aa", marginTop: 3 }}>Scans all articles for keyword overlaps and anchor text opportunities</div>
                </div>
                <button className="btn-primary" onClick={analyze} disabled={loading || !projectId}>
                    {loading ? <><Spin /> Scanning...</> : <>{Icon.links} Analyze Links</>}
                </button>
            </Card>

            {err && <Alert type="error" msg={err} />}

            {results ? (
                <Card>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 14 }}>
                        Linking Suggestions {suggestions.length > 0 && <Badge type="purple">{suggestions.length} found</Badge>}
                    </div>
                    {suggestions.length === 0 ? (
                        <Empty icon="🔗" title="No suggestions found" desc="You may need more articles first. Generate at least 3-5 articles." />
                    ) : suggestions.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px 0", borderBottom: "1px solid #f5f3ff" }}>
                            <div style={{ flex: 1, background: "#f9f8fe", borderRadius: 9, padding: "9px 13px" }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#2d2b3d" }}>{s.source_article || s.from || "Article"}</div>
                            </div>
                            <div style={{ color: "#2962ff", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
                                {Icon.arrow}
                            </div>
                            <div style={{ flex: 1, background: "#f0eeff", borderRadius: 9, padding: "9px 13px", border: "1px solid #ddd6fe" }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#2962ff" }}>{s.target_article || s.to || "Target"}</div>
                            </div>
                            {s.anchor_text && (
                                <div style={{ background: "#f5f4f8", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#6b6888", flexShrink: 0 }}>
                                    "{s.anchor_text}"
                                </div>
                            )}
                        </div>
                    ))}
                </Card>
            ) : !loading && (
                <Card>
                    <Empty icon="🔗" title="Discover linking opportunities" desc="Click Analyze Links to scan your articles for internal linking suggestions" />
                </Card>
            )}
        </div>
    );
}

// ── SEO Tools ───────────────────────────────────────────────────
function Tools() {
    const TOOLS = [
        { id: "kd", label: "Keyword Difficulty", icon: "📊", endpoint: "/generator/keyword-difficulty/", field: "keyword", placeholder: "Enter a keyword..." },
        { id: "faq", label: "FAQ Schema", icon: "❓", endpoint: "/generator/faq-schema/", field: "topic", placeholder: "Enter a topic..." },
        { id: "article", label: "Article Schema", icon: "📄", endpoint: "/generator/article-schema/", field: "url", placeholder: "https://example.com/article" },
        { id: "qa", label: "Q&A Schema", icon: "💬", endpoint: "/generator/qa-schema/", field: "topic", placeholder: "Enter a topic..." },
    ];
    const [active, setActive] = useState("kd");
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const tool = TOOLS.find(t => t.id === active);

    const run = async () => {
        if (!input) return;
        setLoading(true); setErr(""); setResult(null);
        try {
            const res = await api(tool.endpoint, { method: "POST", body: JSON.stringify({ [tool.field]: input }) });
            const d = await res.json();
            if (!res.ok) setErr(JSON.stringify(d));
            else setResult(d);
        } catch (e) { setErr(e.message); }
        setLoading(false);
    };

    const renderResult = () => {
        if (!result) return null;
        if (active === "faq" && result.faqs) return (
            <div>
                {result.faqs.map((f, i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #f5f3ff" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2d2b3d", marginBottom: 5 }}>Q: {f.question}</div>
                        <div style={{ fontSize: 13, color: "#6b6888", lineHeight: 1.6 }}>A: {f.answer}</div>
                    </div>
                ))}
            </div>
        );
        if (active === "kd" && result.difficulty !== undefined) return (
            <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "#f5f3ff", borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#2962ff" }}>{result.difficulty}</div>
                        <div style={{ fontSize: 11.5, color: "#9896aa", marginTop: 3 }}>Difficulty</div>
                    </div>
                    {result.volume && <div style={{ background: "#eff6ff", borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>{result.volume?.toLocaleString()}</div>
                        <div style={{ fontSize: 11.5, color: "#9896aa", marginTop: 3 }}>Monthly Volume</div>
                    </div>}
                    {result.cpc && <div style={{ background: "#fffbeb", borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>${result.cpc}</div>
                        <div style={{ fontSize: 11.5, color: "#9896aa", marginTop: 3 }}>CPC</div>
                    </div>}
                </div>
                {result.recommendation && <Alert type="info" msg={result.recommendation} />}
            </div>
        );
        return (
            <pre style={{ fontSize: 12, color: "#4a4868", fontFamily: "'JetBrains Mono', monospace", background: "#f9f9fb", borderRadius: 10, padding: 16, overflow: "auto", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(result, null, 2)}
            </pre>
        );
    };

    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>SEO Tools</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>Free interactive SEO tools to power your workflow</p>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}>
                {/* Tool picker */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {TOOLS.map(t => (
                        <button key={t.id} onClick={() => { setActive(t.id); setResult(null); setInput(""); }}
                            style={{ background: active === t.id ? "#f0eeff" : "#fff", color: active === t.id ? "#2962ff" : "#4a4868", border: active === t.id ? "1.5px solid #ddd6fe" : "1.5px solid #eeedf5", borderRadius: 11, padding: "13px 16px", cursor: "pointer", fontSize: 13.5, fontWeight: active === t.id ? 700 : 500, display: "flex", alignItems: "center", gap: 10, textAlign: "left", transition: "all 0.15s" }}>
                            <span style={{ fontSize: 18 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tool panel */}
                <Card>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d12", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{tool.icon}</span> {tool.label}
                    </div>
                    {err && <Alert type="error" msg={err} />}
                    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                        <input className="input-field" style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)} placeholder={tool.placeholder} onKeyDown={e => e.key === "Enter" && run()} />
                        <button className="btn-primary" onClick={run} disabled={loading} style={{ whiteSpace: "nowrap" }}>
                            {loading ? <><Spin /> Running...</> : "Run Tool"}
                        </button>
                    </div>
                    {result ? renderResult() : !loading && (
                        <Empty icon={tool.icon} title={`Use ${tool.label}`} desc={`Enter ${tool.field === "url" ? "a URL" : "a topic or keyword"} above and click Run Tool`} />
                    )}
                </Card>
            </div>
        </div>
    );
}

// ── User Profile ────────────────────────────────────────────────
function UserProfile({ user, onLogout }) {
    if (!user) return <div className="fade-up" style={{ padding: 40 }}><Spin /> Loading profile...</div>;
    return (
        <div className="fade-up">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>My Profile</h1>
            <p style={{ fontSize: 14, color: "#9896aa", marginBottom: 24 }}>Manage your account settings and preferences</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Card>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d12", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>{Icon.user} Personal Information</div>
                        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                            <div style={{ width: 64, height: 64, background: "#2962ff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 800 }}>
                                {user.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "#0d0d12", marginBottom: 4 }}>{user.username}</div>
                                <div style={{ fontSize: 13, color: "#9896aa" }}>{user.email || "No email provided"}</div>
                                <div style={{ marginTop: 8 }}><Badge type={user.is_superuser ? "purple" : "blue"}>{user.is_superuser ? "Administrator" : "User"}</Badge></div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn-primary">Edit Profile</button>
                            <button className="btn-ghost" onClick={onLogout}>Sign Out</button>
                        </div>
                    </Card>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Card>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0d0d12", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>{Icon.settings} Account Settings</div>
                        <div style={{ fontSize: 13, color: "#6b6888", marginBottom: 16, lineHeight: 1.5 }}>Update your notification preferences and API features.</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f2f0f8" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#4a4868" }}>Email Notifications</span>
                            <Badge type="green">Enabled</Badge>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f2f0f8" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#4a4868" }}>Dark Mode</span>
                            <Badge type="gray">Disabled</Badge>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ── Admin Panel ─────────────────────────────────────────────────
function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        Promise.all([
            api("/auth/admin/stats/").then(r => r.json()).catch(() => ({})),
            api("/auth/admin/users/").then(r => r.json()).catch(() => [])
        ]).then(([s, u]) => {
            setStats(s); setUsers(u.results || u || []); setLoading(false);
        }).catch(e => { setErr(e.message); setLoading(false); });
    }, []);

    if (loading) return <div className="fade-up" style={{ padding: 40 }}><Spin /> Loading admin dashboard...</div>;

    const cards = [
        { label: "Total Users", value: stats?.total_users || 0, color: "#2962ff", bg: "#f5f3ff", icon: "👥" },
        { label: "Active Subscriptions", value: stats?.active_subs || 0, color: "#16a34a", bg: "#f0fdf4", icon: "💎" },
        { label: "Total Projects", value: stats?.total_projects || 0, color: "#d97706", bg: "#fffbeb", icon: "📁" },
        { label: "API Requests", value: stats?.api_requests || 0, color: "#2563eb", bg: "#eff6ff", icon: "⚡" },
    ];

    return (
        <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0d0d12", letterSpacing: -0.3, marginBottom: 4 }}>Admin Panel</h1>
                    <p style={{ fontSize: 14, color: "#9896aa" }}>Platform overview and user management</p>
                </div>
                <Badge type="purple">Admin Access</Badge>
            </div>

            {err && <Alert type="error" msg={err} />}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {cards.map(s => (
                    <Card key={s.label} style={{ padding: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9896aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{(s.value || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ width: 34, height: 34, background: s.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d12", marginBottom: 16 }}>Recent Users</div>
                {users.length === 0 ? (
                    <Empty icon="👥" title="No users found" desc="There are no users registered on the platform yet." />
                ) : (
                    <table>
                        <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th></tr></thead>
                        <tbody>
                            {users.slice(0, 10).map(u => (
                                <tr key={u.id || u.username}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 28, height: 28, background: "#f0eeff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#2962ff" }}>{u.username[0].toUpperCase()}</div>
                                            <span style={{ fontWeight: 600, color: "#2d2b3d" }}>{u.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: "#6b6888", fontSize: 12.5 }}>{u.email || "—"}</td>
                                    <td><Badge type={u.is_superuser ? "purple" : "gray"}>{u.is_superuser ? "Admin" : "User"}</Badge></td>
                                    <td style={{ color: "#9896aa", fontSize: 12.5 }}>{new Date(u.date_joined || Date.now()).toLocaleDateString()}</td>
                                    <td><Badge type={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Inactive"}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}

// ── App root ─────────────────────────────────────────────────────
export default function App() {
    const [authed, setAuthed] = useState(!!getToken());
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("dashboard");
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState(getProject() || "");

    useEffect(() => {
        if (!authed) return;
        
        api("/data/").then(r => r.json()).then(d => {
            const list = Array.isArray(d) ? d : d.results || [];
            setProjects(list);
            if (!projectId && list.length > 0) { setProjectId(String(list[0].id)); saveProject(String(list[0].id)); }
        }).catch(() => { });

        api("/auth/profile/").then(r => r.json()).then(d => {
            if (d.user) setUser(d.user);
            else if (d.username) setUser(d);
        }).catch(() => {});
    }, [authed]);

    if (!authed) return (
        <>
            <style>{GLOBAL_CSS}</style>
            <AuthPage onLogin={() => setAuthed(true)} />
        </>
    );

    const handleLogout = () => { clearToken(); setAuthed(false); setUser(null); };

    const pages = {
        dashboard: <Dashboard projectId={projectId} setPage={setPage} />,
        audit: <Audit projectId={projectId} />,
        keywords: <Keywords projectId={projectId} />,
        articles: <Articles projectId={projectId} />,
        plan: <ContentPlan projectId={projectId} />,
        links: <InternalLinks projectId={projectId} />,
        tools: <Tools />,
        profile: <UserProfile user={user} onLogout={handleLogout} />,
        admin: <AdminPanel />,
    };

    return (
        <>
            <style>{GLOBAL_CSS}</style>
            <div style={{ display: "flex", minHeight: "100vh", background: "#f5f4f8" }}>
                <Sidebar page={page} setPage={setPage} onLogout={handleLogout} projects={projects} projectId={projectId} setProjectId={setProjectId} user={user} />
                <div style={{ marginLeft: 220, flex: 1, padding: "36px 40px", maxWidth: "calc(100vw - 220px)" }}>
                    {pages[page] || <Dashboard projectId={projectId} setPage={setPage} />}
                </div>
            </div>
        </>
    );
}
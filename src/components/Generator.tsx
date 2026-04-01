"use client";

import { useState, useEffect, useRef } from "react";

interface GeneratorProps {
  onBack: () => void;
}

interface ProposalData {
  theme: {
    palette: { background: string; surface: string; primary: string; accent: string; text: string; textMuted: string };
    fonts: { display: string; body: string };
    aesthetic: string;
    backgroundEffect: string;
  };
  proposal: {
    clientName: string;
    projectTitle: string;
    tagline: string;
    challenge: string;
    approach: string;
    deliverables: { icon: string; title: string; description: string }[];
    pricing: { item: string; detail: string; amount: number }[];
    currency: string;
    timeline: { phase: string; duration: string; tasks: string }[];
    differentiators: { icon: string; title: string; description: string }[];
    ctaText: string;
  };
}

const STATUS_MSGS_ES = [
  "Analizando el brief...",
  "Investigando el mercado...",
  "Definiendo la estetica...",
  "Estructurando entregables...",
  "Calculando inversion...",
  "Armando la propuesta...",
];

const STATUS_MSGS_EN = [
  "Analyzing the brief...",
  "Researching the market...",
  "Defining the aesthetic...",
  "Structuring deliverables...",
  "Calculating investment...",
  "Building the proposal...",
];

function fmtCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Generator({ onBack }: GeneratorProps) {
  const [screen, setScreen] = useState<"input" | "loading" | "proposal">("input");
  const [prompt, setPrompt] = useState("");
  const [agency, setAgency] = useState("WTF Agency");
  const [client, setClient] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [lang, setLang] = useState("es");
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [data, setData] = useState<ProposalData | null>(null);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const proposalRef = useRef<HTMLDivElement>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusRef.current) clearInterval(statusRef.current);
    };
  }, []);

  // IntersectionObserver for proposal sections
  useEffect(() => {
    if (screen !== "proposal" || !proposalRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("g-visible");
            entry.target.querySelectorAll(".g-card-stagger").forEach((c) => c.classList.add("g-visible"));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    proposalRef.current.querySelectorAll(".g-section-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [screen, data]);

  // Load fonts when data changes
  useEffect(() => {
    if (!data) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(data.theme.fonts.display)}:wght@400;600;700;800&family=${encodeURIComponent(data.theme.fonts.body)}:wght@400;500;600&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [data]);

  const startLoader = () => {
    const msgs = lang === "en" ? STATUS_MSGS_EN : STATUS_MSGS_ES;
    let i = 0;
    setStatusMsg(msgs[0]);
    statusRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setStatusMsg(msgs[i]);
    }, 2500);
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setError("Describe el proyecto");
      return;
    }
    setError("");
    setScreen("loading");
    startLoader();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agency, client, currency, lang }),
      });

      if (statusRef.current) clearInterval(statusRef.current);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error: ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setScreen("proposal");
    } catch (err: unknown) {
      if (statusRef.current) clearInterval(statusRef.current);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setScreen("input");
    }
  };

  const handlePrint = () => {
    if (!proposalRef.current || !data) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const t = data.theme;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.fonts.display)}:wght@400;600;700;800&family=${encodeURIComponent(t.fonts.body)}:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#fff;color:#111;font-family:'${t.fonts.body}',sans-serif;line-height:1.6;padding:2rem}
        .g-hero{text-align:center;padding:3rem 1rem;margin-bottom:2rem}
        .g-hero-client{font-size:.9rem;text-transform:uppercase;letter-spacing:.15em;color:${t.palette.primary};margin-bottom:.5rem}
        .g-hero-title{font-size:2.5rem;font-weight:800;letter-spacing:-.03em;margin-bottom:1rem;font-family:'${t.fonts.display}',sans-serif;color:#111}
        .g-hero-tagline{color:#666;font-size:1.1rem}
        .g-section{padding:2rem 0;max-width:800px;margin:0 auto}
        .g-section-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.15em;color:${t.palette.primary};margin-bottom:.5rem}
        .g-section-heading{font-size:1.6rem;font-weight:700;margin-bottom:1rem;font-family:'${t.fonts.display}',sans-serif}
        .g-section-text{color:#444;font-size:.95rem;line-height:1.8}
        .g-divider{width:50px;height:3px;background:${t.palette.primary};margin-bottom:1.5rem}
        .g-cards-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-top:1rem}
        .g-card{border:1px solid #ddd;border-radius:8px;padding:1rem}
        .g-card-icon{font-size:1.5rem;margin-bottom:.5rem}
        .g-card-title{font-weight:600;margin-bottom:.3rem}
        .g-card-desc{color:#666;font-size:.85rem}
        .g-pricing-table{width:100%;border-collapse:collapse;margin-top:1rem}
        .g-pricing-table th{text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#888;padding:.5rem;border-bottom:2px solid #ddd}
        .g-pricing-table td{padding:.6rem .5rem;border-bottom:1px solid #eee;font-size:.9rem}
        .g-pricing-table td:last-child{text-align:right}
        .g-pricing-total{background:${t.palette.primary};color:#fff;border-radius:8px;padding:1rem 1.5rem;margin-top:1rem;display:flex;justify-content:space-between;align-items:center}
        .g-pricing-total-label{font-weight:600;text-transform:uppercase}
        .g-pricing-total-amount{font-size:1.5rem;font-weight:800}
        .g-timeline-item{margin-bottom:1.5rem;padding-left:1.5rem;border-left:3px solid ${t.palette.primary}}
        .g-timeline-phase{font-weight:600}
        .g-timeline-duration{font-size:.85rem;color:${t.palette.primary}}
        .g-timeline-tasks{color:#666;font-size:.9rem}
        .g-diff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem}
        .g-diff-item{text-align:center;padding:1rem}
        .g-diff-icon{font-size:1.8rem;margin-bottom:.5rem}
        .g-diff-title{font-weight:600;margin-bottom:.3rem}
        .g-diff-desc{color:#666;font-size:.85rem}
      </style></head><body>`);
    w.document.write(proposalRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  // ── INPUT SCREEN ──
  if (screen === "input") {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm mb-8 cursor-pointer">&larr; Volver al panel</button>
        <h2 className="text-2xl font-bold text-white mb-1">Proposal Generator</h2>
        <p className="text-white/50 mb-8">Genera propuestas comerciales con IA</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">Descripcion del proyecto</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Campana de rebranding para una bodega de vinos premium en Mendoza..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-accent min-h-[100px] resize-y"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">Agencia</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">Cliente</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dolar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="BRL">BRL - Real</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">Idioma</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-colors cursor-pointer mt-2"
          >
            Generar Propuesta
          </button>

          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
              <button onClick={generate} className="block mt-2 text-red-300 underline cursor-pointer">Reintentar</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──
  if (screen === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 border-[3px] border-white/10 border-t-accent rounded-full animate-spin mb-8" />
        <p className="text-white/50 text-lg">{statusMsg}</p>
      </div>
    );
  }

  // ── PROPOSAL SCREEN ──
  if (!data) return null;
  const t = data.theme;
  const p = data.proposal;
  const total = p.pricing.reduce((sum, item) => sum + (item.amount || 0), 0);
  const curr = p.currency || "ARS";
  const isEs = lang === "es";

  const labels = isEs
    ? { challenge: "El Desafio", approach: "Nuestra Propuesta", deliverables: "Alcance & Entregables", investment: "Inversion", timeline: "Cronograma", whyUs: "Por Que Nosotros", letsChat: "Hablemos", item: "Item", detail: "Detalle", amount: "Monto", total: "Inversion Total" }
    : { challenge: "The Challenge", approach: "Our Approach", deliverables: "Scope & Deliverables", investment: "Investment", timeline: "Timeline", whyUs: "Why Us", letsChat: "Let's Talk", item: "Item", detail: "Detail", amount: "Amount", total: "Total Investment" };

  // Generate hero bg elements
  const renderHeroBg = () => {
    const effect = t.backgroundEffect || "gradient-mesh";
    if (effect === "particles") {
      return (
        <div className="absolute inset-0" style={{ background: t.palette.background }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: t.palette.primary,
                left: `${Math.random() * 100}%`,
                opacity: 0.4,
                animation: `g-floatP ${8 + Math.random() * 12}s linear ${Math.random() * 10}s infinite`,
              }}
            />
          ))}
        </div>
      );
    }
    if (effect === "geometric") {
      return (
        <div className="absolute inset-0" style={{ background: t.palette.background }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: `${40 + Math.random() * 100}px`,
                height: `${40 + Math.random() * 100}px`,
                border: `2px solid ${i % 2 === 0 ? t.palette.primary : t.palette.accent}`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                opacity: 0.12,
                animation: `g-geoFloat ${12 + Math.random() * 10}s ease-in-out ${Math.random() * -10}s infinite`,
              }}
            />
          ))}
        </div>
      );
    }
    // gradient-mesh / noise / default
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: t.palette.background }}>
        <div className="absolute rounded-full" style={{ width: "60vmax", height: "60vmax", background: t.palette.primary, filter: "blur(80px)", opacity: 0.3, top: "-20%", left: "-10%", animation: "g-meshMove 12s ease-in-out -2s infinite alternate" }} />
        <div className="absolute rounded-full" style={{ width: "60vmax", height: "60vmax", background: t.palette.accent, filter: "blur(80px)", opacity: 0.3, bottom: "-20%", right: "-10%", animation: "g-meshMove 12s ease-in-out infinite alternate" }} />
      </div>
    );
  };

  return (
    <div ref={proposalRef}>
      {/* Inject keyframes */}
      <style>{`
        @keyframes g-floatP{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:.5}90%{opacity:.5}100%{transform:translateY(-10vh) scale(1);opacity:0}}
        @keyframes g-geoFloat{0%,100%{transform:rotate(0deg) translate(0,0)}33%{transform:rotate(120deg) translate(30px,-20px)}66%{transform:rotate(240deg) translate(-20px,30px)}}
        @keyframes g-meshMove{0%{transform:translate(0,0) scale(1)}50%{transform:translate(5vw,-5vh) scale(1.1)}100%{transform:translate(-3vw,3vh) scale(.95)}}
        @keyframes g-fadeUp{to{opacity:1;transform:translateY(0)}}
        .g-section-reveal{opacity:0;transform:translateY(40px);transition:opacity .7s ease,transform .7s ease}
        .g-section-reveal.g-visible{opacity:1;transform:translateY(0)}
        .g-card-stagger{opacity:0;transform:translateY(30px);transition:opacity .5s ease,transform .5s ease}
        .g-card-stagger.g-visible{opacity:1;transform:translateY(0)}
      `}</style>

      {/* Nav */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={() => setScreen("input")} className="text-white/50 hover:text-white text-sm cursor-pointer">&larr; Nueva propuesta</button>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/15 cursor-pointer">Panel</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/15 cursor-pointer">Descargar PDF</button>
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center rounded-2xl overflow-hidden mb-8" style={{ fontFamily: `'${t.fonts.body}', sans-serif` }}>
        {renderHeroBg()}
        <div className="relative z-10 max-w-3xl px-6 py-16">
          <div className="text-sm uppercase tracking-[.15em] mb-4" style={{ color: t.palette.accent, opacity: 0, transform: "translateY(20px)", animation: "g-fadeUp .8s .3s forwards" }}>{p.clientName}</div>
          <h1 className="font-extrabold leading-[1.05] mb-6" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", letterSpacing: "-.03em", fontFamily: `'${t.fonts.display}', sans-serif`, color: t.palette.text, opacity: 0, transform: "translateY(30px)", animation: "g-fadeUp .8s .5s forwards" }}>{p.projectTitle}</h1>
          <p className="text-lg" style={{ color: t.palette.textMuted, opacity: 0, transform: "translateY(20px)", animation: "g-fadeUp .8s .7s forwards" }}>{p.tagline}</p>
        </div>
      </section>

      {/* SECTIONS */}
      <div style={{ color: t.palette.text }}>
        {/* Challenge */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.challenge}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{isEs ? "Entendiendo la Oportunidad" : "Understanding the Opportunity"}</h2>
          <div className="leading-relaxed" style={{ color: t.palette.textMuted }} dangerouslySetInnerHTML={{ __html: p.challenge }} />
        </section>

        {/* Approach */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.approach}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{isEs ? "Enfoque Estrategico" : "Strategic Approach"}</h2>
          <div className="leading-relaxed" style={{ color: t.palette.textMuted }} dangerouslySetInnerHTML={{ __html: p.approach }} />
        </section>

        {/* Deliverables */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.deliverables}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{isEs ? "Que Vamos a Entregar" : "What We Will Deliver"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {p.deliverables.map((d, i) => (
              <div key={i} className="g-card-stagger rounded-xl p-5 border" style={{ background: t.palette.surface, borderColor: "rgba(255,255,255,0.06)", transitionDelay: `${i * 0.1}s` }}>
                <div className="text-2xl mb-2">{d.icon}</div>
                <div className="font-semibold mb-1">{d.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: t.palette.textMuted }}>{d.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.investment}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{labels.investment}</h2>
          <table className="g-pricing-table w-full mt-4" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="text-left text-xs uppercase tracking-wider pb-3" style={{ color: t.palette.textMuted, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>{labels.item}</th>
                <th className="text-left text-xs uppercase tracking-wider pb-3" style={{ color: t.palette.textMuted, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>{labels.detail}</th>
                <th className="text-right text-xs uppercase tracking-wider pb-3" style={{ color: t.palette.textMuted, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>{labels.amount}</th>
              </tr>
            </thead>
            <tbody>
              {p.pricing.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 pr-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{item.item}</td>
                  <td className="py-3 pr-4 text-sm" style={{ color: t.palette.textMuted, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{item.detail}</td>
                  <td className="py-3 text-right whitespace-nowrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtCurrency(item.amount, curr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rounded-xl p-5 mt-4 flex items-center justify-between" style={{ background: t.palette.primary }}>
            <span className="font-semibold uppercase tracking-wider">{labels.total}</span>
            <span className="text-2xl font-extrabold">{fmtCurrency(total, curr)}</span>
          </div>
        </section>

        {/* Timeline */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.timeline}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{labels.timeline}</h2>
          <div className="mt-4 pl-8 relative">
            <div className="absolute left-[6px] top-2 bottom-2 w-[2px]" style={{ background: "rgba(255,255,255,0.08)" }} />
            {p.timeline.map((phase, i) => (
              <div key={i} className="relative pl-6 mb-8">
                <div className="absolute -left-8 top-[6px] w-[14px] h-[14px] rounded-full border-[3px]" style={{ background: t.palette.surface, borderColor: t.palette.primary }} />
                <div className="font-semibold">{phase.phase}</div>
                <div className="text-sm" style={{ color: t.palette.accent }}>{phase.duration}</div>
                <div className="text-sm mt-1" style={{ color: t.palette.textMuted }}>{phase.tasks}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Us */}
        <section className="g-section-reveal max-w-3xl mx-auto py-12 px-4">
          <div className="text-xs uppercase tracking-[.15em] mb-2" style={{ color: t.palette.accent }}>{labels.whyUs}</div>
          <div className="w-14 h-[3px] rounded mb-6" style={{ background: t.palette.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{isEs ? "Por Que Trabajar Con Nosotros" : "Why Work With Us"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {p.differentiators.map((d, i) => (
              <div key={i} className="text-center py-4">
                <div className="text-3xl mb-3">{d.icon}</div>
                <div className="font-semibold mb-2">{d.title}</div>
                <div className="text-sm" style={{ color: t.palette.textMuted }}>{d.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="g-section-reveal text-center py-20 px-4">
          <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{labels.letsChat}</h2>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: t.palette.textMuted }}>{p.ctaText}</p>
          <a href="mailto:hola@wtf-agency.works" className="inline-block px-10 py-4 rounded-full text-lg font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: t.palette.primary }}>{labels.letsChat} &rarr;</a>
        </section>

        <div className="text-center py-6 text-sm border-t" style={{ color: t.palette.textMuted, borderColor: "rgba(255,255,255,0.06)" }}>
          {agency} &copy; {new Date().getFullYear()} &middot; {isEs ? "Propuesta generada con IA" : "Proposal generated with AI"}
        </div>
      </div>
    </div>
  );
}

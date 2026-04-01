"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

const STATUS_ES = ["Analizando el brief...", "Investigando el mercado...", "Definiendo la estetica...", "Estructurando entregables...", "Calculando inversion...", "Armando la propuesta..."];
const STATUS_EN = ["Analyzing the brief...", "Researching the market...", "Defining the aesthetic...", "Structuring deliverables...", "Calculating investment...", "Building the proposal..."];

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Scroll reveal
  const observeSections = useCallback(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "translateY(0)";
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -60px 0px" });
    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (screen === "proposal") {
      const cleanup = observeSections();
      return cleanup;
    }
  }, [screen, observeSections]);

  useEffect(() => {
    if (!data) return;
    const id = "g-font-link";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(data.theme.fonts.display)}:wght@400;600;700;800;900&family=${encodeURIComponent(data.theme.fonts.body)}:wght@300;400;500;600&display=swap`;
  }, [data]);

  const startLoader = () => {
    const msgs = lang === "en" ? STATUS_EN : STATUS_ES;
    let i = 0;
    setStatusMsg(msgs[0]);
    timerRef.current = setInterval(() => { i = (i + 1) % msgs.length; setStatusMsg(msgs[i]); }, 2500);
  };

  const generate = async () => {
    if (!prompt.trim()) { setError("Describe el proyecto"); return; }
    setError(""); setScreen("loading"); startLoader();
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agency, client, currency, lang }),
      });
      if (timerRef.current) clearInterval(timerRef.current);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Error: ${res.status}`); }
      const json = await res.json();
      setData(json); setScreen("proposal"); window.scrollTo(0, 0);
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current);
      setError(err instanceof Error ? err.message : "Error desconocido"); setScreen("input");
    }
  };

  const addRef = (el: HTMLElement | null) => { if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el); };

  // ── INPUT ──
  if (screen === "input") {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-10 cursor-pointer flex items-center gap-2 transition-colors">
          <span>&larr;</span> Volver al panel
        </button>
        <img src="/assets/logo-wtf.png" alt="WTF Agency" className="h-10 mb-6 opacity-70" />
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Proposal Generator</h2>
        <p className="text-white/40 mb-10 text-sm">Genera propuestas comerciales unicas con inteligencia artificial</p>
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-[.12em] mb-2 font-medium">Descripcion del proyecto</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Campana de rebranding para una bodega de vinos premium en Mendoza. Necesitan nueva identidad visual, website y estrategia de redes sociales."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 min-h-[120px] resize-y transition-colors" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-white/40 uppercase tracking-[.12em] mb-2 font-medium">Agencia</label>
              <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors" />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-white/40 uppercase tracking-[.12em] mb-2 font-medium">Cliente</label>
              <input type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-white/40 uppercase tracking-[.12em] mb-2 font-medium">Moneda</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors">
                <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                <option value="MXN">MXN</option><option value="CLP">CLP</option><option value="COP">COP</option><option value="BRL">BRL</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-white/40 uppercase tracking-[.12em] mb-2 font-medium">Idioma</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors">
                <option value="es">Espanol</option><option value="en">English</option>
              </select>
            </div>
          </div>
          <button onClick={generate}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-base transition-all cursor-pointer mt-3 hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99]">
            Generar Propuesta &rarr;
          </button>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
              <button onClick={generate} className="block mt-2 text-red-300 underline cursor-pointer text-xs">Reintentar</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LOADING ──
  if (screen === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <img src="/assets/logo-wtf.png" alt="WTF Agency" className="h-8 mb-12 opacity-40" />
        <div className="relative w-20 h-20 mb-10">
          <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-transparent border-b-white/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="text-white/40 text-lg tracking-wide">{statusMsg}</p>
      </div>
    );
  }

  // ── PROPOSAL ──
  if (!data) return null;
  const t = data.theme;
  const p = data.proposal;
  const total = p.pricing.reduce((s, i) => s + (i.amount || 0), 0);
  const curr = p.currency || "ARS";
  const es = lang === "es";
  sectionRefs.current = [];

  const sectionStyle: React.CSSProperties = { opacity: 0, transform: "translateY(50px)", transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)" };

  return (
    <div style={{ fontFamily: `'${t.fonts.body}', sans-serif`, color: t.palette.text }}>
      <style>{`
        @keyframes g-mesh{0%{transform:translate(0,0) scale(1)}50%{transform:translate(5vw,-5vh) scale(1.15)}100%{transform:translate(-3vw,3vh) scale(.9)}}
        @keyframes g-float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:.6}90%{opacity:.4}100%{transform:translateY(-10vh) scale(1);opacity:0}}
        @keyframes g-geo{0%,100%{transform:rotate(0deg) translate(0)}33%{transform:rotate(120deg) translate(40px,-30px)}66%{transform:rotate(240deg) translate(-30px,40px)}}
        @keyframes g-hero-in{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes g-line-grow{from{width:0}to{width:60px}}
      `}</style>

      {/* Floating Nav */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-5 py-3 rounded-2xl backdrop-blur-xl"
        style={{ background: `${t.palette.background}cc`, border: `1px solid ${t.palette.text}10` }}>
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: `${t.palette.text}60` }}>{agency}</span>
        <div className="flex gap-2">
          <button onClick={() => { setScreen("input"); sectionRefs.current = []; }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{ background: `${t.palette.text}10`, color: `${t.palette.text}90` }}>
            Nueva
          </button>
          <button onClick={onBack}
            className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{ background: `${t.palette.text}10`, color: `${t.palette.text}90` }}>
            Panel
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative flex items-center justify-center text-center overflow-hidden -mx-6 -mt-8 rounded-b-[2rem]"
        style={{ minHeight: "100vh", background: t.palette.background }}>
        {/* BG Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {(t.backgroundEffect === "particles") ? (
            Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="absolute rounded-full"
                style={{ width: `${2 + Math.random() * 5}px`, height: `${2 + Math.random() * 5}px`, background: i % 3 === 0 ? t.palette.accent : t.palette.primary, left: `${Math.random() * 100}%`, opacity: 0.5, animation: `g-float ${6 + Math.random() * 14}s linear ${Math.random() * 12}s infinite` }} />
            ))
          ) : (t.backgroundEffect === "geometric") ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="absolute"
                style={{ width: `${30 + Math.random() * 150}px`, height: `${30 + Math.random() * 150}px`, border: `1.5px solid ${i % 2 === 0 ? t.palette.primary : t.palette.accent}`, borderRadius: Math.random() > 0.5 ? "50%" : `${Math.random() * 20}px`, top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%`, opacity: 0.08, animation: `g-geo ${10 + Math.random() * 15}s ease-in-out ${Math.random() * -15}s infinite` }} />
            ))
          ) : (
            <>
              <div className="absolute rounded-full" style={{ width: "70vmax", height: "70vmax", background: `radial-gradient(circle, ${t.palette.primary}80, transparent 70%)`, top: "-30%", left: "-15%", animation: "g-mesh 14s ease-in-out -3s infinite alternate" }} />
              <div className="absolute rounded-full" style={{ width: "60vmax", height: "60vmax", background: `radial-gradient(circle, ${t.palette.accent}60, transparent 70%)`, bottom: "-25%", right: "-15%", animation: "g-mesh 14s ease-in-out infinite alternate" }} />
              <div className="absolute rounded-full" style={{ width: "40vmax", height: "40vmax", background: `radial-gradient(circle, ${t.palette.primary}30, transparent 70%)`, top: "40%", left: "50%", transform: "translate(-50%,-50%)", animation: "g-mesh 18s ease-in-out -8s infinite alternate" }} />
            </>
          )}
          {/* Noise overlay */}
          <div className="absolute inset-0" style={{ opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        </div>

        <div className="relative z-10 max-w-4xl px-8 py-24">
          <div className="mb-8" style={{ animation: "g-hero-in 1s .1s both" }}>
            <img src="/assets/logo-wtf.png" alt="WTF Agency" className="h-8 mx-auto opacity-50" />
          </div>
          <div className="mb-6" style={{ animation: "g-hero-in 1s .3s both" }}>
            <span className="inline-block px-5 py-2 rounded-full text-[11px] uppercase tracking-[.2em] font-semibold"
              style={{ background: `${t.palette.accent}20`, color: t.palette.accent, border: `1px solid ${t.palette.accent}30` }}>
              {p.clientName}
            </span>
          </div>
          <h1 style={{ fontFamily: `'${t.fonts.display}', sans-serif`, fontSize: "clamp(2.5rem, 8vw, 6rem)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.04em", marginBottom: "1.5rem", animation: "g-hero-in 1s .4s both" }}>
            {p.projectTitle}
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: t.palette.textMuted, animation: "g-hero-in 1s .6s both", lineHeight: 1.6 }}>
            {p.tagline}
          </p>
          <div className="mt-10" style={{ animation: "g-hero-in 1s .8s both" }}>
            <div className="mx-auto" style={{ width: 0, height: "3px", background: t.palette.accent, borderRadius: "2px", animation: "g-line-grow 1s 1.2s forwards" }} />
          </div>
        </div>
      </section>

      {/* ── CHALLENGE ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.surface }}>
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "El Desafio" : "The Challenge"}
          </span>
          <div className="mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em", lineHeight: 1.2 }}>
            {es ? "Entendiendo la Oportunidad" : "Understanding the Opportunity"}
          </h2>
          <div className="text-lg leading-[1.9]" style={{ color: t.palette.textMuted }} dangerouslySetInnerHTML={{ __html: p.challenge }} />
        </div>
      </section>

      {/* ── APPROACH ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.background }}>
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "Nuestra Propuesta" : "Our Approach"}
          </span>
          <div className="mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em", lineHeight: 1.2 }}>
            {es ? "Enfoque Estrategico" : "Strategic Approach"}
          </h2>
          <div className="text-lg leading-[1.9]" style={{ color: t.palette.textMuted }} dangerouslySetInnerHTML={{ __html: p.approach }} />
        </div>
      </section>

      {/* ── DELIVERABLES ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.surface }}>
        <div className="max-w-4xl mx-auto">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "Alcance & Entregables" : "Scope & Deliverables"}
          </span>
          <div className="mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em" }}>
            {es ? "Que Vamos a Entregar" : "What We Will Deliver"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {p.deliverables.map((d, i) => (
              <div key={i} className="group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: `${t.palette.background}`, border: `1px solid ${t.palette.text}08`, backdropFilter: "blur(8px)" }}>
                <div className="text-3xl mb-4">{d.icon}</div>
                <div className="font-bold text-lg mb-2" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{d.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: t.palette.textMuted }}>{d.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.background }}>
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "Inversion" : "Investment"}
          </span>
          <div className="mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-10" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em" }}>
            {es ? "Inversion" : "Investment"}
          </h2>

          <div className="rounded-2xl overflow-hidden" style={{ background: t.palette.surface, border: `1px solid ${t.palette.text}08` }}>
            {p.pricing.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-5" style={{ borderBottom: i < p.pricing.length - 1 ? `1px solid ${t.palette.text}08` : "none" }}>
                <div>
                  <div className="font-semibold">{item.item}</div>
                  <div className="text-xs mt-1" style={{ color: t.palette.textMuted }}>{item.detail}</div>
                </div>
                <div className="font-semibold text-right whitespace-nowrap ml-4" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmt(item.amount, curr)}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6 mt-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.accent})` }}>
            <span className="font-bold text-sm uppercase tracking-[.1em]">{es ? "Inversion Total" : "Total Investment"}</span>
            <span className="text-3xl md:text-4xl font-black" style={{ letterSpacing: "-.02em" }}>{fmt(total, curr)}</span>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.surface }}>
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "Cronograma" : "Timeline"}
          </span>
          <div className="mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em" }}>
            {es ? "Cronograma" : "Timeline"}
          </h2>

          <div className="relative pl-10">
            <div className="absolute left-[15px] top-3 bottom-3 w-[2px]" style={{ background: `${t.palette.primary}30` }} />
            {p.timeline.map((phase, i) => (
              <div key={i} className="relative mb-10 last:mb-0">
                <div className="absolute -left-10 top-1 w-[12px] h-[12px] rounded-full border-[3px]"
                  style={{ background: t.palette.background, borderColor: t.palette.primary, boxShadow: `0 0 12px ${t.palette.primary}40` }} />
                <div className="font-bold text-lg mb-1" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{phase.phase}</div>
                <div className="text-sm font-semibold mb-2" style={{ color: t.palette.accent }}>{phase.duration}</div>
                <div className="text-sm leading-relaxed" style={{ color: t.palette.textMuted }}>{phase.tasks}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section ref={addRef} className="-mx-6 px-6 py-24 md:py-32" style={{ ...sectionStyle, background: t.palette.background }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[11px] uppercase tracking-[.2em] font-semibold" style={{ color: t.palette.accent }}>
            {es ? "Por Que Nosotros" : "Why Us"}
          </span>
          <div className="mx-auto mt-4 mb-8" style={{ width: "40px", height: "3px", background: t.palette.primary, borderRadius: "2px" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-14" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.02em" }}>
            {es ? "Por Que Trabajar Con Nosotros" : "Why Work With Us"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {p.differentiators.map((d, i) => (
              <div key={i} className="px-4 py-6">
                <div className="text-4xl mb-5">{d.icon}</div>
                <div className="font-bold text-lg mb-3" style={{ fontFamily: `'${t.fonts.display}', sans-serif` }}>{d.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: t.palette.textMuted }}>{d.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={addRef} className="-mx-6 px-6 py-28 md:py-36 text-center relative overflow-hidden" style={{ ...sectionStyle, background: t.palette.surface }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full" style={{ width: "50vmax", height: "50vmax", background: `radial-gradient(circle, ${t.palette.primary}15, transparent 70%)`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        </div>
        <div className="relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ fontFamily: `'${t.fonts.display}', sans-serif`, letterSpacing: "-.04em" }}>
            {es ? "Hablemos" : "Let's Talk"}
          </h2>
          <p className="text-lg max-w-lg mx-auto mb-10" style={{ color: t.palette.textMuted }}>{p.ctaText}</p>
          <a href="mailto:hola@wtf-agency.works"
            className="inline-block px-12 py-5 rounded-full text-lg font-bold transition-all hover:scale-105 hover:shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.accent})`, color: "#fff" }}>
            {es ? "Hablemos" : "Let's Talk"} &rarr;
          </a>
        </div>
      </section>

      {/* Footer */}
      <div className="-mx-6 px-6 py-10 text-center" style={{ borderTop: `1px solid ${t.palette.text}08` }}>
        <img src="/assets/logo-wtf.png" alt="WTF Agency" className="h-6 mx-auto mb-3 opacity-30" />
        <span className="text-xs" style={{ color: `${t.palette.text}30` }}>{agency} &copy; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Building2, Check, Users, X } from "lucide-react";
import { useI18n } from "../i18n";
import { CYCLES, CYCLE_MULT, mx } from "../lib/pricing";

const EASE = [0.16, 1, 0.3, 1];

const B2C_FEATURES = [
  "landing.b2cFeat1",
  "landing.b2cFeat2",
  "landing.b2cFeat3",
  "landing.b2cFeat4",
  "landing.b2cFeat5",
];

const B2C_FEATURE_DEFAULTS = [
  "Monitoreo en vivo con IA",
  "Alertas de impacto a contactos",
  "Historial de telemetría",
  "App móvil C.R.A.S.H.",
  "Dispositivo con 46% de margen",
];

const PlansModal = ({ onClose, audience, onAudienceChange, cycle, onCycleChange, plans, deviceB2C, deviceB2B, subB2C, subB2BPerDriver, onAddItems }) => {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const closeRef = useRef(null);
  const [exiting, setExiting] = useState(false);

  const requestClose = () => setExiting(true);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
  };

  const fadeUp = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  };

  const planCard = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } },
  };

  const panelTarget = exiting
    ? { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.15, ease: "easeIn" } }
    : { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 30 } };

  const pillSpring = { type: "spring", stiffness: 420, damping: 34 };

  const planList = plans && plans.length ? plans : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.18 }}
      onAnimationComplete={() => {
        if (exiting) onClose();
      }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-pointer"
        onClick={requestClose}
        aria-hidden
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06),transparent_65%)]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={panelTarget}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plans-modal-title"
        className={`relative w-full ${audience === "b2b" ? "max-w-4xl" : "max-w-2xl"} rounded-[2rem] p-1.5 bg-white/[0.05] ring-1 ring-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.85)]`}
      >
        <div className="hud-frame relative rounded-[1.75rem] bg-[#070707] border border-white/5 overflow-hidden">
          <div className="absolute inset-0 opacity-40 scanlines pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-red-500/[0.06] blur-[120px] pointer-events-none" />

          {/* ── Header ── */}
          <div className="relative px-6 sm:px-8 pt-7 pb-5 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-start justify-between gap-4">
              <motion.div variants={stagger} initial="hidden" animate="show" className="text-left">
                <motion.div
                  variants={fadeUp}
                  className="inline-flex items-center gap-2.5 border border-white/15 rounded-full px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-300 glass-refined"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                  {t("landing.plansModalBadge", "Planes · Precios · MXN")}
                  <span className="tactical-index ml-1">v3.2.1</span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  id="plans-modal-title"
                  className="mt-4 font-bold font-mono text-2xl sm:text-3xl tracking-tight leading-[1.08] text-white"
                >
                  {t("landing.plansModalTitle", "Elige tu nivel de protección")}
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-2 text-zinc-300 text-sm font-mono max-w-md">
                  <span className="text-red-400">//</span> {t("landing.plansModalHint", "Perfil B2C o B2B. Los precios en B2B incluyen dashboard corporativo y telemetría de flotilla.")}
                </motion.p>
              </motion.div>

              <motion.button
                ref={closeRef}
                type="button"
                onClick={requestClose}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="liquid-glass-strong shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={t("landing.plansCloseAria", "Cerrar planes")}
              >
                <X size={17} />
              </motion.button>
            </div>

            {/* ── Audience toggle ── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
              <div className="inline-flex p-1 rounded-full border border-white/15 bg-white/[0.05]">
                {[
                  { a: "b2c", icon: Users, label: t("landing.audienceB2c", "Usuario (B2C)") },
                  { a: "b2b", icon: Building2, label: t("landing.audienceB2b", "Empresa (B2B)") },
                ].map(({ a, icon: Icon, label }) => (
                  <motion.button
                    key={a}
                    type="button"
                    onClick={() => onAudienceChange(a)}
                    whileTap={{ scale: 0.97 }}
                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 font-mono cursor-pointer ${
                      audience === a ? "text-black" : "text-zinc-200 hover:text-white"
                    }`}
                  >
                    {audience === a && (
                      <motion.span
                        layoutId="plans-aud-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.25)]"
                        transition={pillSpring}
                      />
                    )}
                    <Icon size={15} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          </div>

          {/* ── Body ── */}
          <div className="relative px-5 sm:px-8 py-6 max-h-[62dvh] sm:max-h-[68dvh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {audience === "b2c" ? (
                <motion.div
                  key="b2c"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {/* Plan Personal */}
                  <motion.div
                    variants={planCard}
                    initial="hidden"
                    animate="show"
                    whileHover={reduce ? undefined : { y: -4 }}
                    className="hud-frame glass-refined p-6 flex flex-col rounded-3xl relative overflow-hidden"
                    style={{ borderRadius: 22 }}
                  >
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-red-500/10 blur-[70px] pointer-events-none" />
                    <div className="relative">
                      <div className="text-red-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-2">{t("landing.planPersonal", "Plan Personal")}</div>
                      <div className="text-zinc-500 text-xs font-mono mb-4">{t("landing.planPersonalDesc", "Protecci\u00f3n para motociclistas particulares y repartidores independientes.")}</div>
                      <div className="flex items-end gap-2 mb-6">
                        <span className="font-mono font-bold text-4xl tactical-num">{mx(subB2C)}</span>
                        <span className="text-zinc-500 text-sm mb-1.5 font-mono">/ {t(`landing.cycle${cycle}`, cycle).toLowerCase()}</span>
                      </div>
                      <ul className="space-y-3 text-sm mb-6 flex-1">
                        {B2C_FEATURES.map((key, i) => (
                          <li key={key} className="flex items-center gap-2.5 text-zinc-300">
                            <Check size={15} className="text-red-400 shrink-0" /> {t(key, B2C_FEATURE_DEFAULTS[i])}
                          </li>
                        ))}
                      </ul>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          type="button"
                          onClick={() => onAddItems([{ key: "b2c-device", kind: "device", audience: "b2c" }])}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-full transition-all hover:bg-white/5 text-sm font-mono cursor-pointer"
                        >
                          {t("landing.btnDevice", "Dispositivo")} {mx(deviceB2C)}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => onAddItems([{ key: `b2c-sub-${cycle}`, kind: "b2csub", cycle }])}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="bg-white text-black font-bold py-3 rounded-full transition-all hover:bg-zinc-200 text-sm font-mono cursor-pointer"
                        >
                          {t("landing.btnSubscription", "Suscripci\u00f3n")}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Por qué C.R.A.S.H. */}
                  <motion.div
                    variants={planCard}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: 0.08 }}
                    whileHover={reduce ? undefined : { y: -4 }}
                    className="hud-frame glass-refined p-6 flex flex-col justify-center rounded-3xl relative overflow-hidden"
                    style={{ borderRadius: 22 }}
                  >
                    <span className="absolute top-3 left-4 text-white/[0.06] font-mono text-3xl pointer-events-none select-none">+</span>
                    <span className="absolute bottom-3 right-4 text-white/[0.06] font-mono text-3xl pointer-events-none select-none">+</span>
                    <div className="relative">
                      <div className="text-red-400 text-xs font-mono uppercase tracking-[0.2em] mb-3">{t("landing.whyCrash", "\u00bfPor qu\u00e9 C.R.A.S.H.?")}</div>
                      <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                        {t("landing.whyPara", "En 2024 se registraron 61,869 accidentes con motocicleta en M\u00e9xico. M\u00e1s de 386 mil personas usan la moto como herramienta de trabajo.")}
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-zinc-300 font-mono text-xs">{t("landing.priceDeviceB2c", "Dispositivo (B2C)")}</span>
                          <span className="font-mono font-bold text-white">{mx(deviceB2C)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-zinc-300 font-mono text-xs">{t("landing.priceSubMonth", "Suscripción / mes")}</span>
                          <span className="font-mono font-bold text-white">{mx(subB2C)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-mono text-xs">{t("landing.priceProduction", "Costo de producción")}</span>
                          <span className="font-mono font-bold text-red-400">$800 MXN</span>
                        </div>
                      </div>
                      <div className="mt-6 hud-ticker text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-semibold">
                        {t("landing.whyTicker", "Protección · Monitoreo · Alerta")} <span className="tick-blink text-red-400">▌</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="b2b"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  {/* Cycle toggle */}
                  <div className="inline-flex flex-wrap gap-1 border border-white/15 rounded-full p-1 mb-6 bg-white/[0.04]">
                    {CYCLES.map((c) => (
                      <motion.button
                        key={c.key}
                        type="button"
                        onClick={() => onCycleChange(c.label)}
                        whileTap={{ scale: 0.97 }}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all font-mono cursor-pointer ${
                          cycle === c.label ? "bg-white text-black font-bold shadow-md" : "text-zinc-200 hover:text-white"
                        }`}
                      >
                        {t(`landing.${c.key}`, c.label)}
                      </motion.button>
                    ))}
                  </div>


                  {planList.length === 0 ? (
                    <div className="hud-frame glass-refined rounded-3xl p-12 text-center" style={{ borderRadius: 22 }}>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] mx-auto mb-4" />
                      <p className="font-mono text-sm text-zinc-400">{t("landing.plansEmpty", "Cargando cat\u00e1logo de planes B2B\u2026")}</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="grid md:grid-cols-3 gap-4"
                    >
                      {planList.map((p) => (
                        <motion.div
                          key={p.name}
                          variants={planCard}
                          whileHover={reduce ? undefined : { y: -5 }}
                          className={`hud-frame glass-refined p-6 flex flex-col transition-all duration-300 rounded-3xl relative overflow-hidden ${p.popular ? "shimmer-border ring-1 ring-red-500/25 md:scale-[1.02]" : ""}`}
                          style={{ borderRadius: 22 }}
                        >
                          {p.popular && (
                            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-red-500/15 blur-[70px] pointer-events-none" />
                          )}
                          <div className="relative flex-1 flex flex-col">
                            {p.popular && (
                              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 mb-3 bg-red-500/10 px-2.5 py-1 rounded-full self-start">
                                <span className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                                {t("landing.popular", "M\u00e1s popular")}
                              </div>
                            )}
                            <div className="font-bold font-mono text-xl">{p.name}</div>
                            <div className="text-zinc-500 text-xs font-mono mt-1 mb-5">
                              {t("landing.planDrivers", "Hasta {d} repartidores \u00b7 {m} monitores").replace("{d}", p.max_drivers).replace("{m}", p.max_monitors)}
                            </div>
                            <div className="flex items-end gap-2 mb-1">
                              <span className="font-mono font-bold text-3xl tactical-num">{mx(Math.round((p.price || 0) * (CYCLE_MULT[cycle] || 1)))}</span>
                              <span className="text-zinc-500 text-xs mb-1 font-mono">{t(`landing.cycleSlash${cycle}`, `/ ${cycle.toLowerCase()}`)}</span>
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono mb-6">
                              {t("landing.planIncludesSaas", "Incluye SaaS a {amt} por repartidor/mes").replace("{amt}", mx(subB2BPerDriver))}
                            </div>
                            <ul className="space-y-2.5 text-sm mb-6 flex-1">
                              {(p.features && p.features.length ? p.features : ["Monitoreo en tiempo real", "Alertas de impacto", "Historial de telemetr\u00eda", "Soporte"]).map((f, i) => (
                                <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                                  <Check size={14} className="text-red-400 shrink-0" />
                                  {p.features && p.features.length ? f : t(`landing.b2bDefFeat${i}`, f)}
                                </li>
                              ))}
                            </ul>
                            <div className="grid grid-cols-2 gap-2">
                              <motion.button
                                type="button"
                                onClick={() => onAddItems([{ key: "b2b-device", kind: "device", audience: "b2b" }])}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                className="border border-white/15 hover:border-white/40 font-bold py-3 rounded-full transition-all hover:bg-white/5 text-sm font-mono cursor-pointer"
                              >
                                {t("landing.btnDisp", "Disp.")} {mx(deviceB2B)}
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => onAddItems([{ key: `plan-${p.name}-b2b-${cycle}`, kind: "plan", planName: p.name, cycle }])}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                className={`font-bold py-3 rounded-full transition-all text-sm font-mono cursor-pointer ${p.popular ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-red-500/10" : "border border-white/15 hover:border-white/40 hover:bg-white/5"}`}
                              >
                                {t("landing.btnPlan", "Plan")}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <p className="text-[11px] text-zinc-600 mt-6 leading-relaxed font-mono text-left">
                    <span className="text-red-400/80">//</span> {t("landing.plansFooter", "El precio B2B (empresa) es superior al B2C porque suma instalaci\u00f3n, soporte, dashboard corporativo con telemetr\u00eda de flotilla y prevenci\u00f3n de accidentes laborales. Las empresas acceden a un Centro de Control que reduce primas de seguro y responsabilidad civil.")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom bar ── */}
          <div className="relative px-6 sm:px-8 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40">
            <div className="hud-ticker text-neutral-600 text-[10px] uppercase tracking-[0.2em]">
              <span className="glow-dot bg-emerald-400 text-emerald-400 inline-block" /> {t("landing.plansLive", "Cat\u00e1logo en l\u00ednea \u00b7 Actualizado")}
            </div>
            <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">
              {t("landing.plansSku", "FOLIO 66137-17 \u00b7 TEC NUEVO LAREDO")}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default memo(PlansModal);

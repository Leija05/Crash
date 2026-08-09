import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];
const SHADOW_CARD = "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)";

/* ── Panel base unificado (superficie, borde, elevación) ───────────── */
export const Panel = memo(function Panel({ children, className = "", hud = false, interactive = false, as: Tag = "div", ...rest }) {
  return (
    <Tag
      className={`relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-[24px] ${hud ? "hud-frame" : ""} ${
        interactive ? "transition-all duration-250 hover:border-white/15 hover:bg-white/[0.05]" : ""
      } ${className}`}
      style={{ boxShadow: SHADOW_CARD }}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/* ── StatCard: KPI con entrada animada y tono semántico ────────────── */
export const StatCard = memo(function StatCard({ icon: Icon, label, value, hint, tone = "default", delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  const tones = {
    default: { icon: "text-zinc-400", iconBg: "bg-white/[0.06] border-white/10", value: "text-white" },
    red: { icon: "text-red-400", iconBg: "bg-red-500/10 border-red-500/25", value: "text-red-300" },
    emerald: { icon: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/25", value: "text-emerald-300" },
    amber: { icon: "text-amber-400", iconBg: "bg-amber-500/10 border-amber-500/25", value: "text-amber-300" },
  }[tone] || tones.default;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: delay * 0.08, ease: EASE }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5 backdrop-blur-[24px] ${className}`}
      style={{ boxShadow: SHADOW_CARD }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tones.iconBg}`}>
          {Icon ? <Icon size={15} className={tones.icon} /> : null}
        </div>
      </div>
      <div className={`font-mono font-bold text-2xl tabular-nums leading-none ${tones.value}`}>{value}</div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      {hint ? <div className="mt-2 text-[11px] text-zinc-500">{hint}</div> : null}
    </motion.div>
  );
});

/* ── StatusPill: estado semántico compacto ─────────────────────────── */
export const StatusPill = memo(function StatusPill({ tone = "neutral", children, className = "", pulse = false }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.04] text-zinc-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  }[tone] || tones.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em] ${tones} ${className}`}>
      {pulse ? <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> : null}
      {children}
    </span>
  );
});

/* ── SectionHeader: título + opción de descripción, sin eyebrow por defecto ── */
export const SectionHeader = memo(function SectionHeader({ title, description, right, className = "" }) {
  return (
    <div className={`flex items-end justify-between gap-4 flex-wrap ${className}`}>
      <div>
        <h2 className="font-bold font-mono text-lg sm:text-xl tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500 max-w-lg">{description}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
});

/* ── EmptyState: estado vacío compuesto ────────────────────────────── */
export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {Icon ? (
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl" />
          <div className="relative w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center">
            <Icon size={20} className="text-zinc-500" />
          </div>
        </div>
      ) : null}
      <div className="text-sm font-semibold text-zinc-300">{title}</div>
      {description ? <p className="mt-1 text-xs text-zinc-500 max-w-xs">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
});

/* ── Skeleton: shimmer acorde a la forma final ─────────────────────── */
export const Skeleton = memo(function Skeleton({ className = "" }) {
  return <div className={`rounded-lg bg-white/[0.05] animate-pulse ${className}`} aria-hidden />;
});

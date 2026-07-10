import { useEffect } from "react";
import { X } from "lucide-react";
import CrashLogo from "../CrashLogo";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[1700px]",
};

const ACCENT = {
  emerald: { ring: "rgba(16,185,129,0.18)", glow: "rgba(16,185,129,0.12)", border: "border-emerald-500/25" },
  red: { ring: "rgba(239,68,68,0.18)", glow: "rgba(239,68,68,0.12)", border: "border-red-500/30" },
  amber: { ring: "rgba(245,158,11,0.18)", glow: "rgba(245,158,11,0.12)", border: "border-amber-500/25" },
};

/**
 * Modal premium reutilizable: overlay con blur, tarjeta glass con glow,
 * cabecera con el logo de C.R.A.S.H. y botón de cierre. Evita duplicar
 * la estructura de ventanas emergentes en toda la app.
 */
export default function PremiumModal({
  open,
  onClose,
  title,
  eyebrow = "C.R.A.S.H.",
  icon: Icon,
  accent = "emerald",
  size = "md",
  children,
  footer,
  closeOnBackdrop = true,
  bodyClassName = "",
  testId,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const a = ACCENT[accent] || ACCENT.emerald;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-3 lg:p-6 bg-black/80 backdrop-blur-md fade-in"
      onClick={closeOnBackdrop ? onClose : undefined}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${SIZES[size] || SIZES.md} max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border ${a.border} bg-[#0B0B0D] shadow-2xl animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glows de marca */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[320px] w-[420px] rounded-full blur-[120px]" style={{ background: a.glow }} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-60" style={{ boxShadow: `inset 0 0 0 1px ${a.ring}` }} />

        <div className="relative flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl blur-md" style={{ background: a.glow }} />
              <div className="relative h-10 w-10 rounded-xl border border-red-500/30 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
                {Icon ? <Icon className="h-5 w-5 text-red-400" /> : <CrashLogo size={22} className="text-red-500" />}
              </div>
            </div>
            <div className="min-w-0">
              {eyebrow ? <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold leading-none">{eyebrow}</div> : null}
              <h2 className="text-lg font-bold tracking-tight text-white truncate mt-0.5">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 h-9 w-9 rounded-lg border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`relative flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 ${bodyClassName}`}>
          {children}
        </div>

        {footer ? (
          <div className="relative flex-shrink-0 px-5 sm:px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

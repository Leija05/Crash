import { useState } from "react";
import { Mail } from "lucide-react";
import PremiumModal from "./ui/Modal";

/**
 * Diálogo de entrada premium a pantalla completa (construido sobre PremiumModal).
 * Reemplaza window.prompt() para no usar la ventana de alerta del sistema.
 */
export default function PromptDialog({
  open,
  onClose,
  onSubmit,
  title = "Introduce un valor",
  message,
  label,
  placeholder,
  defaultValue = "",
  submitLabel = "Aceptar",
  cancelLabel = "Cancelar",
  type = "text",
  busy = false,
  testId,
}) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    if (busy) return;
    onSubmit(value.trim());
  };

  return (
    <PremiumModal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      eyebrow="C.R.A.S.H."
      icon={Mail}
      accent="emerald"
      closeOnBackdrop={false}
      testId={testId}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-neutral-300 text-sm transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="text-black font-semibold rounded-xl px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && (
              <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            )}
            {submitLabel}
          </button>
        </div>
      }
    >
      {message ? (
        <p className="text-sm text-neutral-400 leading-relaxed">{message}</p>
      ) : null}
      {label ? (
        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">
          {label}
        </label>
      ) : null}
      <input
        type={type}
        value={value}
        autoFocus
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape" && !busy) onClose?.();
        }}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-neutral-600 outline-none transition-all focus:border-emerald-500/40 focus:bg-white/[0.05]"
      />
    </PremiumModal>
  );
}

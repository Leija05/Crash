import PremiumModal from "./ui/Modal";
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * Diálogo de confirmación premium reutilizable (construido sobre PremiumModal).
 * Evita duplicar la lógica de confirmación (window.confirm) en toda la app.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  icon,
  busy = false,
  testId,
}) {
  const accent = danger ? "red" : "emerald";
  const Icon = icon || (danger ? Trash2 : AlertTriangle);

  return (
    <PremiumModal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      eyebrow="C.R.A.S.H."
      icon={Icon}
      accent={accent}
      size="sm"
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
            onClick={onConfirm}
            disabled={busy}
            className={`text-black font-semibold rounded-xl px-4 py-2.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
              danger ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {busy && (
              <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      }
    >
      {message ? <p className="text-sm text-neutral-400 leading-relaxed">{message}</p> : null}
    </PremiumModal>
  );
}

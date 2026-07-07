import { useState } from "react";
import { api, formatApiError } from "../lib/api";
import { useI18n } from "../i18n";
import { X, Download, FileText, Loader2, CheckCircle } from "lucide-react";

export default function ExportModal({ open, onClose }) {
  const { t } = useI18n();
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleExport = async () => {
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const res = await api.get(`/admin/export/impacts?days=${days}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `crash-impacts-${days}d.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 glass-card p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            {t("export.title")}
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center transition-all">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">
              {t("export.period")}
            </label>
            <input
              type="range"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="text-center text-sm font-mono text-neutral-300 mt-1">{days} d&iacute;as</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-400">
            <FileText className="h-3.5 w-3.5 inline mr-1.5" />
            CSV &middot; {t("export.includeMedical")}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t("export.success")}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-4 py-3 transition-all flex items-center justify-center gap-2"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy ? t("export.preparing") : t("export.download")}
          </button>
        </div>
      </div>
    </div>
  );
}
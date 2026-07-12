import { memo, useCallback, useState } from "react";
import { Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../i18n";

function AlertDiagnosis({ diagnosis }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const { t } = useI18n();

  if (!diagnosis || typeof diagnosis !== "object") return null;

  const priority = (diagnosis.priority_level || "").toLowerCase();
  const priorityTone = {
    "crítico": "text-red-300 border-red-500/40 bg-red-500/15",
    "critico": "text-red-300 border-red-500/40 bg-red-500/15",
    "alto":    "text-amber-300 border-amber-500/40 bg-amber-500/10",
    "medio":   "text-yellow-300 border-yellow-500/30 bg-yellow-500/5",
    "bajo":    "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
  }[priority] || "text-neutral-300 border-white/15 bg-white/5";

  const injuries = diagnosis.possible_injuries || [];
  const firstAid = diagnosis.first_aid_steps || [];
  const recs = diagnosis.emergency_recommendations || [];
  const summary = diagnosis.severity_assessment || "";

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <button
        onClick={toggle}
        data-testid="alert-diagnosis-toggle"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-300">{t("alertDiagnosis.title", "Diagnóstico IA")}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border ${priorityTone}`}>
            {diagnosis.priority_level || "—"}
          </span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-neutral-500" /> : <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />}
      </button>

      {open ? (
        <div className="px-3 pb-3 pt-1 space-y-3 text-xs">
          {summary ? <p className="text-neutral-200 leading-relaxed">{summary}</p> : null}
          {injuries.length > 0 ? (
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-1">{t("alertDiagnosis.possibleInjuries", "Lesiones posibles")}</div>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral-300">{injuries.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
          ) : null}
          {firstAid.length > 0 ? (
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-emerald-400 mb-1">{t("alertDiagnosis.firstAid", "Primeros auxilios")}</div>
              <ol className="list-decimal pl-4 space-y-0.5 text-neutral-200 font-medium">{firstAid.map((it, i) => <li key={i}>{it}</li>)}</ol>
            </div>
          ) : null}
          {recs.length > 0 ? (
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-amber-400 mb-1">{t("alertDiagnosis.recommendations", "Recomendaciones")}</div>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral-300">{recs.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default memo(AlertDiagnosis);

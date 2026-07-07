import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, BellOff, Check, Volume2, VolumeX, Gauge, UserCheck, CalendarDays,
  ClipboardCheck, Clock, FileText, PhoneCall, MapPin, MessageCircle, Siren,
} from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { playCriticalAlert, playAck } from "../lib/sound";
import AlertDiagnosis from "./AlertDiagnosis";

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return new Date(iso).toLocaleString();
}

const STATUS_BADGE = {
  pending: "bg-red-500/20 border-red-500/40 text-red-400",
  acknowledged: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  false_alarm: "bg-neutral-500/15 border-neutral-500/30 text-neutral-400",
};

const STATUS_LABEL = {
  pending: "Pendiente",
  acknowledged: "Atendido",
  false_alarm: "Falsa Alarma",
};

const SEVERITY_TONE = {
  critical: "border-red-500/50 bg-red-500/15 text-red-300",
  critico: "border-red-500/50 bg-red-500/15 text-red-300",
  "crítico": "border-red-500/50 bg-red-500/15 text-red-300",
  high: "border-red-500/40 bg-red-500/10 text-red-300",
  alto: "border-red-500/40 bg-red-500/10 text-red-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  medio: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  bajo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function severityTone(sev) {
  if (!sev) return "border-white/10 bg-white/5 text-neutral-300";
  return SEVERITY_TONE[String(sev).toLowerCase()] || "border-white/10 bg-white/5 text-neutral-300";
}

const EMERGENCY_STEPS = [
  { key: "location", label: "Ver ubicación", icon: MapPin },
  { key: "medical", label: "Revisar datos médicos", icon: FileText },
  { key: "call", label: "Llamar contacto principal", icon: PhoneCall },
  { key: "message", label: "Confirmar WhatsApp/SMS", icon: MessageCircle },
  { key: "escalate", label: "Escalar a emergencias", icon: Siren },
  { key: "close", label: "Cerrar incidente con nota", icon: ClipboardCheck },
];

const DAY_FILTERS = [
  { v: 1, l: "1 día" },
  { v: 3, l: "3 días" },
  { v: 7, l: "7 días" },
  { v: 14, l: "14 días" },
  { v: 30, l: "30 días" },
];

function IncidentWorkflow({ alert, onOpenDriverDetail }) {
  const storageKey = `incident-workflow-${alert.id}`;
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || { checked: {}, note: "", log: [] }; }
    catch { return { checked: {}, note: "", log: [] }; }
  });

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(state)); }, [state, storageKey]);

  const toggle = useCallback((step) => {
    setState((prev) => {
      const nextChecked = { ...prev.checked, [step.key]: !prev.checked?.[step.key] };
      const log = [{ at: new Date().toISOString(), text: `${nextChecked[step.key] ? "Completó" : "Reabrió"}: ${step.label}` }, ...(prev.log || [])].slice(0, 6);
      return { ...prev, checked: nextChecked, log };
    });
  }, []);

  const completed = EMERGENCY_STEPS.filter((step) => state.checked?.[step.key]).length;
  const firstResponse = state.log?.[state.log.length - 1]?.at;

  return (
    <div className="mt-3 rounded-xl border border-red-500/25 bg-black/20 p-3" data-testid={`incident-workflow-${alert.id}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-red-200">
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-[0.2em]">Modo emergencia</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">{completed}/{EMERGENCY_STEPS.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {EMERGENCY_STEPS.map((step) => {
          const Icon = step.icon;
          const checked = Boolean(state.checked?.[step.key]);
          return (
            <button key={step.key} type="button" onClick={() => { if (step.key === "medical") onOpenDriverDetail?.(alert.driver_id); toggle(step); }}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition-all ${checked ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25"}`}
            >
              <span className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checked ? "border-emerald-400 bg-emerald-400 text-black" : "border-neutral-600"}`}>
                {checked ? "✓" : ""}
              </span>
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            <Clock className="h-3 w-3" /> Bitácora
          </div>
          {firstResponse ? <span className="text-[10px] font-mono text-emerald-400">1ª respuesta {timeAgo(firstResponse)}</span> : null}
        </div>
        <textarea value={state.note || ""} onChange={(e) => setState((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="Nota interna: contacto, decisión, seguimiento..."
          className="w-full min-h-[58px] rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
        {(state.log || []).length > 0 ? (
          <div className="mt-2 space-y-1">
            {state.log.slice(0, 3).map((entry, idx) => (
              <div key={`${entry.at}-${idx}`} className="text-[10px] text-neutral-400 flex items-center justify-between gap-2">
                <span className="truncate">{entry.text}</span>
                <span className="font-mono text-neutral-600 whitespace-nowrap">{new Date(entry.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const MemoIncidentWorkflow = memo(IncidentWorkflow);

function AlertsCenter({ alerts, setAlerts, lastImpactId, onSelectDriver, onOpenDriverDetail }) {
  const [tab, setTab] = useState("active");
  const [muted, setMuted] = useState(false);
  const [days, setDays] = useState(7);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const lastPlayedRef = useRef(null);

  useEffect(() => {
    if (!lastImpactId || muted) return;
    if (lastPlayedRef.current === lastImpactId) return;
    lastPlayedRef.current = lastImpactId;
    playCriticalAlert();
  }, [lastImpactId, muted]);

  const active = useMemo(() => {
    const list = (alerts || []).filter((x) => x.status === "pending" && x.alerts_sent === false);
    const dedupByDriver = new Map();
    list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .forEach((a) => { const key = a.driver_id || a.id; if (!dedupByDriver.has(key)) dedupByDriver.set(key, a); });
    return [...dedupByDriver.values()];
  }, [alerts]);

  const loadHistory = useCallback(async (d = days) => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "all");
      params.set("days", String(d));
      params.set("limit", "200");
      const { data } = await api.get(`/monitor/impacts?${params.toString()}`);
      const list = (data.impacts || []).filter((i) => i.status !== "pending")
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setHistory(list);
    } catch (e) { console.error(formatApiError(e)); setHistory([]); }
    finally { setLoadingHistory(false); }
  }, [days]);

  useEffect(() => { if (tab === "history") loadHistory(days); }, [tab, days, loadHistory]);

  const lastAlertSig = useMemo(
    () => (alerts || []).filter((a) => a.status !== "pending" || a.alerts_sent === true).map((a) => `${a.id}:${a.status}:${a.alerts_sent}`).join(","),
    [alerts],
  );

  useEffect(() => { if (tab === "history") loadHistory(days); }, [lastAlertSig, tab, days, loadHistory]);

  const acknowledge = useCallback(async (id) => {
    try {
      const { data } = await api.post(`/monitor/alerts/${id}/acknowledge`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? data.alert : a)));
      playAck();
      setTab("history");
      setTimeout(() => loadHistory(days), 400);
    } catch (e) {
      if (e?.response?.status === 404) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a)));
        setTab("history");
        setTimeout(() => loadHistory(days), 300);
        return;
      }
      console.error(formatApiError(e));
    }
  }, [days, loadHistory, setAlerts]);

  const falseAlarm = useCallback(async (id) => {
    try {
      const { data } = await api.post(`/monitor/alerts/${id}/false-alarm`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? data.alert : a)));
      setTab("history");
      setTimeout(() => loadHistory(days), 400);
    } catch (e) {
      if (e?.response?.status === 404) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "false_alarm" } : a)));
        setTab("history");
        setTimeout(() => loadHistory(days), 300);
        return;
      }
      console.error(formatApiError(e));
    }
  }, [days, loadHistory, setAlerts]);

  const handleMute = useCallback(() => setMuted((m) => !m), []);

  return (
    <div className={`flex flex-col h-full glass-card rounded-2xl overflow-hidden ${active.length > 0 ? "border-red-500/30 border-glow-red" : ""}`} data-testid="alerts-center">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Centro de Alertas</div>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className={`h-4 w-4 ${active.length > 0 ? "text-red-400" : "text-neutral-400"}`} />
            <h3 className="text-lg font-bold">{active.length > 0 ? `${active.length} crítica${active.length > 1 ? "s" : ""}` : "Sin alertas activas"}</h3>
          </div>
        </div>
        <button onClick={handleMute} data-testid="alerts-mute-toggle" className="h-9 w-9 rounded-lg border border-white/10 hover:border-white/30 flex items-center justify-center transition-all hover-lift" title={muted ? "Activar audio" : "Silenciar audio"}>
          {muted ? <VolumeX className="h-4 w-4 text-neutral-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
        </button>
      </div>

      <div className="px-5 flex gap-1 border-b border-white/10">
        {[{ k: "active", l: `Activas · ${active.length}` }, { k: "history", l: `Historial · ${history.length}` }].map((t) => (
          <button key={t.k} data-testid={`alerts-tab-${t.k}`} onClick={() => setTab(t.k)}
            className={`relative px-4 py-2 text-xs uppercase tracking-[0.2em] transition-all ${tab === t.k ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {t.l}
            {tab === t.k ? <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-emerald-400" /> : null}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <CalendarDays className="h-3 w-3" /><span>Últimos</span>
          </div>
          <div className="flex gap-1 flex-1 justify-end" data-testid="history-day-filters">
            {DAY_FILTERS.map((d) => (
              <button key={d.v} data-testid={`history-days-${d.v}`} onClick={() => setDays(d.v)}
                className={`text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded-md border transition-all hover-lift ${days === d.v ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/30 hover:text-white"}`}
              >{d.l}</button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "history" && loadingHistory ? <div className="text-xs text-neutral-500 px-1">Cargando historial...</div> : null}

        {(tab === "active" ? active : history).length === 0 && !loadingHistory ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-neutral-500">
            <BellOff className="h-8 w-8 mb-3" />
            <span className="text-xs uppercase tracking-[0.3em]">{tab === "active" ? "Todo en orden" : "Sin registros en el rango"}</span>
          </div>
        ) : (
          (tab === "active" ? active : [...(alerts || []).filter((a) => a.status === "pending" && a.alerts_sent === true), ...history]).map((a) => {
            const isCrit = a.status === "pending" && a.alerts_sent === false;
            const isSent = a.alerts_sent === true;
            return (
              <div key={a.id} data-testid={`alert-${a.id}`} className={`rounded-xl border p-4 transition-all hover-lift ${isCrit ? "bg-red-500/[0.08] border-red-500/40 glow-red" : a.status === "acknowledged" || isSent ? "bg-emerald-500/[0.07] border-emerald-500/40" : "bg-white/[0.03] border-white/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      {a.severity_label || a.severity ? <span className={`text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border ${severityTone(a.severity)}`}>{a.severity_label || a.severity}</span> : null}
                      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{isCrit ? "Impacto detectado · Prioridad máxima" : isSent ? "Emergencia notificada" : a.type === "impact" ? "Impacto detectado" : a.type}</span>
                    </div>
                    <button onClick={() => onSelectDriver?.(a.driver_id)} className="text-base font-semibold mt-1.5 hover:text-emerald-400 transition-colors text-left">{a.driver_name || a.driver_id}</button>
                    {a.driver_email ? <div className="text-[10px] text-neutral-500 font-mono">{a.driver_email}</div> : null}
                    <div className="font-mono text-[11px] text-neutral-400 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-amber-300"><Gauge className="h-3 w-3" />{a.gforce?.toFixed(2)}G</span>
                      {a.speed ? <span>{Math.round(a.speed || 0)} km/h</span> : null}
                      {a.lat != null ? <span className="text-neutral-500">{a.lat?.toFixed(4)}, {a.lng?.toFixed(4)}</span> : null}
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-neutral-500 whitespace-nowrap">hace {timeAgo(a.created_at)}</div>
                </div>

                {isCrit ? (
                  <>
                    <MemoIncidentWorkflow alert={a} onOpenDriverDetail={onOpenDriverDetail} />
                    <div className="flex gap-2 mt-3">
                      <button data-testid={`alert-ack-${a.id}`} onClick={() => acknowledge(a.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg px-3 py-2 transition-all hover-lift">
                        <Check className="h-3.5 w-3.5" /> Atender
                      </button>
                      <button data-testid={`alert-false-${a.id}`} onClick={() => falseAlarm(a.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-neutral-300 rounded-lg px-3 py-2 transition-all hover-lift">
                        Falsa alarma
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[11px] flex items-start gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-emerald-300">Atendido por <span className="font-semibold">{a.ack_by_name || a.ack_by || "—"}</span></div>
                      {a.ack_by && a.ack_by_name ? <div className="text-[10px] text-neutral-500 font-mono truncate">{a.ack_by}</div> : null}
                      {a.ack_at ? <div className="text-[10px] text-neutral-500 font-mono">{new Date(a.ack_at).toLocaleString()}</div> : null}
                    </div>
                  </div>
                )}
                <AlertDiagnosis diagnosis={a.ai_diagnosis} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(AlertsCenter);

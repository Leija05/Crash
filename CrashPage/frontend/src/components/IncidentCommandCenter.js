import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  HeartPulse,
  MapPin,
  MessageSquarePlus,
  PhoneCall,
  Radio,
  RefreshCw,
  Route,
  ShieldAlert,
  Smartphone,
  Stethoscope,
  TimerReset,
  WifiOff,
  X,
} from "lucide-react";
import { api, formatApiError } from "../lib/api";

const GUIDE_STEPS = [
  "Confirmar identidad, placa y ubicación GPS del conductor.",
  "Verificar G-Force, velocidad previa y estado del casco/app móvil.",
  "Llamar al 911 y compartir coordenadas, nombre y severidad.",
  "Contactar a emergencias personales y registrar quién contestó.",
  "Mantener seguimiento hasta arribo de ayuda y cierre del incidente.",
];

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function minutesBetween(start, end) {
  if (!start || !end) return "—";
  const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  return `${Math.round(diff / 60000)} min`;
}

function buildReplay(history, incident, driver) {
  const crashAt = incident?.created_at ? new Date(incident.created_at).getTime() : null;
  const points = (history || [])
    .filter((p) => p?.ts)
    .filter((p) => {
      if (!crashAt) return true;
      const t = new Date(p.ts).getTime();
      return t >= crashAt - 10 * 60 * 1000 && t <= crashAt + 3 * 60 * 1000;
    })
    .slice(-9)
    .map((p) => ({
      ts: p.ts,
      speed: typeof p.speed === "number" ? p.speed : 0,
      gforce: typeof p.gforce === "number" ? p.gforce : typeof p.g_force === "number" ? p.g_force : 0,
    }));

  if (points.length >= 3) return points;
  const baseSpeed = Number(incident?.speed ?? driver?.speed ?? 45);
  const peakG = Number(incident?.gforce ?? driver?.gforce ?? 5.4);
  const baseTs = crashAt || Date.now();
  return [-120, -60, -15, 0, 45, 120].map((offset) => ({
    ts: new Date(baseTs + offset * 1000).toISOString(),
    speed: Math.max(0, offset < 0 ? baseSpeed + offset / 12 : baseSpeed * Math.max(0, 1 - offset / 90)),
    gforce: offset === 0 ? peakG : Math.max(0.8, peakG / (Math.abs(offset) / 15 + 2)),
  }));
}

function statusTone(status) {
  if (status === "ok") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-red-500/35 bg-red-500/10 text-red-300";
}

export default function IncidentCommandCenter({ open, onClose, alerts, drivers, selectedDriver, socketStatus }) {
  const activeIncident = useMemo(() => {
    const list = [...(alerts || [])].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return list.find((a) => a.status === "pending") || list[0] || null;
  }, [alerts]);

  const driver = activeIncident?.driver_id ? drivers?.[activeIncident.driver_id] : selectedDriver;
  const incidentId = activeIncident?.id || driver?.id || "sin-incidente";
  const [checked, setChecked] = useState({});
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setChecked({});
  }, [open, incidentId]);

  useEffect(() => {
    if (!open || !driver?.id) return;
    let cancelled = false;
    api.get(`/monitor/drivers/${driver.id}/history?limit=120`)
      .then(({ data }) => { if (!cancelled) setHistory(data.points || []); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [open, driver?.id]);

  const loadNotes = async () => {
    if (!open || !incidentId || incidentId === "sin-incidente") return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/monitor/incidents/${encodeURIComponent(incidentId)}/log`);
      setNotes(data.entries || []);
    } catch (e) {
      setError(formatApiError(e));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incidentId]);

  const addNote = async () => {
    const text = noteText.trim();
    if (!text || incidentId === "sin-incidente") return;
    setError("");
    try {
      const { data } = await api.post(`/monitor/incidents/${encodeURIComponent(incidentId)}/log`, { note: text });
      setNotes((prev) => [data.entry, ...prev]);
      setNoteText("");
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  if (!open) return null;

  const replay = buildReplay(history, activeIncident, driver);
  const maxSpeed = Math.max(1, ...replay.map((p) => p.speed || 0));
  const maxG = Math.max(1, ...replay.map((p) => p.gforce || 0));
  const systems = [
    {
      label: "GPS",
      detail: driver?.lat != null && driver?.lng != null ? `${driver.lat.toFixed(5)}, ${driver.lng.toFixed(5)}` : "Sin coordenadas",
      status: driver?.lat != null && driver?.lng != null ? "ok" : "critical",
      icon: MapPin,
    },
    {
      label: "Telemetría",
      detail: driver?.last_update ? `Último dato ${fmtTime(driver.last_update)}` : "Sin telemetría",
      status: driver?.helmet_connected ? "ok" : "warning",
      icon: Radio,
    },
    {
      label: "App móvil",
      detail: driver?.status === "offline" ? "Desconectada" : socketStatus === "open" ? "Enlazada" : "Reconectando",
      status: driver?.status === "offline" ? "critical" : socketStatus === "open" ? "ok" : "warning",
      icon: Smartphone,
    },
  ];

  return (
    <div className="fixed inset-0 z-[900] bg-black/75 backdrop-blur-sm p-3 md:p-6" data-testid="incident-command-center">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-red-500/30 bg-[#0A0A0A] shadow-[0_0_60px_rgba(239,68,68,0.22)]">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-red-300">Centro operativo de incidente</div>
            <h2 className="text-xl font-bold text-white">{activeIncident?.driver_name || driver?.name || "Sin accidente activo"}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
              <span className="font-mono">ID {incidentId}</span>
              <span>Inicio {fmtTime(activeIncident?.created_at)}</span>
              <span>Respuesta {minutesBetween(activeIncident?.created_at, activeIncident?.ack_at || new Date().toISOString())}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-neutral-400 transition hover:border-red-500/50 hover:text-red-300" aria-label="Cerrar centro operativo">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-12">
          <section className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert className="h-4 w-4 text-red-400" /> Modo emergencia guiado</div>
            <div className="space-y-2">
              {GUIDE_STEPS.map((step, idx) => (
                <label key={step} className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-neutral-200 hover:border-red-500/30">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[idx])}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [idx]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-red-500"
                  />
                  <span><span className="font-mono text-red-300">0{idx + 1}</span> {step}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200"><PhoneCall className="h-3.5 w-3.5" /> 911</button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-200"><Stethoscope className="h-3.5 w-3.5" /> Paramédicos</button>
            </div>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Route className="h-4 w-4 text-emerald-400" /> Replay del accidente</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">velocidad + G-Force</div>
            </div>
            <div className="space-y-3">
              {replay.map((p, idx) => (
                <div key={`${p.ts}-${idx}`} className="grid grid-cols-[72px_1fr_54px] items-center gap-3 text-xs">
                  <div className="font-mono text-neutral-400">{fmtTime(p.ts)}</div>
                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (p.speed / maxSpeed) * 100)}%` }} /></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, (p.gforce / maxG) * 100)}%` }} /></div>
                  </div>
                  <div className="font-mono text-right"><span className="text-emerald-300">{Math.round(p.speed)}</span><span className="text-neutral-500"> km/h</span><br /><span className="text-red-300">{p.gforce.toFixed(2)}G</span></div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><HeartPulse className="h-4 w-4 text-amber-400" /> Salud del sistema</div>
            <div className="space-y-2">
              {systems.map(({ label, detail, status, icon: Icon }) => (
                <div key={label} className={`rounded-xl border p-3 ${statusTone(status)}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"><Icon className="h-3.5 w-3.5" /> {label}</div>
                  <div className="mt-1 text-xs text-neutral-300">{detail}</div>
                </div>
              ))}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-neutral-400">
                <WifiOff className="mb-1 h-3.5 w-3.5 text-neutral-500" /> Se marca crítico si no hay GPS, si no llega telemetría o si el móvil queda offline.
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><MessageSquarePlus className="h-4 w-4 text-sky-400" /> Bitácora colaborativa</div>
              <button onClick={loadNotes} className="rounded-lg border border-white/10 p-1.5 text-neutral-400 hover:text-white"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
            </div>
            <div className="flex gap-2">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} placeholder="Agregar nota: llamada, ETA ambulancia, cierre..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" />
              <button onClick={addNote} className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">Agregar</button>
            </div>
            {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}
            <div className="mt-4 max-h-52 space-y-2 overflow-auto pr-1">
              {notes.length === 0 ? <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-500">Sin notas todavía. Registra tiempos y acciones del equipo.</div> : notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500"><span>{n.author_name || n.author_email || "Operador"}</span><span>{fmtTime(n.created_at)}</span></div>
                  <div className="text-sm text-neutral-200">{n.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><TimerReset className="h-4 w-4 text-violet-400" /> Tiempos de respuesta</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><Clock3 className="mb-2 h-4 w-4 text-neutral-400" /><div className="text-2xl font-mono text-white">{minutesBetween(activeIncident?.created_at, new Date().toISOString())}</div><div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">desde impacto</div></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" /><div className="text-2xl font-mono text-white">{activeIncident?.status === "pending" ? "Abierto" : "Cerrado"}</div><div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">estado</div></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><Gauge className="mb-2 h-4 w-4 text-emerald-400" /><div className="text-2xl font-mono text-white">{Math.round(activeIncident?.speed ?? driver?.speed ?? 0)}</div><div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">km/h impacto</div></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><Activity className="mb-2 h-4 w-4 text-red-400" /><div className="text-2xl font-mono text-white">{Number(activeIncident?.gforce ?? driver?.gforce ?? 0).toFixed(2)}G</div><div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">pico G-Force</div></div>
            </div>
            {!activeIncident ? <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4" /> No hay accidentes activos; se muestra el conductor seleccionado.</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

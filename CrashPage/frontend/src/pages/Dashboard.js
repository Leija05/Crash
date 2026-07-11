import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { LifeBuoy, Send, X, Flame } from "lucide-react";
import Topbar from "../components/Topbar";
import LiveMap from "../components/LiveMap";
import DriverList from "../components/DriverList";
import TelemetryBento from "../components/TelemetryBento";
import AlertsCenter from "../components/AlertsCenter";
import DriverDetailSheet from "../components/DriverDetailSheet";
import CrashHistoryModal from "../components/CrashHistoryModal";
import SystemHealthPanel from "../components/SystemHealthPanel";
import PremiumModal from "../components/ui/Modal";
import { useCrashSocket } from "../lib/ws";
import { useAuth } from "../auth/AuthContext";
import { api, companyAPI, monitorAPI, formatApiError } from "../lib/api";

const SUPPORT_TYPES = [
  { id: "password_reset", label: "Reiniciar contraseña" },
  { id: "remove_token", label: "Quitar token de una cuenta" },
  { id: "billing", label: "Facturación / suscripción" },
  { id: "otro", label: "Otro" },
];

function SupportModal({ onClose }) {
  const [type, setType] = useState("password_reset");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await companyAPI.createSupport(type, message);
      toast.success("Reporte enviado a soporte");
      onClose();
    } catch (err) { toast.error(formatApiError(err)); }
    setBusy(false);
  }, [type, message, onClose]);

  return (
    <PremiumModal
      open
      onClose={onClose}
      title="Reportar a soporte"
      eyebrow="Centro de Ayudas"
      icon={LifeBuoy}
      size="md"
      testId="support-modal"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-neutral-300 text-sm transition-all">Cancelar</button>
          <button form="support-form" type="submit" disabled={busy} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-2.5 transition-all flex items-center justify-center gap-2">
            <Send className="h-4 w-4" /> {busy ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      }
    >
      <form id="support-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Tipo de solicitud</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
            {SUPPORT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">Detalle</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required placeholder="Describe qué necesitas (cuenta afectada, motivo, etc.)" className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none" />
        </div>
      </form>
    </PremiumModal>
  );
}

function Dashboard() {
  const { drivers, alerts, setAlerts, status, lastImpactId } = useCrashSocket();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const [roster, setRoster] = useState([]);

  const isMonitor = user?.role === "monitor" && !!user?.company_id;
  // Monitorista "general": monitor sin empresa asignada. Ve los conductores
  // independientes (sin empresa) en el monitoreo general.
  const isGeneralMonitor = user?.role === "monitor" && !user?.company_id;

  const [heatOn, setHeatOn] = useState(false);
  const [heatDays, setHeatDays] = useState(30);
  const [heatPoints, setHeatPoints] = useState(null);

  // Mapa de calor histórico de impactos de la empresa del monitorista.
  useEffect(() => {
    if (!isMonitor || !heatOn) { setHeatPoints(null); return; }
    let cancelled = false;
    monitorAPI.heatmap({ days: heatDays })
      .then((r) => { if (!cancelled) setHeatPoints(r.data?.points || []); })
      .catch(() => { if (!cancelled) setHeatPoints([]); });
    return () => { cancelled = true; };
  }, [isMonitor, heatOn, heatDays]);

  useEffect(() => {
    if (!isMonitor) { setRoster([]); return; }
    let cancelled = false;
    const load = () => {
      api.get(`/companies/${user.company_id}/drivers`)
        .then((r) => { if (!cancelled) setRoster(r.data || []); })
        .catch(() => { if (!cancelled) setRoster([]); });
    };
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isMonitor, user?.company_id]);

  const visibleDrivers = useMemo(() => {
    if (!isMonitor && !isGeneralMonitor) return drivers || {};
    const out = {};
    for (const [k, v] of Object.entries(drivers || {})) {
      if (isMonitor && v.company_id === user.company_id) out[k] = v;
      else if (isGeneralMonitor && !v.company_id) out[k] = v;
    }
    return out;
  }, [drivers, isMonitor, isGeneralMonitor, user?.company_id]);

  // Flota consolidada: conductores en vivo + los asociados a la empresa
  // (registrados aunque estén desconectados). Solo para monitoristas.
  const fleetDrivers = useMemo(() => {
    if (!isMonitor) return visibleDrivers;
    const merged = { ...visibleDrivers };
    for (const d of roster) {
      const key = d.id || d.email;
      if (!key) continue;
      const liveMatch = Object.values(visibleDrivers).some(
        (v) => v.id === d.id || (d.email && v.email === d.email)
      );
      if (!liveMatch) {
        merged[key] = {
          id: d.id || key,
          name: d.name || d.email || "Conductor",
          email: d.email || "",
          status: "offline",
          helmet_connected: false,
          company_id: user.company_id,
        };
      }
    }
    return merged;
  }, [isMonitor, visibleDrivers, roster, user?.company_id]);

  const visibleAlerts = useMemo(() => {
    if (!isMonitor) return alerts;
    const ids = new Set(Object.keys(visibleDrivers));
    return (alerts || []).filter((a) => ids.has(a.driver_id));
  }, [alerts, isMonitor, visibleDrivers]);

  const driverList = useMemo(() => Object.values(fleetDrivers || {}), [fleetDrivers]);

  const selected = useMemo(() => {
    if (selectedId && fleetDrivers[selectedId]) return fleetDrivers[selectedId];
    if (driverList.length > 0) return driverList[0];
    return null;
  }, [selectedId, fleetDrivers, driverList]);

  const activeAlertCount = useMemo(
    () => (visibleAlerts || []).filter((a) => a.status === "pending").length,
    [visibleAlerts]
  );

  const openDetail = useCallback((id) => {
    setDetailId(id);
    setSheetOpen(true);
  }, []);

  const handleSelectId = useCallback((id) => setSelectedId(id), []);
  const handleOpenHistory = useCallback(() => setHistoryOpen(true), []);
  const handleSheetOpenChange = useCallback((v) => setSheetOpen(v), []);
  const handleHistoryClose = useCallback(() => setHistoryOpen(false), []);

  const driverDetail = useMemo(
    () => (detailId ? fleetDrivers[detailId] : null),
    [detailId, fleetDrivers]
  );

  return (
    <div className="h-screen w-full p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 overflow-hidden bg-[#0A0A0A] red-accent-panel">
      <Topbar
        status={status}
        alertCount={activeAlertCount}
        onOpenHistory={handleOpenHistory}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 min-h-0">
        <aside className="lg:col-span-3 min-h-0 flex flex-col gap-3 lg:gap-4">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/10 glass-card backdrop-premium p-4 flex flex-col">
            <div className="flex-1 min-h-0">
              <DriverList
                drivers={fleetDrivers}
                selectedId={selected?.id}
                onSelect={handleSelectId}
                onOpenDetail={openDetail}
              />
            </div>
            {isMonitor ? (
              <button
                onClick={() => setSupportOpen(true)}
                className="mt-3 flex-shrink-0 inline-flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-2.5 text-xs text-neutral-300 transition-all"
                title="Reportar a soporte"
              >
                <LifeBuoy className="h-4 w-4 text-emerald-400" /> Reportar a soporte
              </button>
            ) : null}
            <div className="mt-3 flex-shrink-0">
              <SystemHealthPanel drivers={drivers} wsStatus={status} />
            </div>
          </div>
        </aside>

        <section className="lg:col-span-6 flex flex-col gap-3 lg:gap-4 min-h-0">
          <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden min-h-[280px] relative">
            <LiveMap
              drivers={visibleDrivers}
              alerts={visibleAlerts}
              selectedId={selected?.id}
              onSelect={handleSelectId}
              heatPoints={heatOn ? heatPoints : null}
            />
            {isMonitor && (
              <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
                {heatOn && (
                  <select
                    value={heatDays}
                    onChange={(e) => setHeatDays(Number(e.target.value))}
                    className="rounded-lg border border-white/10 bg-black/50 backdrop-blur-xl px-2 py-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-300 outline-none"
                  >
                    <option value={7}>7 días</option>
                    <option value={30}>30 días</option>
                    <option value={90}>90 días</option>
                    <option value={365}>1 año</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setHeatOn((v) => !v)}
                  className={`rounded-xl border backdrop-blur-xl px-3 py-2 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${heatOn ? "border-orange-500/50 bg-orange-500/20 text-orange-200" : "border-white/10 bg-black/40 text-neutral-300 hover:bg-white/10"}`}
                  title="Mapa de calor de impactos"
                >
                  <Flame className="h-3.5 w-3.5" />
                  Mapa de calor
                </button>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <TelemetryBento driver={selected} />
          </div>
        </section>

        <aside className="lg:col-span-3 min-h-0 flex">
          <div className="flex-1 min-h-0">
            <AlertsCenter
              alerts={visibleAlerts}
              setAlerts={setAlerts}
              lastImpactId={lastImpactId}
              onSelectDriver={handleSelectId}
              onOpenDriverDetail={openDetail}
            />
          </div>
        </aside>
      </div>

      <DriverDetailSheet
        driverId={detailId}
        driver={driverDetail}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />

      <CrashHistoryModal
        open={historyOpen}
        onClose={handleHistoryClose}
      />

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </div>
  );
}

export default memo(Dashboard);

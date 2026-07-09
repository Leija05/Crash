import { memo, useCallback, useMemo, useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import LiveMap from "../components/LiveMap";
import DriverList from "../components/DriverList";
import TelemetryBento from "../components/TelemetryBento";
import AlertsCenter from "../components/AlertsCenter";
import DriverDetailSheet from "../components/DriverDetailSheet";
import CrashHistoryModal from "../components/CrashHistoryModal";
import SystemHealthPanel from "../components/SystemHealthPanel";
import { useCrashSocket } from "../lib/ws";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

function CompanyDriversPanel({ companyId }) {
  const [drivers, setDrivers] = useState(null);
  const load = useCallback(() => {
    if (!companyId) { setDrivers([]); return; }
    api.get(`/companies/${companyId}/drivers`)
      .then((r) => setDrivers(r.data || []))
      .catch(() => setDrivers([]));
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    load();
    const id = setInterval(() => { if (!cancelled) load(); }, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [load]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-3">Conductores de mi empresa</h4>
      {drivers === null ? (
        <div className="text-xs text-neutral-500">Cargando...</div>
      ) : drivers.length > 0 ? (
        <div className="space-y-2">
          {drivers.map((d) => (
            <div key={d.id || d.email} className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-300 font-bold">{d.name?.[0] || "?"}</div>
              <div><div className="font-medium">{d.name}</div><div className="text-xs text-neutral-500">{d.email}</div></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-neutral-500">Ningún conductor ha vinculado su cuenta a esta empresa todavía.</div>
      )}
    </div>
  );
}

function Dashboard() {
  const { drivers, alerts, setAlerts, status, lastImpactId } = useCrashSocket();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isMonitor = user?.role === "monitor" && !!user?.company_id;

  const visibleDrivers = useMemo(() => {
    if (!isMonitor) return drivers || {};
    const out = {};
    for (const [k, v] of Object.entries(drivers || {})) {
      if (v.company_id === user.company_id) out[k] = v;
    }
    return out;
  }, [drivers, isMonitor, user?.company_id]);

  const visibleAlerts = useMemo(() => {
    if (!isMonitor) return alerts;
    const ids = new Set(Object.keys(visibleDrivers));
    return (alerts || []).filter((a) => ids.has(a.driver_id));
  }, [alerts, isMonitor, visibleDrivers]);

  const driverList = useMemo(() => Object.values(visibleDrivers || {}), [visibleDrivers]);

  const selected = useMemo(() => {
    if (selectedId && visibleDrivers[selectedId]) return visibleDrivers[selectedId];
    if (driverList.length > 0) return driverList[0];
    return null;
  }, [selectedId, visibleDrivers, driverList]);

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
    () => (detailId ? visibleDrivers[detailId] : null),
    [detailId, visibleDrivers]
  );

  return (
    <div className="h-screen w-full p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 overflow-hidden bg-[#0A0A0A] red-accent-panel">
      <Topbar
        status={status}
        alertCount={activeAlertCount}
        onOpenHistory={handleOpenHistory}
      />

      {user?.role === "monitor" && user?.company_id ? (
        <CompanyDriversPanel companyId={user.company_id} />
      ) : null}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 min-h-0">
        <aside className="lg:col-span-3 rounded-2xl border border-white/10 glass-card backdrop-premium p-4 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <DriverList
              drivers={visibleDrivers}
              selectedId={selected?.id}
              onSelect={handleSelectId}
              onOpenDetail={openDetail}
            />
          </div>
          <div className="mt-4 flex-shrink-0">
            <SystemHealthPanel drivers={drivers} wsStatus={status} />
          </div>
        </aside>

        <section className="lg:col-span-6 flex flex-col gap-3 lg:gap-4 min-h-0">
          <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden min-h-[280px]">
            <LiveMap
              drivers={visibleDrivers}
              alerts={visibleAlerts}
              selectedId={selected?.id}
              onSelect={handleSelectId}
            />
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
    </div>
  );
}

export default memo(Dashboard);

import { memo, useCallback, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import LiveMap from "../components/LiveMap";
import DriverList from "../components/DriverList";
import TelemetryBento from "../components/TelemetryBento";
import AlertsCenter from "../components/AlertsCenter";
import DriverDetailSheet from "../components/DriverDetailSheet";
import CrashHistoryModal from "../components/CrashHistoryModal";
import SystemHealthPanel from "../components/SystemHealthPanel";
import { useCrashSocket } from "../lib/ws";

function Dashboard() {
  const { drivers, alerts, setAlerts, status, lastImpactId } = useCrashSocket();
  const [selectedId, setSelectedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const driverList = useMemo(() => Object.values(drivers || {}), [drivers]);

  const selected = useMemo(() => {
    if (selectedId && drivers[selectedId]) return drivers[selectedId];
    if (driverList.length > 0) return driverList[0];
    return null;
  }, [selectedId, drivers, driverList]);

  const activeAlertCount = useMemo(
    () => alerts.filter((a) => a.status === "pending").length,
    [alerts]
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
    () => (detailId ? drivers[detailId] : null),
    [detailId, drivers]
  );

  return (
    <div className="h-screen w-full p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 overflow-hidden bg-[#0A0A0A] red-accent-panel">
      <Topbar
        status={status}
        alertCount={activeAlertCount}
        onOpenHistory={handleOpenHistory}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 min-h-0">
        <aside className="lg:col-span-3 rounded-2xl border border-white/10 glass-card backdrop-premium p-4 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <DriverList
              drivers={drivers}
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
              drivers={drivers}
              alerts={alerts}
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
              alerts={alerts}
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

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LifeBuoy, Send, Flame } from "lucide-react";
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
import { useI18n } from "../i18n";

const SUPPORT_TYPES = [
  { id: "password_reset", key: "passwordReset", label: "Reiniciar contraseña" },
  { id: "remove_token", key: "removeToken", label: "Quitar token de una cuenta" },
  { id: "billing", key: "billing", label: "Facturación / suscripción" },
  { id: "otro", key: "other", label: "Otro" },
];

const SUPPORT_VARIANTS = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.18 } },
};

const PANEL_VARIANTS = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 180, damping: 24, delay: i * 0.08 },
  }),
};

function SupportModal({ onClose }) {
  const [type, setType] = useState("password_reset");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { t } = useI18n();

  const submit = useCallback(async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await companyAPI.createSupport(type, message);
      toast.success(t("dashboardPage.reportSent", "Reporte enviado a soporte"));
      onClose();
    } catch (err) { toast.error(formatApiError(err)); }
    setBusy(false);
  }, [type, message, onClose, t]);

  return (
    <PremiumModal
      open
      onClose={onClose}
      title={t("dashboardPage.reportToSupport", "Reportar a soporte")}
      eyebrow={t("dashboardPage.helpCenter", "Centro de Ayudas")}
      icon={LifeBuoy}
      size="md"
      testId="support-modal"
      footer={
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-end gap-3"
        >
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-neutral-300 text-sm transition-all">{t("dashboardPage.cancel", "Cancelar")}</button>
          <button form="support-form" type="submit" disabled={busy} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-2.5 transition-all flex items-center justify-center gap-2">
            <Send className="h-4 w-4" /> {busy ? t("dashboardPage.sending", "Enviando...") : t("dashboardPage.sendReport", "Enviar reporte")}
          </button>
        </motion.div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.form
          key="support-form"
          variants={SUPPORT_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          id="support-form"
          onSubmit={submit}
          className="space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">{t("dashboardPage.requestType", "Tipo de solicitud")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all">
              {SUPPORT_TYPES.map((t) =>             <option key={t.id} value={t.id}>{t(`dashboardPage.support.${t.key}`, t.label)}</option>)}
            </select>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
          >
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-1.5 block">{t("dashboardPage.detail", "Detalle")}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required placeholder={t("dashboardPage.detailPlaceholder", "Describe qué necesitas (cuenta afectada, motivo, etc.)")} className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none" />
          </motion.div>
        </motion.form>
      </AnimatePresence>
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

  const { t } = useI18n();

  const [roster, setRoster] = useState([]);

  const GENERAL_COMPANY_ID = "general";
  const hasCompanyRole = user?.role === "monitor" || user?.role === "admin";
  const hasSpecificCompany = !!user?.company_id && user?.company_id !== GENERAL_COMPANY_ID;
  // Usuario de empresa con compañía específica: filtra conductores
  const isCompanyUser = hasCompanyRole && hasSpecificCompany;
  // Usuario "general": monitoreo general (sin empresa o con company_id "general")
  const isGeneralView = hasCompanyRole && (!user?.company_id || user?.company_id === GENERAL_COMPANY_ID);

  const [heatOn, setHeatOn] = useState(false);
  const [heatDays, setHeatDays] = useState(30);
  const [heatPoints, setHeatPoints] = useState(null);

  // Mapa de calor histórico de impactos de la empresa del monitorista.
  useEffect(() => {
    if (!hasSpecificCompany || !heatOn) { setHeatPoints(null); return; }
    let cancelled = false;
    monitorAPI.heatmap({ days: heatDays })
      .then((r) => { if (!cancelled) setHeatPoints(r.data?.points || []); })
      .catch(() => { if (!cancelled) setHeatPoints([]); });
    return () => { cancelled = true; };
  }, [hasSpecificCompany, heatOn, heatDays]);

  useEffect(() => {
    if (!user?.company_id) { setRoster([]); return; }
    let cancelled = false;
    const load = () => {
      api.get(`/companies/${user.company_id}/drivers`)
        .then((r) => { if (!cancelled) setRoster(r.data || []); })
        .catch(() => { if (!cancelled) setRoster([]); });
    };
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.company_id]);

  const visibleDrivers = useMemo(() => {
    // Sin filtro: superadmins y usuarios sin compañía ven todo
    if (!isCompanyUser && !isGeneralView) return drivers || {};
    const out = {};
    for (const [k, v] of Object.entries(drivers || {})) {
      const dc = v.company_id;
      // Usuario de empresa específica: solo sus conductores
      if (isCompanyUser && dc === user.company_id) out[k] = v;
      // Vista general: ve todos los conductores
      else if (isGeneralView) out[k] = v;
    }
    return out;
  }, [drivers, isCompanyUser, isGeneralView, user?.company_id]);

  // Flota consolidada: conductores en vivo + los asociados a la empresa
  // (registrados aunque estén desconectados). Solo para usuarios con compañía.
  const fleetDrivers = useMemo(() => {
    if (!user?.company_id) return visibleDrivers;
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
          name: d.name || d.email || t("dashboardPage.driver", "Conductor"),
          email: d.email || "",
          status: "offline",
          helmet_connected: false,
          company_id: user.company_id,
        };
      }
    }
    return merged;
  }, [user?.company_id, visibleDrivers, roster, t]);

  const visibleAlerts = useMemo(() => {
    if (!hasSpecificCompany) return alerts;
    const ids = new Set(Object.keys(visibleDrivers));
    return (alerts || []).filter((a) => ids.has(a.driver_id));
  }, [alerts, hasSpecificCompany, visibleDrivers]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-screen w-full p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 overflow-hidden bg-[#0A0A0A] red-accent-panel"
    >
      <Topbar
        status={status}
        alertCount={activeAlertCount}
        onOpenHistory={handleOpenHistory}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 min-h-0">
        <motion.aside
          custom={0}
          variants={PANEL_VARIANTS}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 min-h-0 flex flex-col gap-3 lg:gap-4"
        >
          <div className="flex-1 min-h-0 rounded-2xl border border-white/10 glass-card backdrop-premium p-4 flex flex-col">
            <motion.div
              className="flex-1 min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <DriverList
                drivers={fleetDrivers}
                selectedId={selected?.id}
                onSelect={handleSelectId}
                onOpenDetail={openDetail}
              />
            </motion.div>
            <AnimatePresence>
              {hasSpecificCompany ? (
                <motion.button
                  key="support-btn"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 22 }}
                  onClick={() => setSupportOpen(true)}
                  whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-3 flex-shrink-0 inline-flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-2.5 text-xs text-neutral-300 transition-all"
                  title={t("dashboardPage.reportToSupport", "Reportar a soporte")}
                >
                  <LifeBuoy className="h-4 w-4 text-emerald-400" /> {t("dashboardPage.reportToSupport", "Reportar a soporte")}
                </motion.button>
              ) : null}
            </AnimatePresence>
            <motion.div
              className="mt-3 flex-shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <SystemHealthPanel drivers={visibleDrivers} wsStatus={status} />
            </motion.div>
          </div>
        </motion.aside>

        <motion.section
          custom={1}
          variants={PANEL_VARIANTS}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col gap-3 lg:gap-4 min-h-0"
        >
          <motion.div
            className="flex-1 rounded-2xl border border-white/10 overflow-hidden min-h-[280px] relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <LiveMap
              drivers={visibleDrivers}
              alerts={visibleAlerts}
              selectedId={selected?.id}
              onSelect={handleSelectId}
              heatPoints={heatOn ? heatPoints : null}
            />
            {hasSpecificCompany && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute top-4 right-4 z-[500] flex items-center gap-2"
              >
                <AnimatePresence>
                  {heatOn && (
                    <motion.select
                      key="heat-days"
                      initial={{ opacity: 0, x: 10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: "auto" }}
                      exit={{ opacity: 0, x: 10, width: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      value={heatDays}
                      onChange={(e) => setHeatDays(Number(e.target.value))}
                      className="rounded-lg border border-white/10 bg-black/50 backdrop-blur-xl px-2 py-1.5 text-[10px] uppercase tracking-[0.15em] text-neutral-300 outline-none"
                    >
                      <option value={7}>{t("dashboardPage.days7", "7 días")}</option>
                      <option value={30}>{t("dashboardPage.days30", "30 días")}</option>
                      <option value={90}>{t("dashboardPage.days90", "90 días")}</option>
                      <option value={365}>{t("dashboardPage.year1", "1 año")}</option>
                    </motion.select>
                  )}
                </AnimatePresence>
                <motion.button
                  type="button"
                  onClick={() => setHeatOn((v) => !v)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className={`rounded-xl border backdrop-blur-xl px-3 py-2 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${heatOn ? "border-orange-500/50 bg-orange-500/20 text-orange-200" : "border-white/10 bg-black/40 text-neutral-300 hover:bg-white/10"}`}
                  title={t("dashboardPage.heatmapTitle", "Mapa de calor de impactos")}
                >
                  <Flame className="h-3.5 w-3.5" />
                  {t("dashboardPage.heatmap", "Mapa de calor")}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 22 }}
          >
            <TelemetryBento driver={selected} />
          </motion.div>
        </motion.section>

        <motion.aside
          custom={2}
          variants={PANEL_VARIANTS}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 min-h-0 flex"
        >
          <motion.div
            className="flex-1 min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <AlertsCenter
              alerts={visibleAlerts}
              setAlerts={setAlerts}
              lastImpactId={lastImpactId}
              onSelectDriver={handleSelectId}
              onOpenDriverDetail={openDetail}
            />
          </motion.div>
        </motion.aside>
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

      <AnimatePresence>
        {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(Dashboard);

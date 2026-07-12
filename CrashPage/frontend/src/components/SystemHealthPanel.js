import { memo, useMemo } from "react";
import { Activity, BatteryWarning, BluetoothOff, MapPinOff, ServerCrash, Smartphone } from "lucide-react";
import { useI18n } from "../i18n";

function minutesSince(iso) {
  if (!iso) return Infinity;
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return Infinity;
  return (Date.now() - at) / 60000;
}

function HealthItem({ icon: Icon, label, value, tone = "default", hint }) {
  const toneClass = {
    default: "border-white/10 bg-white/[0.03] text-neutral-300",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    danger: "border-red-500/35 bg-red-500/10 text-red-300",
    ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  }[tone] || "border-white/10 bg-white/[0.03] text-neutral-300";

  return (
    <div className={`rounded-xl border ${toneClass} hover-lift transition-all`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.2em] truncate">{label}</span>
          </div>
          <span className="font-mono text-sm font-bold">{value}</span>
        </div>
        {hint ? <div className="text-[10px] text-neutral-500 mt-1 leading-snug">{hint}</div> : null}
      </div>
    </div>
  );
}

const MemoHealthItem = memo(HealthItem);

function SystemHealthPanel({ drivers, wsStatus }) {
  const { t } = useI18n();
  const metrics = useMemo(() => {
    const list = Object.values(drivers || {});
    const noGps = list.filter((d) => typeof d.lat !== "number" || typeof d.lng !== "number").length;
    const noBattery = list.filter((d) => d.battery == null).length;
    const lowBattery = list.filter((d) => typeof d.battery === "number" && d.battery <= 20).length;
    const helmetOff = list.filter((d) => d.helmet_connected === false).length;
    const stale = list.filter((d) => minutesSince(d.updated_at || d.last_seen || d.ts) > 5).length;
    const appSilent = list.filter((d) => d.status === "offline" || minutesSince(d.updated_at || d.last_seen || d.ts) > 15).length;
    const wsDisconnected = wsStatus !== "open";
    const totalIssues = noGps + noBattery + lowBattery + helmetOff + stale + appSilent + (wsDisconnected ? 1 : 0);
    return { noGps, stale, lowBattery, noBattery, helmetOff, appSilent, wsStatus, wsDisconnected, totalIssues };
  }, [drivers, wsStatus]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-4" data-testid="system-health-panel">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{t("systemHealth.healthCenter", "Centro de salud")}</div>
          <div className="text-sm font-semibold mt-1">
            {metrics.totalIssues > 0 ? `${metrics.totalIssues} ${t("systemHealth.signalsToReview", "señales a revisar")}` : t("systemHealth.operational", "Sistema operativo")}
          </div>
        </div>
        <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${metrics.wsDisconnected ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`} title={t("systemHealth.wsStatusTitle", "Estado WebSocket")}>
          <Activity className={`h-4 w-4 ${metrics.wsDisconnected ? "text-red-400" : "text-emerald-400"}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MemoHealthItem icon={MapPinOff} label={t("systemHealth.noGps", "Sin GPS")} value={metrics.noGps} tone={metrics.noGps ? "warning" : "ok"} hint={t("systemHealth.noGpsHint", "App móvil sin coordenadas")} />
        <MemoHealthItem icon={Smartphone} label={t("systemHealth.noTelemetry", "Sin telemetría")} value={metrics.stale} tone={metrics.stale ? "danger" : "ok"} hint={t("systemHealth.staleHint", "Última actualización vieja")} />
        <MemoHealthItem icon={BatteryWarning} label={t("systemHealth.battery", "Batería")} value={metrics.lowBattery + metrics.noBattery} tone={metrics.lowBattery || metrics.noBattery ? "warning" : "ok"} hint={t("systemHealth.batteryHint", "Baja o no reportada")} />
        <MemoHealthItem icon={BluetoothOff} label={t("systemHealth.helmetBt", "Casco BT")} value={metrics.helmetOff} tone={metrics.helmetOff ? "warning" : "ok"} hint={t("systemHealth.helmetBtHint", "Headset desconectado")} />
        <MemoHealthItem icon={ServerCrash} label="WebSocket" value={metrics.wsStatus} tone={metrics.wsDisconnected ? "danger" : "ok"} hint={t("systemHealth.wsHint", "Canal tiempo real")} />
        <MemoHealthItem icon={Smartphone} label={t("systemHealth.silentApp", "App silenciosa")} value={metrics.appSilent} tone={metrics.appSilent ? "danger" : "ok"} hint={t("systemHealth.silentAppHint", "Posible móvil/backend")} />
      </div>
    </section>
  );
}

export default memo(SystemHealthPanel);

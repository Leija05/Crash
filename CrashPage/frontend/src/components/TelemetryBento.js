import { memo, useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { Bluetooth, BluetoothOff, Gauge, MapPin, Activity, Battery } from "lucide-react";
import { useI18n } from "../i18n";

const fmtNum = (v, digits = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : "—";

/** Número con conteo animado tipo instrumento (odómetro con overshoot). */
function AnimatedValue({ value, decimals = 0, className, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value != null ? Number(value).toFixed(decimals) : "—");

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      setDisplay("—");
      return;
    }
    const from = parseFloat(display.replace(/,/g, "")) || 0;
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        setDisplay(v.toFixed(decimals));
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={`tactical-num ${className || ""}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function TelemetryBento({ driver }) {
  const { t } = useI18n();
  if (!driver) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="telemetry-bento-empty">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="double-bezel">
            <div className="glass-refined rounded-[16.5px] h-[140px] flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                {t("telemetryBento.selectDriver", "Selecciona un conductor")}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isCrit = driver.status === "critical";
  const speed = typeof driver.speed === "number" ? driver.speed : null;
  const gforce = typeof driver.gforce === "number" ? driver.gforce : null;
  const lat = typeof driver.lat === "number" ? driver.lat : null;
  const lng = typeof driver.lng === "number" ? driver.lng : null;

  const gforceTone =
    gforce == null ? "default"
    : gforce >= 4 ? "critical"
    : gforce >= 2.5 ? "warning"
    : "active";

  const speedColor = speed != null && speed > 80 ? "text-amber-400" : "text-white";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" data-testid="telemetry-bento">
      <div className={`double-bezel ${gforceTone === "critical" ? "metric-scan" : ""}`}>
        <div className="glass-refined rounded-[16.5px] p-5 h-full hover-lift">
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{t("telemetryBento.helmet", "Casco")} · Bluetooth</div>
          <div className="mt-2">
            <div className="flex items-center gap-3">
              {driver.helmet_connected ? (
                <Bluetooth className="h-7 w-7 text-emerald-400" />
              ) : (
                <BluetoothOff className="h-7 w-7 text-red-400" />
              )}
              <div>
                <div className={`font-mono text-2xl font-bold ${driver.helmet_connected ? "text-emerald-400" : "text-red-400"}`}>
                  {driver.helmet_connected ? "ONLINE" : "OFFLINE"}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {driver.helmet_connected ? t("telemetryBento.connectedHeadset", "Conectado al headset") : t("telemetryBento.noRecentTelemetry", "Sin telemetría reciente")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="double-bezel">
        <div className="glass-refined rounded-[16.5px] p-5 h-full hover-lift">
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{t("telemetryBento.speed", "Velocidad")}</div>
          <div className="mt-2">
            <div className="flex items-end gap-2">
              <Gauge className="h-7 w-7 text-emerald-400 mb-1" />
              <div>
                <AnimatedValue
                  value={speed}
                  className={`font-mono text-4xl font-bold tracking-tighter ${speedColor}`}
                />
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">km/h</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`double-bezel ${gforceTone === "critical" ? "metric-scan" : ""}`}>
        <div className={`glass-refined rounded-[16.5px] p-5 h-full hover-lift ${gforceTone === "critical" ? "glass-card-red" : gforceTone === "active" ? "glass-card-emerald" : ""}`}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">G-Force</div>
          <div className="mt-2">
            <div className="flex items-end gap-2">
              <Activity className={`h-7 w-7 mb-1 ${
                gforceTone === "critical" ? "text-red-400"
                : gforceTone === "warning" ? "text-amber-400"
                : "text-emerald-400"
              }`} />
              <div>
                <div className={`font-mono text-4xl font-bold tracking-tighter ${
                  gforceTone === "critical" ? "text-red-400" : "text-white"
                }`}>
                  <AnimatedValue value={gforce} decimals={2} />
                  <span className="text-base text-neutral-500 ml-1">G</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  {isCrit ? t("telemetryBento.gforceImpact", "IMPACTO DETECTADO")
                    : gforce != null && gforce >= 2.5 ? t("telemetryBento.gforceEffort", "Esfuerzo")
                    : gforce != null ? t("telemetryBento.gforceStable", "Estable")
                    : t("telemetryBento.gforceNoData", "Sin datos")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="double-bezel">
        <div className="glass-refined rounded-[16.5px] p-5 h-full hover-lift">
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">GPS · {t("telemetryBento.battery", "Batería")}</div>
          <div className="mt-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-6 w-6 text-emerald-400 mt-1" />
              <div className="flex-1">
                {lat != null && lng != null ? (
                  <>
                    <div className="font-mono text-sm text-white leading-tight">
                      {lat.toFixed(5)}<span className="text-neutral-500">°</span>
                    </div>
                    <div className="font-mono text-sm text-white leading-tight">
                      {lng.toFixed(5)}<span className="text-neutral-500">°</span>
                    </div>
                  </>
                ) : (
                  <div className="font-mono text-sm text-neutral-500 leading-tight">
                    {t("telemetryBento.noCoordinates", "Sin coordenadas")}
                  </div>
                )}
                {driver.battery != null ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Battery className="h-3 w-3 text-neutral-400" />
                    <div className="text-[11px] font-mono text-neutral-300">
                      <AnimatedValue value={driver.battery} />%
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TelemetryBento);

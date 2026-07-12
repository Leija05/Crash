import { useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

export function usePushNotifications(alerts = []) {
  const { pushEnabled } = useSettings();
  const notifiedRef = useRef(new Set());
  const permissionRef = useRef(null);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (permissionRef.current === null) {
      permissionRef.current = Notification.permission;
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => {
          permissionRef.current = p;
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!pushEnabled || permissionRef.current !== "granted") return;
    const critical = alerts.filter(
      (a) =>
        a.status === "pending" &&
        a.severity === "critical" &&
        !notifiedRef.current.has(a.id)
    );
    for (const alert of critical) {
      notifiedRef.current.add(alert.id);
      try {
        new Notification("C.R.A.S.H. - Alerta Cr\u00edtica", {
          body: `Impacto detectado: ${alert.driver_name || "Conductor desconocido"} - ${(alert.gforce || alert.g_force || 0).toFixed(1)}G`,
          icon: "/crash-icon.png",
          tag: alert.id,
          requireInteraction: true,
        });
      } catch {}
    }
  }, [alerts, pushEnabled]);
}
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "./api";

export function useCrashSocket() {
  const [drivers, setDrivers] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [lastImpactId, setLastImpactId] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const pendingDriversRef = useRef(null);
  const flushTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(true);

  const flush = useCallback(() => {
    if (pendingDriversRef.current) {
      setDrivers((prev) => {
        const merged = { ...prev, ...pendingDriversRef.current };
        pendingDriversRef.current = null;
        return merged;
      });
    }
    flushTimerRef.current = null;
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current == null) {
      flushTimerRef.current = setTimeout(flush, 200);
    }
  }, [flush]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const token = localStorage.getItem("crash_token") || "";
    if (!token) {
      setStatus("closed");
      return;
    }
    const url = API_BASE.replace(/^http(s)?:/, "ws$1:") + `/api/ws?token=${encodeURIComponent(token)}`;
    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      reconnectRef.current = 0;
      setStatus("open");
      heartbeatRef.current = setInterval(() => {
        try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
      }, 30000);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === "snapshot") {
        const map = {};
        for (const d of msg.drivers) map[d.id] = d;
        setDrivers(map);
        setAlerts(msg.alerts || []);
      } else if (msg.type === "telemetry_batch") {
        const next = { ...(pendingDriversRef.current || {}) };
        for (const k in (wsRef.current?._lastDrivers || {})) {
          if (!next[k]) next[k] = wsRef.current._lastDrivers[k];
        }
        for (const d of msg.drivers) next[d.id] = d;
        pendingDriversRef.current = next;
        wsRef.current._lastDrivers = next;
        scheduleFlush();
      } else if (msg.type === "alert") {
        setAlerts((prev) => [msg.alert, ...prev.filter((a) => a.id !== msg.alert.id)]);
        if (msg.alert.type === "impact" && msg.alert.status === "pending") {
          setLastImpactId(msg.alert.id);
        }
      } else if (msg.type === "alert_update") {
        setAlerts((prev) => prev.map((a) => (a.id === msg.alert.id ? msg.alert : a)));
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("closed");
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      const delay = Math.min(10000, 800 * 2 ** reconnectRef.current);
      reconnectRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };
  }, [scheduleFlush]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      try { wsRef.current?.close(); } catch {}
    };
  }, [connect]);

  return { drivers, alerts, setAlerts, status, lastImpactId };
}

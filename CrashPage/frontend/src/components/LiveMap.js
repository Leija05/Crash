import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Flame } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIcon(status) {
  const cls = `crash-marker ${status}`;
  return L.divIcon({
    className: "",
    html: `<div class="${cls}"><span class="pulse"></span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const hasCoords = (d) => typeof d?.lat === "number" && typeof d?.lng === "number";

function FocusPointController({ point, nonce }) {
  const map = useMap();
  useEffect(() => {
    if (point && nonce) {
      map.flyTo(point, 15, { duration: 0.8 });
    }
  }, [point, nonce, map]);
  return null;
}

function clusterDangerZones(points) {
  const clusters = [];
  points.forEach((p) => {
    const existing = clusters.find((c) => Math.abs(c.lat - p.lat) < 0.008 && Math.abs(c.lng - p.lng) < 0.008);
    if (existing) {
      existing.count += 1;
      existing.maxG = Math.max(existing.maxG, p.gforce || 0);
      existing.lat = (existing.lat * (existing.count - 1) + p.lat) / existing.count;
      existing.lng = (existing.lng * (existing.count - 1) + p.lng) / existing.count;
    } else {
      clusters.push({ ...p, count: 1, maxG: p.gforce || 0 });
    }
  });
  return clusters.sort((a, b) => b.count - a.count || b.maxG - a.maxG).slice(0, 5);
}

function FocusController({ focusDriver }) {
  const map = useMap();
  const lastFocusedRef = useRef(null);
  useEffect(() => {
    if (focusDriver && hasCoords(focusDriver) && focusDriver.id && lastFocusedRef.current !== focusDriver.id) {
      map.flyTo([focusDriver.lat, focusDriver.lng], 15, { duration: 0.8 });
      lastFocusedRef.current = focusDriver.id;
    }
  }, [focusDriver, map]);
  return null;
}

function DriverMarkers({ positioned, onSelect }) {
  return positioned.map((d) => {
    const recentPath = (d.recent_path || d.route || [])
      .map((p) => [p.lat, p.lng])
      .filter(([lat, lng]) => typeof lat === "number" && typeof lng === "number");
    return (
      <Marker
        key={d.id}
        position={[d.lat, d.lng]}
        icon={makeIcon(d.status)}
        eventHandlers={{ click: () => onSelect?.(d.id) }}
      >
        <Popup>
          <div className="min-w-[200px]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{d.id?.slice?.(-8)}</div>
            <div className="font-semibold text-base mb-2">{d.name}</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div><div className="text-[10px] uppercase text-neutral-500">Velocidad</div><div className="text-emerald-400">{d.speed != null ? `${Math.round(d.speed)} km/h` : "—"}</div></div>
              <div><div className="text-[10px] uppercase text-neutral-500">G-Force</div><div className={d.gforce > 3 ? "text-red-400" : "text-white"}>{d.gforce != null ? d.gforce.toFixed(2) : "—"}G</div></div>
              <div className="col-span-2"><div className="text-[10px] uppercase text-neutral-500">GPS</div><div>{d.lat.toFixed(5)}, {d.lng.toFixed(5)}</div></div>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });
}

const MemoDriverMarkers = memo(DriverMarkers);

const HEAT_SEVERITY = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

function HeatLayer({ points }) {
  if (!points || points.length === 0) return null;
  return points.map((p, i) => (
    <CircleMarker key={`heat-${i}`} center={[p.lat, p.lng]} radius={Math.min(20, 6 + (p.weight || 1) * 3)}
      pathOptions={{ color: HEAT_SEVERITY[p.severity] || "#ef4444", fillColor: HEAT_SEVERITY[p.severity] || "#ef4444", fillOpacity: 0.4, weight: 1, opacity: 0.6 }}>
      <Popup>
        <div className="text-xs">
          <div className="font-semibold capitalize">{p.severity}</div>
          {p.company_name && <div>{p.company_name}</div>}
          <div>{p.g_force != null ? `${Number(p.g_force).toFixed(2)}G` : ""}</div>
          <div className="text-neutral-400">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</div>
        </div>
      </Popup>
    </CircleMarker>
  ));
}

function LiveMap({ drivers, alerts, selectedId, onSelect, heatPoints }) {
  const [theme, setTheme] = useState(() => document.body.dataset.theme || "dark");
  const [focusNonce, setFocusNonce] = useState(0);

  useEffect(() => {
    const updateTheme = () => setTheme(document.body.dataset.theme || "dark");
    window.addEventListener("themechange", updateTheme);
    return () => window.removeEventListener("themechange", updateTheme);
  }, []);

  const driverList = useMemo(() => Object.values(drivers || {}), [drivers]);
  const positioned = useMemo(() => driverList.filter(hasCoords), [driverList]);

  const { impactPoints, dangerZones, latestImpact } = useMemo(() => {
    const points = (alerts || [])
      .filter((a) => a.type === "impact" && typeof a.lat === "number" && typeof a.lng === "number")
      .map((a) => ({ lat: a.lat, lng: a.lng, gforce: a.gforce, id: a.id, driver: a.driver_name || a.driver_id }));
    return {
      impactPoints: points,
      dangerZones: clusterDangerZones(points),
      latestImpact: points[0] || null,
    };
  }, [alerts]);

  const center = positioned[0] ? [positioned[0].lat, positioned[0].lng] : [19.4326, -99.1332];
  const focus = selectedId ? drivers[selectedId] : null;
  const noGpsCount = driverList.length - positioned.length;
  const handleSelect = useCallback((id) => onSelect?.(id), [onSelect]);
  const handleFocusImpact = useCallback(() => setFocusNonce((n) => n + 1), []);

  return (
    <div className="relative h-full w-full" data-testid="live-map">
      <MapContainer key={`live-map-${theme}`}
        center={center}
        zoom={13}
        scrollWheelZoom
        zoomControl={true}
        className="h-full w-full"
        style={{ background: theme === "light" ? "#dbe7f3" : "#0a0a0a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">carto.com</a>'
          url={theme === "light"
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
        />
        <FocusController focusDriver={focus} />
        <FocusPointController point={latestImpact ? [latestImpact.lat, latestImpact.lng] : null} nonce={focusNonce} />

        {dangerZones.map((z, idx) => (
          <Circle
            key={`danger-zone-${idx}-${z.lat}-${z.lng}`}
            center={[z.lat, z.lng]}
            radius={180 + z.count * 55}
            pathOptions={{ color: z.count > 1 ? "#ef4444" : "#f97316", fillColor: z.count > 1 ? "#ef4444" : "#f97316", fillOpacity: Math.min(0.22, 0.08 + z.count * 0.04), opacity: 0.35, weight: 1 }}
          >
            <Popup><div className="text-xs"><div className="font-semibold">Zona peligrosa</div><div>{z.count} impacto{z.count > 1 ? "s" : ""} registrado{z.count > 1 ? "s" : ""}</div><div>G máx: {z.maxG ? z.maxG.toFixed(2) : "—"}</div></div></Popup>
          </Circle>
        ))}

        {impactPoints.map((p) => (
          <CircleMarker
            key={`impact-heat-${p.id}`}
            center={[p.lat, p.lng]}
            radius={Math.min(18, 6 + (p.gforce || 1) * 2)}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.42, weight: 1, opacity: 0.55 }}
          >
            <Popup><div className="text-xs"><div className="font-semibold">Impacto histórico</div><div>{p.driver || "Conductor"}</div><div>{p.gforce != null ? `${p.gforce.toFixed(2)}G` : "G-Force no reportada"}</div></div></Popup>
          </CircleMarker>
        ))}

        <HeatLayer points={heatPoints} />

        {positioned.map((d) => {
          const recentPath = (d.recent_path || d.route || [])
            .map((p) => [p.lat, p.lng])
            .filter(([lat, lng]) => typeof lat === "number" && typeof lng === "number");
          return recentPath.length > 1 ? (
            <Polyline
              key={`route-${d.id}`}
              positions={recentPath}
              pathOptions={{ color: d.status === "critical" ? "#ef4444" : "#10b981", weight: 2, opacity: 0.5 }}
            />
          ) : null;
        })}

        <MemoDriverMarkers positioned={positioned} onSelect={handleSelect} />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[400] rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-3 text-[10px] uppercase tracking-[0.2em] text-neutral-300 space-y-1.5">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" /> Activo</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]" /> Accidente</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Advertencia</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-neutral-600" /> Offline</div>
      </div>

      {latestImpact ? (
        <button
          type="button"
          onClick={handleFocusImpact}
          className="absolute top-4 left-4 z-[400] rounded-xl border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 backdrop-blur-xl px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-red-200 flex items-center gap-2 transition-colors"
          data-testid="focus-latest-impact"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Centrar accidente reciente
        </button>
      ) : null}

      {dangerZones.length > 0 ? (
        <div className="absolute bottom-4 right-4 z-[400] rounded-xl border border-red-500/25 bg-black/40 backdrop-blur-xl p-3 text-[10px] uppercase tracking-[0.2em] text-red-200 space-y-1.5">
          <div className="font-semibold">Heatmap activo</div>
          <div className="text-neutral-400 normal-case tracking-normal">{dangerZones.length} zona{dangerZones.length > 1 ? "s" : ""} con impactos</div>
        </div>
      ) : null}

      {noGpsCount > 0 ? (
        <div data-testid="no-gps-banner" className="absolute top-4 right-4 z-[400] max-w-[280px] rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-300">
          {noGpsCount} sin GPS — el mobile aún no envía coordenadas en /api/telemetry
        </div>
      ) : null}
    </div>
  );
}

export default memo(LiveMap);

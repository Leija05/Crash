import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, RED } from '../theme';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: string;
  gForce?: number;
  speed?: number;
}

interface GPSMapProps {
  route: RoutePoint[];
  impactPoint?: { latitude: number; longitude: number; g_force?: number; speed_kmh?: number } | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  width?: number;
  height?: number;
  style?: ViewStyle;
  showImpactMarker?: boolean;
  showCurrentLocation?: boolean;
  animateRoute?: boolean;
  onPress?: (point: RoutePoint, index: number) => void;
}

export function GPSMap({
  route = [],
  impactPoint,
  currentLocation,
  width = 340,
  height = 240,
  style,
  showImpactMarker = true,
  showCurrentLocation = true,
}: GPSMapProps) {
  const [mapType, setMapType] = useState<'interactive' | 'vector'>('interactive');
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (
      webViewLoaded &&
      currentLocation &&
      typeof currentLocation.latitude === 'number' &&
      typeof currentLocation.longitude === 'number'
    ) {
      const script = `if (window.setVehiclePos) { window.setVehiclePos(${currentLocation.latitude}, ${currentLocation.longitude}); } true;`;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [currentLocation, webViewLoaded]);

  // Normalizar los puntos de la ruta
  const validRoute = useMemo(() => {
    return route.filter(
      (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
    );
  }, [route]);

  // Punto central de referencia (impacto, último punto de la ruta o ubicación actual)
  const centerLat = impactPoint?.latitude ?? validRoute[validRoute.length - 1]?.latitude ?? currentLocation?.latitude ?? 25.6866;
  const centerLon = impactPoint?.longitude ?? validRoute[validRoute.length - 1]?.longitude ?? currentLocation?.longitude ?? -100.3161;

  // Código HTML de Leaflet embebido para CartoDB Dark Matter
  const leafletHtml = useMemo(() => {
    const routeCoords = validRoute.map((p) => [p.latitude, p.longitude]);
    const startCoord = validRoute.length > 0 ? [validRoute[0].latitude, validRoute[0].longitude] : null;
    const impactCoord = impactPoint && impactPoint.latitude && impactPoint.longitude
      ? [impactPoint.latitude, impactPoint.longitude]
      : null;

    const gForceText = impactPoint?.g_force ? `${impactPoint.g_force.toFixed(1)}G` : '';
    const speedText = impactPoint?.speed_kmh ? `${Math.round(impactPoint.speed_kmh)} km/h` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; }
          body, html, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #0A0A0C;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
          }
          .leaflet-control-attribution { display: none !important; }
          .leaflet-bar { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; }
          .leaflet-bar a {
            background-color: rgba(26,26,30,0.9) !important;
            color: #FFFFFF !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          }
          .pulse-marker-wrapper {
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pulse-marker {
            width: 16px;
            height: 16px;
            background: #EF4444;
            border: 2.5px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 16px #EF4444;
            z-index: 2;
          }
          .pulse-ring {
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.4);
            animation: pulseAnim 1.8s infinite ease-out;
            z-index: 1;
          }
          @keyframes pulseAnim {
            0% { transform: scale(0.4); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          .start-marker {
            width: 12px;
            height: 12px;
            background: #10B981;
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 10px #10B981;
          }
          .vehicle-marker-wrapper {
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .vehicle-pulsar {
            width: 24px;
            height: 24px;
            border-radius: 12px;
            background: rgba(96, 165, 250, 0.3);
            border: 2px solid #60A5FA;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px rgba(96, 165, 250, 0.9);
            animation: vPulse 1.6s infinite ease-out;
          }
          .vehicle-core {
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: #FFFFFF;
          }
          @keyframes vPulse {
            0% { transform: scale(0.9); opacity: 0.85; }
            50% { transform: scale(1.18); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.85; }
          }
          .leaflet-popup-content-wrapper {
            background: rgba(18, 18, 22, 0.95) !important;
            backdrop-filter: blur(12px);
            color: #FFFFFF !important;
            border: 1px solid rgba(239, 68, 68, 0.45) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7) !important;
            padding: 2px !important;
          }
          .leaflet-popup-content {
            margin: 8px 12px !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .leaflet-popup-tip { background: rgba(18, 18, 22, 0.95) !important; }
          .impact-title {
            color: #EF4444;
            font-weight: 800;
            letter-spacing: 1px;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .impact-coord {
            color: rgba(255,255,255,0.7);
            font-family: monospace;
            font-size: 10px;
          }
          .impact-badge {
            display: inline-block;
            background: rgba(239,68,68,0.2);
            color: #EF4444;
            padding: 2px 6px;
            border-radius: 6px;
            font-weight: 700;
            margin-top: 4px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${centerLat}, ${centerLon}], 15);

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          // CartoDB Dark Matter tiles
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          const routeCoords = ${JSON.stringify(routeCoords)};
          const impactCoord = ${JSON.stringify(impactCoord)};
          const startCoord = ${JSON.stringify(startCoord)};

          let bounds = [];

          // Dibujar ruta previa al impacto
          if (routeCoords.length > 1) {
            // Línea de brillo exterior
            L.polyline(routeCoords, {
              color: '#EF4444',
              weight: 6,
              opacity: 0.25,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);

            // Línea principal
            L.polyline(routeCoords, {
              color: '#EF4444',
              weight: 3.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);

            routeCoords.forEach(c => bounds.push(c));
          }

          // Marcador de inicio de ruta
          if (startCoord && routeCoords.length > 1) {
            const startIcon = L.divIcon({
              className: 'custom-start-marker',
              html: '<div class="start-marker"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            });
            L.marker(startCoord, { icon: startIcon }).addTo(map).bindPopup('<b>Inicio de Trayecto</b>');
            bounds.push(startCoord);
          }

          // Marcador del punto de impacto
          if (impactCoord) {
            const impactIcon = L.divIcon({
              className: 'custom-impact-marker',
              html: '<div class="pulse-marker-wrapper"><div class="pulse-ring"></div><div class="pulse-marker"></div></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            const popupHtml = '<div class="impact-title">PUNTO DE IMPACTO</div>' +
              '<div class="impact-coord">' + impactCoord[0].toFixed(5) + ', ' + impactCoord[1].toFixed(5) + '</div>' +
              '${gForceText ? `<span class="impact-badge">${gForceText}</span>` : ''}' +
              '${speedText ? ` <span class="impact-badge" style="color:#60A5FA;background:rgba(96,165,250,0.15)">${speedText}</span>` : ''}';

            const marker = L.marker(impactCoord, { icon: impactIcon }).addTo(map)
              .bindPopup(popupHtml, { autoClose: false, closeOnClick: false })
              .openPopup();

            bounds.push(impactCoord);
          }

          // Ajustar vista para encuadrar toda la ruta y el impacto
          if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
          } else {
            map.setView([${centerLat}, ${centerLon}], 15);
          }

          let vehicleMarker = null;
          window.setVehiclePos = function(lat, lng) {
            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
            const vIcon = L.divIcon({
              className: 'vehicle-marker-wrapper',
              html: '<div class="vehicle-pulsar"><div class="vehicle-core"></div></div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            if (!vehicleMarker) {
              vehicleMarker = L.marker([lat, lng], { icon: vIcon, zIndexOffset: 2500 }).addTo(map);
            } else {
              vehicleMarker.setLatLng([lat, lng]);
            }
          };

          ${currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' ? `window.setVehiclePos(${currentLocation.latitude}, ${currentLocation.longitude});` : ''}
        </script>
      </body>
      </html>
    `;
  }, [validRoute, impactPoint, centerLat, centerLon]);

  // Si el usuario eligió vista vectorial o el WebView tuvo error, renderizar SVG
  if (mapType === 'vector' || webViewError) {
    const padding = 20;
    const mapW = width - padding * 2;
    const mapH = height - padding * 2;

    const allPoints = [
      ...validRoute,
      ...(impactPoint ? [{ latitude: impactPoint.latitude, longitude: impactPoint.longitude }] : []),
    ];

    const lats = allPoints.map((p) => p.latitude);
    const lons = allPoints.map((p) => p.longitude);

    const minLat = lats.length ? Math.min(...lats) : 0;
    const maxLat = lats.length ? Math.max(...lats) : 0;
    const minLon = lons.length ? Math.min(...lons) : 0;
    const maxLon = lons.length ? Math.max(...lons) : 0;

    const latRange = maxLat - minLat || 0.001;
    const lonRange = maxLon - minLon || 0.001;

    const project = (lat: number, lon: number) => ({
      x: padding + ((lon - minLon) / lonRange) * mapW,
      y: padding + ((maxLat - lat) / latRange) * mapH,
    });

    const projectedRoute = validRoute.map((p) => project(p.latitude, p.longitude));
    const projectedImpact = impactPoint ? project(impactPoint.latitude, impactPoint.longitude) : null;

    let pathD = '';
    if (projectedRoute.length > 1) {
      pathD = `M ${projectedRoute[0].x} ${projectedRoute[0].y}`;
      for (let i = 1; i < projectedRoute.length; i++) {
        pathD += ` L ${projectedRoute[i].x} ${projectedRoute[i].y}`;
      }
    }

    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={styles.badgeBar}>
          <View style={styles.badgeLeft}>
            <Ionicons name="analytics" size={12} color={RED} />
            <Text style={styles.badgeText}>TELEMETRÍA VECTORIAL</Text>
          </View>
          <TouchableOpacity onPress={() => { setWebViewError(false); setMapType('interactive'); }} style={styles.switchBtn}>
            <Ionicons name="map-outline" size={13} color="#FFFFFF" />
            <Text style={styles.switchBtnText}>Ver Mapa Calles</Text>
          </TouchableOpacity>
        </View>

        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="impactGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {pathD ? (
            <>
              <Path d={pathD} stroke="#EF4444" strokeWidth={5} strokeOpacity={0.25} fill="none" strokeLinecap="round" />
              <Path d={pathD} stroke="#EF4444" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            </>
          ) : null}

          {projectedRoute.length > 0 && (
            <Circle cx={projectedRoute[0].x} cy={projectedRoute[0].y} r={5} fill="#10B981" stroke="#FFFFFF" strokeWidth={1.5} />
          )}

          {projectedImpact && (
            <>
              <Circle cx={projectedImpact.x} cy={projectedImpact.y} r={18} fill="url(#impactGlow)" />
              <Circle cx={projectedImpact.x} cy={projectedImpact.y} r={7} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
            </>
          )}

          {currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' && (
            (() => {
              const p = project(currentLocation.latitude, currentLocation.longitude);
              return (
                <>
                  <Circle cx={p.x} cy={p.y} r={14} fill="rgba(96,165,250,0.3)" />
                  <Circle cx={p.x} cy={p.y} r={5} fill="#60A5FA" stroke="#FFFFFF" strokeWidth={2} />
                </>
              );
            })()
          )}
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setWebViewLoaded(true)}
        onError={() => setWebViewError(true)}
      />

      {!webViewLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={RED} />
          <Text style={styles.loadingText}>Cargando mapa táctico...</Text>
        </View>
      )}

      {/* Selector de capas flotante */}
      <View style={styles.layerSwitchOverlay}>
        <View style={styles.statusIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.statusIndicatorText}>
            {validRoute.length > 0 ? `${validRoute.length} pts de ruta` : 'Punto GPS'}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setMapType('vector')} style={styles.modeToggleBtn}>
          <Ionicons name="git-commit-outline" size={13} color="#FFFFFF" />
          <Text style={styles.modeToggleBtnText}>Vector</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  layerSwitchOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,10,12,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED,
  },
  statusIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONT.heading,
    letterSpacing: 0.5,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,26,30,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modeToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  badgeBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,10,12,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  badgeText: {
    color: RED,
    fontSize: 10,
    fontFamily: FONT.headingBold,
    letterSpacing: 0.8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,26,30,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  switchBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONT.medium,
  },
});

export default GPSMap;
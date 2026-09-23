import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useAuth } from './AuthContext';
import { useBluetooth } from './BluetoothContext';
import { usePhoneSensor } from './PhoneSensorContext';
import { settingsAPI, locationAPI } from '../services/api';
import { phoneSensorEngine } from '../services/phoneSensorEngine';

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  timestamp: number;
};

export interface RouteBreadcrumb {
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: string;
}

type LocationCtx = {
  permissionGranted: boolean | null;
  permissionStatus: Location.LocationPermissionResponse['status'] | null;
  grantedLocation: GeoPoint | null;
  currentLocation: GeoPoint | null;
  routeHistory: GeoPoint[];
  getRecentRoute: () => RouteBreadcrumb[];
  isTracking: boolean;
  trackingEnabled: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  startLiveTracking: () => Promise<void>;
  stopLiveTracking: () => void;
  linkPermissionLocation: () => Promise<boolean>;
};

export const BACKGROUND_LOCATION_TASK = 'crash-background-location-task';

// Registrar tarea de ubicación en segundo plano para Android Foreground Service
try {
  if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
      if (error) {
        console.warn('Error en tarea de ubicación en segundo plano:', error);
        return;
      }
      if (data && data.locations && data.locations.length > 0) {
        const latest = data.locations[data.locations.length - 1];
        if (latest?.coords) {
          phoneSensorEngine.updateCurrentLocation({
            latitude: latest.coords.latitude,
            longitude: latest.coords.longitude,
            speed: latest.coords.speed,
          });
        }
      }
    });
  }
} catch (e) {
  console.warn('No se pudo registrar BACKGROUND_LOCATION_TASK:', e);
}

const LocationContext = createContext<LocationCtx>({} as any);
export const useLocation = () => useContext(LocationContext);

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 2500,
  distanceInterval: 5,
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { connected } = useBluetooth();
  const { phoneSensorActive } = usePhoneSensor();

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse['status'] | null>(null);
  const [grantedLocation, setGrantedLocation] = useState<GeoPoint | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [routeHistory, setRouteHistory] = useState<GeoPoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentAtRef = useRef(0);
  const connectedRef = useRef(connected);
  connectedRef.current = connected;
  const phoneSensorRef = useRef(phoneSensorActive);
  phoneSensorRef.current = phoneSensorActive;

  const appendRoutePoint = useCallback((point: GeoPoint) => {
    phoneSensorEngine.updateCurrentLocation({
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
    });
    setRouteHistory((prev) => {
      // Evitar puntos duplicados exactos si no hubo desplazamiento
      const last = prev[prev.length - 1];
      if (
        last &&
        Math.abs(last.latitude - point.latitude) < 0.00002 &&
        Math.abs(last.longitude - point.longitude) < 0.00002
      ) {
        return prev;
      }
      const updated = [...prev, point];
      // Guardar últimas 50 posiciones para la ruta del impacto
      return updated.slice(-50);
    });
  }, []);

  const getRecentRoute = useCallback((): RouteBreadcrumb[] => {
    if (routeHistory.length === 0 && currentLocation) {
      return [
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          speed: currentLocation.speed ?? 0,
          timestamp: new Date(currentLocation.timestamp).toISOString(),
        },
      ];
    }
    return routeHistory.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      speed: p.speed ?? 0,
      timestamp: new Date(p.timestamp).toISOString(),
    }));
  }, [routeHistory, currentLocation]);

  const capturePosition = useCallback(async (): Promise<GeoPoint | null> => {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed !== null && pos.coords.speed >= 0 ? Math.round(pos.coords.speed * 3.6) : null,
        timestamp: pos.timestamp,
      };
    } catch (e) {
      console.warn('No se pudo capturar la posición', e);
      return null;
    }
  }, []);

  const linkPermissionLocation = useCallback(async (): Promise<boolean> => {
    if (!token || !grantedLocation) return false;
    try {
      await locationAPI.linkPermissionLocation(token, {
        latitude: grantedLocation.latitude,
        longitude: grantedLocation.longitude,
        accuracy: grantedLocation.accuracy,
      });
      return true;
    } catch (e) {
      console.warn('No se pudo vincular la ubicación con la cuenta', e);
      return false;
    }
  }, [token, grantedLocation]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (granted) {
        const point = await capturePosition();
        if (point) {
          setGrantedLocation(point);
          setCurrentLocation(point);
          appendRoutePoint(point);
          if (token) {
            try {
              await locationAPI.linkPermissionLocation(token, {
                latitude: point.latitude,
                longitude: point.longitude,
                accuracy: point.accuracy,
              });
            } catch (e) {
              console.warn('No se pudo vincular ubicación tras otorgar permiso', e);
            }
          }
        }
      } else {
        setError('Permiso de ubicación denegado');
      }
      return granted;
    } catch {
      setError('No se pudo solicitar el permiso de ubicación');
      return false;
    }
  }, [capturePosition, token, appendRoutePoint]);

  const sendLiveLocation = useCallback(async (point: GeoPoint) => {
    if (!token) return;
    if (!connectedRef.current && !phoneSensorRef.current) return;
    const now = Date.now();
    if (now - lastSentAtRef.current < 2000) return;
    lastSentAtRef.current = now;
    try {
      await locationAPI.send(token, {
        latitude: point.latitude,
        longitude: point.longitude,
        gps_accuracy_m: point.accuracy ?? null,
        helmet_connected: connectedRef.current,
      });
    } catch (e) {
      console.warn('No se pudo enviar la ubicación en vivo', e);
    }
  }, [token]);

  const startBackgroundTracking = useCallback(async () => {
    try {
      const bgPerm = await Location.getBackgroundPermissionsAsync();
      if (bgPerm.status !== 'granted') {
        const req = await Location.requestBackgroundPermissionsAsync();
        if (req.status !== 'granted') return;
      }
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 10,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'C.R.A.S.H. Protegiendo en segundo plano',
            notificationBody: 'Monitoreo activo de impacto y geolocalización',
            notificationColor: '#DC2626',
          },
        });
      }
    } catch (e) {
      console.warn('No se pudo iniciar servicio en segundo plano:', e);
    }
  }, []);

  const stopBackgroundTracking = useCallback(async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch {}
  }, []);

  const startLiveTracking = useCallback(async () => {
    if (isTracking || watchRef.current) return;
    if (permissionGranted !== true) {
      const ok = await requestPermission();
      if (!ok) return;
    }
    try {
      const point = await capturePosition();
      if (point) {
        setCurrentLocation(point);
        appendRoutePoint(point);
        if (connectedRef.current || phoneSensorRef.current) await sendLiveLocation(point);
      }

      watchRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (pos) => {
        const next: GeoPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          speed: pos.coords.speed !== null && pos.coords.speed >= 0 ? Math.round(pos.coords.speed * 3.6) : null,
          timestamp: pos.timestamp,
        };
        setCurrentLocation(next);
        appendRoutePoint(next);
        if (connectedRef.current || phoneSensorRef.current) sendLiveLocation(next);
      });

      setIsTracking(true);
      // Iniciar también en segundo plano con Foreground Service
      startBackgroundTracking().catch(() => {});
    } catch (e) {
      console.warn('No se pudo iniciar el rastreo en vivo', e);
      setError('No se pudo iniciar el rastreo de ubicación');
    }
  }, [isTracking, permissionGranted, requestPermission, capturePosition, sendLiveLocation, appendRoutePoint, startBackgroundTracking]);

  const stopLiveTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
    stopBackgroundTracking().catch(() => {});
  }, [stopBackgroundTracking]);

  // Solicitar permiso y vincular ubicación al entrar a la app
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (status === 'granted') {
        setPermissionStatus(status);
        setPermissionGranted(true);
        const point = await capturePosition();
        if (!cancelled && point) {
          setGrantedLocation(point);
          setCurrentLocation(point);
          appendRoutePoint(point);
          if (token) {
            try {
              await locationAPI.linkPermissionLocation(token, {
                latitude: point.latitude,
                longitude: point.longitude,
                accuracy: point.accuracy,
              });
            } catch (e) {
              console.warn('No se pudo vincular ubicación al iniciar', e);
            }
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, capturePosition, appendRoutePoint]);

  // Cargar configuración de rastreo
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const s = await settingsAPI.get(token);
        setTrackingEnabled(s?.location_tracking_enabled !== false);
      } catch (e) {
        console.warn('No se pudo cargar configuración de ubicación', e);
      }
    })();
  }, [token]);

  // Iniciar rastreo continuo si el casco BLE está conectado O si el Modo Sensor Teléfono está activo
  useEffect(() => {
    const shouldTrack = connected || phoneSensorActive;
    if (permissionGranted === true && trackingEnabled && shouldTrack) {
      startLiveTracking();
    } else if (!shouldTrack) {
      stopLiveTracking();
    }
  }, [permissionGranted, trackingEnabled, connected, phoneSensorActive, startLiveTracking, stopLiveTracking]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
      stopBackgroundTracking().catch(() => {});
    };
  }, [stopBackgroundTracking]);

  return (
    <LocationContext.Provider
      value={{
        permissionGranted,
        permissionStatus,
        grantedLocation,
        currentLocation,
        routeHistory,
        getRecentRoute,
        isTracking,
        trackingEnabled,
        error,
        requestPermission,
        startLiveTracking,
        stopLiveTracking,
        linkPermissionLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import { useBluetooth } from './BluetoothContext';
import { settingsAPI, locationAPI } from '../services/api';

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
};

type LocationCtx = {
  permissionGranted: boolean | null;
  permissionStatus: Location.LocationPermissionResponse['status'] | null;
  grantedLocation: GeoPoint | null;
  currentLocation: GeoPoint | null;
  isTracking: boolean;
  trackingEnabled: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  startLiveTracking: () => Promise<void>;
  stopLiveTracking: () => void;
  linkPermissionLocation: () => Promise<boolean>;
};

const LocationContext = createContext<LocationCtx>({} as any);
export const useLocation = () => useContext(LocationContext);

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 3000,
  distanceInterval: 10,
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { connected } = useBluetooth();

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse['status'] | null>(null);
  const [grantedLocation, setGrantedLocation] = useState<GeoPoint | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentAtRef = useRef(0);
  const connectedRef = useRef(connected);
  connectedRef.current = connected;

  const capturePosition = useCallback(async (): Promise<GeoPoint | null> => {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
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
          // Vincular ubicación con la cuenta si ya hay sesión
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
  }, [capturePosition, token]);

  const sendLiveLocation = useCallback(async (point: GeoPoint) => {
    if (!token) return;
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
        await sendLiveLocation(point);
      }
      watchRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (pos) => {
        const next: GeoPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          timestamp: pos.timestamp,
        };
        setCurrentLocation(next);
        sendLiveLocation(next);
      });
      setIsTracking(true);
    } catch (e) {
      console.warn('No se pudo iniciar el rastreo en vivo', e);
      setError('No se pudo iniciar el rastreo de ubicación');
    }
  }, [isTracking, permissionGranted, requestPermission, capturePosition, sendLiveLocation]);

  const stopLiveTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
  }, []);

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
          // Enviar ubicación inicial al backend aunque no haya casco BLE
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
  }, [token, capturePosition]);

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

  // Iniciar rastreo cuando haya permiso y tracking activado (con o sin BLE)
  useEffect(() => {
    if (permissionGranted === true && trackingEnabled) {
      startLiveTracking();
    } else {
      stopLiveTracking();
    }
  }, [permissionGranted, trackingEnabled, startLiveTracking, stopLiveTracking]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        permissionGranted,
        permissionStatus,
        grantedLocation,
        currentLocation,
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

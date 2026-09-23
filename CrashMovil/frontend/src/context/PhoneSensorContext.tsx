import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { phoneSensorEngine, PhoneTelemetryData, DetectedImpact } from '../services/phoneSensorEngine';

interface PhoneSensorContextType {
  phoneSensorActive: boolean;
  canUsePhoneSensor: boolean;
  phoneTelemetry: PhoneTelemetryData | null;
  latestDetectedImpact: DetectedImpact | null;
  togglePhoneSensor: (forced?: boolean) => Promise<boolean>;
  clearDetectedImpact: () => void;
  setSensorThreshold: (threshold: number) => void;
}

const STORAGE_KEY = 'crash_admin_phone_sensor_enabled';

const PhoneSensorContext = createContext<PhoneSensorContextType>({
  phoneSensorActive: false,
  canUsePhoneSensor: false,
  phoneTelemetry: null,
  latestDetectedImpact: null,
  togglePhoneSensor: async () => false,
  clearDetectedImpact: () => {},
  setSensorThreshold: () => {},
});

export const usePhoneSensor = () => useContext(PhoneSensorContext);

export function PhoneSensorProvider({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [phoneSensorActive, setPhoneSensorActive] = useState(false);
  const [phoneTelemetry, setPhoneTelemetry] = useState<PhoneTelemetryData | null>(null);
  const [latestDetectedImpact, setLatestDetectedImpact] = useState<DetectedImpact | null>(null);

  // Verificamos si el usuario tiene rol de administrador o superadmin
  const canUsePhoneSensor = Boolean(
    isSuperAdmin ||
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user as any)?.is_root
  );

  // Cargar preferencia guardada al iniciar si tiene permisos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'true' && canUsePhoneSensor && mounted) {
          setPhoneSensorActive(true);
          phoneSensorEngine.start();
        }
      } catch (e) {
        console.warn('Could not read phone sensor preference', e);
      }
    })();

    return () => {
      mounted = false;
      phoneSensorEngine.stop();
    };
  }, [canUsePhoneSensor]);

  // Si el usuario deja de tener permisos o cierra sesión, apagar sensores
  useEffect(() => {
    if (!canUsePhoneSensor && phoneSensorActive) {
      setPhoneSensorActive(false);
      phoneSensorEngine.stop();
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, [canUsePhoneSensor, phoneSensorActive]);

  // Suscribirse a los datos del motor
  useEffect(() => {
    if (!phoneSensorActive) {
      setPhoneTelemetry(null);
      return;
    }

    const unsubTelemetry = phoneSensorEngine.onTelemetry((data) => {
      setPhoneTelemetry(data);
    });

    const unsubImpact = phoneSensorEngine.onImpact((impact) => {
      setLatestDetectedImpact(impact);
    });

    return () => {
      unsubTelemetry();
      unsubImpact();
    };
  }, [phoneSensorActive]);

  const togglePhoneSensor = useCallback(async (forced?: boolean): Promise<boolean> => {
    if (!canUsePhoneSensor) return false;

    const nextState = forced !== undefined ? forced : !phoneSensorActive;
    setPhoneSensorActive(nextState);

    if (nextState) {
      phoneSensorEngine.start();
      await AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    } else {
      phoneSensorEngine.stop();
      setPhoneTelemetry(null);
      await AsyncStorage.setItem(STORAGE_KEY, 'false').catch(() => {});
    }

    return nextState;
  }, [canUsePhoneSensor, phoneSensorActive]);

  const clearDetectedImpact = useCallback(() => {
    setLatestDetectedImpact(null);
  }, []);

  const setSensorThreshold = useCallback((threshold: number) => {
    phoneSensorEngine.setThreshold(threshold);
  }, []);

  return (
    <PhoneSensorContext.Provider
      value={{
        phoneSensorActive,
        canUsePhoneSensor,
        phoneTelemetry,
        latestDetectedImpact,
        togglePhoneSensor,
        clearDetectedImpact,
        setSensorThreshold,
      }}
    >
      {children}
    </PhoneSensorContext.Provider>
  );
}

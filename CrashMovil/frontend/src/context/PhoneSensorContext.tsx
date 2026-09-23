import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
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

  // Cargar preferencia guardada al iniciar si tiene permisos y validando antes de encender
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'true' && canUsePhoneSensor && mounted) {
          // Verificar si ya cuenta con permisos concedidos para evitar SecurityException
          const locPerm = await Location.getForegroundPermissionsAsync().catch(() => null);
          if (locPerm?.granted) {
            setPhoneSensorActive(true);
            phoneSensorEngine.start();
          } else {
            // Si no tiene permisos, no auto-activar sin preguntar
            await AsyncStorage.setItem(STORAGE_KEY, 'false').catch(() => {});
          }
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

    if (nextState) {
      // 1. Solicitar permisos de Ubicación proactivamente en tiempo de ejecución
      try {
        let { status: locStatus } = await Location.getForegroundPermissionsAsync().catch(() => ({ status: 'undetermined' } as any));
        if (locStatus !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' } as any));
          locStatus = req.status;
        }

        if (locStatus !== 'granted') {
          Alert.alert(
            'Permiso de Ubicación Necesario',
            'C.R.A.S.H. requiere acceso a tu ubicación para calcular velocidad, registrar la trayectoria en la caja negra y geolocalizar impactos.\n\nPor favor, otorga el permiso para continuar.',
            [
              { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
              { text: 'Cancelar', style: 'cancel' },
            ]
          );
          return false;
        }
      } catch (locErr) {
        console.warn('Error verificando permisos de ubicación', locErr);
        return false;
      }

      // 2. Solicitar permisos de Notificaciones en tiempo de ejecución (Android 13+)
      if (Platform.OS === 'android') {
        try {
          const { status: notifStatus } = await Notifications.requestPermissionsAsync().catch(() => ({ status: 'undetermined' } as any));
          if (notifStatus !== 'granted') {
            Alert.alert(
              'Permiso de Notificaciones',
              'Para que C.R.A.S.H. muestre la barra de telemetría y te permita cancelar o despachar alertas de impacto en segundo plano, por favor activa las notificaciones.',
              [
                { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
                { text: 'Continuar de todos modos', style: 'default' },
              ]
            );
          }
        } catch (notifErr) {
          console.warn('Error solicitando notificaciones', notifErr);
        }
      }

      setPhoneSensorActive(true);
      phoneSensorEngine.start();
      await AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
      return true;
    } else {
      setPhoneSensorActive(false);
      phoneSensorEngine.stop();
      setPhoneTelemetry(null);
      await AsyncStorage.setItem(STORAGE_KEY, 'false').catch(() => {});
      return false;
    }
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

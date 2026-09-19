import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppSettings = {
  developerMode: boolean;
  deviceName: string;
  autoReconnect: boolean;
  setDeveloperMode: (v: boolean) => Promise<void>;
  setDeviceName: (v: string) => Promise<void>;
  setAutoReconnect: (v: boolean) => Promise<void>;
  alertsConfigVersion: number;
  notifyAlertsConfigChanged: () => void;
  ready: boolean;
};

const DEFAULTS = {
  developerMode: false,
  deviceName: 'HC-05',
  autoReconnect: false,
};

const AppSettingsContext = createContext<AppSettings>({
  ...DEFAULTS,
  setDeveloperMode: async () => {},
  setDeviceName: async () => {},
  setAutoReconnect: async () => {},
  alertsConfigVersion: 0,
  notifyAlertsConfigChanged: () => {},
  ready: false,
});

export const useAppSettings = () => useContext(AppSettingsContext);

const STORAGE_KEY = 'crash.appSettings.v1';

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [developerMode, setDevMode] = useState(DEFAULTS.developerMode);
  const [deviceName, setDevName] = useState(DEFAULTS.deviceName);
  const [autoReconnect, setAutoReconnectState] = useState(DEFAULTS.autoReconnect);
  const [ready, setReady] = useState(false);
  const [alertsConfigVersion, setAlertsConfigVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setDevMode(!!parsed.developerMode);
          setDevName(parsed.deviceName || DEFAULTS.deviceName);
          setAutoReconnectState(!!parsed.autoReconnect);
        }
      } catch (e) {
        console.warn('Failed to load app settings', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = async (next: { developerMode: boolean; deviceName: string; autoReconnect: boolean }) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setDeveloperMode = useCallback(async (v: boolean) => {
    setDevMode(v);
    await persist({ developerMode: v, deviceName, autoReconnect });
  }, [deviceName, autoReconnect]);

  const setDeviceName = useCallback(async (v: string) => {
    setDevName(v);
    await persist({ developerMode, deviceName: v, autoReconnect });
  }, [developerMode, autoReconnect]);

  const setAutoReconnect = useCallback(async (v: boolean) => {
    setAutoReconnectState(v);
    await persist({ developerMode, deviceName, autoReconnect: v });
  }, [developerMode, deviceName]);

  const notifyAlertsConfigChanged = useCallback(() => {
    setAlertsConfigVersion((v) => v + 1);
  }, []);

  return (
    <AppSettingsContext.Provider
      value={{ developerMode, deviceName, autoReconnect, setDeveloperMode, setDeviceName, setAutoReconnect, alertsConfigVersion, notifyAlertsConfigChanged, ready }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

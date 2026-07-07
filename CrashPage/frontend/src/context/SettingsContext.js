import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useI18n } from "../i18n";

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const { locale, setLocale } = useI18n();
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("crash-theme") || "dark";
  });
  const [soundEnabled, setSoundState] = useState(() => {
    return localStorage.getItem("crash-sound") !== "false";
  });
  const [pushEnabled, setPushState] = useState(() => {
    return localStorage.getItem("crash-push") === "true";
  });
  const [alertThreshold, setThresholdState] = useState(() => {
    return Number(localStorage.getItem("crash-threshold")) || 5;
  });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem("crash-theme", t);
    document.body.dataset.theme = t;
  }, []);

  const setSoundEnabled = useCallback((v) => {
    setSoundState(v);
    localStorage.setItem("crash-sound", v);
  }, []);

  const setPushEnabled = useCallback((v) => {
    setPushState(v);
    localStorage.setItem("crash-push", v);
  }, []);

  const setAlertThreshold = useCallback((v) => {
    setThresholdState(v);
    localStorage.setItem("crash-threshold", v);
  }, []);

  return (
    <SettingsCtx.Provider
      value={{
        theme, setTheme,
        locale, setLocale,
        soundEnabled, setSoundEnabled,
        pushEnabled, setPushEnabled,
        alertThreshold, setAlertThreshold,
      }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsCtx);
}
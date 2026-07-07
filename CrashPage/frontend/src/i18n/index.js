import { createContext, useContext, useState, useCallback, useEffect } from "react";
import es from "./es";
import en from "./en";

export const LOCALES = { es, en };
export const LANGUAGES = [
  { code: "es", label: "Espa\u00f1ol", native: "Espa\u00f1ol" },
  { code: "en", label: "English", native: "English" },
];

const I18nCtx = createContext({
  t: (key) => key,
  locale: "es",
  setLocale: () => {},
  locales: LANGUAGES,
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    return localStorage.getItem("crash-locale") || "es";
  });

  const setLocale = useCallback((code) => {
    setLocaleState(code);
    localStorage.setItem("crash-locale", code);
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const keys = key.split(".");
      let val = LOCALES[locale];
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          return fallback || key;
        }
      }
      return typeof val === "string" ? val : fallback || key;
    },
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nCtx.Provider value={{ t, locale, setLocale, locales: LANGUAGES }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}

export { I18nCtx };
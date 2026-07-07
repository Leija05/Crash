import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import es from './es';
import en from './en';

export type LocaleCode = 'es' | 'en';

const LOCALES: Record<string, any> = { es, en };

type I18nCtx = {
  t: (key: string, fallback?: string) => string;
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => Promise<void>;
  locales: { code: LocaleCode; label: string }[];
};

const I18nContext = createContext<I18nCtx>({
  t: (k) => k,
  locale: 'es',
  setLocale: async () => {},
  locales: [],
});

export const useI18n = () => useContext(I18nContext);
const STORAGE_KEY = 'crash.locale.v1';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'es') setLocaleState(saved);
    });
  }, []);

  const setLocale = useCallback(async (code: LocaleCode) => {
    setLocaleState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const keys = key.split('.');
      let val: any = LOCALES[locale];
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return fallback || key;
        }
      }
      return typeof val === 'string' ? val : fallback || key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{
        t,
        locale,
        setLocale,
        locales: [
          { code: 'es', label: 'Español' },
          { code: 'en', label: 'English' },
        ],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
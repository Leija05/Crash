import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import es from './es';
import en from './en';

export type LocaleCode = 'es' | 'en';

const LOCALES: Record<string, any> = { es, en };

type I18nCtx = {
  t: (key: string, params?: Record<string, any> | string) => string;
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
    (key: string, params?: Record<string, any> | string) => {
      const keys = key.split('.');
      let val: any = LOCALES[locale];
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }
      let str: string = typeof val === 'string' ? val : (typeof params === 'string' ? params : key);
      if (str && typeof params === 'object' && params) {
        str = str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, name: string) =>
          params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
        );
      }
      return str;
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
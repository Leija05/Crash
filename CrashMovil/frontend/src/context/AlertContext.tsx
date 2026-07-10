import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import FullScreenAlert, { AlertConfig } from '../components/FullScreenAlert';

type ResolveFn = (value: unknown) => void;

export type AlertOptions = {
  title: string;
  message?: string;
  eyebrow?: string;
  accent?: string;
  confirmText?: string;
};

export type ConfirmOptions = AlertOptions & {
  cancelText?: string;
  destructive?: boolean;
};

export type PromptOptions = AlertOptions & {
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  secureTextEntry?: boolean;
  inputLabel?: string;
};

type AlertContextValue = {
  /** Reemplaza Alert.alert / window.alert: devuelve una promesa al pulsar Aceptar. */
  alert: (opts: AlertOptions) => Promise<void>;
  /** Reemplaza Alert.alert con 2 botones / window.confirm: Promise<boolean>. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Reemplaza window.prompt: Promise<string | null>. */
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert debe usarse dentro de <AlertProvider>');
  return ctx;
}

type QueuedAlert = { cfg: Omit<AlertConfig, 'onClose'>; resolve: ResolveFn };

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const resolveRef = useRef<ResolveFn | null>(null);
  const queueRef = useRef<QueuedAlert[]>([]);
  const displayedRef = useRef(false);

  const showNext = () => {
    const next = queueRef.current.shift();
    if (next) {
      resolveRef.current = next.resolve;
      displayedRef.current = true;
      setConfig({ ...next.cfg, onClose: close } as AlertConfig);
    } else {
      resolveRef.current = null;
      displayedRef.current = false;
      setConfig(null);
    }
  };

  const close = (value: unknown) => {
    resolveRef.current?.(value);
    showNext();
  };

  const show = (cfg: Omit<AlertConfig, 'onClose'>) => {
    return new Promise<unknown>((resolve) => {
      queueRef.current.push({ cfg, resolve });
      if (!displayedRef.current) showNext();
    });
  };

  const alert = useCallback(
    (opts: AlertOptions) => show({ ...opts, kind: 'alert' }).then(() => undefined),
    [show],
  );
  const confirm = useCallback(
    (opts: ConfirmOptions) => show({ ...opts, kind: 'confirm' }) as Promise<boolean>,
    [show],
  );
  const prompt = useCallback(
    (opts: PromptOptions) => show({ ...opts, kind: 'prompt' }) as Promise<string | null>,
    [show],
  );

  return (
    <AlertContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {config ? <FullScreenAlert {...config} onClose={close} /> : null}
    </AlertContext.Provider>
  );
}

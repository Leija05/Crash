declare module 'react-native' {
  interface NativeModulesStatic {
    ForegroundService?: {
      start: (deviceName: string) => Promise<boolean>;
      stop: () => Promise<boolean>;
      updateTelemetry: (deviceName: string, speed: number, gForce: number, battery: number | null) => Promise<boolean>;
      isRunning: () => Promise<boolean>;
    };
  }
}

export {};

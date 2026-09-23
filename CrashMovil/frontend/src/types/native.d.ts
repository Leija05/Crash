declare module 'react-native' {
  interface NativeModulesStatic {
    ForegroundService?: {
      start: (deviceName: string, threshold: number) => Promise<boolean>;
      stop: () => Promise<boolean>;
      updateTelemetry: (deviceName: string, speed: number, gForce: number, battery: number | null) => Promise<boolean>;
      updateLocation: (latitude: number, longitude: number, speed: number) => Promise<boolean>;
      setThreshold: (threshold: number) => Promise<boolean>;
      isRunning: () => Promise<boolean>;
    };
  }
}

export {};

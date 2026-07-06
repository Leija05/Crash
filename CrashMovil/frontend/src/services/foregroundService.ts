import { Platform, NativeModules } from 'react-native';

const { ForegroundService } = NativeModules;

const isAndroid = Platform.OS === 'android';

let serviceActive = false;

export const foregroundService = {
  async start(deviceName: string): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      console.warn('ForegroundService not available on this platform');
      return false;
    }
    try {
      await ForegroundService.start(deviceName);
      serviceActive = true;
      return true;
    } catch (e) {
      console.error('Failed to start foreground service:', e);
      return false;
    }
  },

  async stop(): Promise<boolean> {
    if (!isAndroid || !ForegroundService || !serviceActive) {
      return false;
    }
    try {
      await ForegroundService.stop();
      serviceActive = false;
      return true;
    } catch (e) {
      console.error('Failed to stop foreground service:', e);
      return false;
    }
  },

  async updateTelemetry(
    deviceName: string,
    speed: number,
    gForce: number,
    battery: number | null,
  ): Promise<boolean> {
    if (!isAndroid || !ForegroundService || !serviceActive) {
      return false;
    }
    try {
      await ForegroundService.updateTelemetry(deviceName, speed, gForce, battery);
      return true;
    } catch (e) {
      console.warn('Failed to update foreground notification:', e);
      return false;
    }
  },

  isActive(): boolean {
    return serviceActive;
  },
};

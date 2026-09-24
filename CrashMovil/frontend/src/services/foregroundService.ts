import { Platform, NativeModules } from 'react-native';

const { ForegroundService } = NativeModules;
const isAndroid = Platform.OS === 'android';
let serviceActive = false;

export const foregroundService = {
  async start(deviceName: string, threshold: number = 5.0): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      return false;
    }
    try {
      await ForegroundService.start(deviceName, threshold);
      serviceActive = true;
      return true;
    } catch (e) {
      console.warn('Failed to start foreground service:', e);
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
      console.warn('Failed to stop foreground service:', e);
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
      return false;
    }
  },

  async updateLocation(
    latitude: number,
    longitude: number,
    speed: number = 0,
  ): Promise<boolean> {
    if (!isAndroid || !ForegroundService || !serviceActive) {
      return false;
    }
    try {
      await ForegroundService.updateLocation(latitude, longitude, speed);
      return true;
    } catch (e) {
      return false;
    }
  },

  async setThreshold(threshold: number): Promise<boolean> {
    if (!isAndroid || !ForegroundService || !serviceActive) {
      return false;
    }
    try {
      await ForegroundService.setThreshold(threshold);
      return true;
    } catch (e) {
      return false;
    }
  },

  async startEmergencyCountdown(seconds: number, gForce: number): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      return false;
    }
    try {
      await ForegroundService.startEmergencyCountdown(seconds, gForce);
      return true;
    } catch (e) {
      console.warn('Failed to start native countdown:', e);
      return false;
    }
  },

  async cancelEmergencyCountdown(): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      return false;
    }
    try {
      await ForegroundService.cancelEmergencyCountdown();
      return true;
    } catch (e) {
      console.warn('Failed to cancel native countdown:', e);
      return false;
    }
  },

  async resetPeakG(): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      return false;
    }
    try {
      await ForegroundService.resetPeakG();
      return true;
    } catch (e) {
      return false;
    }
  },

  async checkPermissions(): Promise<{ locationGranted: boolean; notificationsGranted: boolean; allGranted: boolean } | null> {
    if (!isAndroid || !ForegroundService) {
      return null;
    }
    try {
      return await ForegroundService.checkPermissions();
    } catch {
      return null;
    }
  },

  async isRunning(): Promise<boolean> {
    if (!isAndroid || !ForegroundService) {
      return false;
    }
    try {
      return await ForegroundService.isRunning();
    } catch {
      return false;
    }
  },

  isActive(): boolean {
    return serviceActive;
  },
};

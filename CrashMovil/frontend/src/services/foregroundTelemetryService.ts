import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { telemetryAPI, falseAlarmAPI } from './api';
import { TelemetryData } from './bluetooth';

const BLACKBOX_KEY = 'crash_blackbox_buffer';
const BLACKBOX_MAX = 500;

type ForegroundTelemetrySnapshot = {
  latitude: number | null;
  longitude: number | null;
  gpsAccuracyM?: number | null;
  gForce: number;
  updatedAt: string;
};

type QuickActionPayload = {
  token: string;
  alertId?: string;
  telemetry?: TelemetryData | null;
  location?: ForegroundTelemetrySnapshot | null;
};

const TELEMETRY_THROTTLE_MS = 5000;

/**
 * Thin orchestration layer for the Android foreground service contract.
 *
 * Expo managed builds cannot create the persistent Android notification by
 * themselves; production builds should bind these methods to a small native
 * module (or a library such as Notifee) that owns the notification channel and
 * action buttons. Keeping the policy here makes the privacy/idempotency rules
 * testable from JS and reusable by the native bridge.
 */
class ForegroundTelemetryService {
  private lastSentAt = 0;
  private lastSnapshot: ForegroundTelemetrySnapshot | null = null;
  private flushing = false;

  /**
   * Caja Negra del Casco: guarda localmente las muestras que no se pudieron
   * enviar (sin señal) para no perder telemetría de un posible accidente.
   */
  private async bufferBlackbox(sample: any) {
    try {
      const raw = await AsyncStorage.getItem(BLACKBOX_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      list.push(sample);
      const trimmed = list.slice(-BLACKBOX_MAX);
      await AsyncStorage.setItem(BLACKBOX_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  async blackboxCount(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(BLACKBOX_KEY);
      return raw ? (JSON.parse(raw) as any[]).length : 0;
    } catch {
      return 0;
    }
  }

  /** Vacía el buffer de la caja negra hacia el backend en lotes. */
  async flushBlackbox(token: string) {
    if (this.flushing) return { flushed: 0 };
    this.flushing = true;
    let flushed = 0;
    try {
      const raw = await AsyncStorage.getItem(BLACKBOX_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      if (list.length === 0) return { flushed: 0 };

      const CHUNK = 100;
      const remaining = [...list];
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, CHUNK);
        await telemetryAPI.batch(token, chunk);
        remaining.splice(0, chunk.length);
        flushed += chunk.length;
        await AsyncStorage.setItem(BLACKBOX_KEY, JSON.stringify(remaining));
      }
      return { flushed };
    } catch {
      return { flushed };
    } finally {
      this.flushing = false;
    }
  }

  async shouldTrackLocation(helmetConnected: boolean, gpsConsent: boolean) {
    return helmetConnected && gpsConsent;
  }

  async resolveLocation(helmetConnected: boolean, gpsConsent: boolean) {
    if (!(await this.shouldTrackLocation(helmetConnected, gpsConsent))) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    this.lastSnapshot = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      gpsAccuracyM: position.coords.accuracy,
      gForce: this.lastSnapshot?.gForce ?? 0,
      updatedAt: new Date().toISOString(),
    };
    return this.lastSnapshot;
  }

  async sendThrottledTelemetry(token: string, telemetry: TelemetryData, helmetConnected: boolean, gpsConsent: boolean) {
    const now = Date.now();
    if (now - this.lastSentAt < TELEMETRY_THROTTLE_MS) return { skipped: true };

    const location = await this.resolveLocation(helmetConnected, gpsConsent);

    // Preferimos el GPS del teléfono; si el circuito real trae sus propias
    // coordenadas (hardware con GPS a bordo), las usamos como respaldo.
    const latitude = location?.latitude ?? telemetry.latitude ?? null;
    const longitude = location?.longitude ?? telemetry.longitude ?? null;

    this.lastSentAt = now;
    this.lastSnapshot = {
      latitude,
      longitude,
      gpsAccuracyM: location?.gpsAccuracyM,
      gForce: telemetry.g_force,
      updatedAt: new Date().toISOString(),
    };

    const payload = {
      ...telemetry,
      latitude,
      longitude,
      speed_kmh: telemetry.speed_kmh ?? undefined,
      gps_accuracy_m: location?.gpsAccuracyM,
      helmet_connected: helmetConnected,
      gps_consent: gpsConsent,
      client_event_id: `telemetry-${now}`,
      occurred_at: new Date(now).toISOString(),
    };

    try {
      const result = await telemetryAPI.send(token, payload);
      // Al recuperar señal, vaciar la caja negra acumulada.
      this.flushBlackbox(token).catch(() => {});
      return result;
    } catch (e) {
      // Sin señal: preservar la muestra en la caja negra local.
      await this.bufferBlackbox(payload);
      throw e;
    }
  }

  /**
   * Native quick action handler: notification button -> false_alarm audit row.
   * The native side should call this without opening the React Native screen.
   */
  async cancelAlertFromNotification({ token, alertId, telemetry, location }: QuickActionPayload) {
    const now = Date.now();
    return falseAlarmAPI.create(token, {
      alert_id: alertId,
      client_event_id: `false-alarm-${alertId || now}`,
      reason: 'cancelled_from_notification',
      telemetry,
      latitude: location?.latitude,
      longitude: location?.longitude,
      occurred_at: new Date(now).toISOString(),
    });
  }

  getNotificationText() {
    const lat = this.lastSnapshot?.latitude?.toFixed(5) ?? '--';
    const lon = this.lastSnapshot?.longitude?.toFixed(5) ?? '--';
    const g = this.lastSnapshot?.gForce?.toFixed(2) ?? '0.00';
    return `C.R.A.S.H. activo · ${lat}, ${lon} · ${g}G`;
  }
}

export const foregroundTelemetryService = new ForegroundTelemetryService();

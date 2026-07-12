import AsyncStorage from '@react-native-async-storage/async-storage';
import { geofencesAPI } from './api';

const ZONES_KEY = 'crash_geofences_cache';
const REFRESH_MS = 5 * 60 * 1000;

export type Geofence = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  risk_weight?: number;
};

export type CautionState = {
  in_zone: boolean;
  caution: boolean;
  zone?: Geofence | null;
  seconds_in_zone?: number;
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Geocercas de riesgo en el dispositivo: detecta el modo Precaución
 * localmente (funciona sin señal usando la última lista en caché).
 */
class GeofenceService {
  private zones: Geofence[] = [];
  private lastFetch = 0;
  private currentZoneId: string | null = null;
  private enteredAt = 0;

  async loadCache() {
    try {
      const raw = await AsyncStorage.getItem(ZONES_KEY);
      if (raw) this.zones = JSON.parse(raw);
    } catch {}
    return this.zones;
  }

  async refresh(token: string, force = false): Promise<Geofence[]> {
    const now = Date.now();
    if (!force && now - this.lastFetch < REFRESH_MS && this.zones.length) {
      return this.zones;
    }
    try {
      const data = await geofencesAPI.active(token);
      if (Array.isArray(data)) {
        this.zones = data;
        this.lastFetch = now;
        await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(data));
      }
    } catch {
      if (!this.zones.length) await this.loadCache();
    }
    return this.zones;
  }

  private zoneContaining(lat: number, lon: number): Geofence | null {
    let best: Geofence | null = null;
    let bestDist = Infinity;
    for (const z of this.zones) {
      const d = haversineM(lat, lon, z.latitude, z.longitude);
      if (d <= z.radius_m && d < bestDist) {
        best = z;
        bestDist = d;
      }
    }
    return best;
  }

  evaluate(lat: number | null | undefined, lon: number | null | undefined): CautionState {
    if (lat == null || lon == null) {
      this.currentZoneId = null;
      return { in_zone: false, caution: false };
    }
    const zone = this.zoneContaining(lat, lon);
    const now = Date.now();
    if (!zone) {
      this.currentZoneId = null;
      return { in_zone: false, caution: false };
    }
    if (zone.id !== this.currentZoneId) {
      this.currentZoneId = zone.id;
      this.enteredAt = now;
    }
    return {
      in_zone: true,
      caution: true,
      zone,
      seconds_in_zone: Math.round((now - this.enteredAt) / 1000),
    };
  }
}

export const geofenceService = new GeofenceService();

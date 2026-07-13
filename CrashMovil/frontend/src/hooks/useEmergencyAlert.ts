import { useCallback, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { impactsAPI } from '../services/api';
import { useAlert } from '../context/AlertContext';
import { haptics } from '../utils/haptics';
import { useI18n } from '../i18n';

type Telemetry = {
  acceleration_x?: number;
  acceleration_y?: number;
  acceleration_z?: number;
  gyroscope_x?: number;
  gyroscope_y?: number;
  gyroscope_z?: number;
  g_force?: number;
};

type EmergencyOptions = {
  token: string | null;
  getTelemetry?: () => Telemetry | null;
  hasEmergencyContacts: boolean;
  alertThreshold: number;
  onResult?: (impact: any) => void;
};

export function useEmergencyAlert({ token, getTelemetry, hasEmergencyContacts, alertThreshold, onResult }: EmergencyOptions) {
  const { alert, confirm } = useAlert();
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);

  const trigger = useCallback(async () => {
    if (!token || sending || inFlight.current) return;

    const confirmed = await confirm({
      title: t('dashboard.emergencyConfirmTitle'),
      message: t('dashboard.emergencyConfirmMessage'),
      confirmText: t('dashboard.emergencyConfirmSend'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return 'cancelled';

    if (!hasEmergencyContacts) {
      const goToContacts = await confirm({
        title: t('dashboard.noContactsAlert'),
        message: t('dashboard.noContactsAlertMessage'),
        confirmText: t('dashboard.goToContacts'),
        cancelText: t('common.cancel'),
      });
      if (goToContacts) return 'goToContacts';
      return 'cancelled';
    }

    inFlight.current = true;
    setSending(true);
    try {
      const telemetry = getTelemetry?.() ?? null;
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      } catch (locErr) {
        console.warn('No se pudo obtener ubicación actual', locErr);
      }

      const impact = await impactsAPI.create(token, {
        acceleration_x: telemetry?.acceleration_x ?? 0,
        acceleration_y: telemetry?.acceleration_y ?? 0,
        acceleration_z: telemetry?.acceleration_z ?? 0,
        gyroscope_x: telemetry?.gyroscope_x ?? 0,
        gyroscope_y: telemetry?.gyroscope_y ?? 0,
        gyroscope_z: telemetry?.gyroscope_z ?? 0,
        g_force: telemetry?.g_force ?? alertThreshold,
        latitude,
        longitude,
        manual: true,
      });

      if (!impact?.alerts_sent && impact?.alerted_contacts?.length === 0 && impact?.alert_error) {
        alert({ title: t('dashboard.noContactsAlert'), message: t('dashboard.notSentMessage') });
      }
      if (impact?.alerts_sent) haptics.success(); else haptics.warning();
      onResult?.(impact);
      return 'sent';
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('errors.generic') });
      return 'error';
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  }, [token, sending, hasEmergencyContacts, getTelemetry, alertThreshold, confirm, alert, onResult, t]);

  return { trigger, sending };
}

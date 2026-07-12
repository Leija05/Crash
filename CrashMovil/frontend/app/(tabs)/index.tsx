import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, severityLabel } from '../../src/theme';
import PremiumModal from '../../src/components/PremiumModal';
import { useAuth } from '../../src/context/AuthContext';
import { useBluetooth } from '../../src/context/BluetoothContext';
import { useAppSettings } from '../../src/context/AppSettingsContext';
import { useAlert } from '../../src/context/AlertContext';
import { useLocation } from '../../src/context/LocationContext';
import { useI18n } from '../../src/i18n';
import { contactsAPI, impactsAPI, settingsAPI, telemetryAPI } from '../../src/services/api';
import { foregroundService } from '../../src/services/foregroundService';

function estimateSpeed(ax: number, ay: number, az: number): number {
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  return Math.max(0, (magnitude - 9.8) * 3.6);
}

const MAX_G_RING = 12;
const SEGMENTS = 40;

const ANDROID_ALERT_CHANNEL_ID = 'crash-alerts';
const NOTIFICATION_TELEMETRY_THROTTLE_MS = 12000;
const NOTIFICATION_COUNTDOWN_ID = 'crash-countdown';
const NOTIFICATION_STATUS_ID = 'crash-status';
const ACTION_CANCEL_COUNTDOWN = 'CANCEL_COUNTDOWN';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function DashboardScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { token } = useAuth();
  const router = useRouter();
  const { alert, confirm } = useAlert();
  const { deviceName: pattern, alertsConfigVersion } = useAppSettings();
  const {
    connected, telemetry, statusDetail, deviceName, batteryLevel,
    disconnect, nativeAvailable,
  } = useBluetooth();
  const {
    permissionGranted, grantedLocation, currentLocation, isTracking,
    requestPermission,
  } = useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const [peakG, setPeakG] = useState(0);
  const lastDataRef = useRef<number>(Date.now());

  const telemetryRef = useRef(telemetry);
  const impactTelemetryRef = useRef(telemetry);
  const telemetryForServiceRef = useRef(telemetry);
  const [staleData, setStaleData] = useState(false);
  const impactTriggeredRef = useRef(false);
  const emergencyInFlightRef = useRef(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [alertResult, setAlertResult] = useState<any | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(8);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [hasEmergencyContacts, setHasEmergencyContacts] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const lastTelemetrySentAtRef = useRef(0);
  const lastNotificationUpdateRef = useRef(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!telemetry) return;
    if (countdown !== null) return;
    telemetryRef.current = telemetry;
    lastDataRef.current = Date.now();
    setStaleData(false);
    setPeakG(prev => (telemetry.g_force > prev ? telemetry.g_force : prev));
  }, [telemetry, countdown]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) return;
      try {
        const s = await settingsAPI.get(token);
        const fromServer = Number(s?.countdown_seconds ?? s?.emergency_countdown_seconds ?? 8);
        if (!Number.isNaN(fromServer) && fromServer >= 3 && fromServer <= 60) {
          setCountdownSeconds(Math.round(fromServer));
        }
        const threshold = Number(s?.alert_threshold ?? 5);
        if (!Number.isNaN(threshold) && threshold > 0) setAlertThreshold(threshold);
        setLocationTrackingEnabled(s?.location_tracking_enabled !== false);
      } catch (e) {
        console.warn('No se pudo cargar countdown de usuario', e);
      }
    };
    loadSettings();
  }, [token, alertsConfigVersion]);

  useEffect(() => {
    const loadContactsState = async () => {
      if (!token) return;
      try {
        const contacts = await contactsAPI.list(token);
        setHasEmergencyContacts(Array.isArray(contacts) && contacts.length > 0);
      } catch (e) {
        console.warn('No se pudo validar contactos de emergencia', e);
      }
    };
    loadContactsState();
  }, [token]);

  useEffect(() => {
    const t = setInterval(() => {
      if (connected && Date.now() - lastDataRef.current > 6000) {
        setStaleData(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  useEffect(() => {
    if (connected) {
      foregroundService.start(deviceName || 'C.R.A.S.H.');
    } else {
      foregroundService.stop();
    }
  }, [connected, deviceName]);

  useEffect(() => {
    if (telemetry) telemetryForServiceRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    if (!connected || !telemetry) return;
    const interval = setInterval(() => {
      const t = telemetryForServiceRef.current;
      if (!t) return;
      const speed = estimateSpeed(t.acceleration_x, t.acceleration_y, t.acceleration_z);
      foregroundService.updateTelemetry(
        deviceName || 'C.R.A.S.H.',
        speed,
        t.g_force,
        batteryLevel,
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [connected, deviceName, batteryLevel]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPeakG(0);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const telemetryForDisplay = countdown !== null ? impactTelemetryRef.current : telemetry;
  const gForce = telemetryForDisplay?.g_force ?? 0;
  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);
  const liveData = connected && !staleData && !!telemetryForDisplay;
  const highImpact = liveData && gForce >= alertThreshold;

  useEffect(() => {
    if (highImpact) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 620, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 620, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(0);
    return undefined;
  }, [highImpact, pulseAnim]);

  useEffect(() => {
    const pushRealtimeTelemetry = async () => {
      if (!token || !connected || !telemetry || staleData) return;
      const now = Date.now();
      if (now - lastTelemetrySentAtRef.current < 10000) return;
      lastTelemetrySentAtRef.current = now;
      let latitude: number | undefined;
      let longitude: number | undefined;
      let gpsAccuracyM: number | undefined;
      if (locationTrackingEnabled) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({});
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
            gpsAccuracyM = pos.coords.accuracy ?? undefined;
          }
        } catch (e) {
          console.warn('No se pudo capturar ubicación en telemetría', e);
        }
      }
      try {
        await telemetryAPI.send(token, {
          acceleration_x: telemetry.acceleration_x,
          acceleration_y: telemetry.acceleration_y,
          acceleration_z: telemetry.acceleration_z,
          gyroscope_x: telemetry.gyroscope_x,
          gyroscope_y: telemetry.gyroscope_y,
          gyroscope_z: telemetry.gyroscope_z,
          g_force: telemetry.g_force,
          latitude,
          longitude,
          gps_accuracy_m: gpsAccuracyM,
          helmet_connected: connected,
          client_event_id: `telemetry-${now}`,
        });
      } catch (e) {
        console.warn('No se pudo enviar telemetría en tiempo real', e);
      }
    };
    pushRealtimeTelemetry();
  }, [token, connected, telemetry, staleData, locationTrackingEnabled]);

  useEffect(() => {
    if (highImpact && countdown === null && !sending && !impactTriggeredRef.current) {
      impactTriggeredRef.current = true;
      impactTelemetryRef.current = telemetry ?? telemetryRef.current;
      setCountdown(countdownSeconds);
    }
  }, [highImpact, countdown, sending, countdownSeconds, telemetry]);

  useEffect(() => {
    if (!liveData || gForce < alertThreshold) {
      impactTriggeredRef.current = false;
    }
  }, [liveData, gForce, alertThreshold]);

  const triggerEmergencyFlow = useCallback(async () => {
    const currentTelemetry = impactTelemetryRef.current ?? telemetryRef.current;
    if (!token || !currentTelemetry || sending || emergencyInFlightRef.current) return;

    if (!hasEmergencyContacts) {
      const goToContacts = await confirm({
        title: t('dashboard.noContactsAlert'),
        message: t('dashboard.noContactsAlertMessage'),
        confirmText: t('dashboard.goToContacts'),
        cancelText: t('common.cancel'),
      });
      if (goToContacts) router.push('/contacts');
      impactTriggeredRef.current = false;
      return;
    }

    emergencyInFlightRef.current = true;
    setSending(true);
    try {
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
        acceleration_x: currentTelemetry.acceleration_x,
        acceleration_y: currentTelemetry.acceleration_y,
        acceleration_z: currentTelemetry.acceleration_z,
        gyroscope_x: currentTelemetry.gyroscope_x,
        gyroscope_y: currentTelemetry.gyroscope_y,
        gyroscope_z: currentTelemetry.gyroscope_z,
        g_force: currentTelemetry.g_force,
        latitude,
        longitude,
      });

      if (!impact?.alerts_sent && impact?.alerted_contacts?.length === 0 && impact?.alert_error && currentTelemetry.g_force >= alertThreshold) {
        alert({ title: t('dashboard.noContactsAlert'), message: t('dashboard.notSentMessage') });
      }
      setAlertResult(impact);
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('errors.generic') });
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, alertThreshold, confirm, alert, t]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      triggerEmergencyFlow();
      return;
    }
    const inner = setTimeout(() => setCountdown((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(inner);
  }, [countdown, triggerEmergencyFlow]);

  useEffect(() => {
    const setupNotificationChannel = async () => {
      if (Platform.OS !== 'android') return;
      await Notifications.setNotificationChannelAsync(ANDROID_ALERT_CHANNEL_ID, {
        name: 'C.R.A.S.H. Monitoreo',
        importance: Notifications.AndroidImportance.HIGH,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    };
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      if (actionId === ACTION_CANCEL_COUNTDOWN) {
        setCountdown(null);
        impactTriggeredRef.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const pushStatusNotification = async () => {
      if (Platform.OS !== 'android' || !connected) {
        await Notifications.dismissNotificationAsync(NOTIFICATION_STATUS_ID).catch(() => {});
        return;
      }
      const now = Date.now();
      if (now - lastNotificationUpdateRef.current < NOTIFICATION_TELEMETRY_THROTTLE_MS) return;
      lastNotificationUpdateRef.current = now;
      const current = telemetryForDisplay;
      const gVal = current?.g_force ?? 0;
      const speed = current ? estimateSpeed(current.acceleration_x, current.acceleration_y, current.acceleration_z) : 0;
      const batText = batteryLevel !== null ? ` · ${t('dashboard.battery')} ${batteryLevel}%` : '';
      const title = `C.R.A.S.H. · ${deviceName || 'Casco'}`;
      const body = `Velocidad: ${Math.round(speed)} km/h · ${gVal.toFixed(2)}G${batText}`;
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_STATUS_ID,
        content: { title, body, sticky: true, priority: Notifications.AndroidNotificationPriority.HIGH },
        trigger: null,
      });
    };
    pushStatusNotification();
  }, [connected, telemetryForDisplay, deviceName, batteryLevel, t]);

  useEffect(() => {
    const updateCountdownNotification = async () => {
      if (Platform.OS !== 'android') return;
      if (countdown === null) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        await Notifications.dismissNotificationAsync(NOTIFICATION_COUNTDOWN_ID).catch(() => {});
        return;
      }
      await Notifications.setNotificationCategoryAsync('crash-actions', [
        { identifier: ACTION_CANCEL_COUNTDOWN, buttonTitle: t('dashboard.cancel'), options: { opensAppToForeground: false } },
      ]);

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      const publish = async () => {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_COUNTDOWN_ID,
          content: {
            title: t('dashboard.impactDetected'),
            body: `${t('dashboard.sendNow')} ${countdown}s · G ${(impactTelemetryRef.current?.g_force ?? gForce).toFixed(2)}`,
            categoryIdentifier: 'crash-actions',
            sticky: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: null,
        });
      };
      await publish();
      countdownIntervalRef.current = setInterval(publish, 1000);
    };
    updateCountdownNotification();
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, gForce, t]);

  const greetingName = user?.name?.split(' ')[0] || 'Rider';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header minimal */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('dashboard.greeting')}, {greetingName}</Text>
            <Text style={styles.appName}>{t('dashboard.appName')}</Text>
          </View>
          <View style={styles.modePill}>
            <View style={[styles.modeDot, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
            <Text style={[styles.modeText, { color: liveData ? COLORS.success : COLORS.textDim }]}>{t('dashboard.modeReal')}</Text>
          </View>
        </View>

        {/* Status bar */}
        <TouchableOpacity
          style={[styles.statusBar, liveData && styles.statusBarConnected]}
          onPress={() => router.push('/devices')}
          activeOpacity={0.7}
          testID="dashboard-status-bar"
        >
          <View style={[styles.statusDot, { backgroundColor: liveData ? COLORS.success : connected ? COLORS.warning : COLORS.textDim }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>
              {liveData ? t('dashboard.connected') : connected ? t('dashboard.noData') : t('dashboard.disconnected')}
            </Text>
            <Text style={styles.statusDetail} numberOfLines={1}>
              {connected
                ? staleData ? (statusDetail || t('dashboard.waitingTelemetry')) : `${deviceName}${batteryLevel !== null ? ` · ${t('dashboard.battery')} ${batteryLevel}%` : ''}`
                : t('dashboard.tapToConnect')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
        </TouchableOpacity>

        {/* Force Ring */}
        <View style={[styles.ringCard, highImpact && styles.ringCardCritical]}>
          {highImpact && (
            <Animated.View pointerEvents="none" style={[styles.criticalPulse, { opacity: pulseAnim }]} />
          )}
          <ForceRing gForce={gForce} liveData={liveData} color={sevColor} severity={sevLabel} t={t} />
          <View style={styles.peakRow}>
            <Text style={styles.peakLabel}>{t('dashboard.peak')}</Text>
            <Text style={styles.peakValue}>{peakG.toFixed(2)} G</Text>
          </View>
        </View>

        {/* Bento: Acceleration + Permission Location */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoCard, styles.bentoHalf]}>
            <Text style={styles.bentoTitle}>{t('dashboard.acceleration')}</Text>
            <View style={styles.coordsGrid}>
              <CoordItem label="X" value={telemetryForDisplay?.acceleration_x} live={liveData} />
              <CoordItem label="Y" value={telemetryForDisplay?.acceleration_y} live={liveData} />
              <CoordItem label="Z" value={telemetryForDisplay?.acceleration_z} live={liveData} />
            </View>
          </View>
          <View style={[styles.bentoCard, styles.bentoHalf]}>
            <Text style={styles.bentoTitle}>{t('dashboard.location')}</Text>
            {permissionGranted === false ? (
              <TouchableOpacity style={styles.locationBtn} onPress={requestPermission} activeOpacity={0.8}>
                <Ionicons name="location-outline" size={16} color={COLORS.accent} />
                <Text style={styles.locationBtnText}>{t('dashboard.enableLocation')}</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.locationPermBadge}>
                  <Ionicons name="location" size={12} color={COLORS.accent} />
                  <Text style={styles.locationPermText}>{t('dashboard.permissionLocation')}</Text>
                </View>
                {grantedLocation ? (
                  <Text style={styles.coordsGeo}>
                    {grantedLocation.latitude.toFixed(5)}, {grantedLocation.longitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.coordsGeoDim}>{t('dashboard.obtaining')}</Text>
                )}
                {isTracking && currentLocation && (
                  <View style={styles.liveTrackingBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTrackingText}>{t('dashboard.live')} · {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}</Text>
                  </View>
                )}
                {!isTracking && permissionGranted && (
                  <Text style={styles.trackingStatus}>{t('dashboard.permissionGranted')}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Live Tracking Status */}
        <View style={styles.trackingCard}>
          <Ionicons name={isTracking ? "radio" : "radio-outline"} size={18} color={isTracking ? COLORS.success : COLORS.textDim} />
          <View style={{ flex: 1 }}>
            <Text style={styles.trackingTitle}>{t('dashboard.liveTracking')}</Text>
            <Text style={styles.trackingDesc}>
              {isTracking ? t('dashboard.trackingActive') : t('dashboard.trackingInactive')}
            </Text>
          </View>
          <View style={[styles.trackingDot, { backgroundColor: isTracking ? COLORS.success : COLORS.textDim }]} />
        </View>

        {/* Telemetry Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('dashboard.telemetryTitle')}</Text>
          <View style={[styles.liveBadge, liveData && styles.liveBadgeOn]}>
            <View style={[styles.liveDotSm, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
            <Text style={[styles.liveText, { color: liveData ? COLORS.success : COLORS.textDim }]}>{t('dashboard.liveBadge')}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <MetricCard label={t('dashboard.gyroX')} value={telemetryForDisplay?.gyroscope_x} unit="rad/s" color={COLORS.warning} live={liveData} />
          <MetricCard label={t('dashboard.gyroY')} value={telemetryForDisplay?.gyroscope_y} unit="rad/s" color={COLORS.warning} live={liveData} />
          <MetricCard label={t('dashboard.gyroZ')} value={telemetryForDisplay?.gyroscope_z} unit="rad/s" color="#FB923C" live={liveData} />
          <MetricCard label={t('dashboard.gForce')} value={telemetryForDisplay?.g_force} unit="g" color={COLORS.accent} live={liveData} />
        </View>

        {/* Connect / Disconnect */}
        {connected ? (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.primaryBtnDanger]}
            onPress={disconnect}
            activeOpacity={0.8}
            testID="disconnect-btn"
          >
            <Ionicons name="bluetooth" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>{t('dashboard.disconnectHelmet')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/devices')}
            activeOpacity={0.8}
            testID="connect-btn"
          >
            <Ionicons name="bluetooth" size={18} color={COLORS.bg} />
            <Text style={[styles.primaryBtnText, { color: COLORS.bg }]}>{t('dashboard.connectHelmet')}</Text>
          </TouchableOpacity>
        )}

        {/* Info / Warnings */}
        {!nativeAvailable && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={14} color={COLORS.info} />
            <Text style={styles.infoText}>{t('dashboard.nativeBluetoothInfo')}</Text>
          </View>
        )}
        {nativeAvailable && !connected && (
          <View style={styles.infoBox}>
            <Ionicons name="radio" size={14} color={COLORS.info} />
            <Text style={styles.infoText}>{t('dashboard.scanningFor')} {pattern} · HC-05 · HC-10 · HM-10 · MLT-BT05 · CRASH</Text>
          </View>
        )}
        {!hasEmergencyContacts && (
          <TouchableOpacity style={styles.warningCard} onPress={() => router.push('/contacts')} activeOpacity={0.85}>
            <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>{t('dashboard.noContacts')}</Text>
              <Text style={styles.warningText}>{t('dashboard.noContactsDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Impact Countdown Modal */}
      <PremiumModal
        visible={countdown !== null}
        onClose={() => setCountdown(null)}
        title={t('dashboard.impactDetected')}
        eyebrow={t('dashboard.alertEyebrow')}
        accent={COLORS.primary}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>{t('dashboard.alertMessage')}</Text>
        <Text style={styles.countdownLabel}>{t('dashboard.remainingTime')}</Text>
        <Text style={styles.countdownValue}>{countdown}s</Text>
        <View style={styles.dialogActions}>
          <TouchableOpacity style={styles.cancelBtnSoft} onPress={() => setCountdown(null)}>
            <Text style={styles.cancelSoftText}>{t('dashboard.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, sending && { opacity: 0.6 }]}
            disabled={sending}
            onPress={() => { setCountdown(null); impactTriggeredRef.current = true; triggerEmergencyFlow(); }}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.cancelText}>{t('dashboard.sendNow')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </PremiumModal>

      {/* Result Modal */}
      <PremiumModal
        visible={!!alertResult}
        onClose={() => setAlertResult(null)}
        title={alertResult?.alerts_sent ? t('dashboard.sentTitle') : t('dashboard.notSentTitle')}
        eyebrow={t('dashboard.reportEyebrow')}
        accent={alertResult?.alerts_sent ? COLORS.success : COLORS.primary}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>
          {alertResult?.alerts_sent
            ? t('dashboard.sentMessage')
            : (alertResult?.alert_error || t('dashboard.notSentMessage'))}
        </Text>
        {(alertResult?.alerted_contacts || []).map((c: any) => (
          <Text key={c.id} style={styles.contactSent}>{`• ${c.name} (${c.phone})`}</Text>
        ))}
        <View style={styles.dialogActions}>
          <TouchableOpacity style={styles.okBtnWide} onPress={() => setAlertResult(null)}>
            <Text style={styles.okBtnText}>{t('common.accept')}</Text>
          </TouchableOpacity>
        </View>
      </PremiumModal>
    </SafeAreaView>
  );
}

function ForceRing({ gForce, liveData, color, severity, t }: { gForce: number; liveData: boolean; color: string; severity: string; t: (key: string) => string }) {
  const progress = Math.max(0, Math.min(gForce / MAX_G_RING, 1));
  const filled = Math.round(progress * SEGMENTS);

  return (
    <View style={styles.ringWrap}>
      <View style={styles.ringTrack}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const active = liveData && i < filled;
          return (
            <View
              key={`seg-${i}`}
              style={[
                styles.segment,
                {
                  transform: [{ rotate: `${(360 / SEGMENTS) * i}deg` }, { translateY: -118 }],
                  backgroundColor: active ? color : 'rgba(148,163,184,0.10)',
                  opacity: active ? 1 : 0.5,
                },
              ]}
            />
          );
        })}
        <View style={styles.ringInner}>
          <Text style={[styles.gValue, { color: liveData ? COLORS.text : COLORS.textDim }]}>{liveData ? gForce.toFixed(2) : '0.00'}</Text>
          <Text style={styles.gTitle}>{t('dashboard.gForceValue')}</Text>
          <View style={styles.gSubRow}>
            <View style={[styles.gBullet, { backgroundColor: liveData ? color : COLORS.textDim }]} />
            <Text style={styles.gSubText}>{liveData ? `${gForce.toFixed(2)}G` : '--'}</Text>
          </View>
          <Text style={styles.severityText}>{liveData ? severity : t('common.noData')}</Text>
        </View>
      </View>
      <Text style={styles.ms2}>{t('dashboard.mPerSecond')}</Text>
    </View>
  );
}

function CoordItem({ label, value, live }: { label: string; value?: number; live: boolean }) {
  return (
    <View style={styles.coordCell}>
      <Text style={styles.coordLabel}>{label}</Text>
      <Text style={styles.coordValue}>{live && value !== undefined ? value.toFixed(2) : '--.--'}</Text>
    </View>
  );
}

function MetricCard({ label, value, unit, color, live }: {
  label: string; value?: number; unit: string; color: string; live: boolean;
}) {
  return (
    <View style={styles.metric} testID={`metric-${label.toLowerCase().replace(/[\s-]+/g, '-')}`}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: live ? color : COLORS.textDim }]}>
        {live && value !== undefined ? value.toFixed(3) : '—.——'}
      </Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(204,255,0,0.012)',
    borderBottomLeftRadius: 100, borderBottomRightRadius: 100,
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md, paddingTop: SPACING.sm,
  },
  greeting: { fontSize: 13, color: COLORS.textSec },
  appName: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 4, marginTop: 2 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(52,211,153,0.06)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.10)',
  },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 14, marginBottom: SPACING.md,
  },
  statusBarConnected: { borderColor: 'rgba(52,211,153,0.20)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: '900', color: COLORS.text, letterSpacing: 1.5 },
  statusDetail: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },

  ringCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  ringCardCritical: {
    borderColor: 'rgba(239,68,68,0.40)',
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  criticalPulse: {
    position: 'absolute', top: -60, left: -60, right: -60, bottom: -60,
    backgroundColor: 'rgba(239,68,68,0.20)',
    borderRadius: 999,
  },
  ringWrap: { alignItems: 'center' },
  ringTrack: {
    width: 260, height: 260, borderRadius: 130,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    width: 3, height: 16, borderRadius: 999, position: 'absolute',
  },
  ringInner: {
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  gValue: { fontSize: 56, fontWeight: '900', color: COLORS.text, lineHeight: 64 },
  gTitle: { color: COLORS.textSec, letterSpacing: 4, fontSize: 10, fontWeight: '700' },
  gSubRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  gBullet: { width: 6, height: 6, borderRadius: 3 },
  gSubText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  severityText: { marginTop: 4, fontSize: 9, letterSpacing: 1.5, color: COLORS.textSec, fontWeight: '700' },
  ms2: { color: COLORS.textDim, marginTop: 8, fontSize: 11, letterSpacing: 3 },
  peakRow: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  peakLabel: { color: COLORS.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  peakValue: { color: COLORS.text, fontSize: 12, fontWeight: '900' },

  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  bentoCard: {
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, padding: 14,
  },
  bentoHalf: { flex: 1 },
  bentoTitle: { color: COLORS.textSec, fontSize: 8, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10 },
  coordsGrid: { flexDirection: 'row', gap: 8 },
  coordCell: {
    flex: 1, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 10, alignItems: 'center',
  },
  coordLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '900', marginBottom: 4 },
  coordValue: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, paddingVertical: 10, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: 'rgba(204,255,0,0.15)',
  },
  locationBtnText: { color: COLORS.accent, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  locationPermBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4, marginBottom: 6,
  },
  locationPermText: { color: COLORS.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  coordsGeo: { color: COLORS.textDim, fontSize: 12, letterSpacing: 0.5, lineHeight: 18 },
  coordsGeoDim: { color: COLORS.textDim, fontSize: 12 },
  liveTrackingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.pill, backgroundColor: 'rgba(52,211,153,0.06)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.12)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.success },
  liveTrackingText: { color: COLORS.success, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  trackingStatus: { color: COLORS.textDim, fontSize: 10, marginTop: 6 },

  trackingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  trackingTitle: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  trackingDesc: { color: COLORS.textSec, fontSize: 11, marginTop: 2 },
  trackingDot: { width: 8, height: 8, borderRadius: 4 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border },
  liveBadgeOn: { backgroundColor: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.10)' },
  liveDotSm: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  metric: {
    width: '48%', flexGrow: 1,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metricLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: '900', color: COLORS.textDim },
  metricUnit: { fontSize: 10, color: COLORS.textDim, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 50,
    marginBottom: SPACING.md,
  },
  primaryBtnDanger: {
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, padding: 12, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 4,
  },
  infoText: { fontSize: 11, color: COLORS.textSec, flex: 1 },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1, borderRadius: RADIUS.md, padding: 14, marginTop: 4,
  },
  warningTitle: { color: COLORS.warning, fontWeight: '800', fontSize: 13, marginBottom: 2 },
  warningText: { color: COLORS.textSec, fontSize: 11 },

  dialogText: { color: COLORS.textSec, fontSize: 14, marginBottom: 8, lineHeight: 20, textAlign: 'center' },
  countdownLabel: { color: COLORS.textDim, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  countdownValue: { color: COLORS.warning, fontSize: 64, fontWeight: '900', marginTop: 4, marginBottom: 20 },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtnSoft: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, alignItems: 'center' },
  cancelSoftText: { color: COLORS.text, fontWeight: '800', letterSpacing: 0.7 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  okBtnWide: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 14, marginTop: 14, width: '100%', alignItems: 'center' },
  okBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1, fontSize: 14 },
  contactSent: { color: COLORS.textSec, fontSize: 13, marginBottom: 4, textAlign: 'center' },
});

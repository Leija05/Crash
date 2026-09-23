import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Platform, ActivityIndicator, useWindowDimensions, Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Animated, { FadeIn, FadeInDown, SlideInUp, SlideInRight, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, severityLabel, RED, RED_GRADIENT, RED_GRADIENT_DIAGONAL, FONT, FONT_SIZE, ANIMATION, EASING } from '../../src/theme';
import PremiumModal from '../../src/components/PremiumModal';
import SimulationProgressModal from '../../src/components/SimulationProgressModal';
import GlassCard from '../../src/components/GlassCard';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import { CrashLogoMark } from '../../src/components/CrashLogo';
import { useAuth } from '../../src/context/AuthContext';
import { useBluetooth } from '../../src/context/BluetoothContext';
import { useAppSettings } from '../../src/context/AppSettingsContext';
import { useAlert } from '../../src/context/AlertContext';
import { useLocation } from '../../src/context/LocationContext';
import { useI18n } from '../../src/i18n';
import { contactsAPI, impactsAPI, settingsAPI, telemetryAPI } from '../../src/services/api';
import { foregroundService } from '../../src/services/foregroundService';
import GForceRing from '../../src/components/GForceRing';
import { LineChart, MultiLineChart, Sparkline } from '../../src/components/Charts';
import GPSMap from '../../src/components/GPSMap';
import { DarkSwitch } from '../../src/components/DarkSwitch';
import StickyNotification from '../../src/components/StickyNotification';
import { haptics } from '../../src/utils/haptics';
import { useTabBarScroll } from '../../src/context/TabBarContext';

const STAGGER = 60;

function estimateSpeed(ax: number, ay: number, az: number): number {
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  return Math.max(0, (magnitude - 9.8) * 3.6);
}

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

function Stagger({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(index * STAGGER).springify().damping(26).stiffness(200)}
    >
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { t } = useI18n();
  const { user, isSuperAdmin } = useAuth();
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

  const onTabScroll = useTabBarScroll();

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
  const [simulationModalVisible, setSimulationModalVisible] = useState(false);
  const [simulationStep, setSimulationStep] = useState(1);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(8);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [hasEmergencyContacts, setHasEmergencyContacts] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const lastTelemetrySentAtRef = useRef(0);
  const lastNotificationUpdateRef = useRef(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseAnim = useRef(new RNAnimated.Value(0)).current;
  const accelHistory = useRef<{ x: number; y: number; z: number; t: number }[]>([]);
  const gyroHistory = useRef<{ x: number; y: number; z: number; t: number }[]>([]);
  const gForceHistory = useRef<{ value: number; t: number }[]>([]);
  const gpsHistory = useRef<{ latitude: number; longitude: number; t: number }[]>([]);

  const greetingName = user?.name?.split(' ')[0] || 'Rider';

  const { width: SCREEN_W } = useWindowDimensions();
  const CONTENT_W = SCREEN_W - SPACING.md * 2;
  const CHART_INNER = CONTENT_W - SPACING.md * 2;
  const BENTO_INNER = CONTENT_W - 14 * 2;
  const RING_SIZE = Math.min(280, CONTENT_W - 48);
  const SPARK_W = (BENTO_INNER - 16) / 3;

  useEffect(() => {
    if (!telemetry) return;
    if (countdown !== null) return;
    telemetryRef.current = telemetry;
    lastDataRef.current = Date.now();
    setStaleData(false);
    setPeakG(prev => (telemetry.g_force > prev ? telemetry.g_force : prev));

    const now = Date.now();
    accelHistory.current.push({ x: telemetry.acceleration_x, y: telemetry.acceleration_y, z: telemetry.acceleration_z, t: now });
    gyroHistory.current.push({ x: telemetry.gyroscope_x, y: telemetry.gyroscope_y, z: telemetry.gyroscope_z, t: now });
    gForceHistory.current.push({ value: telemetry.g_force, t: now });

    if (accelHistory.current.length > 60) accelHistory.current.shift();
    if (gyroHistory.current.length > 60) gyroHistory.current.shift();
    if (gForceHistory.current.length > 60) gForceHistory.current.shift();
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
    haptics.light();
    setRefreshing(true);
    setPeakG(0);
    accelHistory.current = [];
    gyroHistory.current = [];
    gForceHistory.current = [];
    gpsHistory.current = [];
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
      const loop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 620, useNativeDriver: false }),
          RNAnimated.timing(pulseAnim, { toValue: 0, duration: 620, useNativeDriver: false }),
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
            gpsHistory.current.push({ latitude, longitude, t: now });
            if (gpsHistory.current.length > 60) gpsHistory.current.shift();
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
      haptics.error();
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
      if (impact?.alerts_sent) haptics.success(); else haptics.warning();
      setAlertResult(impact);
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('errors.generic') });
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, alertThreshold, confirm, alert, t]);

  const simulateImpact = useCallback(async () => {
    if (!token || sending || emergencyInFlightRef.current) return;

    const confirmed = await confirm({
      eyebrow: t('dashboard.alertEyebrow'),
      title: t('dashboard.simulateTitle'),
      message: t('dashboard.simulateMessage'),
      confirmText: t('dashboard.simulateSend'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    if (!hasEmergencyContacts) {
      const goToContacts = await confirm({
        title: t('dashboard.noContactsAlert'),
        message: t('dashboard.noContactsAlertMessage'),
        confirmText: t('dashboard.goToContacts'),
        cancelText: t('common.cancel'),
      });
      if (goToContacts) router.push('/contacts');
      return;
    }

    // Launch Simulation Progress Modal immediately
    setSimulationResult(null);
    setSimulationError(null);
    setSimulationStep(1);
    setSimulationModalVisible(true);
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

      // Step 1: Telemetry acquisition & G-Force visualizer pacing
      await new Promise((r) => setTimeout(r, 650));
      setSimulationStep(2); // Step 2: Server uplink

      // Start asynchronous backend creation
      const createPromise = impactsAPI.create(token, {
        acceleration_x: 0,
        acceleration_y: 0,
        acceleration_z: 18.5,
        gyroscope_x: 0,
        gyroscope_y: 0,
        gyroscope_z: 0,
        g_force: 18.5,
        latitude,
        longitude,
        simulated: true,
      });

      // Timers to smoothly progress through AI diagnosis and WhatsApp dispatch while backend computes
      const t1 = setTimeout(() => setSimulationStep(3), 850);
      const t2 = setTimeout(() => setSimulationStep(4), 1800);

      const impact = await createPromise;
      clearTimeout(t1);
      clearTimeout(t2);

      // Transition to final dispatch and success
      setSimulationStep(4);
      await new Promise((r) => setTimeout(r, 500));
      setSimulationStep(5);
      setSimulationResult(impact);

      if (impact?.alerts_sent) {
        haptics.success();
      } else {
        haptics.warning();
      }
    } catch (e: any) {
      setSimulationError(e.message || t('errors.generic'));
      haptics.error();
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, confirm, t]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      triggerEmergencyFlow();
      return;
    }
    haptics.warning();
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

  const accelChartData = useRef(
    accelHistory.current.map((d, i) => ({
      x: i,
      y: d.x,
      label: `${i}s`,
    }))
  ).current;

  const accelYData = accelHistory.current.map(d => ({ x: 0, y: d.y }));
  const accelZData = accelHistory.current.map(d => ({ x: 0, y: d.z }));
  const gyroXData = gyroHistory.current.map((d, i) => ({ x: i, y: d.x }));
  const gyroYData = gyroHistory.current.map((d, i) => ({ x: i, y: d.y }));
  const gyroZData = gyroHistory.current.map((d, i) => ({ x: i, y: d.z }));
  const gForceChartData = gForceHistory.current.map((d, i) => ({ x: i, y: d.value }));
  const gpsRoute = gpsHistory.current.map(p => ({ latitude: p.latitude, longitude: p.longitude, t: p.t }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.brandGlow} pointerEvents="none" />

      {highImpact && liveData && (
        <StickyNotification
          message={t('dashboard.impactDetected')}
          type="danger"
          icon="alert-circle"
          position="top-right"
          autoDismiss={0}
        />
      )}

      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
        contentContainerStyle={styles.scroll}
        onScroll={onTabScroll}
        scrollEventThrottle={16}
      >
        <Stagger index={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CrashLogoMark size={38} />
              <View>
                <Text style={styles.greeting}>{t('dashboard.greeting')}, {greetingName}</Text>
                <Text style={styles.appName}>{t('dashboard.appName')}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.modePill, liveData && styles.modePillOn]}>
                <View style={[styles.modeDot, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
                <Text style={[styles.modeText, { color: liveData ? COLORS.success : COLORS.textDim }]}>{t('dashboard.modeReal')}</Text>
              </View>
              {isSuperAdmin && (
                <TouchableOpacity
                  style={[styles.simBadge, sending && { opacity: 0.6 }]}
                  onPress={() => { haptics.medium(); simulateImpact(); }}
                  disabled={sending}
                  activeOpacity={0.7}
                  testID="simulate-impact-btn"
                >
                  <Ionicons name="flask" size={13} color={RED} />
                  <Text style={styles.simText}>{sending ? t('common.sending') : t('dashboard.simulate')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Stagger>

        <Stagger index={1}>
          <GlassCard
            padding={14}
            bezel
            delay={40}
            style={[styles.statusBarCard, liveData && styles.statusBarCardConnected]}
          >
            <TouchableOpacity
              style={styles.statusBarInner}
              onPress={() => { haptics.selection(); router.push('/devices'); }}
              activeOpacity={0.7}
              testID="dashboard-status-bar"
            >
              <View style={styles.statusDotWrap}>
                <View style={[styles.statusDot, { backgroundColor: liveData ? COLORS.success : connected ? COLORS.warning : COLORS.textDim }]} />
              </View>
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
          </GlassCard>
        </Stagger>

        <Stagger index={2}>
          <GlassCard
            padding={16}
            bezel
            blur
            variant={highImpact ? 'danger' : 'premium'}
            delay={80}
            style={[styles.ringCard, highImpact && styles.ringCardCritical]}
          >
            {highImpact && (
              <RNAnimated.View pointerEvents="none" style={[styles.criticalPulse, { opacity: pulseAnim }]} />
            )}
            <View pointerEvents="none" style={styles.hudBrackets}>
              <View style={[styles.hudCorner, styles.hudTL]} />
              <View style={[styles.hudCorner, styles.hudTR]} />
              <View style={[styles.hudCorner, styles.hudBL]} />
              <View style={[styles.hudCorner, styles.hudBR]} />
            </View>
            <GForceRing
              gForce={gForce}
              liveData={liveData}
              severity={sevLabel}
              t={t}
              peakG={peakG}
              size={RING_SIZE}
            />
            {!liveData && (
              <View style={styles.ringEmptyHint}>
                <View style={styles.ringEmptyLine} />
                <Text style={styles.ringEmptyText}>{t('dashboard.tapToConnect')}</Text>
              </View>
            )}
          </GlassCard>
        </Stagger>

        <Stagger index={3}>
          <View style={styles.bentoRow}>
            <GlassCard padding={14} delay={40} style={styles.bentoHalf} redEdge>
              <Text style={styles.bentoTitle}>{t('dashboard.acceleration')}</Text>
              <View style={styles.coordsGrid}>
                <CoordItem label="X" value={telemetryForDisplay?.acceleration_x} live={liveData} delay={0} />
                <CoordItem label="Y" value={telemetryForDisplay?.acceleration_y} live={liveData} delay={1} />
                <CoordItem label="Z" value={telemetryForDisplay?.acceleration_z} live={liveData} delay={2} />
              </View>
            </GlassCard>
            <GlassCard padding={14} delay={70} style={styles.bentoHalf} redEdge>
              <Text style={styles.bentoTitle}>{t('dashboard.location')}</Text>
              {permissionGranted === false ? (
                <TouchableOpacity style={styles.locationBtn} onPress={requestPermission} activeOpacity={0.8}>
                  <Ionicons name="location-outline" size={16} color={RED} />
                  <Text style={styles.locationBtnText}>{t('dashboard.enableLocation')}</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <View style={styles.locationPermBadge}>
                    <Ionicons name="location" size={12} color={RED} />
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
            </GlassCard>
          </View>
        </Stagger>

        <Stagger index={4}>
          <View style={styles.bentoCol}>
            <GlassCard padding={14} delay={40} redEdge>
              <Text style={styles.bentoTitle}>{t('dashboard.gyroscope')}</Text>
              <View style={styles.gyroGrid}>
                <GyroAxis label={t('dashboard.gyroX')} value={telemetryForDisplay?.gyroscope_x} unit="°/s" color={COLORS.warning} live={liveData} delay={0} />
                <GyroAxis label={t('dashboard.gyroY')} value={telemetryForDisplay?.gyroscope_y} unit="°/s" color={COLORS.warning} live={liveData} delay={1} />
                <GyroAxis label={t('dashboard.gyroZ')} value={telemetryForDisplay?.gyroscope_z} unit="°/s" color="#FB923C" live={liveData} delay={2} />
              </View>
            </GlassCard>
            <GlassCard padding={14} delay={70} redEdge>
              <Text style={styles.bentoTitle}>{t('dashboard.gps')}</Text>
              <GPSMap
                route={gpsRoute}
                impactPoint={impactTelemetryRef.current?.latitude && impactTelemetryRef.current?.longitude ? {
                  latitude: impactTelemetryRef.current.latitude,
                  longitude: impactTelemetryRef.current.longitude,
                } : undefined}
                currentLocation={currentLocation}
                width={BENTO_INNER}
                height={160}
                animateRoute={true}
              />
            </GlassCard>
          </View>
        </Stagger>

        <Stagger index={5}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('dashboard.telemetryTitle')}</Text>
            <View style={[styles.liveBadge, liveData && styles.liveBadgeOn]}>
              <View style={[styles.liveDotSm, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
              <Text style={[styles.liveText, { color: liveData ? COLORS.success : COLORS.textDim }]}>{t('dashboard.liveBadge')}</Text>
            </View>
          </View>
        </Stagger>

        <Stagger index={6}>
          <GlassCard padding={16} delay={40} redEdge>
            <Text style={styles.chartTitle}>{t('dashboard.accelChart')}</Text>
            <MultiLineChart
              datasets={[
                { data: accelChartData, color: COLORS.info, name: 'Accel X' },
                { data: accelYData, color: COLORS.warning, name: 'Accel Y' },
                { data: accelZData, color: COLORS.danger, name: 'Accel Z' },
              ]}
              width={CHART_INNER}
              height={140}
              showArea
              showLegend
            />
          </GlassCard>
        </Stagger>

        <Stagger index={7}>
          <GlassCard padding={16} delay={40} redEdge>
            <Text style={styles.chartTitle}>{t('dashboard.gForceChart')}</Text>
            <LineChart
              data={gForceChartData}
              width={CHART_INNER}
              height={140}
              color={RED}
              gradientColors={[RED, RED + '00']}
              showArea
              showPoints={false}
              strokeWidth={2}
            />
          </GlassCard>
        </Stagger>

        <Stagger index={8}>
          <View style={styles.metricsGrid}>
            <MetricCard label={t('dashboard.gyroX')} value={telemetryForDisplay?.gyroscope_x} unit="°/s" color={COLORS.warning} live={liveData} delay={0} />
            <MetricCard label={t('dashboard.gyroY')} value={telemetryForDisplay?.gyroscope_y} unit="°/s" color={COLORS.warning} live={liveData} delay={1} />
            <MetricCard label={t('dashboard.gyroZ')} value={telemetryForDisplay?.gyroscope_z} unit="°/s" color="#FB923C" live={liveData} delay={2} />
            <MetricCard label={t('dashboard.gForce')} value={telemetryForDisplay?.g_force} unit="g" color={RED} live={liveData} delay={3} />
          </View>
        </Stagger>

        <Stagger index={9}>
          {connected ? (
            <TouchableOpacity
              style={[styles.primaryBtn, styles.primaryBtnDanger]}
              onPress={() => { haptics.medium(); disconnect(); }}
              activeOpacity={0.8}
              testID="disconnect-btn"
            >
              <Ionicons name="bluetooth" size={18} color="#fff" />
              <Text style={[styles.primaryBtnText, styles.primaryBtnTextDanger]}>{t('dashboard.disconnectHelmet')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => { haptics.medium(); router.push('/devices'); }}
              activeOpacity={0.85}
              testID="connect-btn"
            >
              <LinearGradient
                colors={[...RED_GRADIENT]}
                start={RED_GRADIENT_DIAGONAL.start}
                end={RED_GRADIENT_DIAGONAL.end}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.primaryBtnSheen} pointerEvents="none" />
              <Ionicons name="bluetooth" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{t('dashboard.connectHelmet')}</Text>
            </TouchableOpacity>
          )}
        </Stagger>

        <Stagger index={10}>
          {!nativeAvailable && (
            <GlassCard padding={12} delay={40}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={14} color={COLORS.info} />
                <Text style={styles.infoText}>{t('dashboard.nativeBluetoothInfo')}</Text>
              </View>
            </GlassCard>
          )}
          {nativeAvailable && !connected && (
            <GlassCard padding={12} delay={40}>
              <View style={styles.infoRow}>
                <Ionicons name="radio" size={14} color={COLORS.info} />
                <Text style={styles.infoText}>{t('dashboard.scanningFor')} {pattern} · HC-05 · HC-10 · HM-10 · MLT-BT05 · CRASH</Text>
              </View>
            </GlassCard>
          )}
        </Stagger>

        <Stagger index={11}>
          {!hasEmergencyContacts && (
            <GlassCard padding={14} delay={40} variant="danger">
              <TouchableOpacity style={styles.warningRow} onPress={() => router.push('/contacts')} activeOpacity={0.85}>
                <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>{t('dashboard.noContacts')}</Text>
                  <Text style={styles.warningText}>{t('dashboard.noContactsDesc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
              </TouchableOpacity>
            </GlassCard>
          )}
        </Stagger>

        {isSuperAdmin && (
          <Stagger index={12}>
            <GlassCard padding={14} delay={40} redEdge>
              <View style={styles.debugHeader}>
                <Text style={styles.debugTitle}>{t('dashboard.debugTerminal')}</Text>
                <Text style={styles.debugSubtitle}>{t('dashboard.debugSubtitle')}</Text>
              </View>
              <View style={styles.debugTerminal}>
                <Text style={styles.debugText}>
                  {telemetry ? JSON.stringify(telemetry, null, 2) : t('dashboard.noTelemetryData')}
                </Text>
              </View>
            </GlassCard>
          </Stagger>
        )}
      </Animated.ScrollView>

      <PremiumModal
        visible={countdown !== null}
        onClose={() => setCountdown(null)}
        title={t('dashboard.impactDetected')}
        eyebrow={t('dashboard.alertEyebrow')}
        accent={RED}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>{t('dashboard.alertMessage')}</Text>
        <View style={styles.countdownRing}>
          <Text style={styles.countdownLabel}>{t('dashboard.remainingTime')}</Text>
          <AnimatedNumber value={countdown ?? 0} style={styles.countdownValue} />
          <View style={styles.countdownTickRow}>
            {Array.from({ length: countdownSeconds }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.countdownTick,
                  (countdown ?? 0) > i && styles.countdownTickActive,
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.dialogActions}>
          <TouchableOpacity style={styles.cancelBtnSoft} onPress={() => { haptics.light(); setCountdown(null); }}>
            <Text style={styles.cancelSoftText}>{t('dashboard.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, sending && { opacity: 0.6 }]}
            disabled={sending}
            onPress={() => { haptics.heavy(); setCountdown(null); impactTriggeredRef.current = true; triggerEmergencyFlow(); }}
          >
            <LinearGradient
              colors={[...RED_GRADIENT]}
              start={RED_GRADIENT_DIAGONAL.start}
              end={RED_GRADIENT_DIAGONAL.end}
              style={StyleSheet.absoluteFill}
            />
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelText}>{t('dashboard.sendNow')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </PremiumModal>

      <PremiumModal
        visible={!!alertResult}
        onClose={() => setAlertResult(null)}
        title={alertResult?.alerts_sent ? t('dashboard.sentTitle') : t('dashboard.notSentTitle')}
        eyebrow={t('dashboard.reportEyebrow')}
        accent={alertResult?.alerts_sent ? COLORS.success : RED}
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
          <TouchableOpacity style={styles.okBtnWide} onPress={() => { haptics.light(); setAlertResult(null); }}>
            <LinearGradient
              colors={[...RED_GRADIENT]}
              start={RED_GRADIENT_DIAGONAL.start}
              end={RED_GRADIENT_DIAGONAL.end}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.okBtnText}>{t('common.accept')}</Text>
          </TouchableOpacity>
        </View>
      </PremiumModal>

      <SimulationProgressModal
        visible={simulationModalVisible}
        currentStep={simulationStep}
        simulatedGForce={18.5}
        impactResult={simulationResult}
        error={simulationError}
        onClose={() => setSimulationModalVisible(false)}
        onViewReport={(id) => {
          setSimulationModalVisible(false);
          router.push(`/impact/${id}`);
        }}
        t={t}
      />
    </SafeAreaView>
  );
}

function CoordItem({ label, value, live, delay = 0 }: { label: string; value?: number; live: boolean; delay?: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(320).delay(delay * 80).springify().damping(25).stiffness(200)}
      style={styles.coordCell}
    >
      <Text style={styles.coordLabel}>{label}</Text>
      <AnimatedNumber
        value={live && value !== undefined ? value : 0}
        decimals={2}
        duration={400}
        style={[styles.coordValue, { color: live ? COLORS.text : COLORS.textDim }]}
      >
      </AnimatedNumber>
    </Animated.View>
  );
}

function MetricCard({ label, value, unit, color, live, delay = 0 }: {
  label: string; value?: number; unit: string; color: string; live: boolean; delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(320).delay(delay * 80).springify().damping(25).stiffness(200)}
      style={styles.metric}
      testID={`metric-${label.toLowerCase().replace(/[\s-]+/g, '-')}`}
    >
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={[styles.metricAccent, { backgroundColor: live ? color : COLORS.textFaint }]} />
      </View>
      <AnimatedNumber
        value={live && value !== undefined ? value : 0}
        decimals={3}
        duration={450}
        style={[styles.metricValue, { color: live ? color : COLORS.textDim }]}
      />
      <Text style={styles.metricUnit}>{unit}</Text>
    </Animated.View>
  );
}

function GyroAxis({ label, value, unit, color, live, delay = 0 }: {
  label: string; value?: number; unit: string; color: string; live: boolean; delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(320).delay(delay * 80).springify().damping(25).stiffness(200)}
      style={styles.gyroAxis}
      testID={`gyro-${label.toLowerCase().replace(/[\s-]+/g, '-')}`}
    >
      <View style={styles.gyroAxisTop}>
        <Text style={styles.gyroAxisLabel}>{label}</Text>
        <View style={[styles.gyroAxisDot, { backgroundColor: live ? color : COLORS.textFaint }]} />
      </View>
      <AnimatedNumber
        value={live && value !== undefined ? value : 0}
        decimals={1}
        duration={400}
        style={[styles.gyroAxisValue, { color: live ? color : COLORS.textDim }]}
      />
      <Text style={[styles.gyroAxisUnit, { color: live ? COLORS.textSec : COLORS.textDim }]}>{unit}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(239,68,68,0.02)',
    borderBottomLeftRadius: 100, borderBottomRightRadius: 100,
  },
  brandGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,68,68,0.03)',
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 90 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md, paddingTop: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  simBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    ...SHADOWS.glow(RED, 0.25, 12),
  },
  simText: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1, color: RED },
  greeting: { fontSize: FONT_SIZE.sm, fontFamily: FONT.body, color: COLORS.textSec },
  appName: { fontSize: FONT_SIZE.xl, fontFamily: FONT.display, fontWeight: '700', color: COLORS.text, letterSpacing: 4, marginTop: 1 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modePillOn: {
    backgroundColor: COLORS.successSoft,
    borderColor: 'rgba(74,222,128,0.22)',
  },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1 },

  statusBarCard: {
    marginBottom: SPACING.md,
  },
  statusBarCardConnected: {
    borderColor: 'rgba(239,68,68,0.30)',
  },
  statusBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  statusDotWrap: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', color: COLORS.text, letterSpacing: 1.5 },
  statusDetail: { fontSize: FONT_SIZE.sm, fontFamily: FONT.body, color: COLORS.textSec, marginTop: 2 },

  ringCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: SPACING.md,
  },
  ringCardCritical: {
    borderColor: 'rgba(255,77,77,0.45)',
  },
  criticalPulse: {
    position: 'absolute', top: -60, left: -60, right: -60, bottom: -60,
    backgroundColor: 'rgba(255,59,48,0.22)',
    borderRadius: 999,
  },
  hudBrackets: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
    opacity: 0.65,
  },
  hudCorner: {
    position: 'absolute', width: 16, height: 16,
    borderColor: 'rgba(248,113,113,0.60)',
  },
  hudTL: { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  hudTR: { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  hudBL: { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  hudBR: { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  ringEmptyHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
  },
  ringEmptyLine: { width: 20, height: 1, backgroundColor: COLORS.textDim },
  ringEmptyText: { color: COLORS.textDim, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, letterSpacing: 2, textTransform: 'uppercase' },

  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  bentoCol: { gap: SPACING.md, marginBottom: SPACING.md },
  bentoHalf: { flex: 1 },
  bentoTitle: { color: COLORS.textSec, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  coordsGrid: { flexDirection: 'row', gap: 8 },
  coordCell: {
    flex: 1, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10, alignItems: 'center',
  },
  coordLabel: { color: COLORS.textDim, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', marginBottom: 4 },
  coordValue: { fontSize: FONT_SIZE.lg, fontFamily: FONT.monoMedium, fontWeight: '500', includeFontPadding: false },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, paddingVertical: 10, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)',
  },
  locationBtnText: { color: RED, fontFamily: FONT.heading, fontWeight: '600', fontSize: FONT_SIZE.sm, letterSpacing: 0.5 },
  locationPermBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4, marginBottom: 6,
  },
  locationPermText: { color: RED, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '600', letterSpacing: 1 },
  coordsGeo: { color: COLORS.textDim, fontSize: FONT_SIZE.sm, fontFamily: FONT.monoMedium, letterSpacing: 0.5, lineHeight: 18 },
  coordsGeoDim: { color: COLORS.textDim, fontSize: FONT_SIZE.sm, fontFamily: FONT.body },
  liveTrackingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.successSoft,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.22)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.success },
  liveTrackingText: { color: COLORS.success, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '600', letterSpacing: 0.5 },
  trackingStatus: { color: COLORS.textDim, fontSize: FONT_SIZE.xs, fontFamily: FONT.body, marginTop: 6 },

  sparklineGrid: { flexDirection: 'row', gap: 8 },

  gyroGrid: { flexDirection: 'row', gap: 10 },
  gyroAxis: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  gyroAxisTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  gyroAxisLabel: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', color: COLORS.textSec, letterSpacing: 1.5, textTransform: 'uppercase' },
  gyroAxisDot: { width: 8, height: 8, borderRadius: 4 },
  gyroAxisValue: { fontSize: FONT_SIZE.xl, fontFamily: FONT.monoMedium, fontWeight: '500', includeFontPadding: false },
  gyroAxisUnit: { fontSize: FONT_SIZE.xs, fontFamily: FONT.body, marginTop: 2 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  liveBadgeOn: { backgroundColor: COLORS.successSoft, borderColor: 'rgba(74,222,128,0.20)' },
  liveDotSm: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1 },

  chartTitle: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.heading,
    fontWeight: '700',
    color: COLORS.textSec,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  metric: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '49%',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)',
    ...SHADOWS.xs,
  },
  metricTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  metricAccent: {
    width: 10, height: 10, borderRadius: 5,
    opacity: 0.9,
  },
  metricLabel: { fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2 },
  metricValue: { fontSize: FONT_SIZE.xl, fontFamily: FONT.monoMedium, fontWeight: '500', includeFontPadding: false },
  metricUnit: { fontSize: FONT_SIZE.xs, fontFamily: FONT.body, color: COLORS.textDim, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: RED, borderRadius: RADIUS.pill, height: 54,
    marginBottom: SPACING.md, overflow: 'hidden',
    ...SHADOWS.glow(RED, 0.4, 18),
  },
  primaryBtnDanger: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.redGlow(0.35),
  },
  primaryBtnSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: RADIUS.pill, borderTopRightRadius: RADIUS.pill,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: FONT_SIZE.sm, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 2 },
  primaryBtnTextDanger: { color: '#fff' },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  infoText: { fontSize: FONT_SIZE.sm, fontFamily: FONT.body, color: COLORS.textSec, flex: 1 },
  warningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  warningTitle: { color: COLORS.warning, fontFamily: FONT.heading, fontWeight: '700', fontSize: FONT_SIZE.md, marginBottom: 2 },
  warningText: { color: COLORS.textSec, fontSize: FONT_SIZE.sm, fontFamily: FONT.body },

  dialogText: { color: COLORS.textSec, fontSize: FONT_SIZE.md, fontFamily: FONT.body, marginBottom: 8, lineHeight: 20, textAlign: 'center' },
  countdownRing: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    backgroundColor: 'rgba(239,68,68,0.05)',
    ...SHADOWS.glow(RED, 0.15, 20),
  },
  countdownLabel: { color: COLORS.textDim, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  countdownValue: { color: RED, fontSize: FONT_SIZE.display, fontFamily: FONT.mono, fontWeight: '700', marginTop: 2, includeFontPadding: false },
  countdownTickRow: { flexDirection: 'row', gap: 4, marginTop: 12 },
  countdownTick: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  countdownTickActive: {
    backgroundColor: RED,
    ...SHADOWS.glow(RED, 0.5, 6),
  },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtnSoft: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14, alignItems: 'center',
  },
  cancelSoftText: { color: COLORS.text, fontFamily: FONT.heading, fontWeight: '600', letterSpacing: 0.7 },
  cancelBtn: {
    flex: 1, backgroundColor: RED, borderRadius: RADIUS.pill,
    paddingVertical: 14, alignItems: 'center', overflow: 'hidden',
  },
  cancelText: { color: '#FFFFFF', fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1 },
  okBtnWide: {
    backgroundColor: RED, borderRadius: RADIUS.pill,
    paddingVertical: 14, marginTop: 14, width: '100%', alignItems: 'center', overflow: 'hidden',
  },
  okBtnText: { color: '#FFFFFF', fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1, fontSize: FONT_SIZE.md },
  contactSent: { color: COLORS.textSec, fontSize: FONT_SIZE.md, fontFamily: FONT.body, marginBottom: 4, textAlign: 'center' },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  debugTitle: {
    color: RED,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.heading,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  debugSubtitle: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.mono,
    fontWeight: '500',
  },
  debugTerminal: {
    backgroundColor: '#0a0a0a',
    borderRadius: RADIUS.md,
    padding: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    ...SHADOWS.glow(RED, 0.1, 8),
  },
  debugText: {
    color: '#00ff88',
    fontSize: 10,
    fontFamily: FONT.mono,
    lineHeight: 16,
  },
});
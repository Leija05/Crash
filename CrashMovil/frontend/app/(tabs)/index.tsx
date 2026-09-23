import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Platform, ActivityIndicator, useWindowDimensions, Animated as RNAnimated, Switch, AppState, DeviceEventEmitter,
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
import { usePhoneSensor } from '../../src/context/PhoneSensorContext';
import { useLocation } from '../../src/context/LocationContext';
import { useI18n } from '../../src/i18n';
import { contactsAPI, impactsAPI, settingsAPI, telemetryAPI } from '../../src/services/api';
import { foregroundService } from '../../src/services/foregroundService';
import { phoneSensorEngine } from '../../src/services/phoneSensorEngine';
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
const ANDROID_STATUS_CHANNEL_ID = 'crash-monitoring';
const NOTIFICATION_TELEMETRY_THROTTLE_MS = 12000;
const NOTIFICATION_COUNTDOWN_ID = 'crash-countdown';
const NOTIFICATION_STATUS_ID = 'crash-status';
const ACTION_CANCEL_COUNTDOWN = 'CANCEL_COUNTDOWN';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const id = notification.request.identifier || '';
    const content = notification.request.content as any;
    const isEmergency = id.includes('alert')
      || id.includes('emergency')
      || id.includes('countdown')
      || id.includes('threshold')
      || id.includes('dispatched')
      || content?.priority === Notifications.AndroidNotificationPriority.MAX;

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: isEmergency,
      shouldSetBadge: false,
    };
  },
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
    phoneSensorActive, canUsePhoneSensor, phoneTelemetry, latestDetectedImpact,
    clearDetectedImpact, setSensorThreshold,
  } = usePhoneSensor();
  const {
    permissionGranted, grantedLocation, currentLocation, isTracking,
    requestPermission, getRecentRoute,
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
  const lastReportedGRef = useRef(1.0);
  const lastReportedPeakRef = useRef(1.0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTargetTsRef = useRef<number | null>(null);
  const emergencyFlowRef = useRef<() => void>(() => {});
  const lastImpactTriggerTsRef = useRef(0);

  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    countdownTargetTsRef.current = null;
    setCountdown(null);
    lastImpactTriggerTsRef.current = Date.now();
    impactTriggeredRef.current = false;
    // Sincronizar cancelación con el servicio nativo para retirar alerta y parar vibración
    foregroundService.cancelEmergencyCountdown();
  }, []);

  const startCountdown = useCallback((seconds: number, forceG?: number) => {
    const now = Date.now();
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    lastImpactTriggerTsRef.current = now;
    countdownTargetTsRef.current = now + seconds * 1000;
    setCountdown(seconds);
    haptics.warning();

    // Sincronizar con el servicio nativo para mostrar la alerta con botones Cancelar y Enviar Ahora
    const gVal = forceG ?? (impactTelemetryRef.current?.g_force ?? telemetryRef.current?.g_force ?? 5.0);
    foregroundService.startEmergencyCountdown(seconds, gVal);

    countdownTimerRef.current = setInterval(() => {
      if (!countdownTargetTsRef.current) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        return;
      }
      const diffMs = countdownTargetTsRef.current - Date.now();
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));
      setCountdown((prev) => {
        if (prev !== remaining) {
          if (remaining > 0) haptics.warning();
          return remaining;
        }
        return prev;
      });

      if (diffMs <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        countdownTargetTsRef.current = null;
        setCountdown(null);
        lastImpactTriggerTsRef.current = Date.now();
        impactTriggeredRef.current = true;
        if (emergencyFlowRef.current) {
          emergencyFlowRef.current();
        }
      }
    }, 200);
  }, []);

  useEffect(() => {
    // 1. Descartar cualquier notificación de Expo en Android para asegurar que solo exista 1 barra nativa
    if (Platform.OS === 'android') {
      Notifications.dismissNotificationAsync(NOTIFICATION_STATUS_ID).catch(() => {});
    }

    // 2. Escuchar eventos de la barra de notificaciones interactiva de C.R.A.S.H.
    const subStarted = DeviceEventEmitter.addListener('onNativeCountdownStarted', (data: any) => {
      const sec = data?.seconds ?? 10;
      if (countdown === null && !sending && !emergencyInFlightRef.current) {
        impactTriggeredRef.current = true;
        setCountdown(sec);
      }
    });

    const subTick = DeviceEventEmitter.addListener('onNativeCountdownTick', (data: any) => {
      const sec = data?.seconds;
      if (sec !== undefined) {
        setCountdown(sec);
      }
    });

    const subCancelled = DeviceEventEmitter.addListener('onNativeCountdownCancelled', () => {
      // El usuario presionó "❌ CANCELAR" en la barra de notificaciones
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      countdownTargetTsRef.current = null;
      setCountdown(null);
      lastImpactTriggerTsRef.current = Date.now();
      impactTriggeredRef.current = false;
      haptics.light();
    });

    const subSendNow = DeviceEventEmitter.addListener('onNativeCountdownSendNow', () => {
      // El usuario presionó "🚨 ENVIAR AHORA" en la barra de notificaciones o expiró el tiempo
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      countdownTargetTsRef.current = null;
      setCountdown(null);
      lastImpactTriggerTsRef.current = Date.now();
      impactTriggeredRef.current = true;
      if (emergencyFlowRef.current) {
        emergencyFlowRef.current();
      }
    });

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      subStarted.remove();
      subTick.remove();
      subCancelled.remove();
      subSendNow.remove();
    };
  }, [countdown, sending]);

  const pulseAnim = useRef(new RNAnimated.Value(0)).current;
  const accelHistory = useRef<{ x: number; y: number; z: number; t: number }[]>([]);
  const gyroHistory = useRef<{ x: number; y: number; z: number; t: number }[]>([]);
  const gForceHistory = useRef<{ value: number; t: number }[]>([]);
  const gpsHistory = useRef<{ latitude: number; longitude: number; t: number }[]>([]);

  const greetingName = user?.name?.split(' ')[0] || 'Rider';

  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const CONTENT_W = SCREEN_W - SPACING.md * 2;
  const CHART_INNER = CONTENT_W - SPACING.md * 2;
  const BENTO_INNER = CONTENT_W - 14 * 2;
  const RING_SIZE = Math.min(290, Math.max(220, SCREEN_W * 0.74));
  const SPARK_W = (BENTO_INNER - 16) / 3;

  const effectiveTelemetry: any = connected
    ? telemetry
    : phoneSensorActive && phoneTelemetry
    ? {
        acceleration_x: phoneTelemetry.acceleration.x,
        acceleration_y: phoneTelemetry.acceleration.y,
        acceleration_z: phoneTelemetry.acceleration.z,
        gyroscope_x: phoneTelemetry.gyroscope.x,
        gyroscope_y: phoneTelemetry.gyroscope.y,
        gyroscope_z: phoneTelemetry.gyroscope.z,
        g_force: phoneTelemetry.gForce,
        speed_kmh: phoneTelemetry.speedKmh,
        battery: 100,
        critical: phoneTelemetry.gForce >= alertThreshold,
        timestamp: phoneTelemetry.timestamp,
      }
    : telemetry;

  useEffect(() => {
    if (!effectiveTelemetry) return;
    if (countdown !== null) return;
    telemetryRef.current = effectiveTelemetry;
    lastDataRef.current = Date.now();
    setStaleData(false);
    setPeakG(prev => (effectiveTelemetry.g_force > prev ? effectiveTelemetry.g_force : prev));

    const now = Date.now();
    accelHistory.current.push({ x: effectiveTelemetry.acceleration_x, y: effectiveTelemetry.acceleration_y, z: effectiveTelemetry.acceleration_z, t: now });
    gyroHistory.current.push({ x: effectiveTelemetry.gyroscope_x, y: effectiveTelemetry.gyroscope_y, z: effectiveTelemetry.gyroscope_z, t: now });
    gForceHistory.current.push({ value: effectiveTelemetry.g_force, t: now });

    if (accelHistory.current.length > 60) accelHistory.current.shift();
    if (gyroHistory.current.length > 60) gyroHistory.current.shift();
    if (gForceHistory.current.length > 60) gForceHistory.current.shift();
  }, [effectiveTelemetry, countdown]);

  // Detección autónoma de impacto en el smartphone
  useEffect(() => {
    if (!phoneSensorActive || !latestDetectedImpact) return;
    const detected = latestDetectedImpact;
    // Consumir y limpiar de inmediato para que nunca quede un impacto residual en el contexto
    clearDetectedImpact();

    const now = Date.now();
    if (countdown !== null || sending || emergencyInFlightRef.current || now - lastImpactTriggerTsRef.current < 15000) {
      return;
    }

    lastImpactTriggerTsRef.current = now;
    impactTriggeredRef.current = true;
    impactTelemetryRef.current = {
      acceleration_x: detected.acceleration.x,
      acceleration_y: detected.acceleration.y,
      acceleration_z: detected.acceleration.z,
      gyroscope_x: detected.gyroscope.x,
      gyroscope_y: detected.gyroscope.y,
      gyroscope_z: detected.gyroscope.z,
      g_force: detected.gForce,
      speed_kmh: Math.round((detected.gForce - 1.0) * 18.5),
      battery: 100,
      critical: true,
      timestamp: now,
    };
    haptics.error();
    startCountdown(countdownSeconds);
  }, [phoneSensorActive, latestDetectedImpact, countdown, sending, countdownSeconds, clearDetectedImpact, startCountdown]);

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
        if (!Number.isNaN(threshold) && threshold > 0) {
          setAlertThreshold(threshold);
          setSensorThreshold(threshold);
        }
        setLocationTrackingEnabled(s?.location_tracking_enabled !== false);
      } catch (e) {
        console.warn('No se pudo cargar countdown de usuario', e);
      }
    };
    loadSettings();
  }, [token, alertsConfigVersion, setSensorThreshold]);

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

  const isMonitoring = connected || phoneSensorActive;

  useEffect(() => {
    if (isMonitoring) {
      foregroundService.start('C.R.A.S.H.', alertThreshold);
    } else {
      foregroundService.stop();
    }
  }, [isMonitoring, alertThreshold]);

  useEffect(() => {
    if (effectiveTelemetry) telemetryForServiceRef.current = effectiveTelemetry;
  }, [effectiveTelemetry]);

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(() => {
      const t = telemetryForServiceRef.current;
      if (!t) return;
      const speed = estimateSpeed(t.acceleration_x, t.acceleration_y, t.acceleration_z);
      foregroundService.updateTelemetry(
        'C.R.A.S.H.',
        speed,
        t.g_force,
        batteryLevel,
      );
      if (currentLocation?.latitude && currentLocation?.longitude) {
        foregroundService.updateLocation(currentLocation.latitude, currentLocation.longitude, speed);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring, batteryLevel, currentLocation]);

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

  const resetPeakG = useCallback(() => {
    haptics.selection();
    setPeakG(effectiveTelemetry?.g_force ?? 1.0);
  }, [effectiveTelemetry]);

  const telemetryForDisplay = countdown !== null ? impactTelemetryRef.current : effectiveTelemetry;
  const gForce = telemetryForDisplay?.g_force ?? 0;
  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);
  const liveData = (connected || phoneSensorActive) && !staleData && !!telemetryForDisplay;
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
    const now = Date.now();
    if (
      highImpact &&
      countdown === null &&
      !sending &&
      !emergencyInFlightRef.current &&
      !impactTriggeredRef.current &&
      now - lastImpactTriggerTsRef.current >= 15000
    ) {
      lastImpactTriggerTsRef.current = now;
      impactTriggeredRef.current = true;
      impactTelemetryRef.current = telemetry ?? telemetryRef.current;
      haptics.error();
      startCountdown(countdownSeconds);
    }
  }, [highImpact, countdown, sending, countdownSeconds, telemetry, startCountdown]);

  useEffect(() => {
    if (!liveData || (gForce < alertThreshold && Date.now() - lastImpactTriggerTsRef.current >= 15000 && countdown === null && !sending)) {
      impactTriggeredRef.current = false;
    }
  }, [liveData, gForce, alertThreshold, countdown, sending]);

  const pushStatusNotification = useCallback(async (forceImmediate = false, overrideG?: number) => {
    const isMonitoring = connected || phoneSensorActive;
    if (Platform.OS !== 'android') return;

    // En Android, descartar SIEMPRE la notificación secundaria de Expo para garantizar exactamente 1 barra nativa
    await Notifications.dismissNotificationAsync(NOTIFICATION_STATUS_ID).catch(() => {});

    if (!isMonitoring) return;

    const current = telemetryForDisplay;
    const gVal = overrideG !== undefined ? overrideG : (current?.g_force ?? 1.0);
    const speed = current ? estimateSpeed(current.acceleration_x, current.acceleration_y, current.acceleration_z) : 0;

    // La barra única oficial de C.R.A.S.H. (ID 1001) es gestionada por el servicio nativo con colores rojo y negro
    foregroundService.updateTelemetry('C.R.A.S.H.', speed, gVal, batteryLevel);
    if (currentLocation?.latitude && currentLocation?.longitude) {
      foregroundService.updateLocation(currentLocation.latitude, currentLocation.longitude, speed);
    }
  }, [connected, phoneSensorActive, telemetryForDisplay, batteryLevel, currentLocation]);

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

      const blackbox = phoneSensorEngine.getPreImpactBlackbox();
      const routeHistoryToSend = blackbox.length > 0 ? blackbox : getRecentRoute();

      const impact = await impactsAPI.create(token, {
        acceleration_x: currentTelemetry.acceleration_x,
        acceleration_y: currentTelemetry.acceleration_y,
        acceleration_z: currentTelemetry.acceleration_z,
        gyroscope_x: currentTelemetry.gyroscope_x,
        gyroscope_y: currentTelemetry.gyroscope_y,
        gyroscope_z: currentTelemetry.gyroscope_z,
        g_force: currentTelemetry.g_force,
        source: connected ? 'circuit' : 'phone_sensor',
        location_history: routeHistoryToSend,
        latitude,
        longitude,
      });

      if (!impact?.alerts_sent && impact?.alerted_contacts?.length === 0 && impact?.alert_error && currentTelemetry.g_force >= alertThreshold) {
        alert({ title: t('dashboard.noContactsAlert'), message: t('dashboard.notSentMessage') });
      }
      if (impact?.alerts_sent) haptics.success(); else haptics.warning();
      setAlertResult(impact);

      // Aviso inconfundible al usuario de que se mandó la alerta de emergencia
      const gRecorded = (currentTelemetry?.g_force ?? 1.0).toFixed(2);
      const contactsText = impact?.alerted_contacts?.length
        ? `${impact.alerted_contacts.length} contactos de emergencia`
        : 'tus contactos de emergencia';

      await Notifications.scheduleNotificationAsync({
        identifier: `crash-dispatched-${Date.now()}`,
        content: {
          title: '🚨 ¡ALERTA DE EMERGENCIA DESPACHADA!',
          body: `📢 Notificación de impacto enviada (${gRecorded}G) a ${contactsText} con tu ubicación exacta. La ayuda viene en camino.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 600, 200, 600, 200, 1000],
        },
        trigger: { channelId: ANDROID_ALERT_CHANNEL_ID },
      }).catch(() => {});

      // Ráfaga háptica intensa para que el usuario se dé cuenta de inmediato
      haptics.error();
      setTimeout(() => haptics.error(), 300);
      setTimeout(() => haptics.error(), 650);

      // Actualizar inmediatamente la barra de estado con confirmación
      pushStatusNotification(true);
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('errors.generic') });
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, alertThreshold, confirm, alert, t, connected, getRecentRoute, pushStatusNotification]);

  useEffect(() => {
    emergencyFlowRef.current = triggerEmergencyFlow;
  }, [triggerEmergencyFlow]);

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
        source: connected ? 'circuit' : phoneSensorActive ? 'phone_sensor' : 'circuit',
        location_history: (() => {
          const blackbox = phoneSensorEngine.getPreImpactBlackbox();
          return blackbox.length > 0 ? blackbox : getRecentRoute();
        })(),
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

      // Aviso de prueba despachada en simulación
      await Notifications.scheduleNotificationAsync({
        identifier: `crash-sim-dispatched-${Date.now()}`,
        content: {
          title: '🚨 ¡ALERTA DE PRUEBA DESPACHADA!',
          body: '📢 La simulación de impacto fue transmitida y tus contactos recibieron el aviso de emergencia con éxito.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500, 200, 800],
        },
        trigger: { channelId: ANDROID_ALERT_CHANNEL_ID },
      }).catch(() => {});
    } catch (e: any) {
      setSimulationError(e.message || t('errors.generic'));
      haptics.error();
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, confirm, t, connected, phoneSensorActive, getRecentRoute]);

  useEffect(() => {
    const setupNotificationChannels = async () => {
      if (Platform.OS !== 'android') return;

      // Canal 1: Monitoreo continuo y telemetría en vivo (silencioso, no intrusivo)
      await Notifications.setNotificationChannelAsync(ANDROID_STATUS_CHANNEL_ID, {
        name: 'C.R.A.S.H. Monitoreo en Vivo',
        description: 'Barra de estado continua con Fuerza G, velocidad y coordenadas',
        importance: Notifications.AndroidImportance.LOW,
        enableVibrate: false,
        vibrationPattern: null,
        sound: null,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
      });

      // Canal 2: Alertas críticas y despacho de emergencia (máxima prioridad, sonido y vibración)
      await Notifications.setNotificationChannelAsync(ANDROID_ALERT_CHANNEL_ID, {
        name: 'C.R.A.S.H. Alertas de Emergencia',
        description: 'Avisos críticos de impacto, cuenta regresiva y confirmación de despacho',
        importance: Notifications.AndroidImportance.MAX,
        enableVibrate: true,
        vibrationPattern: [0, 500, 200, 500, 200, 1000],
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        showBadge: true,
      });
    };
    setupNotificationChannels();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      if (actionId === ACTION_CANCEL_COUNTDOWN) {
        cancelCountdown();
      }
    });
    return () => sub.remove();
  }, [cancelCountdown]);

  // Actualizar notificación persistente de estado (con bypass inteligente para picos)
  useEffect(() => {
    pushStatusNotification(false);
  }, [telemetryForDisplay, pushStatusNotification]);

  // Actualización instantánea en tiempo real ante detección de picos en smartphone
  useEffect(() => {
    const unsubPeak = phoneSensorEngine.onPeak((newPeak, currentG) => {
      setPeakG(prev => (newPeak > prev ? newPeak : prev));
      pushStatusNotification(true, currentG);
    });
    return () => unsubPeak();
  }, [pushStatusNotification]);

  // Actualización inmediata en tiempo real de la barra de notificaciones nativa ante picos o umbrales
  useEffect(() => {
    const unsubThreshold = phoneSensorEngine.onThresholdExceeded((gVal) => {
      pushStatusNotification(true, gVal);
    });
    return () => unsubThreshold();
  }, [pushStatusNotification]);

  // Asegurar que ninguna notificación duplicada de Expo compita con la barra interactiva nativa oficial
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.dismissNotificationAsync(NOTIFICATION_COUNTDOWN_ID).catch(() => {});
      Notifications.dismissNotificationAsync(NOTIFICATION_STATUS_ID).catch(() => {});
    }
  }, [countdown]);

  const { accelChartData, accelYData, accelZData, gForceChartData, gpsRoute } = useMemo(() => {
    const aData = accelHistory.current.map((d, i) => ({
      x: i,
      y: d.x,
      label: `${i}s`,
    }));
    const yData = accelHistory.current.map((d, i) => ({ x: i, y: d.y }));
    const zData = accelHistory.current.map((d, i) => ({ x: i, y: d.z }));
    const gfData = gForceHistory.current.map((d, i) => ({ x: i, y: d.value }));
    const route = gpsHistory.current.map(p => ({ latitude: p.latitude, longitude: p.longitude, t: p.t }));
    return {
      accelChartData: aData,
      accelYData: yData,
      accelZData: zData,
      gForceChartData: gfData,
      gpsRoute: route,
    };
  }, [telemetryForDisplay?.timestamp]);

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
                <View style={[styles.statusDot, { backgroundColor: liveData ? (connected ? COLORS.success : '#60A5FA') : connected ? COLORS.warning : COLORS.textDim }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>
                  {liveData
                    ? (connected
                        ? t('dashboard.connected')
                        : (canUsePhoneSensor
                            ? 'PROTECCIÓN ACTIVA · MODO AUTÓNOMO'
                            : t('dashboard.phoneSensorActive')))
                    : connected
                    ? t('dashboard.noData')
                    : t('dashboard.disconnected')}
                </Text>
                <Text style={styles.statusDetail} numberOfLines={1}>
                  {connected
                    ? staleData ? (statusDetail || t('dashboard.waitingTelemetry')) : `${deviceName}${batteryLevel !== null ? ` · ${t('dashboard.battery')} ${batteryLevel}%` : ''}`
                    : phoneSensorActive
                    ? (canUsePhoneSensor ? 'Telemetría autónoma activa (Admin)' : t('dashboard.phoneSensorDetail'))
                    : t('dashboard.tapToConnect')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          </GlassCard>
        </Stagger>

        {/* Quick Tactical Controls Dock */}
        <Stagger index={2}>
          <View style={styles.quickDock}>
            <TouchableOpacity
              style={styles.quickDockBtn}
              onPress={resetPeakG}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh" size={13} color={COLORS.textSec} />
              <Text style={styles.quickDockText}>CALIBRAR PICO</Text>
            </TouchableOpacity>

            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.quickDockBtn, styles.quickDockBtnAlert]}
                onPress={() => {
                  haptics.heavy();
                  simulateImpact();
                }}
                disabled={sending}
                activeOpacity={0.75}
              >
                <Ionicons name="flash-outline" size={13} color={RED} />
                <Text style={[styles.quickDockText, { color: RED }]}>
                  {sending ? 'ENVIANDO...' : 'PROBAR'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Stagger>

        <Stagger index={3}>
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

            {/* Tactical Sub-HUD: Velocidad, Pico G, Severidad */}
            <View style={styles.ringSubHud}>
              <View style={styles.subHudItem}>
                <Text style={styles.subHudLabel}>{t('dashboard.speed') || 'VELOCIDAD'}</Text>
                <View style={styles.subHudValRow}>
                  <Text style={styles.subHudValue}>
                    {liveData ? Math.round(estimateSpeed(telemetryForDisplay?.acceleration_x ?? 0, telemetryForDisplay?.acceleration_y ?? 0, telemetryForDisplay?.acceleration_z ?? 0)) : 0}
                  </Text>
                  <Text style={styles.subHudUnit}>km/h</Text>
                </View>
              </View>

              <View style={styles.subHudDivider} />

              <TouchableOpacity style={styles.subHudItem} onPress={resetPeakG} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={styles.subHudLabel}>{t('dashboard.peak') || 'PICO G'}</Text>
                  <Ionicons name="refresh-outline" size={10} color={COLORS.textDim} />
                </View>
                <View style={styles.subHudValRow}>
                  <Text style={[styles.subHudValue, { color: peakG >= alertThreshold ? RED : COLORS.text }]}>
                    {peakG.toFixed(2)}
                  </Text>
                  <Text style={styles.subHudUnit}>G</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.subHudDivider} />

              <View style={styles.subHudItem}>
                <Text style={styles.subHudLabel}>{t('dashboard.severity') || 'ESTADO'}</Text>
                <View style={styles.subHudValRow}>
                  <View style={[styles.subHudDot, { backgroundColor: sevColor }]} />
                  <Text style={[styles.subHudValue, { color: sevColor, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, letterSpacing: 0.8 }]}>
                    {sevLabel.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {!liveData && (
              <View style={styles.ringEmptyHint}>
                <View style={styles.ringEmptyLine} />
                <Text style={styles.ringEmptyText}>{t('dashboard.tapToConnect')}</Text>
              </View>
            )}
          </GlassCard>
        </Stagger>

        <Stagger index={4}>
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

        <Stagger index={5}>
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

        <Stagger index={6}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('dashboard.telemetryTitle')}</Text>
            <View style={[styles.liveBadge, liveData && styles.liveBadgeOn]}>
              <View style={[styles.liveDotSm, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
              <Text style={[styles.liveText, { color: liveData ? COLORS.success : COLORS.textDim }]}>{t('dashboard.liveBadge')}</Text>
            </View>
          </View>
        </Stagger>

        <Stagger index={7}>
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

        <Stagger index={8}>
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
        onClose={cancelCountdown}
        title={t('dashboard.impactDetected')}
        eyebrow={t('dashboard.alertEyebrow')}
        accent={RED}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>{t('dashboard.alertMessage')}</Text>
        <View style={styles.countdownRing}>
          <Text style={styles.countdownLabel}>{t('dashboard.remainingTime')}</Text>
          <Text style={styles.countdownValue}>{countdown ?? 0}</Text>
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
          <TouchableOpacity style={styles.cancelBtnSoft} onPress={() => { haptics.light(); cancelCountdown(); }}>
            <Text style={styles.cancelSoftText}>{t('dashboard.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, sending && { opacity: 0.6 }]}
            disabled={sending}
            onPress={() => { haptics.heavy(); cancelCountdown(); impactTriggeredRef.current = true; triggerEmergencyFlow(); }}
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
  const numVal = live && value !== undefined ? value : 0;
  const norm = Math.max(-1, Math.min(1, numVal / 15));
  const isPositive = norm >= 0;
  const barPercent = Math.min(50, Math.abs(norm) * 50);

  return (
    <Animated.View
      entering={FadeIn.duration(320).delay(delay * 80).springify().damping(25).stiffness(200)}
      style={styles.coordCell}
    >
      <View style={styles.coordCellTop}>
        <Text style={styles.coordLabel}>{label}</Text>
        <Text style={[styles.coordValue, { color: live ? COLORS.text : COLORS.textDim }]}>
          {live && value !== undefined ? (value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2)) : '0.00'}
        </Text>
      </View>
      <View style={styles.coordBarTrack}>
        <View style={styles.coordBarCenterMark} />
        <View
          style={[
            styles.coordBarFill,
            isPositive
              ? { left: '50%', width: `${barPercent}%`, backgroundColor: RED }
              : { right: '50%', width: `${barPercent}%`, backgroundColor: '#60A5FA' },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const GyroAxis = React.memo(function GyroAxis({ label, value, unit, color, live, delay = 0 }: {
  label: string; value?: number; unit: string; color: string; live: boolean; delay?: number;
}) {
  const numVal = live && value !== undefined ? value : 0;
  const norm = Math.max(-1, Math.min(1, numVal / 50));
  const isPositive = norm >= 0;
  const barPercent = Math.min(50, Math.abs(norm) * 50);

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
      <Text style={[styles.gyroAxisValue, { color: live ? color : COLORS.textDim }]}>
        {live && value !== undefined ? (value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)) : '0.0'}
      </Text>
      <Text style={[styles.gyroAxisUnit, { color: live ? COLORS.textSec : COLORS.textDim }]}>{unit}</Text>

      <View style={styles.gyroBarTrack}>
        <View style={styles.gyroBarCenterMark} />
        <View
          style={[
            styles.gyroBarFill,
            isPositive
              ? { left: '50%', width: `${barPercent}%`, backgroundColor: color }
              : { right: '50%', width: `${barPercent}%`, backgroundColor: color },
          ]}
        />
      </View>
    </Animated.View>
  );
});

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

  quickDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: SPACING.md,
  },
  quickDockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickDockBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  quickDockBtnAlert: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  quickDockText: {
    fontSize: 10,
    fontFamily: FONT.heading,
    fontWeight: '700',
    color: COLORS.textSec,
    letterSpacing: 0.8,
  },
  quickDockTextActive: {
    color: '#60A5FA',
  },

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

  ringSubHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  subHudItem: {
    flex: 1,
    alignItems: 'center',
  },
  subHudLabel: {
    fontSize: 9,
    fontFamily: FONT.heading,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subHudValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  subHudValue: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT.monoMedium,
    fontWeight: '600',
    color: COLORS.text,
    includeFontPadding: false,
  },
  subHudUnit: {
    fontSize: 10,
    fontFamily: FONT.body,
    color: COLORS.textDim,
  },
  subHudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  subHudDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  bentoCol: { gap: SPACING.md, marginBottom: SPACING.md },
  bentoHalf: { flex: 1 },
  bentoTitle: { color: COLORS.textSec, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
  coordsGrid: { flexDirection: 'row', gap: 8 },
  coordCell: {
    flex: 1, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8, paddingVertical: 10, alignItems: 'center',
  },
  coordCellTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  coordLabel: { color: COLORS.textDim, fontSize: FONT_SIZE.xs, fontFamily: FONT.heading, fontWeight: '700' },
  coordValue: { fontSize: FONT_SIZE.md, fontFamily: FONT.monoMedium, fontWeight: '600', includeFontPadding: false },
  coordBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  coordBarCenterMark: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
  },
  coordBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 1,
  },
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
  gyroBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  gyroBarCenterMark: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
  },
  gyroBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 1,
  },

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
  adminSensorCard: {
    marginBottom: SPACING.sm,
    borderColor: 'rgba(59,130,246,0.2)',
    backgroundColor: 'rgba(59,130,246,0.03)',
  },
  adminSensorCardActive: {
    borderColor: 'rgba(59,130,246,0.45)',
    backgroundColor: 'rgba(59,130,246,0.07)',
  },
  adminSensorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  adminIconWrapActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  adminSensorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONT.heading,
    letterSpacing: 0.5,
  },
  adminTag: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  adminTagText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '800',
  },
  adminSensorDesc: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 2,
    fontFamily: FONT.body,
  },
});
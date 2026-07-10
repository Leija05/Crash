import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Alert, Platform, ActivityIndicator, Animated,
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
  const { user } = useAuth();
  const { token } = useAuth();
  const router = useRouter();
  const { deviceName: pattern, alertsConfigVersion } = useAppSettings();
  const {
    connected, telemetry, statusDetail, deviceName, batteryLevel,
    disconnect, nativeAvailable,
  } = useBluetooth();

  const [refreshing, setRefreshing] = useState(false);
  const [peakG, setPeakG] = useState(0);
  //const lastDataRef = useRef<number>(0);
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

  // Pulso crítico: animación cuando hay un impacto alto en vivo.
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!telemetry) return;
    if (countdown !== null) return;
    telemetryRef.current = telemetry;
    lastDataRef.current = Date.now();
    setStaleData(prev => (prev ? false : prev));
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
  const sevLabel = severityLabel(gForce);
  const liveData = connected && !staleData && !!telemetryForDisplay;
  const highImpact = liveData && gForce >= alertThreshold;

  // Pulso crítico: animación cuando hay un impacto alto en vivo.
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
      Alert.alert(
        'No tienes contactos agregados',
        'Antes de enviar alertas, registra al menos un contacto de emergencia.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Contactos', onPress: () => router.push('/contacts') },
        ]
      );
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
        Alert.alert('No tienes contactos agregados', 'No se pudo notificar a nadie.');
      }
      setAlertResult(impact);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar la alerta');
    } finally {
      setSending(false);
      emergencyInFlightRef.current = false;
    }
  }, [token, sending, hasEmergencyContacts, router, alertThreshold]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      triggerEmergencyFlow();
      return;
    }
    const t = setTimeout(() => setCountdown((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, triggerEmergencyFlow]);

  /*const triggerEmergencyFlow = useCallback(async () => {
    if (!token || !telemetry || sending) return;
    if (!hasEmergencyContacts) {
      Alert.alert(
        'No tienes contactos agregados',
        'Antes de enviar alertas, registra al menos un contacto de emergencia.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Contactos', onPress: () => router.push('/contacts') },
        ]
      );
      return;
    }
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
        acceleration_x: telemetry.acceleration_x,
        acceleration_y: telemetry.acceleration_y,
        acceleration_z: telemetry.acceleration_z,
        gyroscope_x: telemetry.gyroscope_x,
        gyroscope_y: telemetry.gyroscope_y,
        gyroscope_z: telemetry.gyroscope_z,
        g_force: telemetry.g_force,
        latitude,
        longitude,
      });
      if (impact?.alerted_contacts?.length === 0 && telemetry.g_force >= 10) {
        Alert.alert('No tienes contactos agregados', 'No se pudo notificar a nadie porque no hay contactos de emergencia.');
      }
      setAlertResult(impact);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar la alerta');
    } finally {
      setSending(false);
    }
  }, [token, telemetry, sending, hasEmergencyContacts, router]);*/

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
      const t = telemetryForDisplay;
      const gVal = t?.g_force ?? 0;
      const speed = t ? estimateSpeed(t.acceleration_x, t.acceleration_y, t.acceleration_z) : 0;
      const batText = batteryLevel !== null ? ` · Batería ${batteryLevel}%` : '';
      const title = `C.R.A.S.H. · ${deviceName || 'Casco'}`;
      const body = `Velocidad: ${Math.round(speed)} km/h · ${gVal.toFixed(2)}G${batText}`;
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_STATUS_ID,
        content: { title, body, sticky: true, priority: Notifications.AndroidNotificationPriority.HIGH },
        trigger: null,
      });
    };
    pushStatusNotification();
  }, [connected, telemetryForDisplay, deviceName, batteryLevel]);

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
        { identifier: ACTION_CANCEL_COUNTDOWN, buttonTitle: 'Cancelar alerta', options: { opensAppToForeground: false } },
      ]);

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      const publish = async () => {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_COUNTDOWN_ID,
          content: {
            title: 'Impacto detectado',
            body: `Envío en ${countdown}s · G ${(impactTelemetryRef.current?.g_force ?? gForce).toFixed(2)}`,
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
  }, [countdown, gForce]);





  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || 'Rider'}</Text>
            <Text style={styles.appName}>C.R.A.S.H.</Text>
          </View>
          <View style={styles.modePill}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
            <Text style={[styles.modeText, { color: COLORS.success }]}>REAL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.statusBar, liveData && styles.statusBarConnected]}
          onPress={() => router.push('/devices')}
          activeOpacity={0.7}
          testID="dashboard-status-bar"
        >
          <View style={[styles.statusDot, { backgroundColor: liveData ? COLORS.success : connected ? COLORS.warning : COLORS.textDim }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>
              {liveData ? 'CONECTADO' : connected ? 'SIN DATOS' : 'DESCONECTADO'}
            </Text>
            <Text style={styles.statusDetail} numberOfLines={1}>
              {connected
                  ? staleData ? (statusDetail || 'Esperando telemetría...') : `${deviceName}${batteryLevel !== null ? ` · Batería ${batteryLevel}%` : ''}`
                  : 'Toca para conectar tu casco'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
        </TouchableOpacity>

        <View style={[styles.ringCard, highImpact && styles.ringCardCritical]}>
          {highImpact && (
            <Animated.View pointerEvents="none" style={[styles.criticalPulse, { opacity: pulseAnim }]} />
          )}
          <ForceRing gForce={gForce} liveData={liveData} color={sevColor} severity={sevLabel} />
          <View style={styles.peakRow}>
            <Text style={styles.peakLabel}>PICO</Text>
            <Text style={styles.peakValue}>{peakG.toFixed(2)} G</Text>
          </View>
        </View>

        <View style={styles.bentoRow}>
          <View style={[styles.bentoCard, styles.bentoHalf]}>
            <Text style={styles.coordsTitle}>ACELERACIÓN (m/s²)</Text>
            <View style={styles.coordsGrid}>
              <CoordItem label="X" value={telemetryForDisplay?.acceleration_x} live={liveData} />
              <CoordItem label="Y" value={telemetryForDisplay?.acceleration_y} live={liveData} />
              <CoordItem label="Z" value={telemetryForDisplay?.acceleration_z} live={liveData} />
            </View>
          </View>
          <View style={[styles.bentoCard, styles.bentoHalf]}>
            <Text style={styles.coordsTitle}>UBICACIÓN GPS</Text>
            <Text style={styles.coordsGeoBig}>
              {locationTrackingEnabled && telemetryForDisplay
                ? `${telemetryForDisplay.latitude?.toFixed(5) ?? '--'}\n${telemetryForDisplay.longitude?.toFixed(5) ?? '--'}`
                : 'No disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>TELEMETRÍA DEL CIRCUITO</Text>
          <View style={[styles.liveBadge, liveData && styles.liveBadgeOn]}>
            <View style={[styles.liveDot, { backgroundColor: liveData ? COLORS.success : COLORS.textDim }]} />
            <Text style={[styles.liveText, { color: liveData ? COLORS.success : COLORS.textDim }]}>LIVE</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <MetricCard label="GIRO X" value={telemetryForDisplay?.gyroscope_x} unit="rad/s" color={COLORS.warning} live={liveData} />
          <MetricCard label="GIRO Y" value={telemetryForDisplay?.gyroscope_y} unit="rad/s" color={COLORS.warning} live={liveData} />
          <MetricCard label="GIRO Z" value={telemetryForDisplay?.gyroscope_z} unit="rad/s" color="#FB923C" live={liveData} />
          <MetricCard label="FUERZA G" value={telemetryForDisplay?.g_force} unit="g" color={COLORS.accent} live={liveData} />
        </View>

        {connected ? (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.primaryBtnDanger]}
            onPress={disconnect}
            activeOpacity={0.8}
            testID="disconnect-btn"
          >
            <Ionicons name="bluetooth" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>DESCONECTAR</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/devices')}
            activeOpacity={0.8}
            testID="connect-btn"
          >
            <Ionicons name="bluetooth" size={18} color="#0A0A0A" />
            <Text style={[styles.primaryBtnText, { color: '#0A0A0A' }]}>CONECTAR CASCO BLE</Text>
          </TouchableOpacity>
        )}

        {!nativeAvailable && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={14} color={COLORS.info} />
            <Text style={styles.infoText}>Bluetooth real disponible solo en build nativa (expo-dev-client).</Text>
          </View>
        )}
        {nativeAvailable && !connected && (
          <View style={styles.infoBox}>
            <Ionicons name="radio" size={14} color={COLORS.info} />
            <Text style={styles.infoText}>Buscando: {pattern} · HC-05 · HC-10 · HM-10 · MLT-BT05 · CRASH</Text>
          </View>
        )}
        {!hasEmergencyContacts && (
          <TouchableOpacity style={styles.warningCard} onPress={() => router.push('/contacts')} activeOpacity={0.85}>
            <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>No tienes contactos de emergencia</Text>
              <Text style={styles.warningText}>Toca aquí para agregar contactos y habilitar alertas reales.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <PremiumModal
        visible={countdown !== null}
        onClose={() => setCountdown(null)}
        title="Impacto alto detectado"
        eyebrow="C.R.A.S.H. · Alerta"
        accent={COLORS.primary}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>Se enviarán alertas a tus contactos de emergencia.</Text>
        <Text style={styles.countdownLabel}>Tiempo restante</Text>
        <Text style={styles.countdownValue}>{countdown}s</Text>
        <View style={styles.dialogActions}>
          <TouchableOpacity style={styles.cancelBtnSoft} onPress={() => setCountdown(null)}>
            <Text style={styles.cancelSoftText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, sending && { opacity: 0.6 }]}
            disabled={sending}
            onPress={() => { setCountdown(null); impactTriggeredRef.current = true; triggerEmergencyFlow(); }}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.cancelText}>Enviar ahora</Text>
            )}
          </TouchableOpacity>
        </View>
      </PremiumModal>

      <PremiumModal
        visible={!!alertResult}
        onClose={() => setAlertResult(null)}
        title={alertResult?.alerts_sent ? 'Mensajes enviados' : 'No se enviaron mensajes'}
        eyebrow="C.R.A.S.H. · Reporte"
        accent={alertResult?.alerts_sent ? COLORS.success : COLORS.primary}
        closeOnBackdrop={false}
      >
        <Text style={styles.dialogText}>
          {alertResult?.alerts_sent
            ? 'Se notificó a contactos de emergencia:'
            : (alertResult?.alert_error || 'No fue posible completar el envío de alertas.')}
        </Text>
        {(alertResult?.alerted_contacts || []).map((c: any) => (
          <Text key={c.id} style={styles.contactSent}>{`• ${c.name} (${c.phone})`}</Text>
        ))}
        <View style={styles.dialogActions}>
          <TouchableOpacity style={styles.okBtnWide} onPress={() => setAlertResult(null)}>
            <Text style={styles.okBtnText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </PremiumModal>
    </SafeAreaView>
  );
}

function ForceRing({ gForce, liveData, color, severity }: { gForce: number; liveData: boolean; color: string; severity: string }) {
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
                  transform: [{ rotate: `${(360 / SEGMENTS) * i}deg` }, { translateY: -126 }],
                  backgroundColor: active ? color : 'rgba(148,163,184,0.14)',
                  opacity: active ? 1 : 0.65,
                },
              ]}
            />
          );
        })}

        <View style={styles.ringInner}>
          <Text style={[styles.gValue, { color: liveData ? COLORS.text : COLORS.textDim }]}>{liveData ? gForce.toFixed(2) : '0.00'}</Text>
          <Text style={styles.gTitle}>G - FORCE</Text>
          <View style={styles.gSubRow}>
            <View style={[styles.gBullet, { backgroundColor: liveData ? color : COLORS.textDim }]} />
            <Text style={styles.gSubText}>{liveData ? `${gForce.toFixed(2)}G` : '--'}</Text>
          </View>
          <Text style={styles.severityText}>{liveData ? severity : 'SIN DATOS'}</Text>
        </View>
      </View>
      <Text style={styles.ms2}>m / s²</Text>
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
    <View style={styles.metric} testID={`metric-${label.toLowerCase().replace(' ', '-')}`}>
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
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(204,255,0,0.015)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md, paddingTop: SPACING.sm,
  },
  greeting: { fontSize: 13, color: COLORS.textSec },
  appName: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: 3, marginTop: 2 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.12)',
  },
  modeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(13,13,18,0.88)',
    borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md, padding: 14, marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  statusBarConnected: { borderColor: 'rgba(52,211,153,0.25)' },
  statusDot: { width: 10, height: 10, borderRadius: 5, ...SHADOWS.glow('#fff') },
  statusLabel: { fontSize: 10, fontWeight: '900', color: COLORS.text, letterSpacing: 1.5 },
  statusDetail: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },

  ringCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  ringCardCritical: {
    borderColor: 'rgba(239,68,68,0.55)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  criticalPulse: {
    position: 'absolute', top: -60, left: -60, right: -60, bottom: -60,
    backgroundColor: 'rgba(239,68,68,0.28)',
    borderRadius: 999,
  },
  ringWrap: { alignItems: 'center' },
  ringTrack: {
    width: 280, height: 280, borderRadius: 140,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    width: 4, height: 18, borderRadius: 999, position: 'absolute',
  },
  ringInner: {
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(5,5,6,0.95)',
  },
  gValue: { fontSize: 66, fontWeight: '900', color: COLORS.text, lineHeight: 72 },
  gTitle: { color: COLORS.textSec, letterSpacing: 3, fontSize: 12, fontWeight: '700' },
  gSubRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  gBullet: { width: 8, height: 8, borderRadius: 999 },
  gSubText: { color: COLORS.text, fontWeight: '600' },
  severityText: { marginTop: 6, fontSize: 10, letterSpacing: 1.5, color: COLORS.textSec, fontWeight: '700' },
  ms2: { color: COLORS.textDim, marginTop: 8, fontSize: 13, letterSpacing: 3 },
  peakRow: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  peakLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  peakValue: { color: COLORS.text, fontSize: 13, fontWeight: '900' },

  coordsCard: {
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBg, padding: 14,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  coordsTitle: { color: COLORS.textSec, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10 },
  coordsGrid: { flexDirection: 'row', gap: 10 },
  coordsGeo: { color: COLORS.textDim, marginTop: 10, fontSize: 12, textAlign: 'center', letterSpacing: 0.5 },
  coordCell: {
    flex: 1, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: COLORS.glassBorder,
    paddingVertical: 12, alignItems: 'center',
  },
  coordLabel: { color: COLORS.textDim, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  coordValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },

  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  bentoCard: {
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBg, padding: 14,
    ...SHADOWS.sm,
  },
  bentoHalf: { flex: 1 },
  coordsGeoBig: { color: COLORS.textDim, fontSize: 13, textAlign: 'center', letterSpacing: 0.5, marginTop: 4, lineHeight: 20 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.03)' },
  liveBadgeOn: { backgroundColor: 'rgba(52,211,153,0.06)' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  metric: {
    width: '48%', flexGrow: 1,
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  metricLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: '900', color: COLORS.textDim },
  metricUnit: { fontSize: 10, color: COLORS.textDim, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 54,
    marginBottom: SPACING.md,
    ...SHADOWS.glow(COLORS.accent),
  },
  primaryBtnDanger: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow(COLORS.primary),
  },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.glassBg, padding: 12, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginTop: 4,
  },
  infoText: { fontSize: 11, color: COLORS.textSec, flex: 1 },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.05)', borderColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1, borderRadius: RADIUS.md, padding: 14, marginTop: 4,
  },
  warningTitle: { color: COLORS.warning, fontWeight: '800', fontSize: 13, marginBottom: 2 },
  warningText: { color: COLORS.textSec, fontSize: 11 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: {
    width: '100%', maxWidth: 360,
    backgroundColor: 'rgba(20,20,28,0.96)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.xl, padding: 24,
    ...SHADOWS.lg,
    alignItems: 'center',
  },
  countdownGlow: {
    position: 'absolute', top: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(251,191,36,0.04)',
  },
  countdownIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.warning, marginBottom: 12,
  },
  dialogTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  dialogText: { color: COLORS.textSec, fontSize: 14, marginBottom: 8, lineHeight: 20, textAlign: 'center' },
  countdownLabel: { color: COLORS.textDim, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  countdownValue: { color: COLORS.warning, fontSize: 64, fontWeight: '900', marginTop: 4, marginBottom: 20, ...SHADOWS.glow(COLORS.warning) },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtnSoft: { flex: 1, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, paddingVertical: 14, alignItems: 'center' },
  cancelSoftText: { color: COLORS.text, fontWeight: '800', letterSpacing: 0.7 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  okBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 48, marginTop: 12 },
  okBtnWide: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 14, marginTop: 14, width: '100%', alignItems: 'center' },
  okBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1, fontSize: 14 },
  contactSent: { color: COLORS.textSec, fontSize: 13, marginBottom: 4, textAlign: 'center' },
});

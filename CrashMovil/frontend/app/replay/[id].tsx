import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { impactsAPI, telemetryAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, GOLD, FONT, FONT_SIZE } from '../../src/theme';
import { MediaControls } from '../../src/components/MediaControls';
import { LineChart } from '../../src/components/Charts';
import GPSMap from '../../src/components/GPSMap';

const PLAYBACK_INTERVAL_MS = 500;

function estimateSpeedFromAccel(ax: number, ay: number, az: number): number {
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  return Math.max(0, (magnitude - 9.8) * 3.6);
}

function fmtTime(iso: string) {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ReplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const { width: SCREEN_W } = useWindowDimensions();
  const CHART_INNER = SCREEN_W - SPACING.md * 4;

  const [loading, setLoading] = useState(true);
  const [trackWidth, setTrackWidth] = useState(0);
  const [error, setError] = useState('');
  const [points, setPoints] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const [detail, history] = await Promise.all([
          impactsAPI.get(token, id),
          telemetryAPI.history(token, id),
        ]);
        setImpact(detail);
        const pts = (history?.points || []).map((p: any) => ({
          ...p,
          ts: p.timestamp,
          speed: estimateSpeedFromAccel(
            p.acceleration?.x || 0,
            p.acceleration?.y || 0,
            p.acceleration?.z || 0,
          ),
        }));
        const impactFrame = {
          ts: detail.created_at,
          g_force: detail.g_force,
          speed: 0,
          __impact: true,
        };
        const allPoints = [...pts, impactFrame].sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
        );
        setPoints(allPoints);
      } catch (e: any) {
        setError(e.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, id]);

  useEffect(() => {
    setCurrentIndex(0);
    setPlaying(false);
  }, [id]);

  useEffect(() => {
    if (!playing || points.length <= 1) return;
    const intervalMs = PLAYBACK_INTERVAL_MS / speed;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= points.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, points.length, speed]);

  const current = points[currentIndex] || null;
  const impactIndex = points.findIndex((p) => p.__impact);
  const maxIndex = Math.max(points.length - 1, 0);
  const gForce = current?.g_force ?? impact?.g_force ?? 0;
  const sevColor = severityColor(gForce);

  const progressPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0;
  const impactMarkerPercent = maxIndex > 0 && impactIndex >= 0
    ? (impactIndex / maxIndex) * 100
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Cargando datos del accidente...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (points.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
            <Ionicons name="arrow-back" size={22} color={GOLD} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REPLAY</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="information-circle" size={48} color={COLORS.warning} />
          <Text style={styles.noDataText}>
            No hay suficientes datos de telemetría para reproducir este accidente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = points.filter(p => !p.__impact).map((p, i) => ({ x: i, y: p.g_force || 0 }));
  const speedData = points.filter(p => !p.__impact).map((p, i) => ({ x: i, y: p.speed || 0 }));
  const gpsRoute = points.filter(p => p.latitude && p.longitude).map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.ts,
  }));
  const impactPoint = impact?.location?.latitude
    ? { latitude: impact.location.latitude, longitude: impact.location.longitude }
    : (gpsRoute.length > 0
        ? { latitude: gpsRoute[gpsRoute.length - 1].latitude, longitude: gpsRoute[gpsRoute.length - 1].longitude }
        : undefined);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
          <Ionicons name="arrow-back" size={22} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REPLAY DEL ACCIDENTE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} ref={scrollRef}>
        <View style={styles.replayCard}>
          <View style={styles.replayHeader}>
            <Text style={styles.replayTitle}>Línea de tiempo</Text>
            <Text style={styles.replayPoints}>{points.length} puntos · {PLAYBACK_INTERVAL_MS}ms por cuadro</Text>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.trackOuter}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.trackTouchArea}
                onLayout={(ev) => setTrackWidth(ev.nativeEvent.layout.width)}
                onPress={(ev) => {
                  if (trackWidth <= 0 || maxIndex <= 0) return;
                  const ratio = ev.nativeEvent.locationX / trackWidth;
                  const newIndex = Math.round(ratio * maxIndex);
                  setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
                }}
              >
                <View style={styles.trackBg}>
                  <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
                  {impactIndex >= 0 && (
                    <View
                      style={[styles.impactMarker, { left: `${impactMarkerPercent}%` }]}
                    />
                  )}
                </View>
                <View style={[styles.thumb, { left: `${progressPercent}%` }]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>TIEMPO</Text>
              <Text style={styles.metaValue}>
                {current ? fmtTime(current.ts) : '--:--:--'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>VELOCIDAD</Text>
              <Text style={styles.metaValue}>
                {current ? `${Math.round(current.speed || 0)}` : '0'}
                <Text style={styles.metaUnit}> km/h</Text>
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>FUERZA G</Text>
              <Text style={[styles.metaValue, current?.__impact && { color: GOLD }]}>
                {gForce.toFixed(2)}
                <Text style={styles.metaUnit}> G</Text>
              </Text>
            </View>
          </View>

          {impactIndex >= 0 && (
            <View style={styles.impactSection}>
              <View style={[styles.impactDot, { left: `${impactMarkerPercent}%` }]} />
              {currentIndex === impactIndex && (
                <View style={styles.impactBadge}>
                  <Ionicons name="warning" size={14} color={GOLD} />
                  <Text style={styles.impactBadgeText}>Momento del impacto</Text>
                </View>
              )}
            </View>
          )}

          <MediaControls
            playing={playing}
            currentTime={currentIndex / points.length * 100}
            duration={100}
            onPlayPause={() => {
              if (currentIndex >= points.length - 1) {
                setCurrentIndex(0);
              }
              setPlaying((v) => !v);
            }}
            onSeek={(time) => {
              const newIndex = Math.round((time / 100) * maxIndex);
              setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
            }}
            onPrevious={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            onNext={() => setCurrentIndex(Math.min(maxIndex, currentIndex + 1))}
            onSpeedChange={setSpeed}
            speeds={[0.5, 1, 1.5, 2]}
            showSpeed={true}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Fuerza G durante el evento</Text>
          {chartData.length >= 2 ? (
            <LineChart
              data={chartData}
              width={CHART_INNER}
              height={140}
              color={GOLD}
              gradientColors={[GOLD, GOLD + '00']}
              showArea
              strokeWidth={2}
            />
          ) : (
            <Text style={styles.noChartText}>Sin telemetría suficiente para graficar.</Text>
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Velocidad estimada</Text>
          {speedData.length >= 2 ? (
            <LineChart
              data={speedData}
              width={CHART_INNER}
              height={140}
              color={COLORS.info}
              gradientColors={[COLORS.info, COLORS.info + '00']}
              showArea
              strokeWidth={2}
            />
          ) : (
            <Text style={styles.noChartText}>Sin telemetría suficiente para graficar.</Text>
          )}
        </View>

        <View style={styles.impactInfoCard}>
          <Text style={styles.infoTitle}>INFORMACIÓN DEL IMPACTO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Severidad</Text>
            <Text style={[styles.infoValue, { color: severityColor(impact?.g_force ?? 0) }]}>
              {impact?.severity_label || impact?.severity || '--'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>G-Force máximo</Text>
            <Text style={[styles.infoValue, { color: severityColor(impact?.g_force ?? 0) }]}>
              {impact?.g_force?.toFixed(2) || '--'} G
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>
              {impact?.created_at
                ? new Date(impact.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '--'}
            </Text>
          </View>
          {impact?.location?.latitude && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValueMono}>
                {impact.location.latitude.toFixed(5)}, {impact.location.longitude.toFixed(5)}
              </Text>
            </View>
          )}
          {impact?.alerts_sent && (
            <View style={styles.alertsBadge}>
              <Ionicons name="notifications" size={14} color={GOLD} />
              <Text style={styles.alertsBadgeText}>Alertas enviadas a contactos de emergencia</Text>
            </View>
          )}
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Ruta y punto de impacto</Text>
          <GPSMap
            route={gpsRoute}
            impactPoint={impactPoint}
            currentLocation={points.length > 0 && points[0].latitude ? {
              latitude: points[0].latitude,
              longitude: points[0].longitude,
            } : undefined}
            width={CHART_INNER}
            height={220}
            showImpactMarker={true}
            showCurrentLocation={true}
            animateRoute={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { color: COLORS.textSec, fontSize: FONT_SIZE.md, marginTop: 8 },
  errorText: { color: COLORS.textSec, fontSize: FONT_SIZE.lg, textAlign: 'center' },
  noDataText: { color: COLORS.textSec, fontSize: FONT_SIZE.md, lineHeight: 22, textAlign: 'center' },
  backBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder },
  backBtnText: { color: GOLD, fontWeight: '700' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
  },
  backBtnSmall: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  headerTitle: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: GOLD, letterSpacing: 2 },

  replayCard: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  replayHeader: { marginBottom: SPACING.md },
  replayTitle: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  replayPoints: { fontSize: FONT_SIZE.xs, color: COLORS.textDim, marginTop: 4 },

  sliderContainer: { marginBottom: SPACING.md },
  trackOuter: { height: 40, justifyContent: 'center', position: 'relative' },
  trackBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3,
    position: 'relative', overflow: 'hidden',
  },
  trackFill: {
    height: '100%', backgroundColor: GOLD, borderRadius: 3,
    ...SHADOWS.glow(GOLD),
  },
  impactMarker: {
    position: 'absolute', top: -4, width: 3, height: 14,
    backgroundColor: COLORS.danger, borderRadius: 1.5,
  },
  thumb: {
    position: 'absolute', top: 12, width: 20, height: 20,
    borderRadius: 10, backgroundColor: GOLD,
    marginLeft: -10, ...SHADOWS.md,
  },
  trackTouchArea: { height: 40, justifyContent: 'center' },

  metaGrid: {
    flexDirection: 'row', gap: 8, marginBottom: SPACING.sm,
  },
  metaItem: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.sm,
    padding: 12, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  metaLabel: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.textDim, letterSpacing: 1.5, marginBottom: 4 },
  metaValue: { fontSize: FONT_SIZE.lg, fontWeight: '900', color: COLORS.text },
  metaUnit: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSec },

  impactSection: { height: 24, position: 'relative', marginBottom: SPACING.sm },
  impactDot: {
    position: 'absolute', top: 6, width: 12, height: 12,
    borderRadius: 6, backgroundColor: COLORS.danger,
    marginLeft: -6, zIndex: 2, ...SHADOWS.glow(COLORS.danger),
  },
  impactBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  impactBadgeText: { fontSize: FONT_SIZE.xs, color: GOLD, fontWeight: '700' },

  chartCard: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  chartTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: COLORS.textSec,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },

  impactInfoCard: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  infoTitle: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.10)' },
  infoLabel: { fontSize: FONT_SIZE.md, color: COLORS.textSec },
  infoValue: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  infoValueMono: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontFamily: FONT.mono },
  alertsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: 'rgba(255,215,0,0.10)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  alertsBadgeText: { fontSize: FONT_SIZE.xs, color: GOLD, fontWeight: '700' },

  mapCard: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  mapTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: COLORS.textSec,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  noChartText: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
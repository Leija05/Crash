import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { impactsAPI, telemetryAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, GOLD } from '../../src/theme';

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

  const [loading, setLoading] = useState(true);
  const [trackWidth, setTrackWidth] = useState(0);
  const [error, setError] = useState('');
  const [points, setPoints] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
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
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= points.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAYBACK_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, points.length]);

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
                {current ? `${Math.round(current.speed || current.speed || 0)}` : '0'}
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

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => { setCurrentIndex(0); setPlaying(false); }}
            >
              <Ionicons name="play-skip-back" size={20} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, playing && styles.playBtnActive]}
              onPress={() => {
                if (currentIndex >= points.length - 1) {
                  setCurrentIndex(0);
                }
                setPlaying((v) => !v);
              }}
            >
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={24}
                color={playing ? GOLD : '#0A0A0A'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => { setCurrentIndex(maxIndex); setPlaying(false); }}
            >
              <Ionicons name="play-skip-forward" size={20} color={GOLD} />
            </TouchableOpacity>
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { color: COLORS.textSec, fontSize: 14, marginTop: 8 },
  errorText: { color: COLORS.textSec, fontSize: 15, textAlign: 'center' },
  noDataText: { color: COLORS.textSec, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  backBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)' },
  backBtnText: { color: GOLD, fontWeight: '700' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
  },
  backBtnSmall: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: 'rgba(10,10,10,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: GOLD, letterSpacing: 2 },

  replayCard: {
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  replayHeader: { marginBottom: SPACING.md },
  replayTitle: { fontSize: 11, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  replayPoints: { fontSize: 10, color: COLORS.textDim, marginTop: 4 },

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
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  metaLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textDim, letterSpacing: 1.5, marginBottom: 4 },
  metaValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  metaUnit: { fontSize: 11, fontWeight: '600', color: COLORS.textSec },

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
  impactBadgeText: { fontSize: 10, color: GOLD, fontWeight: '700' },

  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,215,0,0.10)',
  },
  controlBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(10,10,10,0.85)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.md,
  },
  playBtnActive: { backgroundColor: 'rgba(10,10,10,0.85)', borderWidth: 1, borderColor: GOLD, ...SHADOWS.glow(GOLD) },

  impactInfoCard: {
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  infoTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.10)' },
  infoLabel: { fontSize: 12, color: COLORS.textSec },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  infoValueMono: { fontSize: 12, color: COLORS.text, fontFamily: 'monospace' as any },
  alertsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: 'rgba(255,215,0,0.10)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  alertsBadgeText: { fontSize: 11, color: GOLD, fontWeight: '700' },
});

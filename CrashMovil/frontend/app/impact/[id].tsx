import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { impactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, GOLD, FONT, FONT_SIZE, ANIMATION } from '../../src/theme';
import SeverityBadge from '../../src/components/SeverityBadge';
import { LineChart, MultiLineChart } from '../../src/components/Charts';
import GPSMap from '../../src/components/GPSMap';

function sevColor(s: string) {
  if (s === 'low') return COLORS.success;
  if (s === 'medium') return GOLD;
  if (s === 'high') return '#FB923C';
  return COLORS.danger;
}

function toText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function toItems(v: any): string[] {
  if (Array.isArray(v)) {
    return v.map((item) => (typeof item === 'string' ? item : toText(item)));
  }
  if (typeof v === 'string' && v.trim()) {
    return v.split(/\n|•|\d+\./).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function DataItem({ label, value, unit }: { label: string; value?: string; unit: string }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value || '-'}</Text>
      <Text style={styles.dataUnit}>{unit}</Text>
    </View>
  );
}

export default function ImpactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const { width: SCREEN_W } = useWindowDimensions();
  const CHART_INNER = SCREEN_W - SPACING.md * 4;
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'location' | 'ai'>('telemetry');

  const tabAnim = useSharedValue(0);

  useEffect(() => {
    if (token && id) {
      impactsAPI.get(token, id).then(setImpact).catch(console.error).finally(() => setLoading(false));
    }
  }, [token, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
      </SafeAreaView>
    );
  }

  if (!impact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={COLORS.textDim} />
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const d = impact.ai_diagnosis;
  const color = sevColor(impact.severity);
  const date = new Date(impact.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View
          entering={FadeIn.duration(450).springify().damping(26).stiffness(200)}
          style={styles.header}
        >
          <TouchableOpacity testID="impact-detail-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={GOLD} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DETALLE DEL IMPACTO</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(450).delay(50).springify().damping(26).stiffness(200)}
          style={[styles.sevBanner, { backgroundColor: `${color}10`, borderColor: `${color}30` }]}
        >
          <View style={styles.sevRow}>
            <View>
              <Text style={styles.sevLabel}>SEVERIDAD</Text>
              <Text style={[styles.sevValue, { color }]}>{impact.severity_label || impact.severity}</Text>
            </View>
            <View style={styles.gBlock}>
              <Text style={[styles.gForceVal, { color }]}>{impact.g_force?.toFixed(1)}</Text>
              <Text style={styles.gUnit}>G</Text>
            </View>
          </View>
          <View style={styles.sevMeta}>
            <Text style={styles.dateText}>{date}</Text>
            {impact.alerts_sent && (
              <View style={styles.alertSentBadge}>
                <Ionicons name="notifications" size={10} color={GOLD} />
                <Text style={styles.alertSentText}>Alertas enviadas</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View
          entering={SlideInRight.duration(450).delay(100).springify().damping(26).stiffness(200)}
          style={styles.tabBar}
        >
          {(['telemetry', 'location', 'ai'] as const).map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => { setActiveTab(tab); tabAnim.value = withTiming(i, { duration: 300 }); }}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'telemetry' ? 'TELEMETRÍA' : tab === 'location' ? 'UBICACIÓN' : 'DIAGNÓSTICO IA'}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[
            styles.tabIndicator,
            activeTab === 'telemetry' && styles.tabIndicatorTelemetry,
            activeTab === 'location' && styles.tabIndicatorLocation,
            activeTab === 'ai' && styles.tabIndicatorAI,
          ]} />
        </Animated.View>

        {activeTab === 'telemetry' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DATOS DE TELEMETRÍA</Text>
              <View style={styles.dataGrid}>
                <DataItem label="Accel X" value={impact.acceleration?.x?.toFixed(3)} unit="m/s²" />
                <DataItem label="Accel Y" value={impact.acceleration?.y?.toFixed(3)} unit="m/s²" />
                <DataItem label="Accel Z" value={impact.acceleration?.z?.toFixed(3)} unit="m/s²" />
                <DataItem label="Gyro X" value={impact.gyroscope?.x?.toFixed(3)} unit="°/s" />
                <DataItem label="Gyro Y" value={impact.gyroscope?.y?.toFixed(3)} unit="°/s" />
                <DataItem label="Gyro Z" value={impact.gyroscope?.z?.toFixed(3)} unit="°/s" />
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Giroscopio</Text>
              <MultiLineChart
                datasets={[
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.info, name: 'X' },
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.warning, name: 'Y' },
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.danger, name: 'Z' },
                ]}
                width={CHART_INNER}
                height={140}
                showArea
                showLegend
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Giroscopio</Text>
              <MultiLineChart
                datasets={[
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.info, name: 'X' },
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.warning, name: 'Y' },
                  { data: [{x:0,y:impact.gyroscope?.x||0},{x:1,y:impact.gyroscope?.y||0},{x:2,y:impact.gyroscope?.z||0}], color: COLORS.danger, name: 'Z' },
                ]}
                width={CHART_INNER}
                height={140}
                showArea
                showLegend
              />
            </View>
          </Animated.View>
        )}

        {activeTab === 'location' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            {impact.location && impact.location.latitude ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>UBICACIÓN DEL IMPACTO</Text>
                <GPSMap
                  route={impact.location_history || []}
                  impactPoint={{
                    latitude: impact.location.latitude,
                    longitude: impact.location.longitude,
                  }}
                  currentLocation={undefined}
                  width={CHART_INNER}
                  height={280}
                  animateRoute={true}
                />
                <View style={styles.locRow}>
                  <Ionicons name="location" size={16} color={GOLD} />
                  <Text style={styles.locText}>
                    {impact.location.latitude?.toFixed(5)}, {impact.location.longitude?.toFixed(5)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.noDiag}>
                  <Ionicons name="location-outline" size={28} color={COLORS.textDim} />
                  <Text style={styles.noDiagText}>Ubicación no disponible</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'ai' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            {d ? (
              <>
                <View style={styles.section}>
                  <View style={styles.aiHeader}>
                    <Ionicons name="sparkles" size={16} color={GOLD} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>DIAGNÓSTICO IA</Text>
                  </View>
                  <View style={styles.diagDivider} />

                  {toText(d.severity_assessment) ? (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>EVALUACIÓN DE SEVERIDAD</Text>
                      <Text style={styles.diagValue}>{toText(d.severity_assessment)}</Text>
                    </View>
                  ) : null}

                  <View style={styles.metricRow}>
                    <View style={[styles.metricBox, { borderColor: `${color}40` }]}>
                      <Text style={styles.metricLabel}>PRIORIDAD</Text>
                      <Text style={[styles.metricValue, { color }]}>{toText(d.priority_level).toUpperCase() || 'MEDIO'}</Text>
                    </View>
                    {toText(d.estimated_injury_probability) ? (
                      <View style={[styles.metricBox, { borderColor: 'rgba(255,215,0,0.25)' }]}>
                        <Text style={styles.metricLabel}>PROB. DE LESIÓN</Text>
                        <Text style={[styles.metricValue, { color: GOLD }]}>{toText(d.estimated_injury_probability)}</Text>
                      </View>
                    ) : null}
                  </View>

                  {toText(d.mechanism_of_injury) ? (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>MECANISMO DEL TRAUMATISMO</Text>
                      <Text style={styles.diagValue}>{toText(d.mechanism_of_injury)}</Text>
                    </View>
                  ) : null}

                  {toItems(d.body_areas_at_risk).length > 0 && (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>ZONAS MÁS EXPUESTAS</Text>
                      <View style={styles.chipRow}>
                        {toItems(d.body_areas_at_risk).map((item: string, i: number) => (
                          <View key={i} style={styles.chip}>
                            <Text style={styles.chipText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {toItems(d.possible_injuries).length > 0 && (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>POSIBLES LESIONES</Text>
                      {toItems(d.possible_injuries).map((item: string, i: number) => (
                        <View key={i} style={styles.listItem}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {toItems(d.first_aid_steps).length > 0 && (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>PRIMEROS AUXILIOS</Text>
                      {toItems(d.first_aid_steps).map((item: string, i: number) => (
                        <View key={i} style={styles.listItem}>
                          <View style={styles.stepNum}>
                            <Text style={styles.stepNumText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {toText(d.when_to_call_emergency) ? (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>CUÁNDO LLAMAR A EMERGENCIA</Text>
                      <Text style={styles.diagValue}>{toText(d.when_to_call_emergency)}</Text>
                    </View>
                  ) : null}

                  {toItems(d.emergency_recommendations).length > 0 && (
                    <View style={styles.diagBlock}>
                      <Text style={styles.diagLabel}>RECOMENDACIONES</Text>
                      {toItems(d.emergency_recommendations).map((item: string, i: number) => (
                        <View key={i} style={styles.listItem}>
                          <Ionicons name="medkit" size={14} color={GOLD} />
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {toText(d.profile_warnings) && toText(d.profile_warnings).toUpperCase() !== 'NINGUNA' ? (
                    <View style={[styles.warnBox, { borderColor: 'rgba(255,149,0,0.3)', backgroundColor: 'rgba(255,149,0,0.08)' }]}>
                      <Ionicons name="warning" size={14} color={COLORS.warning} />
                      <Text style={styles.warnBoxText}>
                        <Text style={{ fontWeight: '800' }}>PERFIL MÉDICO: </Text>
                        {toText(d.profile_warnings)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <View style={styles.noDiag}>
                  <Ionicons name="sparkles-outline" size={28} color={COLORS.textDim} />
                  <Text style={styles.noDiagText}>Diagnóstico IA no disponible</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity style={styles.replayBtn} onPress={() => router.push(`/replay/${id}`)} activeOpacity={0.8}>
          <Ionicons name="play-circle" size={20} color="#000" />
          <Text style={styles.replayBtnText}>REPRODUCIR ACCIDENTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(255,215,0,0.02)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  goldGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,215,0,0.03)',
  },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: COLORS.textDim, fontSize: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: GOLD, fontSize: 14, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  headerTitle: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: GOLD, letterSpacing: 2 },
  sevBanner: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1,
    marginBottom: SPACING.md, ...SHADOWS.md,
  },
  sevRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sevLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2, marginBottom: 4 },
  sevValue: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  gBlock: { flexDirection: 'row', alignItems: 'flex-end' },
  gForceVal: { fontSize: 46, fontWeight: '900', lineHeight: 50 },
  gUnit: { fontSize: 18, fontWeight: '700', color: COLORS.textDim, marginBottom: 6, marginLeft: 2 },
  sevMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  dateText: { fontSize: FONT_SIZE.xs, color: COLORS.textSec, flex: 1 },
  alertSentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,215,0,0.10)' },
  alertSentText: { fontSize: FONT_SIZE.xs, color: GOLD, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {},
  tabBtnText: { color: COLORS.textSec, fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1 },
  tabBtnTextActive: { color: COLORS.text },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: GOLD,
    ...SHADOWS.glow(GOLD, 0.3, 8),
  },
  tabIndicatorTelemetry: { left: 0, width: '33.33%' },
  tabIndicatorLocation: { left: '33.33%', width: '33.33%' },
  tabIndicatorAI: { left: '66.66%', width: '33.33%' },
  tabContent: { marginTop: SPACING.sm },
  section: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 12 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dataItem: {
    width: '48%', flexGrow: 1, backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm, padding: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  dataLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1, marginBottom: 4 },
  dataValue: { fontSize: FONT_SIZE.lg, fontWeight: '900', color: COLORS.text, fontFamily: FONT.mono },
  dataUnit: { fontSize: FONT_SIZE.xs, color: COLORS.textDim, marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: COLORS.textSec,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bg, padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  locText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontFamily: FONT.mono, letterSpacing: 0.5 },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOLD, borderRadius: RADIUS.pill, height: 50,
    marginBottom: SPACING.md, ...SHADOWS.glow(GOLD),
  },
  replayBtnText: { color: '#000', fontSize: FONT_SIZE.md, fontWeight: '900', letterSpacing: 2 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  diagDivider: { height: 1, backgroundColor: 'rgba(255,215,0,0.10)', marginVertical: 12 },
  diagBlock: { marginBottom: 20 },
  diagLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: GOLD, letterSpacing: 2, marginBottom: 8 },
  diagValue: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 20 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  priorityText: { fontSize: FONT_SIZE.md, fontWeight: '800', letterSpacing: 1 },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  metricBox: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.sm,
    padding: 12, borderWidth: 1, alignItems: 'center',
  },
  metricLabel: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1.5, marginBottom: 6 },
  metricValue: { fontSize: FONT_SIZE.lg, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(255,215,0,0.10)', borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,215,0,0.18)',
  },
  chipText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: GOLD },
  warnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: RADIUS.sm, borderWidth: 1, padding: 10, marginTop: 4,
  },
  warnBoxText: { fontSize: FONT_SIZE.sm, color: COLORS.text, flex: 1, lineHeight: 18 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  listText: { fontSize: FONT_SIZE.md, color: COLORS.text, flex: 1, lineHeight: 20 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  stepNumText: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: GOLD },
  noDiag: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  noDiagText: { fontSize: FONT_SIZE.md, color: COLORS.textDim },
});
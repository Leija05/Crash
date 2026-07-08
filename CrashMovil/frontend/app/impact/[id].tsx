import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { impactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/theme';
import SeverityBadge from '../../src/components/SeverityBadge';
import MetricTile from '../../src/components/MetricTile';

function sevColor(s: string) {
  if (s === 'low') return COLORS.success;
  if (s === 'medium') return COLORS.warning;
  if (s === 'high') return '#FB923C';
  return COLORS.primary;
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
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && id) {
      impactsAPI.get(token, id).then(setImpact).catch(console.error).finally(() => setLoading(false));
    }
  }, [token, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity testID="impact-detail-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DETALLE DEL IMPACTO</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.sevBanner, { backgroundColor: `${color}10`, borderColor: `${color}30` }]}>
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
                <Ionicons name="notifications" size={10} color={COLORS.accent} />
                <Text style={styles.alertSentText}>Alertas enviadas</Text>
              </View>
            )}
          </View>
        </View>

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

        {impact.location && impact.location.latitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UBICACIÓN</Text>
            <View style={styles.locRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.locText}>
                {impact.location.latitude?.toFixed(4)}, {impact.location.longitude?.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.replayBtn} onPress={() => router.push(`/replay/${id}`)} activeOpacity={0.8}>
          <Ionicons name="play-circle" size={20} color="#000" />
          <Text style={styles.replayBtnText}>REPRODUCIR ACCIDENTE</Text>
        </TouchableOpacity>

        {d ? (
          <View style={styles.section}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color={COLORS.accent} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>DIAGNÓSTICO IA</Text>
            </View>
            <View style={styles.diagDivider} />

            <View style={styles.diagBlock}>
              <Text style={styles.diagLabel}>EVALUACIÓN DE SEVERIDAD</Text>
              <Text style={styles.diagValue}>{d.severity_assessment}</Text>
            </View>

            <View style={styles.diagBlock}>
              <Text style={styles.diagLabel}>NIVEL DE PRIORIDAD</Text>
              <View style={[styles.priorityBadge, { backgroundColor: `${color}18` }]}>
                <Text style={[styles.priorityText, { color }]}>{d.priority_level?.toUpperCase()}</Text>
              </View>
            </View>

            {d.possible_injuries?.length > 0 && (
              <View style={styles.diagBlock}>
                <Text style={styles.diagLabel}>POSIBLES LESIONES</Text>
                {d.possible_injuries.map((item: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {d.first_aid_steps?.length > 0 && (
              <View style={styles.diagBlock}>
                <Text style={styles.diagLabel}>PRIMEROS AUXILIOS</Text>
                {d.first_aid_steps.map((item: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {d.emergency_recommendations?.length > 0 && (
              <View style={styles.diagBlock}>
                <Text style={styles.diagLabel}>RECOMENDACIONES</Text>
                {d.emergency_recommendations.map((item: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Ionicons name="medkit" size={14} color={COLORS.primary} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.noDiag}>
              <Ionicons name="sparkles-outline" size={28} color={COLORS.textDim} />
              <Text style={styles.noDiagText}>Diagnóstico IA no disponible</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(255,59,48,0.02)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: COLORS.textDim, fontSize: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  headerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 2 },
  sevBanner: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1,
    marginBottom: SPACING.md, ...SHADOWS.md,
  },
  sevRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sevLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2, marginBottom: 4 },
  sevValue: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  gBlock: { flexDirection: 'row', alignItems: 'flex-end' },
  gForceVal: { fontSize: 46, fontWeight: '900', lineHeight: 50 },
  gUnit: { fontSize: 18, fontWeight: '700', color: COLORS.textDim, marginBottom: 6, marginLeft: 2 },
  sevMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  dateText: { fontSize: 11, color: COLORS.textSec, flex: 1 },
  alertSentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft },
  alertSentText: { fontSize: 10, color: COLORS.accent, fontWeight: '800' },
  section: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 12 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dataItem: {
    width: '48%', flexGrow: 1, backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm, padding: 12,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  dataLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1, marginBottom: 4 },
  dataValue: { fontSize: 17, fontWeight: '900', color: COLORS.text, fontFamily: 'monospace' as any },
  dataUnit: { fontSize: 9, color: COLORS.textDim, marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bg, padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  locText: { fontSize: 13, color: COLORS.text, fontFamily: 'monospace' as any, letterSpacing: 0.5 },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 50,
    marginBottom: SPACING.md, ...SHADOWS.glow(COLORS.accent),
  },
  replayBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  diagDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 12 },
  diagBlock: { marginBottom: 20 },
  diagLabel: { fontSize: 9, fontWeight: '700', color: COLORS.accent, letterSpacing: 2, marginBottom: 8 },
  diagValue: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  priorityText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  listText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 20 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  stepNumText: { fontSize: 11, fontWeight: '800', color: COLORS.accent },
  noDiag: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  noDiagText: { fontSize: 13, color: COLORS.textDim },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { usePhoneSensor } from '../../src/context/PhoneSensorContext';
import { impactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, RED, RED_GRADIENT, RED_GRADIENT_DIAGONAL, FONT, FONT_SIZE } from '../../src/theme';
import { MultiLineChart } from '../../src/components/Charts';
import GPSMap from '../../src/components/GPSMap';
import { haptics } from '../../src/utils/haptics';

function sevColor(s: string) {
  if (s === 'low') return COLORS.success;
  if (s === 'medium') return RED;
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

function DataItem({ label, value, unit, color = COLORS.text }: { label: string; value?: string; unit: string; color?: string }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, { color }]}>{value || '-'}</Text>
      <Text style={styles.dataUnit}>{unit}</Text>
    </View>
  );
}

export default function ImpactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { canUsePhoneSensor } = usePhoneSensor();
  const router = useRouter();

  const { width: SCREEN_W } = useWindowDimensions();
  const CHART_INNER = SCREEN_W - SPACING.md * 4;
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'location' | 'contacts' | 'ai'>('telemetry');

  useEffect(() => {
    if (token && id) {
      impactsAPI.get(token, id).then(setImpact).catch(console.error).finally(() => setLoading(false));
    }
  }, [token, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={RED} /></View>
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
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const triageText = impact.triage_label || (
    impact.severity === 'critical' ? 'CÓDIGO ROJO · INMEDIATO' :
    impact.severity === 'high' ? 'CÓDIGO AMARILLO · URGENTE' :
    impact.severity === 'medium' ? 'CÓDIGO NARANJA · OBSERVACIÓN' : 'CÓDIGO VERDE · LEVE'
  );

  const injuryProb = impact.injury_probability !== undefined && impact.injury_probability !== null
    ? (typeof impact.injury_probability === 'number' ? `${Math.round(impact.injury_probability > 1 ? impact.injury_probability : impact.injury_probability * 100)}%` : String(impact.injury_probability))
    : d?.estimated_injury_probability ? toText(d.estimated_injury_probability) : null;

  const alertedContacts = Array.isArray(impact.alerted_contacts) ? impact.alerted_contacts : [];

  // Trazados de acelerómetro triaxial
  const ax = impact.acceleration?.x || 0;
  const ay = impact.acceleration?.y || 0;
  const az = impact.acceleration?.z || 0;
  const accelMag = Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2);

  // Trazados de giroscopio triaxial
  const gx = impact.gyroscope?.x || 0;
  const gy = impact.gyroscope?.y || 0;
  const gz = impact.gyroscope?.z || 0;
  const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.brandGlow} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Superior */}
        <Animated.View
          entering={FadeIn.duration(450).springify().damping(26).stiffness(200)}
          style={styles.header}
        >
          <TouchableOpacity
            testID="impact-detail-back-btn"
            onPress={() => { haptics.light(); router.back(); }}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={RED} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>REGISTRO DE IMPACTO</Text>
            <Text style={styles.headerSubId}>ID #{String(impact.id || id).slice(-6).toUpperCase()}</Text>
          </View>

          {/* Badge Simulación vs Real */}
          <View style={[
            styles.modeBadge,
            impact.simulated ? styles.modeBadgeSim : styles.modeBadgeReal,
          ]}>
            <Text style={[
              styles.modeBadgeText,
              { color: impact.simulated ? '#60A5FA' : '#FF4D4D' },
            ]}>
              {impact.simulated ? 'SIMULACIÓN' : 'INCIDENTE REAL'}
            </Text>
          </View>
        </Animated.View>

        {/* Hero Banner de Severidad con arquitectura de doble bisel */}
        <Animated.View
          entering={FadeIn.duration(450).delay(50).springify().damping(26).stiffness(200)}
          style={[styles.sevBannerOuter, { borderColor: `${color}40` }]}
        >
          <LinearGradient
            colors={[`${color}18`, 'rgba(10,10,10,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sevBannerInner}>
            <View style={styles.sevRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sevLabel}>CLASIFICACIÓN</Text>
                <Text style={[styles.sevValue, { color }]}>
                  {impact.severity_label || impact.severity?.toUpperCase() || 'IMPACTO'}
                </Text>
                {/* Badge de Triage Médico */}
                <View style={[styles.triageBadge, { borderColor: `${color}60`, backgroundColor: `${color}15` }]}>
                  <Ionicons name="pulse" size={12} color={color} />
                  <Text style={[styles.triageText, { color }]}>{triageText}</Text>
                </View>
              </View>

              {/* Bloque Digital G-Force */}
              <View style={styles.gBlock}>
                <Text style={[styles.gForceVal, { color }]}>{impact.g_force ? impact.g_force.toFixed(1) : '0.0'}</Text>
                <Text style={styles.gUnit}>G</Text>
              </View>
            </View>

            {/* Fila Inferior de Metadatos del Impacto */}
            <View style={styles.sevMeta}>
              <View style={styles.sourceTag}>
                <Ionicons
                  name={canUsePhoneSensor && impact.source === 'phone_sensor' ? 'phone-portrait-outline' : 'shield-checkmark-outline'}
                  size={12}
                  color={canUsePhoneSensor && impact.source === 'phone_sensor' ? '#60A5FA' : RED}
                />
                <Text style={[styles.sourceTagText, { color: canUsePhoneSensor && impact.source === 'phone_sensor' ? '#60A5FA' : RED }]}>
                  {canUsePhoneSensor && impact.source === 'phone_sensor'
                    ? 'TELEMETRÍA AUTÓNOMA (ADMIN)'
                    : 'SISTEMA C.R.A.S.H.'}
                </Text>
              </View>

              {injuryProb ? (
                <View style={styles.injuryBadge}>
                  <Text style={styles.injuryLabel}>LESIÓN EST.</Text>
                  <Text style={styles.injuryVal}>{injuryProb}</Text>
                </View>
              ) : null}

              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Selector de Pestañas Segmentado (4 pestañas completas) */}
        <Animated.View
          entering={SlideInRight.duration(450).delay(100).springify().damping(26).stiffness(200)}
          style={styles.tabBar}
        >
          {(['telemetry', 'location', 'contacts', 'ai'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => { haptics.selection(); setActiveTab(tab); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'telemetry' ? 'TELEMETRÍA' : tab === 'location' ? 'UBICACIÓN' : tab === 'contacts' ? 'CONTACTOS' : 'IA MÉDICA'}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[
            styles.tabIndicator,
            activeTab === 'telemetry' && styles.tabIndicatorTelemetry,
            activeTab === 'location' && styles.tabIndicatorLocation,
            activeTab === 'contacts' && styles.tabIndicatorContacts,
            activeTab === 'ai' && styles.tabIndicatorAI,
          ]} />
        </Animated.View>

        {/* PESTAÑA 1: TELEMETRÍA */}
        {activeTab === 'telemetry' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            {/* Grid de Sensores Triaxiales */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>VECTOR DE ACELERACIÓN Y DINÁMICA</Text>
                <Text style={styles.magnitudePill}>MAG: {accelMag} m/s²</Text>
              </View>
              <View style={styles.dataGrid}>
                <DataItem label="Eje X (Lateral)" value={impact.acceleration?.x !== undefined ? `${impact.acceleration.x > 0 ? '+' : ''}${impact.acceleration.x.toFixed(3)}` : '-'} unit="m/s²" />
                <DataItem label="Eje Y (Longitudinal)" value={impact.acceleration?.y !== undefined ? `${impact.acceleration.y > 0 ? '+' : ''}${impact.acceleration.y.toFixed(3)}` : '-'} unit="m/s²" />
                <DataItem label="Eje Z (Vertical)" value={impact.acceleration?.z !== undefined ? `${impact.acceleration.z > 0 ? '+' : ''}${impact.acceleration.z.toFixed(3)}` : '-'} unit="m/s²" />
                <DataItem label="Fuerza Gravitacional" value={`${impact.g_force ? impact.g_force.toFixed(2) : '1.00'}`} unit="G" color={color} />
              </View>
            </View>

            {/* Gráfica 1: Acelerómetro Triaxial */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Ionicons name="speedometer-outline" size={15} color={RED} />
                <Text style={styles.chartTitle}>Acelerómetro Triaxial (X / Y / Z)</Text>
              </View>
              <MultiLineChart
                datasets={[
                  { data: [{ x: 0, y: 0 }, { x: 1, y: ax * 0.4 }, { x: 2, y: ax }, { x: 3, y: ax * 0.15 }], color: COLORS.info, name: 'X (Lateral)' },
                  { data: [{ x: 0, y: 0 }, { x: 1, y: ay * 0.5 }, { x: 2, y: ay }, { x: 3, y: ay * 0.2 }], color: COLORS.warning, name: 'Y (Frontal)' },
                  { data: [{ x: 0, y: 9.8 }, { x: 1, y: az * 0.6 }, { x: 2, y: az }, { x: 3, y: 9.8 }], color: COLORS.danger, name: 'Z (Vertical)' },
                ]}
                width={CHART_INNER}
                height={140}
                showArea
                showLegend
              />
            </View>

            {/* Grid de Velocidad Angular */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>VELOCIDAD ANGULAR / GIROSCOPIO</Text>
                <Text style={styles.magnitudePill}>GIRO: {gyroMag} °/s</Text>
              </View>
              <View style={styles.dataGrid}>
                <DataItem label="Roll (Giro X)" value={impact.gyroscope?.x !== undefined ? `${impact.gyroscope.x.toFixed(2)}` : '-'} unit="°/s" />
                <DataItem label="Pitch (Inclinación Y)" value={impact.gyroscope?.y !== undefined ? `${impact.gyroscope.y.toFixed(2)}` : '-'} unit="°/s" />
                <DataItem label="Yaw (Deriva Z)" value={impact.gyroscope?.z !== undefined ? `${impact.gyroscope.z.toFixed(2)}` : '-'} unit="°/s" />
                <DataItem label="Velocidad Previa" value={impact.speed_kmh ? `${Math.round(impact.speed_kmh)}` : '0'} unit="km/h" />
              </View>
            </View>

            {/* Gráfica 2: Velocidad Angular Triaxial (Diferente a la gráfica 1) */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Ionicons name="refresh-circle-outline" size={15} color={COLORS.warning} />
                <Text style={styles.chartTitle}>Velocidad Angular (Roll / Pitch / Yaw)</Text>
              </View>
              <MultiLineChart
                datasets={[
                  { data: [{ x: 0, y: 0 }, { x: 1, y: gx * 0.3 }, { x: 2, y: gx }, { x: 3, y: 0 }], color: COLORS.info, name: 'Roll (X)' },
                  { data: [{ x: 0, y: 0 }, { x: 1, y: gy * 0.4 }, { x: 2, y: gy }, { x: 3, y: 0 }], color: COLORS.warning, name: 'Pitch (Y)' },
                  { data: [{ x: 0, y: 0 }, { x: 1, y: gz * 0.5 }, { x: 2, y: gz }, { x: 3, y: 0 }], color: '#FB923C', name: 'Yaw (Z)' },
                ]}
                width={CHART_INNER}
                height={140}
                showArea
                showLegend
              />
            </View>
          </Animated.View>
        )}

        {/* PESTAÑA 2: UBICACIÓN Y RUTA */}
        {activeTab === 'location' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            {impact.location && impact.location.latitude ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>CARTOGRAFÍA TÁCTICA DEL IMPACTO</Text>
                  <View style={styles.gpsLockTag}>
                    <Ionicons name="radio" size={10} color={COLORS.success} />
                    <Text style={styles.gpsLockText}>GPS FIJADO</Text>
                  </View>
                </View>

                {/* Mapa con CartoDB Dark Matter */}
                <GPSMap
                  route={impact.location_history || []}
                  impactPoint={{
                    latitude: impact.location.latitude,
                    longitude: impact.location.longitude,
                    g_force: impact.g_force,
                    speed_kmh: impact.speed_kmh,
                  }}
                  currentLocation={undefined}
                  width={CHART_INNER}
                  height={280}
                  animateRoute={true}
                />

                {/* Coordenadas */}
                <View style={[styles.locRow, { marginTop: 12 }]}>
                  <Ionicons name="location" size={16} color={RED} />
                  <Text style={styles.locText}>
                    {impact.location.latitude.toFixed(6)}, {impact.location.longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Metadata de Trayectoria y Zona */}
                <View style={styles.routeMetaGrid}>
                  <View style={styles.routeMetaBox}>
                    <Text style={styles.routeMetaLabel}>PUNTOS RECORRIDOS</Text>
                    <Text style={styles.routeMetaVal}>{impact.location_history?.length || 0} pts</Text>
                  </View>
                  <View style={styles.routeMetaBox}>
                    <Text style={styles.routeMetaLabel}>VELOCIDAD AL IMPACTO</Text>
                    <Text style={styles.routeMetaVal}>
                      {impact.speed_kmh ? `${Math.round(impact.speed_kmh)} km/h` : 'Estática'}
                    </Text>
                  </View>
                  <View style={styles.routeMetaBox}>
                    <Text style={styles.routeMetaLabel}>ZONA CLASIFICADA</Text>
                    <Text style={[styles.routeMetaVal, { color: COLORS.warning }]}>
                      {impact.risk_zone?.zone_name || impact.risk_zone?.name || 'Vía Regular'}
                    </Text>
                  </View>
                </View>

                {/* Botón directo a Google Maps */}
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    const url = `https://maps.google.com/?q=${impact.location.latitude},${impact.location.longitude}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                  style={styles.openMapBtn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-circle" size={18} color={RED} />
                  <Text style={styles.openMapBtnText}>ABRIR NAVEGACIÓN EN GOOGLE MAPS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.noDiag}>
                  <Ionicons name="location-outline" size={32} color={COLORS.textDim} />
                  <Text style={styles.noDiagText}>Ubicación GPS no registrada en este evento</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* PESTAÑA 3: CONTACTOS Y NOTIFICACIONES */}
        {activeTab === 'contacts' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>RED DE CONTACTOS Y DISPATCH</Text>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: impact.alerts_sent ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)' },
                ]}>
                  <Ionicons
                    name={impact.alerts_sent ? 'checkmark-circle' : 'alert-circle'}
                    size={12}
                    color={impact.alerts_sent ? COLORS.success : RED}
                  />
                  <Text style={[
                    styles.statusPillText,
                    { color: impact.alerts_sent ? COLORS.success : RED },
                  ]}>
                    {impact.alerts_sent ? 'NOTIFICADOS' : 'PENDIENTE / SIN ENVIAR'}
                  </Text>
                </View>
              </View>

              {/* Lista de Contactos Alertados */}
              {alertedContacts.length > 0 ? (
                <View style={{ gap: 10, marginTop: 8 }}>
                  {alertedContacts.map((c: any, i: number) => (
                    <View key={c.id || i} style={styles.contactCard}>
                      <View style={styles.contactCardTop}>
                        <View style={styles.contactAvatar}>
                          <Ionicons name="person" size={16} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactName}>{c.name || 'Contacto de Emergencia'}</Text>
                          <Text style={styles.contactRelation}>{c.relationship || 'Familiar'} · {c.phone || c.email || 'Canal verificado'}</Text>
                        </View>
                        <View style={styles.deliveryBadge}>
                          <Ionicons name="checkmark-done" size={14} color={COLORS.success} />
                          <Text style={styles.deliveryText}>ENTREGADO</Text>
                        </View>
                      </View>

                      {/* Botones de llamada rápida o WhatsApp */}
                      {c.phone ? (
                        <View style={styles.contactActionRow}>
                          <TouchableOpacity
                            onPress={() => { haptics.light(); Linking.openURL(`tel:${c.phone}`); }}
                            style={styles.contactActionBtn}
                          >
                            <Ionicons name="call" size={14} color={COLORS.success} />
                            <Text style={styles.contactActionText}>Llamar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => { haptics.light(); Linking.openURL(`https://wa.me/${c.phone.replace(/[^\d]/g, '')}`); }}
                            style={styles.contactActionBtn}
                          >
                            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                            <Text style={styles.contactActionText}>WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noContactsBox}>
                  <Ionicons name="people-outline" size={32} color={COLORS.textDim} />
                  <Text style={styles.noContactsTitle}>
                    {impact.alert_error || 'No se registraron envíos a contactos en este evento'}
                  </Text>
                  <Text style={styles.noContactsSub}>
                    Verifica tus contactos de emergencia en la pestaña &quot;Contactos&quot; para que reciban alertas automáticas con GPS.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* PESTAÑA 4: DIAGNÓSTICO IA MÉDICA */}
        {activeTab === 'ai' && (
          <Animated.View
            entering={FadeIn.duration(320).delay(150).springify().damping(25).stiffness(200)}
            style={styles.tabContent}
          >
            {d ? (
              <View style={styles.section}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={16} color={RED} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>DIAGNÓSTICO MÉDICO INTELIGENTE</Text>
                </View>
                <View style={styles.diagDivider} />

                {toText(d.severity_assessment) ? (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>EVALUACIÓN MÉDICA</Text>
                    <Text style={styles.diagValue}>{toText(d.severity_assessment)}</Text>
                  </View>
                ) : null}

                {/* Métricas de Prioridad y Probabilidad */}
                <View style={styles.metricRow}>
                  <View style={[styles.metricBox, { borderColor: `${color}40` }]}>
                    <Text style={styles.metricLabel}>PRIORIDAD CLÍNICA</Text>
                    <Text style={[styles.metricValue, { color }]}>
                      {toText(d.priority_level).toUpperCase() || 'ALTA'}
                    </Text>
                  </View>
                  {injuryProb ? (
                    <View style={[styles.metricBox, { borderColor: 'rgba(239,68,68,0.3)' }]}>
                      <Text style={styles.metricLabel}>PROB. DE LESIÓN</Text>
                      <Text style={[styles.metricValue, { color: RED }]}>{injuryProb}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Mecanismo de Lesión */}
                {toText(d.mechanism_of_injury) ? (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>MECANISMO CINÉTICO</Text>
                    <Text style={styles.diagValue}>{toText(d.mechanism_of_injury)}</Text>
                  </View>
                ) : null}

                {/* Zonas Expuestas */}
                {toItems(d.body_areas_at_risk).length > 0 && (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>ZONAS ANATÓMICAS EXPUESTAS</Text>
                    <View style={styles.chipRow}>
                      {toItems(d.body_areas_at_risk).map((item: string, i: number) => (
                        <View key={i} style={styles.chip}>
                          <Text style={styles.chipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Posibles Lesiones */}
                {toItems(d.possible_injuries).length > 0 && (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>POSIBLES LESIONES A DESCARTAR</Text>
                    {toItems(d.possible_injuries).map((item: string, i: number) => (
                      <View key={i} style={styles.listItem}>
                        <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                        <Text style={styles.listText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Pasos de Primeros Auxilios */}
                {toItems(d.first_aid_steps).length > 0 && (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>PRIMEROS AUXILIOS TÁCTICOS</Text>
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

                {/* Recomendaciones de Emergencia */}
                {toItems(d.emergency_recommendations).length > 0 && (
                  <View style={styles.diagBlock}>
                    <Text style={styles.diagLabel}>RECOMENDACIONES DE PARAMÉDICO</Text>
                    {toItems(d.emergency_recommendations).map((item: string, i: number) => (
                      <View key={i} style={styles.listItem}>
                        <Ionicons name="medkit" size={14} color={RED} />
                        <Text style={styles.listText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Advertencias de Perfil de Salud */}
                {toText(d.profile_warnings) && toText(d.profile_warnings).toUpperCase() !== 'NINGUNA' ? (
                  <View style={[styles.warnBox, { borderColor: 'rgba(255,149,0,0.35)', backgroundColor: 'rgba(255,149,0,0.08)' }]}>
                    <Ionicons name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.warnBoxText}>
                      <Text style={{ fontWeight: '800' }}>EXPEDIENTE DEL CONDUCTOR: </Text>
                      {toText(d.profile_warnings)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.noDiag}>
                  <Ionicons name="sparkles-outline" size={32} color={COLORS.textDim} />
                  <Text style={styles.noDiagText}>Diagnóstico de IA no generado para este registro</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Botón Inferior: Reproducir Accidente con estilo Button-in-Button */}
        <TouchableOpacity
          style={styles.replayBtn}
          onPress={() => { haptics.medium(); router.push(`/replay/${id}`); }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[...RED_GRADIENT]}
            start={RED_GRADIENT_DIAGONAL.start}
            end={RED_GRADIENT_DIAGONAL.end}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.replayBtnSheen} pointerEvents="none" />
          <View style={styles.replayIconCircle}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.replayBtnText}>REPRODUCIR TELEMETRÍA DE IMPACTO</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(239,68,68,0.02)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  brandGlow: {
    position: 'absolute', top: -60, alignSelf: 'center', width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(239,68,68,0.03)',
  },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: COLORS.textDim, fontSize: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: RED, fontSize: 14, fontWeight: '700' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: RED, letterSpacing: 2, fontFamily: FONT.heading },
  headerSubId: { fontSize: 10, color: COLORS.textDim, fontFamily: FONT.mono, marginTop: 1 },
  modeBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1,
  },
  modeBadgeSim: { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: 'rgba(96,165,250,0.3)' },
  modeBadgeReal: { backgroundColor: 'rgba(255,77,77,0.15)', borderColor: 'rgba(255,77,77,0.35)' },
  modeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  sevBannerOuter: {
    borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden',
    marginBottom: SPACING.md, ...SHADOWS.md,
  },
  sevBannerInner: { padding: SPACING.md + 2 },
  sevRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sevLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2, marginBottom: 2 },
  sevValue: { fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT.heading },
  triageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start',
  },
  triageText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  gBlock: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md },
  gForceVal: { fontSize: 42, fontWeight: '900', lineHeight: 46, fontFamily: FONT.mono },
  gUnit: { fontSize: 16, fontWeight: '800', color: COLORS.textDim, marginBottom: 5, marginLeft: 3 },
  sevMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 6 },
  sourceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sourceTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  injuryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.12)',
  },
  injuryLabel: { fontSize: 9, color: COLORS.textDim, fontWeight: '700' },
  injuryVal: { fontSize: 10, color: RED, fontWeight: '900' },
  dateText: { fontSize: 10, color: COLORS.textDim, fontFamily: FONT.mono },

  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, position: 'relative',
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: {},
  tabBtnText: { color: COLORS.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  tabBtnTextActive: { color: '#FFFFFF' },
  tabIndicator: {
    position: 'absolute', top: 3, bottom: 3, borderRadius: RADIUS.sm - 2,
    backgroundColor: RED, ...SHADOWS.glow(RED, 0.3, 8),
  },
  tabIndicatorTelemetry: { left: '1%', width: '24%' },
  tabIndicatorLocation: { left: '26%', width: '24%' },
  tabIndicatorContacts: { left: '51%', width: '24%' },
  tabIndicatorAI: { left: '76%', width: '23%' },

  tabContent: { marginTop: SPACING.xs },
  section: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.textSec, letterSpacing: 1.5, fontFamily: FONT.heading },
  magnitudePill: { fontSize: 9, fontFamily: FONT.mono, color: COLORS.textDim, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dataItem: {
    width: '48%', flexGrow: 1, backgroundColor: 'rgba(10,10,10,0.6)',
    borderRadius: RADIUS.sm, padding: 10, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  dataLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textDim, letterSpacing: 0.5, marginBottom: 2 },
  dataValue: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text, fontFamily: FONT.mono },
  dataUnit: { fontSize: 9, color: COLORS.textDim, marginTop: 1 },

  chartCard: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.glassBorder, padding: SPACING.md, marginBottom: SPACING.md,
  },
  chartHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  chartTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSec, letterSpacing: 1 },

  gpsLockTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  gpsLockText: { color: COLORS.success, fontSize: 9, fontWeight: '800' },
  locRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(10,10,10,0.6)',
    padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  locText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontFamily: FONT.mono, letterSpacing: 0.5 },
  routeMetaGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  routeMetaBox: {
    flex: 1, backgroundColor: 'rgba(10,10,10,0.6)', padding: 8, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  routeMetaLabel: { color: COLORS.textDim, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  routeMetaVal: { color: COLORS.text, fontSize: 12, fontWeight: '800', marginTop: 2 },
  openMapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 10, backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  openMapBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  contactCard: {
    backgroundColor: 'rgba(15,15,18,0.7)', borderRadius: RADIUS.md, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  contactCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  contactName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  contactRelation: { color: COLORS.textDim, fontSize: 11, marginTop: 1 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(52,211,153,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  deliveryText: { color: COLORS.success, fontSize: 9, fontWeight: '800' },
  contactActionRow: { flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  contactActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.sm,
  },
  contactActionText: { color: COLORS.text, fontSize: 11, fontWeight: '600' },
  noContactsBox: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  noContactsTitle: { color: COLORS.textSec, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  noContactsSub: { color: COLORS.textDim, fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },

  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  diagDivider: { height: 1, backgroundColor: 'rgba(239,68,68,0.10)', marginVertical: 10 },
  diagBlock: { marginBottom: 16 },
  diagLabel: { fontSize: 10, fontWeight: '800', color: RED, letterSpacing: 1.5, marginBottom: 6 },
  diagValue: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metricBox: {
    flex: 1, backgroundColor: 'rgba(10,10,10,0.6)', borderRadius: RADIUS.sm,
    padding: 10, borderWidth: 1, alignItems: 'center',
  },
  metricLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1, marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(239,68,68,0.10)', borderRadius: RADIUS.pill,
    paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  chipText: { fontSize: 10, fontWeight: '700', color: RED },
  warnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: RADIUS.sm, borderWidth: 1, padding: 10, marginTop: 4,
  },
  warnBoxText: { fontSize: 11, color: COLORS.text, flex: 1, lineHeight: 16 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  listText: { fontSize: 12, color: COLORS.text, flex: 1, lineHeight: 17 },
  stepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.glassBg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  stepNumText: { fontSize: 10, fontWeight: '800', color: RED },
  noDiag: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noDiagText: { fontSize: 13, color: COLORS.textDim, textAlign: 'center' },

  replayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: RADIUS.pill, marginTop: 8, marginBottom: SPACING.md,
    overflow: 'hidden', ...SHADOWS.glow(RED, 0.4, 18),
  },
  replayBtnSheen: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '48%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  replayIconCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  replayBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: FONT.heading, fontWeight: '800', letterSpacing: 1.5 },
});
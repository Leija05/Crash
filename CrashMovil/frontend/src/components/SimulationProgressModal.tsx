import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  ZoomIn,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  COLORS,
  RADIUS,
  SPACING,
  SHADOWS,
  RED,
  RED_HAIRLINE,
  RED_GRADIENT,
  RED_GRADIENT_DIAGONAL,
} from '../theme';
import { haptics } from '../utils/haptics';

export interface SimulationStep {
  id: number;
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDesc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SIMULATION_STEPS: SimulationStep[] = [
  {
    id: 1,
    titleKey: 'dashboard.simulationModal.step1Title',
    descKey: 'dashboard.simulationModal.step1Desc',
    defaultTitle: 'Fuerza-G y Telemetría',
    defaultDesc: 'Calculando vector de aceleración e impacto de alta energía (18.5G)',
    icon: 'speedometer',
  },
  {
    id: 2,
    titleKey: 'dashboard.simulationModal.step2Title',
    descKey: 'dashboard.simulationModal.step2Desc',
    defaultTitle: 'Enlace con el Servidor',
    defaultDesc: 'Transmitiendo telemetría y registrando evento en la nube',
    icon: 'cloud-upload',
  },
  {
    id: 3,
    titleKey: 'dashboard.simulationModal.step3Title',
    descKey: 'dashboard.simulationModal.step3Desc',
    defaultTitle: 'Diagnóstico Clínico IA',
    defaultDesc: 'Analizando probabilidad de lesión y recomendaciones de trauma',
    icon: 'sparkles',
  },
  {
    id: 4,
    titleKey: 'dashboard.simulationModal.step4Title',
    descKey: 'dashboard.simulationModal.step4Desc',
    defaultTitle: 'Despacho de Alertas',
    defaultDesc: 'Enviando alertas con ubicación en tiempo real por WhatsApp',
    icon: 'logo-whatsapp',
  },
  {
    id: 5,
    titleKey: 'dashboard.simulationModal.step5Title',
    descKey: 'dashboard.simulationModal.step5Desc',
    defaultTitle: 'Confirmación Exitosa',
    defaultDesc: 'Todos los contactos de emergencia han sido notificados',
    icon: 'checkmark-done-circle',
  },
];

interface SimulationProgressModalProps {
  visible: boolean;
  currentStep: number; // 1 to 5
  simulatedGForce?: number;
  impactResult?: any | null;
  error?: string | null;
  onClose: () => void;
  onViewReport?: (impactId: string) => void;
  t?: (key: string, defaultVal?: string) => string;
}

export default function SimulationProgressModal({
  visible,
  currentStep,
  simulatedGForce = 18.5,
  impactResult,
  error,
  onClose,
  onViewReport,
  t = (key: string, defaultVal?: string) => defaultVal || key,
}: SimulationProgressModalProps) {
  const { height: screenHeight } = useWindowDimensions();

  // Animated progress bar: 0 to 1
  const progressAnim = useSharedValue(0.1);
  // Pulse animation for active step & gauge
  const pulseAnim = useSharedValue(1);
  // G-Force scale in animation
  const gForceScale = useSharedValue(0.85);

  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (!visible) {
      progressAnim.value = 0.1;
      return;
    }

    // Step progress percentage mapping
    const targetProgress = Math.min(1, Math.max(0.15, currentStep / 5));
    progressAnim.value = withTiming(targetProgress, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });

    // Haptics on step advance
    if (currentStep > prevStepRef.current) {
      if (currentStep >= 5) {
        haptics.success();
      } else {
        haptics.selection();
      }
    }
    prevStepRef.current = currentStep;
  }, [visible, currentStep, progressAnim]);

  useEffect(() => {
    if (visible) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      gForceScale.value = withSpring(1.0, { damping: 14, stiffness: 220 });
    } else {
      pulseAnim.value = 1;
      gForceScale.value = 0.85;
    }
  }, [visible, pulseAnim, gForceScale]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const isCompleted = currentStep >= 5 && !!impactResult;
  const alertedContacts = impactResult?.alerted_contacts || [];
  const aiDiag = impactResult?.ai_diagnosis;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={isCompleted ? onClose : undefined} statusBarTranslucent>
      <View style={styles.overlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 36 : 24}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dimBackdrop} />

        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(240).mass(0.7)}
          style={[styles.dialogCard, { maxHeight: screenHeight * 0.88 }]}
        >
          {/* Top Edge Red Sheen */}
          <View style={styles.topSheen} pointerEvents="none" />
          <View style={styles.glowRadial} pointerEvents="none" />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.eyebrow}>
                {t('dashboard.simulationModal.eyebrow', 'SIMULADOR DE IMPACTO · EN VIVO')}
              </Text>
            </View>
            <Text style={styles.title}>
              {t('dashboard.simulationModal.title', 'Protocolo de Emergencia')}
            </Text>
          </View>

          {/* Progress Bar Container */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  progressBarStyle,
                  isCompleted && styles.progressBarFillSuccess,
                ]}
              >
                <LinearGradient
                  colors={isCompleted ? ['#10B981', '#059669'] : [...RED_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <View style={styles.progressPercentRow}>
              <Text style={styles.progressPercentText}>
                {isCompleted ? '100%' : `${Math.round((currentStep / 5) * 100)}%`}
              </Text>
              <Text style={styles.progressStatusText}>
                {isCompleted
                  ? t('dashboard.simulationModal.success', 'Completado')
                  : `${t('dashboard.simulationModal.processing', 'Fase')} ${currentStep} / 5`}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Tactical G-Force Gauge Visualizer */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeInnerRow}>
                <View style={styles.gaugeRingWrap}>
                  <Svg width={78} height={78} viewBox="0 0 78 78">
                    <Defs>
                      <SvgLinearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#FCA5A5" />
                        <Stop offset="0.5" stopColor={RED} />
                        <Stop offset="1" stopColor="#991B1B" />
                      </SvgLinearGradient>
                    </Defs>
                    {/* Background track */}
                    <Circle
                      cx="39"
                      cy="39"
                      r="33"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="5"
                      fill="none"
                    />
                    {/* Active G-force arc */}
                    <Circle
                      cx="39"
                      cy="39"
                      r="33"
                      stroke="url(#gGrad)"
                      strokeWidth="5"
                      strokeDasharray="207"
                      strokeDashoffset={207 - (207 * (simulatedGForce / 24))}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 39 39)"
                    />
                  </Svg>
                  <View style={styles.gaugeValueWrap}>
                    <Text style={styles.gaugeValueNumber}>{simulatedGForce.toFixed(1)}</Text>
                    <Text style={styles.gaugeUnit}>G</Text>
                  </View>
                </View>

                <View style={styles.gaugeMeta}>
                  <View style={styles.severityPill}>
                    <View style={styles.severityDot} />
                    <Text style={styles.severityLabel}>
                      {t('dashboard.simulationModal.criticalImpact', 'IMPACTO CRÍTICO · 18.5G')}
                    </Text>
                  </View>
                  <Text style={styles.telemetryVectorText}>
                    Acel: Z=+18.5G · Giro: 0°/s · GPS Activo
                  </Text>
                  <Text style={styles.telemetrySubtext}>
                    {isCompleted
                      ? 'Telemetría confirmada y registrada en el servidor'
                      : 'Simulación de desaceleración severa en curso'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Error Message if Any */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={RED} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Steps Timeline List */}
            <View style={styles.stepsContainer}>
              {SIMULATION_STEPS.map((step, idx) => {
                const stepDone = currentStep > step.id || (isCompleted && step.id === 5);
                const stepActive = currentStep === step.id && !isCompleted;
                const stepPending = currentStep < step.id;

                return (
                  <View key={step.id} style={styles.stepItemWrapper}>
                    {/* Connecting line */}
                    {idx < SIMULATION_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepConnector,
                          stepDone && styles.stepConnectorDone,
                        ]}
                      />
                    )}

                    <View style={styles.stepRow}>
                      {/* Step Indicator / Icon */}
                      <View
                        style={[
                          styles.stepIconWrap,
                          stepDone && styles.stepIconWrapDone,
                          stepActive && styles.stepIconWrapActive,
                          stepPending && styles.stepIconWrapPending,
                        ]}
                      >
                        {stepDone ? (
                          <Animated.View entering={ZoomIn.springify().damping(12)}>
                            <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                          </Animated.View>
                        ) : stepActive ? (
                          <ActivityIndicator size="small" color={RED} />
                        ) : (
                          <Ionicons
                            name={step.icon}
                            size={15}
                            color={stepPending ? COLORS.textFaint : COLORS.textDim}
                          />
                        )}
                      </View>

                      {/* Step Description */}
                      <View style={styles.stepTextContent}>
                        <View style={styles.stepTitleRow}>
                          <Text
                            style={[
                              styles.stepTitle,
                              stepDone && styles.stepTitleDone,
                              stepActive && styles.stepTitleActive,
                              stepPending && styles.stepTitlePending,
                            ]}
                          >
                            {t(step.titleKey, step.defaultTitle)}
                          </Text>
                          {stepDone && (
                            <Text style={styles.doneBadgeText}>Completado ✓</Text>
                          )}
                          {stepActive && (
                            <Text style={styles.activeBadgeText}>En proceso...</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepDesc,
                            stepPending && styles.stepDescPending,
                          ]}
                          numberOfLines={2}
                        >
                          {t(step.descKey, step.defaultDesc)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Results Section when Completed */}
            {isCompleted && (
              <Animated.View entering={FadeInDown.duration(340).springify().damping(18)} style={styles.resultsCard}>
                {/* AI Diagnosis Summary Card */}
                {aiDiag && (
                  <View style={styles.aiDiagBox}>
                    <View style={styles.aiDiagHeader}>
                      <Ionicons name="sparkles" size={14} color="#7DD3FC" />
                      <Text style={styles.aiDiagTitle}>Diagnóstico Clínico de Trauma (IA)</Text>
                      <View style={styles.triageTag}>
                        <Text style={styles.triageTagText}>
                          {aiDiag.priority_level?.toUpperCase() || 'CRÍTICO'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.aiDiagText} numberOfLines={3}>
                      {aiDiag.severity_assessment ||
                        'Impacto de 18.5G con alta probabilidad de lesión. Se activó protocolo de atención inmediata.'}
                    </Text>
                  </View>
                )}

                {/* Notified Contacts List */}
                <View style={styles.contactsHeaderRow}>
                  <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
                  <Text style={styles.contactsTitle}>
                    {t('dashboard.simulationModal.notifiedContacts', 'Contactos Notificados')} ({alertedContacts.length})
                  </Text>
                </View>

                {alertedContacts.length > 0 ? (
                  alertedContacts.map((c: any, i: number) => (
                    <View key={c.id || i} style={styles.contactItemRow}>
                      <View style={styles.contactAvatar}>
                        <Ionicons name="person" size={13} color={COLORS.textSec} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactName}>{c.name}</Text>
                        <Text style={styles.contactPhone}>{c.phone}</Text>
                      </View>
                      <View style={styles.sentPill}>
                        <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                        <Text style={styles.sentPillText}>Enviado</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyContactsBox}>
                    <Text style={styles.emptyContactsText}>
                      {impactResult?.alert_error || 'No se registraron envíos directos.'}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {isCompleted ? (
              <View style={styles.footerButtonRow}>
                {impactResult?.id && onViewReport && (
                  <TouchableOpacity
                    style={styles.primaryReportBtn}
                    onPress={() => {
                      haptics.medium();
                      onClose();
                      onViewReport(impactResult.id);
                    }}
                    activeOpacity={0.82}
                  >
                    <LinearGradient
                      colors={[...RED_GRADIENT]}
                      start={RED_GRADIENT_DIAGONAL.start}
                      end={RED_GRADIENT_DIAGONAL.end}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="document-text" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      {t('dashboard.simulationModal.viewReport', 'Ver Reporte')}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.secondaryCloseBtn,
                    (!impactResult?.id || !onViewReport) && styles.secondaryCloseBtnWide,
                  ]}
                  onPress={() => {
                    haptics.light();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>
                    {t('dashboard.simulationModal.close', 'Cerrar')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inProgressFooter}>
                <ActivityIndicator size="small" color={RED} />
                <Text style={styles.inProgressText}>
                  Ejecutando simulación de emergencia en vivo...
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dimBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 410,
    backgroundColor: 'rgba(14,13,11,0.98)',
    borderWidth: 1,
    borderColor: RED_HAIRLINE,
    borderRadius: RADIUS.xl,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: RED,
    opacity: 0.8,
  },
  glowRadial: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 220,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  header: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },
  eyebrow: {
    color: RED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  progressBarWrapper: {
    marginBottom: 14,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarFillSuccess: {
    backgroundColor: '#10B981',
  },
  progressPercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  progressPercentText: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressStatusText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  gaugeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
  },
  gaugeInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gaugeRingWrap: {
    width: 78,
    height: 78,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 19,
  },
  gaugeUnit: {
    color: RED,
    fontSize: 10,
    fontWeight: '800',
  },
  gaugeMeta: {
    flex: 1,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 5,
    marginBottom: 5,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED,
  },
  severityLabel: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  telemetryVectorText: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  telemetrySubtext: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    flex: 1,
  },
  stepsContainer: {
    marginBottom: 14,
  },
  stepItemWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  stepConnector: {
    position: 'absolute',
    left: 17,
    top: 32,
    bottom: -14,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepConnectorDone: {
    backgroundColor: '#10B981',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconWrapDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepIconWrapActive: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: RED,
  },
  stepIconWrapPending: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepTextContent: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitleDone: {
    color: '#D1FAE5',
  },
  stepTitleActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepTitlePending: {
    color: COLORS.textDim,
  },
  doneBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  activeBadgeText: {
    color: RED,
    fontSize: 10,
    fontWeight: '700',
  },
  stepDesc: {
    color: COLORS.textDim,
    fontSize: 11,
    lineHeight: 15,
  },
  stepDescPending: {
    color: COLORS.textFaint,
  },
  resultsCard: {
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
  },
  aiDiagBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  aiDiagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  aiDiagTitle: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  triageTag: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  triageTagText: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '800',
  },
  aiDiagText: {
    color: COLORS.textSec,
    fontSize: 11,
    lineHeight: 16,
  },
  contactsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contactsTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 6,
  },
  contactAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contactPhone: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  sentPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContactsBox: {
    padding: 8,
  },
  emptyContactsText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 8,
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryReportBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryCloseBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCloseBtnWide: {
    flex: 1,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inProgressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  inProgressText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
});

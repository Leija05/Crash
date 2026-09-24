import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Line,
  G,
  Text as SvgText,
  Path as SvgPath,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  createAnimatedComponent,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADIUS,
  FONT,
  severityColor,
  severityLabel,
  RED,
  SHADOWS,
} from '../theme';

const AnimatedPath = createAnimatedComponent(SvgPath);
const AnimatedView = Animated.createAnimatedComponent(View);

export interface GForceRingProps {
  gForce: number;
  liveData: boolean;
  severity?: string;
  t?: (key: string) => string;
  size?: number;
  maxG?: number;
  showPeak?: boolean;
  peakG?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  onPress?: () => void;
  onResetPeak?: () => void;
}

const MAX_G_DEFAULT = 12;
const MINOR_DIVISIONS = 24; // Marcas cada 0.5G

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function createArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function GForceRingComponent({
  gForce,
  liveData,
  severity,
  t,
  size = 280,
  maxG = MAX_G_DEFAULT,
  showPeak = true,
  peakG = 1.0,
  accelX = 0,
  accelY = 0,
  accelZ = 9.8,
  onPress,
  onResetPeak,
}: GForceRingProps) {
  // Parámetros de geometría circular de precisión
  const center = size / 2;
  const outerBezelR = size * 0.465;
  const scaleTickR = outerBezelR - 7;
  const trackR = scaleTickR - 18;
  const innerBezelR = trackR - 14;
  const dialR = innerBezelR - 5;

  const strokeWidth = 7;
  const trackStrokeWidth = 4;

  // Ángulos de cockpit: 135° (inferior-izq) a 405° (inferior-der = 45°) -> 270° de barrido
  const START_ANGLE = 135;
  const SWEEP_ANGLE = 270;
  const END_ANGLE = START_ANGLE + SWEEP_ANGLE; // 405°

  // Longitud de arco matemáticamente exacta
  const arcLength = (SWEEP_ANGLE / 360) * (2 * Math.PI * trackR);

  // Progreso acotado
  const clampedG = Math.max(0, Math.min(gForce, maxG * 1.15));
  const rawProgress = clampedG / maxG;
  const targetProgress = Math.max(0, Math.min(1, rawProgress));

  const peakVal = Math.max(peakG, gForce);
  const peakClamped = Math.max(0, Math.min(peakVal, maxG));
  const peakProgress = Math.max(0, Math.min(1, peakClamped / maxG));

  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);
  const isCritical = liveData && gForce >= 5.0;
  const isHigh = liveData && gForce >= 3.5;

  // Animaciones Reanimated fluidas en hilo de interfaz nativo
  const fillProgress = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  const auraGlowAnim = useSharedValue(0);

  React.useEffect(() => {
    fillProgress.value = withSpring(targetProgress, {
      stiffness: 180,
      damping: 20,
      mass: 0.7,
    });
  }, [targetProgress, fillProgress]);

  React.useEffect(() => {
    if (isCritical) {
      pulseAnim.value = withRepeat(
        withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }),
        -1,
        true
      );
      auraGlowAnim.value = withRepeat(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else if (isHigh) {
      pulseAnim.value = withTiming(0, { duration: 300 });
      auraGlowAnim.value = withRepeat(
        withTiming(0.65, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(0, { duration: 300 });
      auraGlowAnim.value = withTiming(0, { duration: 400 });
    }
  }, [isCritical, isHigh, pulseAnim, auraGlowAnim]);

  // Props animadas SVG acopladas exactamente a arcLength
  const animatedFillProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLength * (1 - fillProgress.value),
  }));

  // Punta luminosa perfectamente soldada a la cabeza del arco
  const tipAnimatedStyle = useAnimatedStyle(() => {
    const angle = START_ANGLE + SWEEP_ANGLE * fillProgress.value;
    const pos = polarToXY(center, center, trackR, angle);
    const tipSize = strokeWidth * 1.5;
    return {
      opacity: liveData && fillProgress.value > 0.015 ? 1 : 0,
      transform: [
        { translateX: pos.x - tipSize / 2 },
        { translateY: pos.y - tipSize / 2 },
        { scale: isCritical ? 1.25 : 1 },
      ],
    };
  });

  const criticalAuraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(auraGlowAnim.value, [0, 1], [0, isCritical ? 0.35 : 0.16], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.08], Extrapolation.CLAMP) }],
  }));

  // Formato numérico seguro para evitar saltos horizontales
  const gForceFormatted = liveData ? gForce.toFixed(2) : '0.00';
  const [intPart, decPart] = gForceFormatted.split('.');

  // Rutas base y decorativas pre-calculadas
  const trackPathD = useMemo(
    () => createArcPath(center, center, trackR, START_ANGLE, END_ANGLE),
    [center, trackR, START_ANGLE, END_ANGLE]
  );

  const innerTrackD = useMemo(
    () => createArcPath(center, center, innerBezelR, START_ANGLE - 4, END_ANGLE + 4),
    [center, innerBezelR, START_ANGLE, END_ANGLE]
  );

  // Muesca de Pico Máximo (Peak Pip)
  const peakPipPos = useMemo(() => {
    const angle = START_ANGLE + SWEEP_ANGLE * peakProgress;
    return polarToXY(center, center, trackR, angle);
  }, [center, trackR, START_ANGLE, SWEEP_ANGLE, peakProgress]);

  // Micro-cálculo de fuerzas vectoriales triaxiales en G (-2G a +2G normalizado)
  const gX = Number((accelX / 9.80665).toFixed(2));
  const gY = Number((accelY / 9.80665).toFixed(2));
  const gZ = Number((accelZ / 9.80665).toFixed(2));

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      {/* Aura ambiental reactiva a la severidad */}
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.ambientAura,
          {
            width: size * 0.94,
            height: size * 0.94,
            borderRadius: (size * 0.94) / 2,
            backgroundColor: isCritical ? 'rgba(239,68,68,0.22)' : `${sevColor}15`,
          },
          criticalAuraStyle,
        ]}
      />

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Fondo central táctico con viñeta carbón */}
          <RadialGradient id="cockpitCoreGrad" cx="50%" cy="46%" r="56%">
            <Stop offset="0%" stopColor="#141724" stopOpacity="0.98" />
            <Stop offset="55%" stopColor="#0B0D15" stopOpacity="0.99" />
            <Stop offset="100%" stopColor="#05060A" stopOpacity="1" />
          </RadialGradient>

          {/* Gradiente de trazo inactivo */}
          <SvgLinearGradient id="trackMutedGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </SvgLinearGradient>

          {/* Gradiente dinámico de arco de aceleración */}
          <SvgLinearGradient id="activeArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="30%" stopColor="#F59E0B" />
            <Stop offset="65%" stopColor="#FB923C" />
            <Stop offset="100%" stopColor={sevColor} />
          </SvgLinearGradient>

          {/* Bisel metálico exterior mecanizado */}
          <RadialGradient id="outerBezelGrad" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="60%" stopColor="rgba(20,24,36,0.9)" />
            <Stop offset="100%" stopColor="#07080D" />
          </RadialGradient>
        </Defs>

        {/* 1. Doble Bisel Exterior (Doppelrand) */}
        <Circle
          cx={center}
          cy={center}
          r={outerBezelR}
          fill="url(#outerBezelGrad)"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1.5}
        />

        {/* 2. Dial Central Táctico */}
        <Circle
          cx={center}
          cy={center}
          r={dialR}
          fill="url(#cockpitCoreGrad)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />

        {/* 3. Anillo de referencia interior fino */}
        <SvgPath
          d={innerTrackD}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
        />

        {/* 4. Marcas y Graduaciones Láser (Ticks de escala 270°) */}
        <G>
          {Array.from({ length: MINOR_DIVISIONS + 1 }).map((_, i) => {
            const fraction = i / MINOR_DIVISIONS;
            const gVal = fraction * maxG;
            const angle = START_ANGLE + SWEEP_ANGLE * fraction;
            const isMajor = i % 4 === 0; // Cada 2G
            const isSemiMajor = i % 2 === 0;

            const tickLen = isMajor ? 10 : isSemiMajor ? 6 : 4;
            const pOuter = polarToXY(center, center, scaleTickR, angle);
            const pInner = polarToXY(center, center, scaleTickR - tickLen, angle);

            const isPassed = liveData && gVal <= clampedG;
            const tickColor = isPassed
              ? sevColor
              : isMajor
              ? 'rgba(255,255,255,0.45)'
              : 'rgba(255,255,255,0.14)';

            const textPos = isMajor
              ? polarToXY(center, center, scaleTickR + 13, angle)
              : null;

            return (
              <G key={`tick-${i}`}>
                <Line
                  x1={pInner.x}
                  y1={pInner.y}
                  x2={pOuter.x}
                  y2={pOuter.y}
                  stroke={tickColor}
                  strokeWidth={isMajor ? 1.8 : 1}
                  strokeLinecap="round"
                />
                {isMajor && textPos && (
                  <SvgText
                    x={textPos.x}
                    y={textPos.y + 3.5}
                    textAnchor="middle"
                    fill={isPassed ? sevColor : 'rgba(255,255,255,0.45)'}
                    fontSize={size * 0.033}
                    fontFamily={FONT.mono}
                    fontWeight={isPassed ? '700' : '600'}
                  >
                    {gVal === 12 ? '12+' : gVal}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>

        {/* 5. Pista Base Inactiva del Arco (Track) */}
        <SvgPath
          d={trackPathD}
          stroke="url(#trackMutedGrad)"
          strokeWidth={trackStrokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* 6. Arco de Telemetría Dinámico Activo (Hardware Accelerated) */}
        <AnimatedPath
          d={trackPathD}
          stroke="url(#activeArcGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${arcLength + 40}`}
          animatedProps={animatedFillProps}
          opacity={liveData ? 1 : 0.25}
        />

        {/* 7. Muesca de Pico Máximo Físico Retenido (Peak Hold Pip) */}
        {showPeak && peakG !== undefined && peakG > 0 && liveData && (
          <G>
            {/* Pequeño diamante / aguja en la coordenada exacta de pico */}
            <Circle
              cx={peakPipPos.x}
              cy={peakPipPos.y}
              r={3.5}
              fill="#FFFFFF"
              stroke={severityColor(peakVal)}
              strokeWidth={1.5}
            />
          </G>
        )}
      </Svg>

      {/* 8. Punta Luminosa Líder (Glow Bead soldada a la cabeza del arco) */}
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.glowBead,
          {
            width: strokeWidth * 1.5,
            height: strokeWidth * 1.5,
            borderRadius: (strokeWidth * 1.5) / 2,
            backgroundColor: '#FFFFFF',
            borderColor: sevColor,
          },
          tipAnimatedStyle,
        ]}
      />

      {/* 9. Clúster Central del Cockpit (Tipografía Monospaced y Balance) */}
      <View style={[styles.centerDial, { width: dialR * 2, height: dialR * 2 }]} pointerEvents="box-none">
        {/* Encabezado microscópico */}
        <View style={styles.coreHeaderRow}>
          <Ionicons
            name={isCritical ? 'warning' : 'speedometer-outline'}
            size={11}
            color={liveData ? sevColor : COLORS.textDim}
          />
          <Text style={styles.coreEyebrow}>G-FORCE TELEMETRY</Text>
        </View>

        {/* Gran Display Numérico con Tabular Nums para eliminar jitter */}
        <View style={styles.gDigitsContainer}>
          <Text
            style={[
              styles.gIntegerText,
              {
                fontSize: size * 0.17,
                color: liveData ? COLORS.text : COLORS.textDim,
              },
            ]}
          >
            {intPart}
          </Text>
          <Text
            style={[
              styles.gDecimalText,
              {
                fontSize: size * 0.11,
                color: liveData ? sevColor : COLORS.textDim,
              },
            ]}
          >
            .{decPart}
          </Text>
          <Text
            style={[
              styles.gUnitBadge,
              {
                fontSize: size * 0.05,
                color: liveData ? sevColor : COLORS.textDim,
              },
            ]}
          >
            G
          </Text>
        </View>

        {/* Micro-Balance Triaxial en Vivo (Lateral X, Frontal Y, Vertical Z) */}
        {liveData && (
          <View style={styles.triaxialCluster}>
            <View style={styles.axisItem}>
              <Text style={styles.axisLabel}>X</Text>
              <View style={styles.axisBarTrack}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${Math.min(100, Math.abs(gX) * 50)}%`,
                      backgroundColor: Math.abs(gX) > 1.2 ? '#FB923C' : '#38BDF8',
                      alignSelf: gX < 0 ? 'flex-end' : 'flex-start',
                    },
                  ]}
                />
              </View>
              <Text style={styles.axisValue}>{Math.abs(gX).toFixed(1)}</Text>
            </View>

            <View style={styles.axisItem}>
              <Text style={styles.axisLabel}>Y</Text>
              <View style={styles.axisBarTrack}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${Math.min(100, Math.abs(gY) * 50)}%`,
                      backgroundColor: Math.abs(gY) > 1.5 ? RED : '#38BDF8',
                      alignSelf: gY < 0 ? 'flex-end' : 'flex-start',
                    },
                  ]}
                />
              </View>
              <Text style={styles.axisValue}>{Math.abs(gY).toFixed(1)}</Text>
            </View>

            <View style={styles.axisItem}>
              <Text style={styles.axisLabel}>Z</Text>
              <View style={styles.axisBarTrack}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${Math.min(100, Math.abs(gZ) * 40)}%`,
                      backgroundColor: Math.abs(gZ) > 2.0 ? RED : '#38BDF8',
                    },
                  ]}
                />
              </View>
              <Text style={styles.axisValue}>{Math.abs(gZ).toFixed(1)}</Text>
            </View>
          </View>
        )}

        {/* Píldora de Severidad con LED Luminoso */}
        <View
          style={[
            styles.statusPill,
            {
              borderColor: `${sevColor}45`,
              backgroundColor: `${sevColor}14`,
            },
          ]}
        >
          <View
            style={[
              styles.statusLed,
              {
                backgroundColor: liveData ? sevColor : COLORS.textDim,
                shadowColor: sevColor,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: liveData ? sevColor : COLORS.textDim,
              },
            ]}
          >
            {liveData ? (severity || sevLabel).toUpperCase() : (t ? t('common.noData') : 'SIN DATOS')}
          </Text>
        </View>

        {/* Indicador de Pico Máximo con botón táctil de reinicio */}
        {showPeak && peakG !== undefined && peakG > 0 && liveData && (
          <TouchableOpacity
            style={styles.peakInteractiveRow}
            onPress={onResetPeak}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
          >
            <Ionicons name="flash" size={10} color={severityColor(peakVal)} />
            <Text style={styles.peakHoldText}>
              PICO MÁX: <Text style={{ color: severityColor(peakVal), fontWeight: '800' }}>{peakVal.toFixed(2)} G</Text>
            </Text>
            {onResetPeak && (
              <Ionicons name="refresh" size={10} color="rgba(255,255,255,0.4)" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(GForceRingComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ambientAura: {
    position: 'absolute',
    ...SHADOWS.glow(RED, 0.25, 24),
  },
  glowBead: {
    position: 'absolute',
    borderWidth: 2,
    ...SHADOWS.glow('#FFFFFF', 0.8, 10),
  },
  centerDial: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  coreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  coreEyebrow: {
    fontFamily: FONT.heading,
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.4,
  },
  gDigitsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: -2,
  },
  gIntegerText: {
    fontFamily: FONT.mono,
    fontWeight: '900',
    letterSpacing: -1,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  gDecimalText: {
    fontFamily: FONT.mono,
    fontWeight: '800',
    includeFontPadding: false,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  gUnitBadge: {
    fontFamily: FONT.heading,
    fontWeight: '900',
    includeFontPadding: false,
    marginLeft: 3,
    marginTop: 6,
  },
  triaxialCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  axisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  axisLabel: {
    fontFamily: FONT.mono,
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
  },
  axisBarTrack: {
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  axisBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  axisValue: {
    fontFamily: FONT.mono,
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginTop: 2,
  },
  statusLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontFamily: FONT.heading,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  peakInteractiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  peakHoldText: {
    fontFamily: FONT.mono,
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
});
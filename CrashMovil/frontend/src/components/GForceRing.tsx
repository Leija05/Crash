import React from 'react';
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
  useAnimatedReaction,
  useAnimatedProps,
  withSpring,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  createAnimatedComponent,
} from 'react-native-reanimated';
import AnimatedNumber from './AnimatedNumber';
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

interface GForceRingProps {
  gForce: number;
  liveData: boolean;
  severity?: string;
  t?: (key: string) => string;
  size?: number;
  maxG?: number;
  showPeak?: boolean;
  peakG?: number;
  onPress?: () => void;
}

const TICK_COUNT = 24;
const MAJOR_TICK_EVERY = 3;
const MAX_G_DISPLAY = 12;

function GForceRingComponent({
  gForce,
  liveData,
  severity,
  t,
  size = 260,
  maxG = MAX_G_DISPLAY,
  showPeak = true,
  peakG,
  onPress,
}: GForceRingProps) {
  const clampedG = Math.max(0, Math.min(gForce, maxG * 1.2));
  const progress = clampedG / maxG;
  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);
  const isCritical = liveData && gForce >= 15;
  const isHigh = liveData && gForce >= 10;

  const fillProgress = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const peakAnim = useSharedValue(0);
  const ringRotation = useSharedValue(0);

  React.useEffect(() => {
    fillProgress.value = withSpring(progress, { stiffness: 220, damping: 24, mass: 0.85 });
  }, [progress, fillProgress]);

  React.useEffect(() => {
    if (isCritical) {
      pulseAnim.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      glowAnim.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
      ringRotation.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else if (isHigh) {
      pulseAnim.value = withTiming(0, { duration: 300 });
      glowAnim.value = withRepeat(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
      ringRotation.value = 0;
    } else {
      pulseAnim.value = withTiming(0, { duration: 300 });
      glowAnim.value = withTiming(0, { duration: 300 });
      ringRotation.value = 0;
    }
  }, [isCritical, isHigh, pulseAnim, glowAnim, ringRotation]);

  React.useEffect(() => {
    if (peakG !== undefined && peakG > 0) {
      peakAnim.value = withSequence(
        withSpring(1, { stiffness: 300, damping: 20 }),
        withDelay(2000, withSpring(0, { stiffness: 120, damping: 25 }))
      );
    }
  }, [peakG, peakAnim]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0, 0.4], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.12], Extrapolation.CLAMP) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0, isCritical ? 0.5 : 0.25], Extrapolation.CLAMP),
  }));

  const peakBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(peakAnim.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(peakAnim.value, [0, 1], [0.85, 1], Extrapolation.CLAMP) }],
  }));

  const peakIndicatorProps = useAnimatedProps(() => ({
    strokeOpacity: interpolate(peakAnim.value, [0, 1], [0, liveData ? 0.8 : 0.3], Extrapolation.CLAMP),
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value * 360}deg` }],
  }));

  const center = size / 2;
  const outerRadius = size * 0.44;
  const trackRadius = outerRadius - 8;
  const fillRadius = trackRadius - 6;
  const innerRadius = fillRadius - 18;
  const centerRadius = innerRadius - 4;
  const strokeWidth = 6;
  const trackStrokeWidth = 4;

  const circumference = 2 * Math.PI * fillRadius;
  const startAngle = -135;
  const endAngle = 135;
  const sweepAngle = endAngle - startAngle;

  const animatedFillProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fillProgress.value),
  }));

  const tipAnimatedStyle = useAnimatedStyle(() => {
    const angle = startAngle + sweepAngle * fillProgress.value;
    const rad = (angle * Math.PI) / 180;
    const x = center + fillRadius * Math.cos(rad);
    const y = center + fillRadius * Math.sin(rad);
    const tipSize = strokeWidth * 1.3;
    return {
      opacity: liveData && fillProgress.value > 0.02 ? 1 : 0,
      transform: [
        { translateX: x - tipSize / 2 },
        { translateY: y - tipSize / 2 },
      ],
    };
  });

  const tickLength = 10;
  const majorTickLength = 16;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={!onPress}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Glow crítico externo con rotación y pulso */}
      {isCritical && (
        <Animated.View pointerEvents="none" style={[
          styles.outerGlow,
          { width: size * 0.98, height: size * 0.98, borderRadius: size * 0.49 },
          pulseStyle,
          rotationStyle,
        ]} />
      )}

      {/* Glow sutil de datos activos */}
      {(liveData && gForce > 0) && (
        <Animated.View pointerEvents="none" style={[
          styles.outerGlow,
          { width: size * 0.92, height: size * 0.92, borderRadius: size * 0.46 },
          glowStyle,
        ]} />
      )}

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(20,18,14,0.95)" />
            <Stop offset="70%" stopColor="rgba(10,10,9,0.98)" />
            <Stop offset="100%" stopColor="rgba(5,5,5,1)" />
          </RadialGradient>

          <SvgLinearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <Stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </SvgLinearGradient>

          <SvgLinearGradient id="fillGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={sevColor} />
            <Stop offset="100%" stopColor={sevColor === COLORS.sevRed ? '#FF3B30' : sevColor === COLORS.sevOrange ? '#FB923C' : sevColor === COLORS.sevYellow ? '#F59E0B' : '#10B981'} />
          </SvgLinearGradient>

          <RadialGradient id="centerGrad" cx="50%" cy="45%" r="55%">
            <Stop offset="0%" stopColor="rgba(239,68,68,0.12)" />
            <Stop offset="40%" stopColor="rgba(239,68,68,0.04)" />
            <Stop offset="100%" stopColor="rgba(10,10,9,0.95)" />
          </RadialGradient>

          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={`${sevColor}66`} />
            <Stop offset="70%" stopColor={`${sevColor}11`} />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </RadialGradient>

          <SvgLinearGradient id="peakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </SvgLinearGradient>
        </Defs>

        {/* Fondo base */}
        <Circle cx={center} cy={center} r={outerRadius + 4} fill="url(#bgGrad)" />

        {/* Anillo de referencia exterior (ticks mayores) */}
        <G rotation={startAngle} origin={`${center},${center}`}>
          {Array.from({ length: TICK_COUNT + 1 }).map((_, i) => {
            const isMajor = i % MAJOR_TICK_EVERY === 0;
            const angle = (sweepAngle / TICK_COUNT) * i;
            const rad = (angle * Math.PI) / 180;
            const r1 = outerRadius - (isMajor ? 0 : 2);
            const r2 = outerRadius - (isMajor ? majorTickLength : tickLength);
            const x1 = center + r1 * Math.cos(rad);
            const y1 = center + r1 * Math.sin(rad);
            const x2 = center + r2 * Math.cos(rad);
            const y2 = center + r2 * Math.sin(rad);
            const labelValue = (maxG / TICK_COUNT) * i;
            const labelRadius = outerRadius - 26;
            const lx = center + labelRadius * Math.cos(rad);
            const ly = center + labelRadius * Math.sin(rad);

            return (
              <G key={`tick-${i}`}>
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                />
                {isMajor && (
                  <SvgText
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize={9}
                    fontFamily={FONT.mono}
                    fontWeight="500"
                  >
                    {labelValue.toFixed(labelValue >= 10 ? 0 : 1)}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>

        {/* Track base inactivo */}
        <SvgPath
          d={`M ${center} ${center} m 0 ${-fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${2 * fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${-2 * fillRadius}`}
          stroke="url(#trackGrad)"
          strokeWidth={trackStrokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={liveData ? 1 : 0.35}
        />

        {/* Track segmentado para progreso visual */}
        <SvgPath
          d={`M ${center} ${center} m 0 ${-fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${2 * fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${-2 * fillRadius}`}
          stroke="url(#trackGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${(circumference / TICK_COUNT) * 0.7} ${(circumference / TICK_COUNT) * 0.3}`}
          fill="none"
          strokeLinecap="round"
          rotation={-90}
          origin={`${center},${center}`}
          opacity={liveData ? 0.6 : 0.2}
        />

        {/* Fill progresivo con gradiente de severidad (Worklet en UI thread) */}
        <AnimatedPath
          d={`M ${center} ${center} m 0 ${-fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${2 * fillRadius} a ${fillRadius} ${fillRadius} 0 1 0 0 ${-2 * fillRadius}`}
          stroke="url(#fillGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedFillProps}
          fill="none"
          strokeLinecap="round"
          rotation={-90}
          origin={`${center},${center}`}
          opacity={liveData ? 1 : 0.3}
        />

        {/* Indicador de pico (hold) */}
        {showPeak && peakG !== undefined && peakG > 0 && (
          <AnimatedPath
            d={`M ${center} ${center} m 0 ${-fillRadius} a ${fillRadius} ${fillRadius} 0 0 1 ${fillRadius * Math.sin((Math.min(peakG, maxG * 1.2) / maxG) * sweepAngle * Math.PI / 180) * 2} ${-fillRadius * (1 - Math.cos((Math.min(peakG, maxG * 1.2) / maxG) * sweepAngle * Math.PI / 180)) * 2}`}
            stroke={sevColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="4 4"
            animatedProps={peakIndicatorProps}
          />
        )}

        {/* Anillo interior decorativo */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="rgba(239,68,68,0.15)"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Círculo central con gradiente */}
        <Circle cx={center} cy={center} r={centerRadius} fill="url(#centerGrad)" stroke="rgba(239,68,68,0.18)" strokeWidth={1} />
      </Svg>

      {/* Badge de pico en el anillo interior */}
      {showPeak && peakG !== undefined && peakG > 0 && liveData && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.peakBadge,
            { top: center - centerRadius + 8, left: center - 50 },
            peakBadgeStyle,
          ]}
        >
          <Text style={styles.peakLabel}>{t ? t('dashboard.peak') : 'PEAK'}</Text>
          <Text style={[styles.peakValue, { color: severityColor(peakG) }]}>
            {peakG.toFixed(2)} G
          </Text>
        </Animated.View>
      )}

      {/* Punta luminosa fluida (renderizada fuera de SVG con estilo animado en UI thread) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tip,
          { width: strokeWidth * 1.3, height: strokeWidth * 1.3, backgroundColor: sevColor },
          tipAnimatedStyle,
        ]}
      />

      {/* Centro - contenido tipográfico táctico */}
      <View style={styles.center} pointerEvents="none">
        <View style={styles.gValueRow}>
          <Text
            style={[
              styles.gValue,
              { color: liveData ? COLORS.text : COLORS.textDim, fontSize: size * 0.19 },
            ]}
          >
            {liveData ? gForce.toFixed(2) : '0.00'}
          </Text>
          <Text style={[styles.gUnitInline, { color: sevColor, fontSize: size * 0.052 }]}>
            G
          </Text>
        </View>

        <Text style={[styles.gTelemetryLabel, { fontSize: size * 0.038 }]}>
          FUERZA G RESULTANTE
        </Text>

        <View style={[styles.severityPill, { borderColor: `${sevColor}40`, backgroundColor: `${sevColor}12` }]}>
          <View
            style={[
              styles.severityDot,
              { backgroundColor: liveData ? sevColor : COLORS.textDim },
            ]}
          />
          <Text style={[styles.severityText, { color: liveData ? sevColor : COLORS.textDim }]}>
            {liveData ? (severity || sevLabel).toUpperCase() : t ? t('common.noData') : 'SIN DATOS'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(GForceRingComponent);

const styles = StyleSheet.create({
  svg: { position: 'absolute', top: 0, left: 0 },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,59,48,0.18)',
    alignSelf: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 3,
  },
  gValue: {
    fontFamily: FONT.mono,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: undefined,
  },
  gUnitInline: {
    fontFamily: FONT.heading,
    fontWeight: '800',
    includeFontPadding: false,
    marginTop: 4,
  },
  gTelemetryLabel: {
    fontFamily: FONT.heading,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 1.8,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: {
    fontFamily: FONT.heading,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontSize: 10,
  },
  peakBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...SHADOWS.xs,
  },
  peakLabel: {
    color: COLORS.textDim,
    fontSize: 8,
    fontFamily: FONT.body,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  peakValue: {
    fontFamily: FONT.mono,
    fontWeight: '700',
    fontSize: 12,
  },
  tip: {
    position: 'absolute',
    borderRadius: 999,
    ...SHADOWS.glow(RED, 0.6, 12),
  },
});
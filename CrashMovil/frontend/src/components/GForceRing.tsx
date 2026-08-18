import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import Animated, { FadeIn, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import AnimatedNumber from './AnimatedNumber';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, severityColor, severityLabel, SEVERITY_COLORS, IMPACT_SEGMENTS, MAX_G_RING, ANIMATION, EASING, SHADOWS, RED, RED_GRADIENT, RED_GRADIENT_DIAGONAL } from '../theme';

interface GForceRingProps {
  gForce: number;
  liveData: boolean;
  severity?: string;
  t?: (key: string) => string;
  size?: number;
  maxG?: number;
  segments?: number;
  showPeak?: boolean;
  peakG?: number;
  onPress?: () => void;
}

const SEGMENT_GAP_RATIO = 0.82;

export default function GForceRing({
  gForce,
  liveData,
  severity,
  t,
  size = 280,
  maxG = MAX_G_RING,
  segments = IMPACT_SEGMENTS,
  showPeak = true,
  peakG,
  onPress,
}: GForceRingProps) {
  const progress = Math.max(0, Math.min(gForce / maxG, 1));
  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);

  const fillAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  const breathing = useSharedValue(0);
  const [filled, setFilled] = useState(0);

  const isCritical = liveData && gForce >= 15;

  /* Relleno con spring (el anillo "respira" hacia el valor real) */
  useEffect(() => {
    fillAnim.value = withSpring(progress, { stiffness: 130, damping: 18, mass: 0.8 });
  }, [progress, fillAnim]);

  useAnimatedReaction(
    () => fillAnim.value,
    (v, prev) => {
      if (v !== prev) runOnJS(setFilled)(Math.round(v * segments));
    }
  );

  /* Pulso crítico */
  useEffect(() => {
    if (isCritical) {
      pulseAnim.value = withRepeat(withTiming(1, { duration: 700, easing: EASING.enter }), -1, false);
    } else {
      pulseAnim.value = 0;
    }
  }, [isCritical, pulseAnim]);

  /* Respiración sutil en vivo */
  useEffect(() => {
    if (liveData) {
      breathing.value = withRepeat(withTiming(1, { duration: 2400, easing: EASING.premium }), -1, true);
    } else {
      breathing.value = 0;
    }
  }, [liveData, breathing]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(breathing.value, [0, 1], [1, 1.012], Extrapolation.CLAMP),
      },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0.4, 0]),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.22], Extrapolation.CLAMP) }],
  }));

  const center = size / 2;
  const radius = size * 0.44;
  const segWidth = 3.2;
  const circumference = 2 * Math.PI * radius;
  const arc = (circumference / segments) * SEGMENT_GAP_RATIO;
  const gap = circumference / segments - arc;
  const anglePerSeg = 360 / segments;

  /* Posición del tip luminoso al final del relleno */
  const tipAngle = (filled / segments) * 360 - 90;
  const tipR = radius;
  const tipX = center + tipR * Math.cos((tipAngle * Math.PI) / 180);
  const tipY = center + tipR * Math.sin((tipAngle * Math.PI) / 180);
  const tipVisible = liveData && filled > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}
    >
      <Animated.View style={[styles.wrap, breathingStyle]}>
        {/* Halo crítico */}
        {isCritical && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.criticalHalo,
              { width: size * 0.94, height: size * 0.94, borderRadius: size * 0.47 },
              pulseStyle,
            ]}
          />
        )}

        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <SvgLinearGradient id="redEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={RED_GRADIENT[1]} />
              <Stop offset="50%" stopColor={RED_GRADIENT[3]} />
              <Stop offset="100%" stopColor={RED_GRADIENT[5]} />
            </SvgLinearGradient>
            <RadialGradient id="innerGlow" cx="50%" cy="42%" r="60%">
              <Stop offset="0%" stopColor={liveData ? `${sevColor}26` : 'rgba(255,255,255,0.02)'} />
              <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </RadialGradient>
          </Defs>

          {/* Track inactivo */}
          {Array.from({ length: segments }).map((_, i) => (
            <Circle
              key={`t-${i}`}
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.055)"
              strokeWidth={segWidth}
              strokeDasharray={`${arc} ${gap}`}
              rotation={anglePerSeg * i - 90}
              origin={`${center}, ${center}`}
              strokeLinecap="round"
              fill="none"
            />
          ))}

          {/* Segmentos activos con color de severidad por cuadrante */}
          {Array.from({ length: filled }).map((_, i) => {
            const quad = i / segments;
            const color =
              quad < 0.25 ? SEVERITY_COLORS[0] : quad < 0.5 ? SEVERITY_COLORS[1] : quad < 0.75 ? SEVERITY_COLORS[2] : SEVERITY_COLORS[3];
            return (
              <Circle
                key={`a-${i}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={segWidth}
                strokeDasharray={`${arc} ${gap}`}
                rotation={anglePerSeg * i - 90}
                origin={`${center}, ${center}`}
                strokeLinecap="round"
                fill="none"
                opacity={liveData ? 1 : 0.25}
              />
            );
          })}

          {/* Tip luminoso al final del relleno */}
          {tipVisible && (
            <SvgCircle cx={tipX} cy={tipY} r={segWidth * 0.95} fill={sevColor} />
          )}

          {/* Círculo central con borde gradiente oro */}
          <Circle
            cx={center}
            cy={center}
            r={radius * 0.72}
            stroke="url(#redEdge)"
            strokeWidth={1.2}
            fill="none"
            opacity={0.9}
          />
          <Circle cx={center} cy={center} r={radius * 0.72} fill="url(#innerGlow)" />
        </Svg>

        {/* Centro */}
        <View style={styles.center} pointerEvents="none">
          <AnimatedNumber
            value={liveData ? gForce : 0}
            decimals={2}
            style={[
              styles.gValue,
              { color: liveData ? COLORS.text : COLORS.textDim, fontSize: size * 0.155, lineHeight: size * 0.17 },
            ]}
          />
          <Text style={[styles.gTitle, { fontSize: size * 0.034 }]}>
            {t ? t('dashboard.gForceValue') : 'G-FORCE'}
          </Text>
          <View style={styles.gSubRow}>
            <View
              style={[
                styles.gBullet,
                { backgroundColor: liveData ? sevColor : COLORS.textDim, width: size * 0.02, height: size * 0.02 },
              ]}
            />
            <Text style={[styles.gSubText, { color: liveData ? sevColor : COLORS.textDim, fontSize: size * 0.042 }]}>
              {liveData ? `${gForce.toFixed(2)}G` : '--'}
            </Text>
          </View>
          <Text style={[styles.severityText, { color: liveData ? sevColor : COLORS.textDim, fontSize: size * 0.03 }]}>
            {liveData ? (severity || sevLabel) : t ? t('common.noData') : 'Sin datos'}
          </Text>
          {showPeak && peakG !== undefined && peakG > 0 && (
            <View style={styles.peakRow}>
              <Text style={styles.peakLabel}>{t ? t('dashboard.peak') : 'PICO'}</Text>
              <Text style={[styles.peakValue, { color: severityColor(peakG), fontSize: size * 0.042 }]}>
                {peakG.toFixed(2)} G
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.ms2, { fontSize: size * 0.028 }]}>
          {t ? t('dashboard.mPerSecond') : 'm/s²'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  criticalHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(255,77,77,0.28)',
  },
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -78 }, { translateY: -70 }],
    width: 156,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gValue: {
    fontFamily: FONT.mono,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  gTitle: {
    color: COLORS.textSec,
    fontFamily: FONT.body,
    letterSpacing: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
  },
  gSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  gBullet: {
    borderRadius: 999,
  },
  gSubText: {
    fontFamily: FONT.heading,
    fontWeight: '600',
  },
  severityText: {
    marginTop: 4,
    fontFamily: FONT.heading,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  peakRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  peakLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontFamily: FONT.body,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  peakValue: {
    fontFamily: FONT.mono,
    fontWeight: '700',
  },
  ms2: {
    color: COLORS.textDim,
    marginTop: 10,
    fontFamily: FONT.body,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

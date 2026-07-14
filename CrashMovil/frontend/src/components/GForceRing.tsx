import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, interpolateColor, useDerivedValue } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, severityColor, severityLabel, IMPACT_SEGMENTS, MAX_G_RING, ANIMATION } from '../theme';

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
  const progress = useMemo(() => Math.max(0, Math.min(gForce / maxG, 1)), [gForce, maxG]);
  const filled = Math.round(progress * segments);
  const sevColor = severityColor(gForce);
  const sevLabel = severityLabel(gForce, t);

  const pulseAnim = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const centerScale = useSharedValue(1);

  const isCritical = liveData && gForce >= 15;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.3]) }],
  }));

  React.useEffect(() => {
    if (isCritical) {
      pulseAnim.value = withTiming(1, { duration: 600 }, () => {
        pulseAnim.value = withTiming(0, { duration: 600 });
      });
      const interval = setInterval(() => {
        if (isCritical) {
          pulseAnim.value = withTiming(1, { duration: 600 }, () => {
            pulseAnim.value = withTiming(0, { duration: 600 });
          });
        }
      }, 1200);
      return () => clearInterval(interval);
    }
    pulseAnim.value = 0;
  }, [isCritical]);

  React.useEffect(() => {
    if (liveData && gForce > 0) {
      ringScale.value = withSpring(1.015, ANIMATION.springGentle);
      centerScale.value = withSpring(1.015, ANIMATION.springGentle);
      setTimeout(() => {
        ringScale.value = withSpring(1, ANIMATION.springGentle);
        centerScale.value = withSpring(1, ANIMATION.springGentle);
      }, 150);
    }
  }, [gForce, liveData]);

  const segmentAngle = 360 / segments;
  const outerRadius = size * 0.48;
  const center = size / 2;
  const segmentWidth = 3;
  const segmentHeight = outerRadius;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}
    >
      <Animated.View
        style={[styles.container, animatedStyle, { width: size, height: size }]}
        pointerEvents="none"
      >
      <View style={styles.ringTrack} pointerEvents="none">
        {Array.from({ length: segments }).map((_, i) => {
          const active = liveData && i < filled;
          const angle = segmentAngle * i - 90;
          const segmentColor = active
            ? (i / segments < 0.25 ? COLORS.sevGreen :
               i / segments < 0.5 ? COLORS.sevYellow :
               i / segments < 0.75 ? COLORS.sevOrange : COLORS.sevRed)
            : 'rgba(148,163,184,0.08)';

          return (
            <Animated.View
              key={`seg-${i}`}
              entering={FadeIn.duration(150).delay(i * 3).springify().damping(25).stiffness(200)}
              style={[
                styles.segmentLayer,
                { width: size, height: size, transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <View
                style={[
                  styles.segmentBar,
                  {
                    width: segmentWidth,
                    height: segmentHeight,
                    top: center - segmentHeight,
                    left: center - segmentWidth / 2,
                    backgroundColor: segmentColor,
                    opacity: active ? 1 : 0.4,
                  },
                ]}
              />
            </Animated.View>
          );
        })}
        <Animated.View style={[styles.criticalPulse, pulseStyle]} pointerEvents="none" />
        <Animated.View style={[styles.ringInner, centerAnimatedStyle]}>
          <View style={styles.innerContent}>
            <Animated.Text
              entering={FadeIn.duration(400).springify().damping(25).stiffness(200)}
              style={[
                styles.gValue,
                { color: liveData ? COLORS.text : COLORS.textDim, fontSize: size * 0.18, lineHeight: size * 0.2 },
              ]}
            >
              {liveData ? gForce.toFixed(2) : '0.00'}
            </Animated.Text>
            <Text style={[styles.gTitle, { fontSize: size * 0.035 }]}>{t ? t('dashboard.gForceValue') : 'G-FORCE'}</Text>
            <View style={styles.gSubRow}>
              <Animated.View
                style={[
                  styles.gBullet,
                  { backgroundColor: liveData ? sevColor : COLORS.textDim, width: size * 0.02, height: size * 0.02 },
                ]}
              />
              <Animated.Text style={[styles.gSubText, { color: liveData ? sevColor : COLORS.textDim, fontSize: size * 0.045 }]}>
                {liveData ? `${gForce.toFixed(2)}G` : '--'}
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.severityText, { color: liveData ? sevColor : COLORS.textDim, fontSize: size * 0.03 }]}>
              {liveData ? (severity || sevLabel) : (t ? t('common.noData') : 'Sin datos')}
            </Animated.Text>
            {showPeak && peakG !== undefined && peakG > 0 && (
              <View style={styles.peakRow}>
                <Text style={styles.peakLabel}>{t ? t('dashboard.peak') : 'PICO'}</Text>
                <Text style={[styles.peakValue, { color: severityColor(peakG), fontSize: size * 0.045 }]}>
                  {peakG.toFixed(2)} G
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
      <Animated.Text
        entering={FadeIn.duration(400).delay(200).springify().damping(25).stiffness(200)}
        style={[styles.ms2, { fontSize: size * 0.03 }]}
      >
        {t ? t('dashboard.mPerSecond') : 'm/s²'}
      </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segmentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  segmentBar: {
    position: 'absolute',
    borderRadius: 999,
  },
  criticalPulse: {
    position: 'absolute',
    top: -60,
    left: -60,
    right: -60,
    bottom: -60,
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  ringInner: {
    width: '64%',
    height: '64%',
    borderRadius: '50%',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  innerContent: {
    alignItems: 'center',
    gap: 4,
  },
  gValue: {
    fontFamily: FONT.mono,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  gTitle: {
    color: COLORS.textSec,
    letterSpacing: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
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
    fontWeight: '600',
  },
  severityText: {
    marginTop: 4,
    letterSpacing: 1.5,
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
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  peakLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  peakValue: {
    fontWeight: '900',
    fontFamily: FONT.mono,
  },
  ms2: {
    color: COLORS.textDim,
    marginTop: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
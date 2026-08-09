import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GOLD, GOLD_SOFT, GOLD_HAIRLINE } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'accent' | 'danger' | 'premium';
  padding?: number;
  delay?: number;
  /** Bezel doble: shell exterior + core interior (patrón premium) */
  bezel?: boolean;
  /** Blur real detrás del glass (solo si es necesario, consume GPU) */
  blur?: boolean;
  /** Borde superior con gradiente dorado metálico */
  goldEdge?: boolean;
}

const BEZEL_PAD = 1.5;

export default function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 16,
  delay = 0,
  bezel = true,
  blur = false,
  goldEdge = true,
}: GlassCardProps) {
  const variantStyles: Record<string, ViewStyle> = {
    default: { backgroundColor: COLORS.glassBg, borderColor: COLORS.glassBorder },
    elevated: { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.borderStrong, ...SHADOWS.lg },
    accent: { backgroundColor: GOLD_SOFT, borderColor: GOLD_HAIRLINE, ...SHADOWS.glow(GOLD, 0.28, 20) },
    danger: { backgroundColor: COLORS.dangerSoft, borderColor: 'rgba(255,77,77,0.30)', ...SHADOWS.redGlow(0.3) },
    premium: { backgroundColor: 'rgba(16,14,9,0.92)', borderColor: COLORS.glassBorderStrong, ...SHADOWS.md },
  };

  const inner = (
    <View
      style={[
        styles.inner,
        bezel && { borderRadius: RADIUS.lg - BEZEL_PAD },
        variantStyles[variant],
        { padding },
      ]}
    >
      {goldEdge && <View style={styles.topHighlight} pointerEvents="none" />}
      {children}
    </View>
  );

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(delay).springify().damping(26).stiffness(200)}
      style={[
        styles.shell,
        bezel && styles.shellBezel,
        !bezel && styles.shellFlat,
        style,
      ]}
    >
      {blur ? (
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: RADIUS.lg + 2,
    overflow: 'hidden',
  },
  shellBezel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: BEZEL_PAD,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  shellFlat: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inner: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    borderRadius: 1,
    backgroundColor: GOLD_HAIRLINE,
    opacity: 0.85,
  },
});

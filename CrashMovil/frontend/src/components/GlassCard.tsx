import { StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'accent' | 'danger';
  padding?: number;
  delay?: number;
}

export default function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 16,
  delay = 0,
}: GlassCardProps) {
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    elevated: {
      backgroundColor: COLORS.surfaceAlt,
      borderColor: COLORS.borderStrong,
      ...SHADOWS.lg,
    },
    accent: {
      backgroundColor: COLORS.accentSoft,
      borderColor: 'rgba(204,255,0,0.2)',
      ...SHADOWS.glow(COLORS.accent),
    },
    danger: {
      backgroundColor: COLORS.primarySoft,
      borderColor: 'rgba(255,59,48,0.25)',
      ...SHADOWS.glow(COLORS.primary),
    },
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(delay).springify().damping(20)}
      style={[
        styles.base,
        variantStyles[variant],
        { padding },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

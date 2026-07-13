import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GOLD, GOLD_SOFT, GOLD_HAIRLINE } from '../theme';

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
      backgroundColor: GOLD_SOFT,
      borderColor: GOLD_HAIRLINE,
      ...SHADOWS.glow(GOLD),
    },
    danger: {
      backgroundColor: 'rgba(255,59,48,0.08)',
      borderColor: 'rgba(255,59,48,0.25)',
      ...SHADOWS.glow('#FF3B30'),
    },
  };

  const hasHighlight = variant === 'accent' || variant === 'elevated' || variant === 'default';

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(delay).springify().damping(26).stiffness(200)}
      style={[
        styles.base,
        variantStyles[variant],
        { padding },
        style,
      ]}
    >
      {hasHighlight && <View style={styles.topHighlight} pointerEvents="none" />}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GOLD_HAIRLINE,
    opacity: 0.7,
  },
});

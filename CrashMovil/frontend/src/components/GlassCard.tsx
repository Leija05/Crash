import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'accent' | 'danger';
  padding?: number;
}

export default function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 16,
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
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

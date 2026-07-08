import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function GlassButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
  fullWidth = true,
}: GlassButtonProps) {
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: COLORS.primary,
      borderColor: 'transparent',
      ...SHADOWS.glow(COLORS.primary),
    },
    accent: {
      backgroundColor: COLORS.accent,
      borderColor: 'transparent',
      ...SHADOWS.glow(COLORS.accent),
    },
    ghost: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    danger: {
      backgroundColor: COLORS.primarySoft,
      borderColor: 'rgba(255,59,48,0.3)',
    },
  };

  const variantText: Record<string, TextStyle> = {
    primary: { color: '#fff' },
    accent: { color: '#000' },
    ghost: { color: COLORS.text },
    danger: { color: COLORS.primary },
  };

  const sizeStyles: Record<string, { py: number; fontSize: number; iconSize: number }> = {
    sm: { py: 8, fontSize: 11, iconSize: 14 },
    md: { py: 14, fontSize: 13, iconSize: 18 },
    lg: { py: 18, fontSize: 15, iconSize: 22 },
  };

  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles[variant],
        {
          paddingVertical: s.py,
          paddingHorizontal: s.py * 1.5,
          opacity: disabled ? 0.4 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'accent' ? '#000' : '#fff'}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={s.iconSize}
              color={(variantText[variant] as any).color || '#fff'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.text,
              variantText[variant],
              { fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

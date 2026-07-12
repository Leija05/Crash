import {
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GOLD } from '../theme';

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

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const scale = useSharedValue(1);

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: GOLD,
      borderColor: 'transparent',
      ...SHADOWS.glow(GOLD),
    },
    accent: {
      backgroundColor: GOLD,
      borderColor: 'transparent',
      ...SHADOWS.glow(GOLD),
    },
    ghost: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    danger: {
      backgroundColor: COLORS.primarySoft,
      borderColor: 'rgba(255,215,0,0.3)',
    },
  };

  const variantText: Record<string, TextStyle> = {
    primary: { color: '#000' },
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      style={animatedStyle}
    >
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        onPressIn={() => { scale.value = withSpring(0.96, { stiffness: 300, damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 300, damping: 15 }); }}
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
            color={variant === 'accent' ? '#000' : '#000'}
          />
        ) : (
          <>
            {icon && (
              <AnimatedIonicon
                name={icon}
                size={s.iconSize}
                color={(variantText[variant] as any).color || '#000'}
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
      </AnimatedTouchable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
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

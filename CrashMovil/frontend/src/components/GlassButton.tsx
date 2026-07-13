import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GOLD, GOLD_LIGHT, GOLD_DARK } from '../theme';
import { haptics } from '../utils/haptics';

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
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
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
  haptic = 'light',
}: GlassButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (haptic !== 'none') haptics[haptic]();
    onPress();
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: GOLD,
      borderColor: GOLD_LIGHT,
      borderWidth: 0.5,
      ...SHADOWS.glow(GOLD),
    },
    accent: {
      backgroundColor: GOLD,
      borderColor: GOLD_LIGHT,
      borderWidth: 0.5,
      ...SHADOWS.glow(GOLD),
    },
    ghost: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    danger: {
      backgroundColor: COLORS.primarySoft,
      borderColor: 'rgba(200,162,60,0.3)',
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
      entering={FadeIn.duration(400).springify().damping(26).stiffness(200)}
      style={animatedStyle}
    >
      <AnimatedTouchable
        onPress={handlePress}
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
        {(variant === 'primary' || variant === 'accent') && (
          <View style={styles.sheen} pointerEvents="none" />
        )}
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
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderTopLeftRadius: RADIUS.pill,
    borderTopRightRadius: RADIUS.pill,
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

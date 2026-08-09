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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GOLD, GOLD_GRADIENT, GOLD_GRADIENT_DIAGONAL, FONT } from '../theme';
import { haptics } from '../utils/haptics';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'outline';
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
  const shine = useSharedValue(-1);

  const handlePress = () => {
    if (haptic !== 'none') haptics[haptic]();
    onPress();
  };

  const isGold = variant === 'primary' || variant === 'accent';

  const variantStyles: Record<string, ViewStyle> = {
    primary: { ...SHADOWS.glow(GOLD, 0.4, 18) },
    accent: { ...SHADOWS.glow(GOLD, 0.4, 18) },
    outline: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderColor: 'rgba(255,255,255,0.14)',
    },
    ghost: {
      backgroundColor: COLORS.glassBg,
      borderColor: COLORS.glassBorder,
    },
    danger: {
      backgroundColor: COLORS.dangerSoft,
      borderColor: 'rgba(255,77,77,0.35)',
      ...SHADOWS.redGlow(0.3),
    },
  };

  const variantText: Record<string, TextStyle> = {
    primary: { color: '#241A05' },
    accent: { color: '#241A05' },
    ghost: { color: COLORS.text },
    outline: { color: COLORS.text },
    danger: { color: COLORS.danger },
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

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shine.value, [-1, 1], [-220, 320], Extrapolation.CLAMP) }, { rotate: '18deg' }],
    opacity: interpolate(shine.value, [-1, -0.4, 1], [0, 0.8, 0], Extrapolation.CLAMP),
  }));

  const fireShine = () => {
    shine.value = -1;
    shine.value = withTiming(1, { duration: 900 });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).springify().damping(26).stiffness(200)}
      style={animatedStyle}
    >
      <AnimatedTouchable
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        onPressIn={() => { scale.value = withSpring(0.955, { stiffness: 380, damping: 17 }); if (isGold) fireShine(); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 380, damping: 17 }); }}
        style={[
          styles.base,
          variantStyles[variant],
          {
            paddingVertical: s.py,
            paddingHorizontal: s.py * 1.6,
            opacity: disabled ? 0.4 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {isGold ? (
          <LinearGradient
            colors={[...GOLD_GRADIENT]}
            start={GOLD_GRADIENT_DIAGONAL.start}
            end={GOLD_GRADIENT_DIAGONAL.end}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {isGold && (
          <>
            <View style={styles.sheen} pointerEvents="none" />
            <Animated.View style={[styles.shineSweep, shineStyle]} pointerEvents="none" />
          </>
        )}
        {loading ? (
          <ActivityIndicator size="small" color={isGold ? '#241A05' : COLORS.text} />
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
    borderColor: 'rgba(244,224,168,0.45)',
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
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: RADIUS.pill,
    borderTopRightRadius: RADIUS.pill,
  },
  shineSweep: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 44,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: FONT.heading,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

import React from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, interpolate, Extrapolate } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, SHADOWS, ANIMATION, GOLD } from '../theme';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  label?: string;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: any;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | string;
}

const sizeConfig = {
  sm: { btnSize: 44, iconSize: 20, labelFontSize: 11 },
  md: { btnSize: 56, iconSize: 24, labelFontSize: 12 },
  lg: { btnSize: 68, iconSize: 28, labelFontSize: 13 },
};

const variantStyles = {
  primary: { bg: COLORS.primary, iconColor: '#000', labelBg: COLORS.primary, labelColor: '#000' },
  accent: { bg: COLORS.accent, iconColor: '#000', labelBg: COLORS.accent, labelColor: '#000' },
  danger: { bg: COLORS.danger, iconColor: '#FFF', labelBg: COLORS.danger, labelColor: '#FFF' },
  ghost: { bg: COLORS.glassBg, iconColor: COLORS.primary, labelBg: COLORS.glassBg, labelColor: COLORS.primary },
};

export function FloatingActionButton({
  icon,
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: FloatingActionButtonProps) {
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);
  const labelTranslateX = useSharedValue(8);

  const { btnSize, iconSize, labelFontSize } = sizeConfig[size];
  const vs = variantStyles[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateX: labelTranslateX.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.92, ANIMATION.spring);
  };

  const handlePressOut = () => {
    if (!disabled) scale.value = withSpring(1, ANIMATION.springBouncy);
  };

  const handlePress = () => {
    if (!disabled) onPress();
  };

  React.useEffect(() => {
    if (label) {
      labelOpacity.value = withTiming(1, { duration: 200 });
      labelTranslateX.value = withTiming(0, { duration: 200 });
    }
  }, [label]);

  return (
    <View style={[styles.container, { gap: SPACING.sm }, style]}>
      {label && (
        <Animated.View style={[styles.labelWrapper, labelAnimatedStyle]}>
          <Animated.View style={[styles.label, { backgroundColor: vs.labelBg }]}>
            <Text style={[styles.labelText, { color: vs.labelColor, fontSize: labelFontSize }]}>{label}</Text>
          </Animated.View>
        </Animated.View>
      )}
      <AnimatedTouchableOpacity
        style={[
          styles.fab,
          {
            width: btnSize,
            height: btnSize,
            backgroundColor: vs.bg,
            borderColor: variant === 'ghost' ? COLORS.glassBorder : 'transparent',
            borderWidth: variant === 'ghost' ? 1 : 0,
          },
          animatedStyle,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.85}
      >
        <AnimatedIonicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={iconSize} color={vs.iconColor} />
      </AnimatedTouchableOpacity>
    </View>
  );
}

interface SpeedDialAction {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger';
}

interface SpeedDialProps {
  mainIcon: string;
  mainAction?: () => void;
  actions: SpeedDialAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mainVariant?: 'primary' | 'danger';
}

export function SpeedDial({
  mainIcon,
  mainAction,
  actions,
  position = 'bottom-right',
  open = false,
  onOpenChange,
  mainVariant = 'primary',
}: SpeedDialProps) {
  const isOpen = useSharedValue(open ? 1 : 0);
  const mainScale = useSharedValue(1);
  const mainRotate = useSharedValue(0);

  const positions = {
    'bottom-right': { bottom: SPACING.xl, right: SPACING.lg },
    'bottom-left': { bottom: SPACING.xl, left: SPACING.lg },
    'top-right': { top: SPACING.xl, right: SPACING.lg },
    'top-left': { top: SPACING.xl, left: SPACING.lg },
  };

  const posStyle = positions[position];
  const isBottom = position.startsWith('bottom');
  const isRight = position.endsWith('right');

  React.useEffect(() => {
    isOpen.value = withTiming(open ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [open]);

  const mainBg = mainVariant === 'danger' ? COLORS.danger : COLORS.primary;
  const mainIconColor = mainVariant === 'danger' ? '#FFF' : '#000';

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: mainScale.value },
      { rotate: `${mainRotate.value}deg` },
    ],
  }));

  const handleMainPressIn = () => {
    mainScale.value = withSpring(0.9, ANIMATION.spring);
  };
  const handleMainPressOut = () => {
    mainScale.value = withSpring(1, ANIMATION.springBouncy);
  };

  const handleMainPress = () => {
    if (mainAction) {
      mainAction();
    }
    onOpenChange?.(!open);
  };

  const handleActionPress = (action: SpeedDialAction) => {
    action.onPress();
    onOpenChange?.(false);
  };

  return (
    <View style={[styles.speedDialContainer, posStyle]}>
      {actions.map((action, index) => (
        <Animated.View
          key={action.label}
          style={styles.actionWrapper}
          entering={FadeIn.duration(200).delay(index * 50).springify().damping(26).stiffness(200)}
        >
          <Animated.View
            style={[
              styles.actionBtn,
              {
                backgroundColor: action.variant === 'danger' ? COLORS.danger : COLORS.primary,
                opacity: isOpen.value,
                transform: [
                  {
                    translateY: interpolate(
                      isOpen.value,
                      [0, 1],
                      [isBottom ? -60 * (index + 1) : 60 * (index + 1), 0],
                      Extrapolate.CLAMP
                    ),
                  },
                  { scale: isOpen.value },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleActionPress(action)}
              activeOpacity={0.85}
              style={styles.actionBtnContent}
            >
              <Ionicons
                name={action.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={20}
                color={action.variant === 'danger' ? '#FFF' : '#000'}
              />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={[
              styles.actionLabel,
              {
                opacity: isOpen.value,
                transform: [
                  {
                    translateX: interpolate(
                      isOpen.value,
                      [0, 1],
                      [isRight ? 20 : -20, 0],
                      Extrapolate.CLAMP
                    ),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.actionLabelText}>{action.label}</Text>
          </Animated.View>
        </Animated.View>
      ))}
      <AnimatedTouchableOpacity
        style={[
          styles.mainFab,
          { backgroundColor: mainBg },
          mainAnimatedStyle,
        ]}
        onPress={handleMainPress}
        onPressIn={handleMainPressIn}
        onPressOut={handleMainPressOut}
        activeOpacity={0.85}
      >
        <AnimatedIonicons
          name={mainIcon as React.ComponentProps<typeof Ionicons>['name']}
          size={28}
          color={mainIconColor}
          style={{
            transform: [{ rotate: `${interpolate(mainRotate.value, [0, 1], [0, 45])}deg` }],
          }}
        />
      </AnimatedTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labelWrapper: {
    overflow: 'hidden',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    ...SHADOWS.md,
  },
  labelText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONT.body,
  },
  fab: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },
  speedDialContainer: {
    position: 'absolute',
    zIndex: 200,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  actionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  actionBtnContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  actionLabel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  actionLabelText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },
});
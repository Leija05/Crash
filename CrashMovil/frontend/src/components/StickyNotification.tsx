import React, { useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, SHADOWS, ANIMATION } from '../theme';
import Animated, { useSharedValue, withTiming, withDelay, withSequence, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';

export interface StickyNotificationProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
  icon?: string;
  onDismiss?: () => void;
  autoDismiss?: number;
  position?: 'top-right' | 'top-center' | 'top-left';
}

const ICONS: Record<string, string> = {
  info: 'information-circle',
  warning: 'alert-circle',
  success: 'checkmark-circle',
  danger: 'alert-circle-outline',
};

export function StickyNotification({
  message,
  type = 'info',
  icon,
  onDismiss,
  autoDismiss = 5000,
  position = 'top-right',
}: StickyNotificationProps) {
  const translateX = useSharedValue(80);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const progress = useSharedValue(1);

  const positionStyles = {
    'top-right': { right: SPACING.md, alignItems: 'flex-end' as const },
    'top-center': { left: SPACING.md, right: SPACING.md, alignItems: 'center' as const },
    'top-left': { left: SPACING.md, alignItems: 'flex-start' as const },
  };

  const typeColors = {
    info: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', text: COLORS.info, icon: COLORS.info },
    warning: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: COLORS.warning, icon: COLORS.warning },
    success: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: COLORS.success, icon: COLORS.success },
    danger: { bg: 'rgba(255,59,48,0.15)', border: 'rgba(255,59,48,0.3)', text: COLORS.danger, icon: COLORS.danger },
  };

  const colors = typeColors[type];
  const displayIcon = icon || ICONS[type];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: colors.text,
  }));

  const dismiss = () => {
    translateX.value = withTiming(position === 'top-right' ? 80 : position === 'top-left' ? -80 : 0, { duration: 300, easing: Easing.in(Easing.cubic) });
    translateY.value = withTiming(-100, { duration: 300, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });
    setTimeout(() => onDismiss?.(), 300);
  };

  React.useEffect(() => {
    translateX.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    scale.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) }));

    if (autoDismiss > 0) {
      progress.value = withTiming(0, { duration: autoDismiss, easing: Easing.linear });
      const timer = setTimeout(dismiss, autoDismiss + 200);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyles[position],
        { backgroundColor: colors.bg, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={displayIcon as React.ComponentProps<typeof Ionicons>['name']} size={18} color={colors.icon} style={styles.icon} />
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
      {onDismiss && (
        <Animated.View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </Animated.View>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={dismiss}
        style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: SPACING.xs, borderColor: colors.border }}
      >
        <Ionicons name="close" size={14} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function StickyNotificationStack() {
  return null;
}

export default StickyNotification;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: SPACING.md + 44,
    zIndex: 300,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 200,
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  icon: {
    marginRight: 2,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    fontFamily: FONT.body,
    flex: 1,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: SPACING.xs,
  },
});
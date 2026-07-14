import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, PanResponder, PanResponderGestureState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolateColor,
  Easing,
  FadeIn,
  useDerivedValue,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, SHADOWS, ANIMATION, GOLD } from '../theme';
import { haptics } from '../utils/haptics';

interface DarkSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  trackColor?: string;
  offTrackColor?: string;
  thumbColor?: string;
}

export function DarkSwitch({ 
  value, 
  onValueChange, 
  label, 
  description, 
  icon, 
  disabled = false, 
  size = 'md', 
  trackColor = GOLD,
  offTrackColor = '#2A2A34',
  thumbColor = GOLD,
}: DarkSwitchProps) {
  const thumbX = useSharedValue(value ? 1 : 0);
  const trackBg = useSharedValue(value ? trackColor : offTrackColor);
  const thumbBg = useSharedValue(thumbColor);
  const glowOpacity = useSharedValue(value ? 0.4 : 0);
  const labelClr = useSharedValue(value ? trackColor : COLORS.textSec);
  const pressScale = useSharedValue(1);

  const sizeConfig = {
    sm: { width: 44, height: 24, thumbSize: 18, padding: 3 },
    md: { width: 52, height: 28, thumbSize: 22, padding: 3 },
    lg: { width: 60, height: 32, thumbSize: 26, padding: 3 },
  }[size];

  const thumbTranslateX = useDerivedValue(() => 
    thumbX.value * (sizeConfig.width - sizeConfig.thumbSize - sizeConfig.padding * 2)
  );

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: trackBg.value,
  }));

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbTranslateX.value }],
    backgroundColor: thumbBg.value,
    shadowColor: value ? GOLD : '#000',
    shadowOpacity: glowOpacity.value,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: value ? 4 : 2,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: labelClr.value,
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    const newValue = !value;
    haptics.light();
    onValueChange(newValue);
    
    thumbX.value = withSpring(newValue ? 1 : 0, ANIMATION.springBouncy);
    trackBg.value = withTiming(newValue ? trackColor : offTrackColor, { duration: 200 });
    thumbBg.value = withTiming(thumbColor, { duration: 200 });
    glowOpacity.value = withTiming(newValue ? 0.4 : 0, { duration: 200 });
    labelClr.value = withTiming(newValue ? trackColor : COLORS.textSec, { duration: 200 });
    
    pressScale.value = withSpring(0.95, ANIMATION.spring, () => {
      pressScale.value = withSpring(1, ANIMATION.spring);
    });
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          {icon && <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={COLORS.textSec} style={styles.icon} />}
          <View style={styles.labelContent}>
            <Animated.Text style={[styles.label, animatedLabelStyle]}>{label}</Animated.Text>
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.trackContainer, sizeConfig.width === 52 && styles.trackMd]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={1}
      >
        <Animated.View style={[styles.pressWrapper, pressStyle]}>
          <Animated.View style={[styles.track, animatedTrackStyle, { width: sizeConfig.width, height: sizeConfig.height }]} />
          <Animated.View
            style={[
              styles.thumb,
              animatedThumbStyle,
              { width: sizeConfig.thumbSize, height: sizeConfig.thumbSize },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  valueLabel?: string;
  icon?: string;
  disabled?: boolean;
  trackColor?: string;
  showValue?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  valueLabel,
  icon,
  disabled = false,
  trackColor = GOLD,
  showValue = true,
}: SliderProps) {
  const progress = useSharedValue((value - min) / (max - min));
  const thumbX = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const trackWidth = useSharedValue(0);
  const activeTrackWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const clampedProgress = Math.max(0, Math.min(1, progress.value));
  const currentValue = min + clampedProgress * (max - min);
  const steppedValue = Math.round(currentValue / step) * step;
  const finalProgress = (steppedValue - min) / (max - min);

  useEffect(() => {
    progress.value = (value - min) / (max - min);
  }, [value, min, max]);

  const lastStepRef = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        isDragging.value = true;
        haptics.light();
        thumbScale.value = withSpring(1.3, ANIMATION.spring);
      },
      onPanResponderMove: (e: any, gestureState: PanResponderGestureState) => {
        if (disabled) return;
        const newX = Math.max(0, Math.min(gestureState.moveX, trackWidth.value));
        thumbX.value = newX;
        const newProgress = trackWidth.value > 0 ? newX / trackWidth.value : 0;
        const newValue = min + newProgress * (max - min);
        const steppedNewValue = Math.round(newValue / step) * step;
        if (steppedNewValue !== lastStepRef.current) {
          lastStepRef.current = steppedNewValue;
          haptics.selection();
        }
        onValueChange(steppedNewValue);
        progress.value = (steppedNewValue - min) / (max - min);
        activeTrackWidth.value = withTiming((steppedNewValue - min) / (max - min) * trackWidth.value, { duration: 50 });
      },
      onPanResponderRelease: () => {
        isDragging.value = false;
        thumbScale.value = withSpring(1, ANIMATION.spring);
        const finalValue = min + finalProgress * (max - min);
        onValueChange(finalValue);
      },
      onPanResponderTerminate: () => {
        isDragging.value = false;
        thumbScale.value = withSpring(1, ANIMATION.spring);
        const finalValue = min + finalProgress * (max - min);
        onValueChange(finalValue);
      },
    })
  ).current;

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - 12 },
      { scale: thumbScale.value },
    ],
  }));

  const animatedActiveTrackStyle = useAnimatedStyle(() => ({
    width: activeTrackWidth.value || finalProgress * trackWidth.value,
  }));

  return (
    <View style={styles.sliderContainer}>
      {label && (
        <View style={styles.sliderHeader}>
          {icon && <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={COLORS.textSec} style={styles.sliderIcon} />}
          <Text style={styles.sliderLabel}>{label}</Text>
          {showValue && (
            <Animated.Text style={[styles.sliderValue, { color: trackColor }]}>
              {valueLabel || `${steppedValue}${unit}`}
            </Animated.Text>
          )}
        </View>
      )}
      
      <View 
        style={styles.trackWrapper} 
        onLayout={(e) => { trackWidth.value = e.nativeEvent.layout.width - 24; }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackBg, { backgroundColor: '#2A2A34' }]} />
        <Animated.View style={[styles.activeTrack, animatedActiveTrackStyle, { backgroundColor: trackColor }]} />
        <View style={styles.tickContainer}>
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                { left: `${tick * 100}%` },
                i === 0 || i === 4 ? styles.tickEnd : {},
              ]}
            />
          ))}
        </View>
        <Animated.View
          style={[
            styles.sliderThumb,
            animatedThumbStyle,
            { backgroundColor: trackColor },
          ]}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  icon: { marginRight: 2 },
  labelContent: { flex: 1 },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    fontFamily: FONT.body,
  },
  description: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.body,
    marginTop: 2,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackMd: { width: 52 },
  pressWrapper: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  track: {
    borderRadius: RADIUS.pill,
    backgroundColor: '#2A2A34',
    ...SHADOWS.xs,
  },
  thumb: {
    position: 'absolute',
    borderRadius: RADIUS.pill,
    top: 3,
    left: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  sliderContainer: {
    gap: SPACING.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderIcon: { marginRight: SPACING.sm },
  sliderLabel: {
    color: COLORS.textSec,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: FONT.body,
  },
  sliderValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    fontFamily: FONT.mono,
  },
  trackWrapper: {
    position: 'relative',
    height: 28,
    borderRadius: RADIUS.pill,
  },
  trackBg: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    bottom: 8,
    borderRadius: 4,
  },
  activeTrack: {
    position: 'absolute',
    top: 8,
    left: 12,
    bottom: 8,
    borderRadius: 4,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  tickContainer: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    bottom: 0,
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tickEnd: { height: '60%', top: '20%' },
  sliderThumb: {
    position: 'absolute',
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.bg,
  },
});
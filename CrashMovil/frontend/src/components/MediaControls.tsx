import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  useDerivedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, SHADOWS, ANIMATION, GOLD } from '../theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface MediaControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeedChange?: (speed: number) => void;
  speeds?: number[];
  showSpeed?: boolean;
  style?: any;
}

export function MediaControls({
  playing,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onPrevious,
  onNext,
  onSpeedChange,
  speeds = [0.5, 1, 1.5, 2],
  showSpeed = true,
  style,
}: MediaControlsProps) {
  const playScale = useSharedValue(1);
  const progress = useSharedValue(duration > 0 ? currentTime / duration : 0);
  const thumbX = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const speedIndex = useSharedValue(1);
  const speedExpanded = useSharedValue(0);
  const isSeeking = useSharedValue(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPress = () => {
    playScale.value = withSpring(0.9, ANIMATION.spring, () => {
      playScale.value = withSpring(1, ANIMATION.springBouncy);
    });
    onPlayPause();
  };

  const panResponder = React.useRef({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      isSeeking.value = true;
    },
    onPanResponderMove: (e: any, gestureState: any) => {
      if (trackWidth.value > 0) {
        const newX = Math.max(0, Math.min(gestureState.moveX, trackWidth.value));
        thumbX.value = newX;
        const newProgress = newX / trackWidth.value;
        progress.value = newProgress;
      }
    },
    onPanResponderRelease: (e: any, gestureState: any) => {
      isSeeking.value = false;
      if (trackWidth.value > 0) {
        const newProgress = thumbX.value / trackWidth.value;
        const newTime = newProgress * duration;
        onSeek(newTime);
      }
    },
    onPanResponderTerminate: () => {
      isSeeking.value = false;
      if (trackWidth.value > 0) {
        const newProgress = thumbX.value / trackWidth.value;
        const newTime = newProgress * duration;
        onSeek(newTime);
      }
    },
  }).current;

  const animatedPlayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - 12 }],
  }));

  const animatedActiveTrackStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const animatedSpeedStyle = useAnimatedStyle(() => ({
    opacity: speedExpanded.value,
    transform: [{ translateY: interpolate(speedExpanded.value, [0, 1], [20, 0]) }],
  }));

  const playIcon = playing ? 'pause' : 'play';
  const speed = speeds[speedIndex.value];

  useEffect(() => {
    const p = duration > 0 ? currentTime / duration : 0;
    progress.value = withTiming(p, { duration: 200 });
    thumbX.value = withTiming(p * trackWidth.value, { duration: 200 });
  }, [currentTime, duration]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.trackWrapper} onLayout={(e) => { trackWidth.value = e.nativeEvent.layout.width; }} {...panResponder}>
          <View style={styles.trackBg} />
          <Animated.View style={[styles.activeTrack, animatedActiveTrackStyle]} />
          <View style={styles.tickContainer}>
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
              <View key={i} style={[styles.tick, { left: `${tick * 100}%` }, i === 0 || i === 4 ? styles.tickEnd : {}]} />
            ))}
          </View>
          <Animated.View style={[styles.thumb, animatedThumbStyle]} />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onPrevious} activeOpacity={0.7} style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={28} color={GOLD} />
        </TouchableOpacity>

        <AnimatedTouchableOpacity
          style={[styles.playBtn, animatedPlayStyle]}
          onPress={handlePlayPress}
          activeOpacity={0.85}
        >
          <Ionicons name={playIcon} size={32} color={playing ? GOLD : '#0A0A0A'} />
        </AnimatedTouchableOpacity>

        <TouchableOpacity onPress={onNext} activeOpacity={0.7} style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={28} color={GOLD} />
        </TouchableOpacity>

        {showSpeed && (
          <View style={styles.speedContainer}>
            <TouchableOpacity
              onPress={() => {
                speedExpanded.value = withTiming(speedExpanded.value ? 0 : 1, { duration: 200 });
              }}
              activeOpacity={0.85}
              style={styles.speedBtn}
            >
              <Text style={styles.speedText}>{speed}x</Text>
              <Ionicons 
                name={speedExpanded.value ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={COLORS.textSec} 
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            <Animated.View style={[styles.speedOptions, animatedSpeedStyle]}>
              {speeds.map((s, i) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    speedIndex.value = i;
                    speedExpanded.value = withTiming(0, { duration: 200 });
                    onSpeedChange?.(s);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.speedOption,
                    speedIndex.value === i && styles.speedOptionActive,
                  ]}
                >
                  <Text style={[
                    styles.speedOptionText,
                    speedIndex.value === i && styles.speedOptionTextActive,
                  ]}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,162,60,0.1)',
    ...SHADOWS.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  timeText: {
    color: COLORS.textSec,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.mono,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  trackWrapper: {
    flex: 1,
    height: 20,
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 8,
    backgroundColor: '#2A2A34',
    borderRadius: 2,
  },
  activeTrack: {
    position: 'absolute',
    top: 8,
    left: 0,
    bottom: 8,
    backgroundColor: GOLD,
    borderRadius: 2,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  tickContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tickEnd: { height: '60%', top: '20%' },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,10,10,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,162,60,0.1)',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(GOLD),
  },
  speedContainer: {
    position: 'relative',
  },
  speedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(200,162,60,0.1)',
  },
  speedText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    fontFamily: FONT.mono,
  },
  speedOptions: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(200,162,60,0.1)',
    padding: SPACING.xs,
    gap: 2,
    ...SHADOWS.lg,
  },
  speedOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  speedOptionActive: {
    backgroundColor: 'rgba(200,162,60,0.15)',
  },
  speedOptionText: {
    color: COLORS.textSec,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    fontFamily: FONT.mono,
  },
  speedOptionTextActive: {
    color: GOLD,
  },
});
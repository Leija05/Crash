import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS, SPACING, RED, EASING } from '../theme';

interface ScreenShellProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  safeTop?: boolean;
  header?: React.ReactNode;
}

export default function ScreenShell({
  children,
  scroll = true,
  style,
  safeTop = true,
  header,
}: ScreenShellProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: EASING.premium }), -1, true);
  }, [drift]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 0.5, 1], [0.5, 1, 0.6], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(drift.value, [0, 1], [-14, 10], Extrapolation.CLAMP) },
      { scale: interpolate(drift.value, [0, 1], [1, 1.12], Extrapolation.CLAMP) },
    ],
  }));

  const content = (
    <Animated.View
      entering={FadeIn.duration(600).springify().damping(26).stiffness(200)}
      style={[styles.content, !safeTop && { paddingTop: 0 }, style]}
    >
      <View style={styles.inner}>
        {children}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ambientGlow, glowStyle]} pointerEvents="none" />
      <View style={styles.brandGlow} pointerEvents="none" />
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    backgroundColor: 'rgba(239,68,68,0.018)',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  brandGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
});

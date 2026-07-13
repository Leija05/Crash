import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, SPACING, GOLD } from '../theme';

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
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
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
    backgroundColor: 'rgba(200,162,60,0.015)',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  goldGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(200,162,60,0.03)',
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

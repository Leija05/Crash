import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, SPACING } from '../theme';

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
      entering={FadeIn.duration(600).springify().damping(24)}
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
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(204,255,0,0.015)',
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
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

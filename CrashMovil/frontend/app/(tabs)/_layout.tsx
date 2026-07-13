import { Redirect, Tabs } from 'expo-router';
import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, FONT, GOLD, GOLD_GRADIENT, GOLD_GRADIENT_DIAGONAL } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import { haptics } from '../../src/utils/haptics';

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

function AnimatedTabIcon({ name, color, size, focused, highlight }: { name: any; color: string; size: number; focused: boolean; highlight?: boolean }) {
  const scale = useSharedValue(1);

  if (focused) {
    scale.value = withSequence(
      withSpring(1.18, { stiffness: 400, damping: 8 }),
      withSpring(1, { stiffness: 300, damping: 15 })
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconOuter}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.iconWrap,
          highlight && !focused && styles.iconWrapHighlight,
          focused && styles.iconPillActive,
          animatedStyle,
        ]}
      >
        {focused && (
          <LinearGradient
            colors={GOLD_GRADIENT}
            start={GOLD_GRADIENT_DIAGONAL.start}
            end={GOLD_GRADIENT_DIAGONAL.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        <AnimatedIonicon
          name={name}
          size={size - 2}
          color={focused ? '#1A1206' : color}
        />
      </Animated.View>
      <View style={[styles.iconDot, focused && styles.iconDotActive]} />
    </View>
  );
}

const MemoAnimatedIcon = memo(AnimatedTabIcon);

function HomeIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const scale = useSharedValue(1);

  if (focused) {
    scale.value = withSequence(
      withSpring(1.22, { stiffness: 400, damping: 8 }),
      withSpring(1, { stiffness: 300, damping: 15 })
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconOuter}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.iconWrap, focused && styles.iconPillActive, animatedStyle]}
      >
        {focused && (
          <LinearGradient
            colors={GOLD_GRADIENT}
            start={GOLD_GRADIENT_DIAGONAL.start}
            end={GOLD_GRADIENT_DIAGONAL.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        <AnimatedIonicon name="flash" size={size - 2} color={focused ? '#1A1206' : color} />
      </Animated.View>
      <View style={[styles.iconDot, focused && styles.iconDotActive]} />
    </View>
  );
}

const MemoHomeIcon = memo(HomeIcon);

function TabBarBackground() {
  return (
    <View style={styles.bgWrap} pointerEvents="none">
      <LinearGradient
        colors={['rgba(240,216,154,0.55)', 'rgba(200,154,62,0.30)', 'rgba(140,104,36,0.18)']}
        start={GOLD_GRADIENT_DIAGONAL.start}
        end={GOLD_GRADIENT_DIAGONAL.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgInner}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 46 : 30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bgTint} />
        <LinearGradient
          colors={['rgba(240,216,154,0.30)', 'rgba(240,216,154,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bgHighlight}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { token, loading } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  if (!loading && !token) return <Redirect href="/login" />;

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: bottomInset, height: 78 + bottomInset }],
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 6 },
        tabBarBackground: () => <TabBarBackground />,
      }}
      screenListeners={{
        tabPress: () => haptics.selection(),
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size, focused }) => <MemoHomeIcon color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="impacts" options={{ title: t('nav.impacts'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="warning" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="contacts" options={{ title: t('nav.contacts'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="people" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="person-circle" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="settings-sharp" color={focused ? color : GOLD} size={size} focused={focused} highlight /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: RADIUS.xxl,
    borderWidth: 0,
    paddingTop: 2,
    paddingBottom: 0,
    ...SHADOWS.xl,
  },
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    padding: 1.2,
  },
  bgInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xxl - 1.2,
    overflow: 'hidden',
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,8,0.62)',
  },
  bgHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    borderRadius: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  iconOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  iconDotActive: {
    backgroundColor: GOLD,
    ...SHADOWS.glow(GOLD, 0.45, 8),
  },
  iconWrap: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconPillActive: {
    ...SHADOWS.glow(GOLD, 0.5, 16),
  },
  iconWrapHighlight: {
    backgroundColor: 'rgba(217,180,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240,216,154,0.28)',
  },
});

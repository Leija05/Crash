import { Redirect, Tabs } from 'expo-router';
import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, FONT, GOLD } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import { haptics } from '../../src/utils/haptics';

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

function AnimatedTabIcon({ name, color, size, focused, highlight }: { name: any; color: string; size: number; focused: boolean; highlight?: boolean }) {
  const scale = useSharedValue(1);

  if (focused) {
    scale.value = withSequence(
      withSpring(1.15, { stiffness: 400, damping: 8 }),
      withSpring(1, { stiffness: 300, damping: 15 })
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconOuter}>
      <View style={[styles.iconDot, focused && styles.iconDotActive]} />
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.iconWrap,
          highlight && !focused && styles.iconWrapHighlight,
          focused && styles.iconWrapActive,
          animatedStyle,
        ]}
      >
        <AnimatedIonicon name={name} size={size - 2} color={color} />
      </Animated.View>
    </View>
  );
}

const MemoAnimatedIcon = memo(AnimatedTabIcon);

function HomeIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const scale = useSharedValue(1);

  if (focused) {
    scale.value = withSequence(
      withSpring(1.2, { stiffness: 400, damping: 8 }),
      withSpring(1, { stiffness: 300, damping: 15 })
    );
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconOuter}>
      <View style={[styles.iconDot, focused && styles.iconDotActive]} />
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.iconWrap, focused && [styles.iconWrapActive, { backgroundColor: 'rgba(255,215,0,0.15)' }], animatedStyle]}
      >
        <AnimatedIonicon name="flash" size={size - 2} color={focused ? GOLD : color} />
      </Animated.View>
    </View>
  );
}

const MemoHomeIcon = memo(HomeIcon);

function TabBarBackground() {
  return (
    <View style={styles.bgWrap} pointerEvents="none">
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 28}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgTint} />
      <View style={styles.bgHighlight} />
    </View>
  );
}

export default function TabLayout() {
  const { token, loading } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  if (!loading && !token) return <Redirect href="/login" />;

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: bottomInset }],
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 4 },
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
    left: 14,
    right: 14,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: RADIUS.xl,
    height: 62,
    paddingBottom: 6,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(230,200,120,0.16)',
    ...SHADOWS.lg,
  },
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  bgHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(230,200,120,0.25)',
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: FONT.medium,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  iconOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginBottom: 3,
  },
  iconDotActive: {
    backgroundColor: GOLD,
    ...SHADOWS.glow(GOLD),
  },
  iconWrap: {
    width: 34,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,215,0,0.10)',
  },
  iconWrapHighlight: {
    backgroundColor: 'rgba(200,162,60,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,200,120,0.22)',
  },
});

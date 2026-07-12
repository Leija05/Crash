import { Redirect, Tabs } from 'expo-router';
import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, FONT } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

function AnimatedTabIcon({ name, color, size, focused }: { name: any; color: string; size: number; focused: boolean }) {
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
        style={[styles.iconWrap, focused && styles.iconWrapActive, animatedStyle]}
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
        style={[styles.iconWrap, focused && [styles.iconWrapActive, { backgroundColor: 'rgba(255,59,48,0.15)' }], animatedStyle]}
      >
        <AnimatedIonicon name="flash" size={size - 2} color={focused ? COLORS.primary : color} />
      </Animated.View>
    </View>
  );
}

const MemoHomeIcon = memo(HomeIcon);

export default function TabLayout() {
  const { token, loading } = useAuth();
  const { t } = useI18n();

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size, focused }) => <MemoHomeIcon color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="impacts" options={{ title: t('nav.impacts'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="warning" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="contacts" options={{ title: t('nav.contacts'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="people" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="person-circle" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size, focused }) => <MemoAnimatedIcon name="settings-sharp" color={color} size={size} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(10,10,10,0.94)',
    borderTopWidth: 0,
    borderRadius: RADIUS.lg,
    height: 64,
    paddingBottom: 6,
    paddingTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.10)',
    ...SHADOWS.md,
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
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow(COLORS.primary),
  },
  iconWrap: {
    width: 34,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
});

import { Redirect, Tabs } from 'expo-router';
import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOWS, FONT } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';

function TabIcon({ name, color, size, focused }: { name: any; color: string; size: number; focused: boolean }) {
  return (
    <View style={styles.iconOuter}>
      <View style={[styles.iconDot, focused && styles.iconDotActive]} />
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons name={name} size={size - 2} color={color} />
      </View>
    </View>
  );
}

const MemoIcon = memo(TabIcon);

export default function TabLayout() {
  const { token, loading } = useAuth();
  const { t } = useI18n();

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size, focused }) => <MemoIcon name="speedometer" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="impacts" options={{ title: t('nav.dashboard'), tabBarIcon: ({ color, size, focused }) => <MemoIcon name="warning" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="contacts" options={{ title: t('nav.contacts'), tabBarIcon: ({ color, size, focused }) => <MemoIcon name="people" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: ({ color, size, focused }) => <MemoIcon name="person-circle" color={color} size={size} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size, focused }) => <MemoIcon name="settings-sharp" color={color} size={size} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(13,13,18,0.92)',
    borderTopWidth: 0,
    borderRadius: RADIUS.lg,
    height: 64,
    paddingBottom: 6,
    paddingTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.lg,
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
    backgroundColor: COLORS.accent,
    ...SHADOWS.glow(COLORS.accent),
  },
  iconWrap: {
    width: 34,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(204,255,0,0.12)',
  },
});

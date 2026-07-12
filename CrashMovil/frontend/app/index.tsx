import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { CrashLogoMark } from '../src/components/CrashLogo';
import { COLORS, SHADOWS } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, user]);

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.topRedLine} pointerEvents="none" />
      <CrashLogoMark size={64} />
      <Text style={styles.text}>C.R.A.S.H.</Text>
      <Text style={styles.sub}>CRITICAL RESPONSE</Text>
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  topRedLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: COLORS.primary,
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(255,59,48,0.03)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
  },
  loaderWrap: {
    marginTop: 8,
  },
  text: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
  },
  sub: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
  },
});

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { CrashLogoSVG } from '../src/components/CrashLogo';
import { COLORS, GOLD } from '../src/theme';

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
      <View style={styles.goldGlow} pointerEvents="none" />
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.topGoldLine} pointerEvents="none" />
      <CrashLogoSVG size={80} color={GOLD} />
      <Text style={styles.text}>C.R.A.S.H.</Text>
      <Text style={styles.sub}>CRITICAL RESPONSE</Text>
      <Text style={styles.sub2}>ALERT SYSTEM FOR HELMETS</Text>
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={GOLD} />
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
  topGoldLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: GOLD,
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(255,215,0,0.02)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
  },
  goldGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,215,0,0.04)',
  },
  loaderWrap: {
    marginTop: 8,
  },
  text: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
  },
  sub: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
  },
  sub2: {
    color: COLORS.textDim,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: -4,
  },
});

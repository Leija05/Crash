import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/theme';

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
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
      <Text style={styles.text}>C.R.A.S.H.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(204,255,0,0.015)',
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150,
  },
  loaderWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  text: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
});

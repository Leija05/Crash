import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/i18n';
import { CrashLogoMark } from '../src/components/CrashLogo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, FONT, GOLD } from '../src/theme';

export default function LoginScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) { setError(t('login.errorEmpty')); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || t('login.errorGeneric'));
    } finally { setLoading(false); }
  }, [email, password, login, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <View style={styles.topGoldLine} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.duration(600).springify().damping(20)} style={styles.header}>
            <CrashLogoMark size={56} />
            <Text style={styles.appName}>C.R.A.S.H.</Text>
            <Text style={styles.appSub}>CRITICAL RESPONSE ALERT SYSTEM</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(100).springify().damping(22)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.badge}>{t('login.badge')}</Text>
              <Text style={styles.cardTitle}>{t('login.title')}</Text>
              <View style={styles.titleAccent} />
              <Text style={styles.cardDesc}>{t('login.subtitle')}</Text>
            </View>

            {error ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.duration(400).delay(150).springify()} style={styles.inputGroup}>
              <Text style={styles.label}>{t('login.email')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textSec} />
                <TextInput
                  testID="login-email-input"
                  style={styles.input}
                  placeholder={t('login.email')}
                  placeholderTextColor={COLORS.textDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(220).springify()} style={styles.inputGroup}>
              <Text style={styles.label}>{t('login.password')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.textSec} />
                <TextInput
                  testID="login-password-input"
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} testID="toggle-password-btn">
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(290).springify()}>
              <TouchableOpacity
                testID="login-submit-btn"
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>{t('login.submit')}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#000" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(360).springify()}>
              <TouchableOpacity testID="go-to-register-btn" style={styles.linkBtn} onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>
                  {t('login.register')} <Text style={styles.linkAccent}>→</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <Animated.Text entering={FadeInUp.duration(400).delay(400)} style={styles.footer}>C.R.A.S.H. v3.0 · Gold Edition</Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topGoldLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: GOLD,
    zIndex: 10,
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 400,
    backgroundColor: 'rgba(255,215,0,0.03)',
    borderBottomLeftRadius: 180, borderBottomRightRadius: 180,
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: 36, gap: 12 },
  appName: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 5 },
  appSub: { fontSize: 9, color: GOLD, fontWeight: '700', letterSpacing: 2 },
  card: {
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.10)',
    ...SHADOWS.md,
  },
  cardHeader: { marginBottom: 20, alignItems: 'center' },
  badge: {
    fontSize: 9, color: GOLD, letterSpacing: 4,
    marginBottom: 8, fontWeight: '800',
  },
  cardTitle: { fontSize: 28, fontFamily: FONT.headingBold, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase' },
  titleAccent: { width: 40, height: 3, borderRadius: 2, backgroundColor: GOLD, marginTop: 10 },
  cardDesc: { fontSize: 12, color: COLORS.textSec, marginTop: 12, letterSpacing: 0.3 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)',
    padding: 12, borderRadius: RADIUS.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 10, fontWeight: '700', color: COLORS.textSec,
    letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
    gap: 10, height: 50,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 15, height: '100%' },
  button: {
    backgroundColor: GOLD, borderRadius: RADIUS.pill,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: 6, flexDirection: 'row',
    ...SHADOWS.glow(GOLD),
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#000', fontSize: 14, fontFamily: FONT.headingBold, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  linkBtn: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 4 },
  linkText: { color: COLORS.textDim, fontSize: 13 },
  linkAccent: { color: GOLD, fontWeight: '700' },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 10, marginTop: SPACING.lg, letterSpacing: 1 },
});

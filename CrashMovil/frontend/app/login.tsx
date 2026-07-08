import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/i18n';
import { CrashLogoFull } from '../src/components/CrashLogo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/theme';

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
    if (!email.trim() || !password.trim()) { setError('Completa todos los campos'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  }, [email, password, login, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoGlow}>
              <CrashLogoFull size={34} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.badge}>{t('login.badge')}</Text>
              <Text style={styles.cardTitle}>{t('login.title')}</Text>
              <Text style={styles.cardDesc}>{t('login.subtitle')}</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
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
            </View>

            <View style={styles.inputGroup}>
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
            </View>

            <TouchableOpacity
              testID="login-submit-btn"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('login.submit')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity testID="go-to-register-btn" style={styles.linkBtn} onPress={() => router.push('/register')}>
              <Text style={styles.linkText}>
                {t('login.register')} <Text style={styles.linkAccent}>→</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>C.R.A.S.H. v2.0 · Encrypted</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 400,
    backgroundColor: 'rgba(255,59,48,0.03)',
    borderBottomLeftRadius: 180, borderBottomRightRadius: 180,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: 36 },
  logoGlow: {
    ...SHADOWS.glow(COLORS.primary),
    borderRadius: 32,
    padding: 4,
  },
  card: {
    backgroundColor: 'rgba(13,13,18,0.92)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.lg,
  },
  cardHeader: { marginBottom: 20, alignItems: 'center' },
  badge: {
    fontSize: 9, color: COLORS.primary, letterSpacing: 4,
    marginBottom: 8, fontWeight: '800',
  },
  cardTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  cardDesc: { fontSize: 12, color: COLORS.textSec, marginTop: 4, letterSpacing: 0.3 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)',
    padding: 12, borderRadius: RADIUS.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.primary, fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 10, fontWeight: '700', color: COLORS.textSec,
    letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
    gap: 10, height: 50,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 15, height: '100%' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
    marginTop: 6, flexDirection: 'row',
    ...SHADOWS.glow(COLORS.primary),
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 4 },
  linkText: { color: COLORS.textDim, fontSize: 13 },
  linkAccent: { color: COLORS.accent, fontWeight: '700' },
  footer: { textAlign: 'center', color: COLORS.textDim, fontSize: 10, marginTop: SPACING.lg, letterSpacing: 1 },
});

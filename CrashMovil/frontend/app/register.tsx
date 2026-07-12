import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/i18n';
import { CrashLogoMark } from '../src/components/CrashLogo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD } from '../src/theme';

export default function RegisterScreen() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const passwordRules = [
    { label: t('register.passwordRules.minChars'), test: (p: string) => p.length >= 8 },
    { label: t('register.passwordRules.uppercase'), test: (p: string) => /[A-Z]/.test(p) },
    { label: t('register.passwordRules.lowercase'), test: (p: string) => /[a-z]/.test(p) },
    { label: t('register.passwordRules.number'), test: (p: string) => /\d/.test(p) },
  ];
  const failedRules = passwordRules.filter((r) => !r.test(password));

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError(t('register.errorEmpty')); return; }
    if (failedRules.length > 0) {
      setError(t('register.errorPassword'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || t('register.errorGeneric'));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <CrashLogoMark size={56} />
            <Text style={styles.title}>{t('register.subtitle')}</Text>
            <Text style={styles.subtitle}>{t('register.title')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('register.submit')}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.name')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={16} color={COLORS.textSec} />
                <TextInput testID="register-name-input" style={styles.input} placeholder={t('register.namePlaceholder')} placeholderTextColor={COLORS.textDim} value={name} onChangeText={setName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.email')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textSec} />
                <TextInput testID="register-email-input" style={styles.input} placeholder={t('register.emailPlaceholder')} placeholderTextColor={COLORS.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.password')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.textSec} />
                <TextInput testID="register-password-input" style={styles.input} placeholder={t('register.passwordPlaceholder')} placeholderTextColor={COLORS.textDim} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
              <View style={styles.rules}>
                {passwordRules.map((r) => {
                  const ok = password.length === 0 || r.test(password);
                  return (
                    <View key={r.label} style={styles.ruleItem}>
                      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={ok ? GOLD : COLORS.textDim} />
                      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{r.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity testID="register-submit-btn" style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#000" /> : (
                <>
                  <Text style={styles.buttonText}>{t('register.submit')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity testID="go-to-login-btn" style={styles.linkBtn} onPress={() => router.back()}>
              <Text style={styles.linkText}>{t('register.loginLink')} <Text style={styles.linkAccent}>{t('register.loginLinkAccent')} →</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 400,
    backgroundColor: 'rgba(255,215,0,0.012)',
    borderBottomLeftRadius: 180, borderBottomRightRadius: 180,
  },
  goldGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,215,0,0.03)',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  subtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: 'rgba(13,13,18,0.92)',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.06)',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)',
    padding: 12, borderRadius: RADIUS.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
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
  buttonText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 4 },
  linkText: { color: COLORS.textDim, fontSize: 13 },
  linkAccent: { color: GOLD, fontWeight: '700' },
  rules: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ruleText: { color: COLORS.textDim, fontSize: 11 },
  ruleTextOk: { color: GOLD, fontWeight: '700' },
});

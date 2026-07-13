import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Switch, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, withSpring, withTiming, Easing, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor, GOLD, GOLD_HAIRLINE, FONT, FONT_SIZE, ANIMATION } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useAppSettings } from '../../src/context/AppSettingsContext';
import { useBluetooth } from '../../src/context/BluetoothContext';
import { useAlert } from '../../src/context/AlertContext';
import { useI18n } from '../../src/i18n';
import { settingsAPI, authAPI, versionsAPI, API_BASE } from '../../src/services/api';
import SectionHeader from '../../src/components/SectionHeader';
import GlassCard from '../../src/components/GlassCard';
import GlassButton from '../../src/components/GlassButton';
import PremiumModal from '../../src/components/PremiumModal';
import { DarkSwitch } from '../../src/components/DarkSwitch';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { token, logout } = useAuth();
  const { deviceName, setDeviceName, notifyAlertsConfigChanged } = useAppSettings();
  const { connected, deviceName: liveDevice, disconnect, nativeAvailable } = useBluetooth();
  const { alert, confirm } = useAlert();

  const [threshold, setThreshold] = useState('5');
  const [autoCall, setAutoCall] = useState(true);
  const [autoWhatsapp, setAutoWhatsapp] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState('8');
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [deviceInput, setDeviceInput] = useState(deviceName);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState<{ company_id: string | null; company_name: string | null }>({ company_id: null, company_name: null });
  const [companyTokenInput, setCompanyTokenInput] = useState('');
  const [linking, setLinking] = useState(false);

  const cardAnims = useSharedValue(0);

  useEffect(() => { setDeviceInput(deviceName); }, [deviceName]);

  const fetchCompany = useCallback(async () => {
    if (!token) return;
    try {
      const c = await authAPI.driverCompany(token);
      setCompany({ company_id: c.company_id ?? null, company_name: c.company_name ?? null });
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const s = await settingsAPI.get(token);
      setThreshold(String(s.alert_threshold ?? 5));
      setAutoCall(s.auto_call !== false);
      setAutoWhatsapp(s.auto_whatsapp !== false);
      setCountdownSeconds(String(s.countdown_seconds ?? 8));
      setLocationTrackingEnabled(s.location_tracking_enabled !== false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); fetchCompany(); checkForUpdate(); }, [fetchData, fetchCompany]));

  const linkCompany = async () => {
    if (!token) return;
    const raw = companyTokenInput.trim().toUpperCase();
    if (!raw) { alert({ title: t('common.error'), message: t('settings.companyTokenHelper') }); return; }
    setLinking(true);
    try {
      const r = await authAPI.linkCompany(token, raw);
      setCompany({ company_id: r.company_id ?? null, company_name: r.company_name ?? null });
      setCompanyTokenInput('');
      alert({ title: t('settings.linkedTitle'), message: `${t('settings.linkedMessage')} "${r.company_name}".` });
    } catch (e: any) {
      alert({ title: t('settings.linkError'), message: e?.message || t('settings.linkErrorDetail') });
    } finally { setLinking(false); }
  };

  const unlinkCompany = async () => {
    const ok = await confirm({
      title: t('settings.unlinkConfirmTitle'),
      message: t('settings.unlinkConfirmMessage'),
      confirmText: t('settings.unlinkConfirmBtn'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      const r = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || ''}/api/auth/remove-driver-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.detail || `Error ${r.status}`);
      }
      await fetchCompany();
      alert({ title: t('settings.unlinkedTitle'), message: t('settings.unlinkedMessage') });
    } catch (e: any) { alert({ title: t('common.error'), message: e?.message || t('errors.generic') }); }
  };

  const saveServer = async () => {
    if (!token) return;
    const tVal = parseFloat(threshold);
    if (isNaN(tVal) || tVal <= 0) { alert({ title: t('common.error'), message: t('settings.thresholdError') }); return; }
    const c = parseInt(countdownSeconds, 10);
    if (isNaN(c) || c < 3 || c > 60) { alert({ title: t('common.error'), message: t('settings.countdownError') }); return; }
    setSaving(true);
    try {
      await settingsAPI.update(token, { alert_threshold: tVal, auto_call: autoCall, auto_whatsapp: autoWhatsapp, countdown_seconds: c, location_tracking_enabled: locationTrackingEnabled });
      notifyAlertsConfigChanged();
      alert({ title: t('settings.saved'), message: t('settings.savedAlerts') });
    } catch (e: any) { alert({ title: t('common.error'), message: e.message }); }
    finally { setSaving(false); }
  };

  const saveDeviceName = async () => {
    await setDeviceName(deviceInput.trim() || 'HC-05');
    alert({ title: t('settings.saved'), message: t('settings.deviceNameSaved') });
  };

  const [logoutOpen, setLogoutOpen] = useState(false);

  const localVersion = Constants.expoConfig?.version || (Constants as any).manifest?.version || '0.0.0';
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'uptodate' | 'available' | 'error'>('idle');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateMandatory, setUpdateMandatory] = useState(false);

  const versionTuple = (v?: string) => ((v || '').match(/\d+/g) || []).map(Number);
  const isNewer = (remote?: string, local?: string) => {
    const a = versionTuple(remote);
    const b = versionTuple(local);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const x = a[i] || 0;
      const y = b[i] || 0;
      if (x > y) return true;
      if (x < y) return false;
    }
    return false;
  };

  const checkForUpdate = async () => {
    setUpdateStatus('checking');
    try {
      const data = await versionsAPI.latest('android');
      if (!data?.version) { setUpdateStatus('error'); return; }
      setLatestVersion(data.version);
      setUpdateNotes(data.notes || '');
      setUpdateUrl(data.download_url || '');
      setUpdateMandatory(!!data.mandatory);
      setUpdateStatus(isNewer(data.version, localVersion) ? 'available' : 'uptodate');
    } catch {
      setUpdateStatus('error');
    }
  };

  const openUpdate = () => {
    if (!updateUrl) return;
    const url = updateUrl.startsWith('/') ? `${API_BASE}${updateUrl}` : updateUrl;
    Linking.openURL(url).catch(() => {});
  };

  const doLogout = async () => {
    setLogoutOpen(false);
    if (connected) disconnect();
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500).springify().damping(26).stiffness(200)} style={styles.header}>
            <Text style={styles.title}>{t('settings.title').toUpperCase()}</Text>
            <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(100).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.bluetoothDevice')} icon="bluetooth" />
              <View style={styles.deviceStatus}>
                <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.textDim }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusLabel}>{connected ? t('settings.connected') : t('settings.noConnection')}</Text>
                  <Text style={styles.statusDevice}>{connected ? liveDevice : t('settings.noDevice')}</Text>
                </View>
                {connected ? (
                  <TouchableOpacity onPress={disconnect} style={styles.inlineBtn} testID="settings-disconnect-btn">
                    <Text style={styles.inlineBtnText}>{t('settings.disconnect')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => router.push('/devices')} style={[styles.inlineBtn, styles.inlineBtnAccent]} testID="settings-scan-btn">
                    <Text style={[styles.inlineBtnText, { color: '#000' }]}>{t('settings.scan')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('settings.deviceNameLabel')}</Text>
                <Text style={styles.helper}>{t('settings.deviceNameHelper')}</Text>
                <View style={styles.inputRow}>
                  <TextInput testID="device-name-input" style={[styles.input, { flex: 1 }]} value={deviceInput} onChangeText={setDeviceInput} placeholder="HC-05 CRASH" placeholderTextColor={COLORS.textDim} autoCapitalize="characters" />
                  <TouchableOpacity onPress={saveDeviceName} style={styles.saveInlineBtn} testID="save-device-name-btn">
                    <Text style={styles.saveInlineBtnText}>{t('settings.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(200).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.company')} icon="business" accent />
              {(() => {
                const isGeneral = company?.company_id === "general";
                const linked = !!company?.company_id && !isGeneral;
                if (linked) {
                  return (
                    <View style={styles.deviceStatus}>
                      <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statusLabel}>{t('settings.linked')}</Text>
                        <Text style={styles.statusDevice}>{company.company_name}</Text>
                      </View>
                      <TouchableOpacity onPress={unlinkCompany} style={styles.inlineBtn} testID="company-unlink-btn">
                        <Text style={styles.inlineBtnText}>{t('settings.unlink')}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <View style={styles.inputGroup}>
                    {isGeneral ? (
                      <Text style={[styles.helper, { color: COLORS.success, marginBottom: 8 }]}>
                        {t('settings.generalMonitoring')}
                      </Text>
                    ) : (
                      <Text style={styles.label}>{t('settings.companyToken')}</Text>
                    )}
                    <Text style={styles.helper}>{t('settings.companyTokenHelper')}</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        testID="company-token-input"
                        style={[styles.input, { flex: 1, letterSpacing: 2 }]}
                        value={companyTokenInput}
                        onChangeText={(v) => setCompanyTokenInput(v.toUpperCase())}
                        placeholder={t('settings.companyTokenPlaceholder')}
                        placeholderTextColor={COLORS.textDim}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity onPress={linkCompany} disabled={linking} style={[styles.saveInlineBtn, linking && { opacity: 0.6 }]} testID="company-link-btn">
                        {linking ? <ActivityIndicator color="#000" /> : <Text style={styles.saveInlineBtnText}>{t('settings.link')}</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(300).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.languageSection')} icon="globe" accent />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.langBtn, locale === 'es' && styles.langBtnActive]} onPress={() => setLocale('es')}>
                  <Text style={[styles.langBtnText, locale === 'es' && styles.langBtnTextActive]}>Español</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.langBtn, locale === 'en' && styles.langBtnActive]} onPress={() => setLocale('en')}>
                  <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>English</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(400).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.confirmTime')} icon="timer" />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('settings.countdownLabel')}</Text>
                <Text style={styles.helper}>{t('settings.countdownHelper')}</Text>
                <View style={styles.thresholdRow}>
                  <TextInput style={[styles.input, { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '800' }]} value={countdownSeconds} onChangeText={setCountdownSeconds} keyboardType="numeric" />
                  <Text style={styles.gSymbol}>s</Text>
                </View>
              </View>
              {!nativeAvailable && (
                <View style={styles.warnBox}>
                  <Ionicons name="information-circle" size={14} color={COLORS.info} />
                  <Text style={styles.warnBoxText}>{t('settings.nativeBluetoothWarning')}</Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(500).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.alertsImpact')} icon="warning" accent />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('settings.alertThresholdLabel')}</Text>
                <Text style={styles.helper}>{t('settings.alertThresholdHelper')}</Text>
                <View style={styles.thresholdRow}>
                  <TextInput testID="threshold-input" style={[styles.input, { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '800' }]} value={threshold} onChangeText={setThreshold} keyboardType="numeric" />
                  <Text style={styles.gSymbol}>G</Text>
                </View>
                <View style={styles.thresholdScale}>
                  {[
                    { l: t('settings.thresholdLow'), v: '5' },
                    { l: t('settings.thresholdMedium'), v: '10' },
                    { l: t('settings.thresholdHigh'), v: '15' },
                    { l: t('settings.thresholdCritical'), v: '20' },
                  ].map((item) => (
                    <TouchableOpacity key={item.v} style={[styles.threshBtn, { borderColor: severityColor(parseFloat(item.v)) }]} onPress={() => setThreshold(item.v)}>
                      <Text style={[styles.threshText, { color: severityColor(parseFloat(item.v)) }]}>{item.l}</Text>
                      <Text style={[styles.threshVal, { color: severityColor(parseFloat(item.v)) }]}>{item.v}G</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <DarkSwitch
                value={locationTrackingEnabled}
                onValueChange={setLocationTrackingEnabled}
                label={t('settings.trackingLabel')}
                icon="location-outline"
                trackColor={COLORS.info}
              />

              <DarkSwitch
                value={autoCall}
                onValueChange={setAutoCall}
                label={t('settings.autoCalls')}
                icon="call-outline"
                trackColor={GOLD}
              />

              <DarkSwitch
                value={autoWhatsapp}
                onValueChange={setAutoWhatsapp}
                label={t('settings.autoWhatsapp')}
                icon="logo-whatsapp"
                trackColor={COLORS.success}
              />

              <TouchableOpacity testID="save-settings-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveServer} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Ionicons name="save" size={16} color="#000" />
                    <Text style={styles.saveBtnText}>{t('settings.saveAlerts')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(520).springify().damping(26).stiffness(200)}
            style={{ marginBottom: SPACING.md }}
          >
            <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
              <SectionHeader title={t('settings.updateSection')} icon="cloud-download" accent />
              <View style={styles.updateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.updateLabel}>{t('settings.updateCurrent')}</Text>
                  <Text style={styles.updateValue}>v{localVersion}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.updateLabel}>{t('settings.updateLatest')}</Text>
                  <Text style={[styles.updateValue, { color: updateStatus === 'available' ? GOLD : COLORS.text }]}>
                    {latestVersion ? `v${latestVersion}` : updateStatus === 'checking' ? '...' : '—'}
                  </Text>
                </View>
              </View>

              {updateStatus === 'uptodate' && (
                <View style={[styles.updateStatusBox, { borderColor: 'rgba(52,199,89,0.25)', backgroundColor: 'rgba(52,199,89,0.08)' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={[styles.updateStatusText, { color: COLORS.success }]}>{t('settings.updateUpToDate')}</Text>
                </View>
              )}
              {updateStatus === 'available' && (
                <View style={[styles.updateStatusBox, { borderColor: GOLD_HAIRLINE, backgroundColor: 'rgba(200,162,60,0.08)' }]}>
                  <Ionicons name="arrow-up-circle" size={16} color={GOLD} />
                  <Text style={[styles.updateStatusText, { color: GOLD }]}>{t('settings.updateAvailable')}</Text>
                </View>
              )}
              {updateStatus === 'error' && (
                <View style={[styles.updateStatusBox, { borderColor: 'rgba(255,59,48,0.25)', backgroundColor: 'rgba(255,59,48,0.08)' }]}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={[styles.updateStatusText, { color: COLORS.danger }]}>{t('settings.updateError')}</Text>
                </View>
              )}

              {updateStatus === 'available' && updateNotes ? (
                <View style={styles.updateNotesBox}>
                  <Text style={styles.updateNotesLabel}>{t('settings.updateNotes')}</Text>
                  <Text style={styles.updateNotesText}>{updateNotes}</Text>
                </View>
              ) : null}

              <GlassButton
                title={updateStatus === 'checking' ? t('settings.updateChecking') : t('settings.updateCheck')}
                onPress={checkForUpdate}
                variant="ghost"
                icon="refresh"
                size="md"
                loading={updateStatus === 'checking'}
                disabled={updateStatus === 'checking'}
                style={{ marginTop: 14 }}
              />
              {updateStatus === 'available' ? (
                <GlassButton
                  title={t('settings.updateNow')}
                  onPress={openUpdate}
                  variant="accent"
                  icon="download-outline"
                  size="md"
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </GlassCard>
          </Animated.View>

          <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={() => setLogoutOpen(true)}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
          <Text style={styles.version}>C.R.A.S.H. v3.0 · Gold Edition</Text>
        </ScrollView>

        <PremiumModal
          visible={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          title={t('settings.logoutConfirmTitle')}
          eyebrow="C.R.A.S.H. · Cuenta"
          accent={GOLD}
          closeOnBackdrop={false}
        >
          <Text style={{ color: COLORS.textSec, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            {t('settings.logoutConfirmMessage')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
            <TouchableOpacity
              onPress={() => setLogoutOpen(false)}
              style={{ flex: 1, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '800', letterSpacing: 0.7 }}>{t('settings.logoutNo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={doLogout}
              style={{ flex: 1, backgroundColor: COLORS.danger, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', letterSpacing: 1 }}>{t('settings.logoutYes')}</Text>
            </TouchableOpacity>
          </View>
        </PremiumModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'rgba(255,215,0,0.010)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  goldGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,215,0,0.03)',
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSec, marginTop: 4 },
  deviceStatus: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(217,180,91,0.10)', marginBottom: SPACING.md },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.text, letterSpacing: 1.5 },
  statusDevice: { fontSize: FONT_SIZE.sm, color: COLORS.textSec, marginTop: 2 },
  inlineBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  inlineBtnAccent: { backgroundColor: GOLD, borderColor: GOLD },
  inlineBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  helper: { fontSize: FONT_SIZE.sm, color: COLORS.textDim, marginBottom: 8, lineHeight: 16 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, paddingHorizontal: 14, minHeight: 48, color: COLORS.text, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.border },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveInlineBtn: { backgroundColor: GOLD, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12 },
  saveInlineBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: '#000', letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.10)' },
  toggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  warnBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(96,165,250,0.06)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.15)', padding: 10, borderRadius: RADIUS.md, marginTop: 4 },
  warnBoxText: { fontSize: FONT_SIZE.xs, color: COLORS.textSec, flex: 1, lineHeight: 16 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gSymbol: { fontSize: 22, fontWeight: '900', color: COLORS.textSec },
  thresholdScale: { flexDirection: 'row', gap: 8 },
  threshBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', backgroundColor: COLORS.glassBg },
  threshText: { fontSize: FONT_SIZE.xs, fontWeight: '800', letterSpacing: 1 },
  threshVal: { fontSize: FONT_SIZE.md, fontWeight: '900', marginTop: 2 },
  saveBtn: { flexDirection: 'row', gap: 8, backgroundColor: GOLD, borderRadius: RADIUS.pill, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...SHADOWS.glow(GOLD) },
  saveBtnText: { color: '#000', fontSize: FONT_SIZE.sm, fontWeight: '900', letterSpacing: 2 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.glassBg },
  langBtnActive: { borderColor: GOLD, backgroundColor: 'rgba(255,215,0,0.10)' },
  langBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textSec },
  langBtnTextActive: { color: GOLD },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: 'rgba(255,59,48,0.10)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', marginTop: 8 },
  logoutText: { fontSize: FONT_SIZE.md, color: COLORS.danger, fontWeight: '700' },
  version: { textAlign: 'center', color: COLORS.textDim, fontSize: FONT_SIZE.xs, marginTop: 12 },
  updateRow: { flexDirection: 'row', gap: 12, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(200,162,60,0.10)', marginBottom: SPACING.md },
  updateLabel: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.textSec, letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' },
  updateValue: { fontSize: FONT_SIZE.lg, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  updateStatusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1, marginTop: 12 },
  updateStatusText: { fontSize: FONT_SIZE.sm, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
  updateNotesBox: { marginTop: 12, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassBg },
  updateNotesLabel: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: GOLD, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  updateNotesText: { fontSize: FONT_SIZE.sm, color: COLORS.textSec, lineHeight: 18 },
});
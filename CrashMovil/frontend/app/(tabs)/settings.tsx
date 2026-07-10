import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, SHADOWS, severityColor } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useAppSettings } from '../../src/context/AppSettingsContext';
import { useBluetooth } from '../../src/context/BluetoothContext';
import { useAlert } from '../../src/context/AlertContext';
import { useI18n } from '../../src/i18n';
import { settingsAPI, authAPI } from '../../src/services/api';
import SectionHeader from '../../src/components/SectionHeader';
import GlassCard from '../../src/components/GlassCard';
import PremiumModal from '../../src/components/PremiumModal';

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

  useFocusEffect(useCallback(() => { fetchData(); fetchCompany(); }, [fetchData, fetchCompany]));

  const linkCompany = async () => {
    if (!token) return;
    const raw = companyTokenInput.trim().toUpperCase();
    if (!raw) { alert({ title: 'Error', message: 'Ingresa el token de empresa.' }); return; }
    setLinking(true);
    try {
      const r = await authAPI.linkCompany(token, raw);
      setCompany({ company_id: r.company_id ?? null, company_name: r.company_name ?? null });
      setCompanyTokenInput('');
      alert({ title: 'Vinculado', message: `Tu cuenta ahora está asociada a "${r.company_name}".` });
    } catch (e: any) {
      alert({ title: 'Error al vincular', message: e?.message || 'Token inválido, agotado o expirado.' });
    } finally { setLinking(false); }
  };

  const unlinkCompany = async () => {
    const ok = await confirm({
      title: 'Desvincular empresa',
      message: 'Tu cuenta ya no aparecerá en el monitoreo de la empresa.',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
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
      alert({ title: 'Desvinculado', message: 'Tu cuenta ahora está en el monitoreo general de C.R.A.S.H.' });
    } catch (e: any) { alert({ title: 'Error', message: e?.message || 'No se pudo desvincular.' }); }
  };

  const saveServer = async () => {
    if (!token) return;
    const t = parseFloat(threshold);
    if (isNaN(t) || t <= 0) { alert({ title: 'Error', message: 'El umbral debe ser un número positivo' }); return; }
    const c = parseInt(countdownSeconds, 10);
    if (isNaN(c) || c < 3 || c > 60) { alert({ title: 'Error', message: 'La cuenta regresiva debe estar entre 3 y 60 segundos' }); return; }
    setSaving(true);
    try {
      await settingsAPI.update(token, { alert_threshold: t, auto_call: autoCall, auto_whatsapp: autoWhatsapp, countdown_seconds: c, location_tracking_enabled: locationTrackingEnabled });
      notifyAlertsConfigChanged();
      alert({ title: 'Guardado', message: 'Configuración de alertas actualizada' });
    } catch (e: any) { alert({ title: 'Error', message: e.message }); }
    finally { setSaving(false); }
  };

  const saveDeviceName = async () => {
    await setDeviceName(deviceInput.trim() || 'HC-05');
    alert({ title: 'Guardado', message: 'Nombre del dispositivo actualizado.' });
  };

  const [logoutOpen, setLogoutOpen] = useState(false);

  const doLogout = async () => {
    setLogoutOpen(false);
    if (connected) disconnect();
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>AJUSTES</Text>
            <Text style={styles.subtitle}>Configura tu casco, alertas y modo de prueba.</Text>
          </View>

          <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
            <SectionHeader title="DISPOSITIVO BLUETOOTH" icon="bluetooth" />
            <View style={styles.deviceStatus}>
              <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.textDim }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>{connected ? 'CONECTADO' : 'SIN CONEXIÓN'}</Text>
                <Text style={styles.statusDevice}>{connected ? liveDevice : 'Ningún módulo activo'}</Text>
              </View>
              {connected ? (
                <TouchableOpacity onPress={disconnect} style={styles.inlineBtn} testID="settings-disconnect-btn">
                  <Text style={styles.inlineBtnText}>DESCONECTAR</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/devices')} style={[styles.inlineBtn, styles.inlineBtnAccent]} testID="settings-scan-btn">
                  <Text style={[styles.inlineBtnText, { color: '#000' }]}>ESCANEAR</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE DEL DISPOSITIVO</Text>
              <Text style={styles.helper}>Se usará como patrón de búsqueda para identificar tu módulo.</Text>
              <View style={styles.inputRow}>
                <TextInput testID="device-name-input" style={[styles.input, { flex: 1 }]} value={deviceInput} onChangeText={setDeviceInput} placeholder="HC-05 CRASH" placeholderTextColor={COLORS.textDim} autoCapitalize="characters" />
                <TouchableOpacity onPress={saveDeviceName} style={styles.saveInlineBtn} testID="save-device-name-btn">
                  <Text style={styles.saveInlineBtnText}>GUARDAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>

          <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
            <SectionHeader title="EMPRESA / MONITOREO" icon="business" accent />
            {(() => {
              const isGeneral = company?.company_id === "general";
              const linked = !!company?.company_id && !isGeneral;
              if (linked) {
                return (
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusLabel}>VINCULADO</Text>
                      <Text style={styles.statusDevice}>{company.company_name}</Text>
                    </View>
                    <TouchableOpacity onPress={unlinkCompany} style={styles.inlineBtn} testID="company-unlink-btn">
                      <Text style={styles.inlineBtnText}>DESVINCULAR</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return (
                <View style={styles.inputGroup}>
                  {isGeneral ? (
                    <Text style={[styles.helper, { color: COLORS.success, marginBottom: 8 }]}>
                      Cuenta en monitoreo general de C.R.A.S.H. Puedes vincularla a una empresa específica con su token:
                    </Text>
                  ) : (
                    <Text style={styles.label}>TOKEN DE EMPRESA</Text>
                  )}
                  <Text style={styles.helper}>Pídelo a tu empresa. Al ingresarlo, tu cuenta de conductor aparecerá en su centro de monitoreo.</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      testID="company-token-input"
                      style={[styles.input, { flex: 1, letterSpacing: 2 }]}
                      value={companyTokenInput}
                      onChangeText={(v) => setCompanyTokenInput(v.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      placeholderTextColor={COLORS.textDim}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity onPress={linkCompany} disabled={linking} style={[styles.saveInlineBtn, linking && { opacity: 0.6 }]} testID="company-link-btn">
                      {linking ? <ActivityIndicator color="#000" /> : <Text style={styles.saveInlineBtnText}>VINCULAR</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
          </GlassCard>

          <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
            <SectionHeader title={t('settings.language')} icon="globe" accent />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.langBtn, locale === 'es' && styles.langBtnActive]} onPress={() => setLocale('es')}>
                <Text style={[styles.langBtnText, locale === 'es' && styles.langBtnTextActive]}>Español</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langBtn, locale === 'en' && styles.langBtnActive]} onPress={() => setLocale('en')}>
                <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>English</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
            <SectionHeader title="TIEMPO DE CONFIRMACIÓN" icon="timer" />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CUENTA REGRESIVA DE EMERGENCIA</Text>
              <Text style={styles.helper}>Segundos antes de enviar mensajes tras detectar impacto alto.</Text>
              <View style={styles.thresholdRow}>
                <TextInput style={[styles.input, { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '800' }]} value={countdownSeconds} onChangeText={setCountdownSeconds} keyboardType="numeric" />
                <Text style={styles.gSymbol}>s</Text>
              </View>
            </View>
            {!nativeAvailable && (
              <View style={styles.warnBox}>
                <Ionicons name="information-circle" size={14} color={COLORS.info} />
                <Text style={styles.warnBoxText}>Bluetooth real requiere build nativa (expo-dev-client).</Text>
              </View>
            )}
          </GlassCard>

          <GlassCard padding={16} style={{ marginBottom: SPACING.md }}>
            <SectionHeader title="ALERTAS DE IMPACTO" icon="warning" accent />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>UMBRAL DE ALERTA</Text>
              <Text style={styles.helper}>Se envían alertas cuando la fuerza G supere este valor.</Text>
              <View style={styles.thresholdRow}>
                <TextInput testID="threshold-input" style={[styles.input, { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '800' }]} value={threshold} onChangeText={setThreshold} keyboardType="numeric" />
                <Text style={styles.gSymbol}>G</Text>
              </View>
              <View style={styles.thresholdScale}>
                {[{ l: 'Bajo', v: '5' }, { l: 'Medio', v: '10' }, { l: 'Alto', v: '15' }, { l: 'Crítico', v: '20' }].map((t) => (
                  <TouchableOpacity key={t.v} style={[styles.threshBtn, { borderColor: severityColor(parseFloat(t.v)) }]} onPress={() => setThreshold(t.v)}>
                    <Text style={[styles.threshText, { color: severityColor(parseFloat(t.v)) }]}>{t.l}</Text>
                    <Text style={[styles.threshVal, { color: severityColor(parseFloat(t.v)) }]}>{t.v}G</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.info} />
                <Text style={styles.toggleLabel}>Rastreo de ubicación</Text>
              </View>
              <Switch value={locationTrackingEnabled} onValueChange={setLocationTrackingEnabled} trackColor={{ false: '#2A2A34', true: 'rgba(96,165,250,0.4)' }} thumbColor={locationTrackingEnabled ? COLORS.info : '#9A9AA8'} />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelRow}>
                <Ionicons name="call-outline" size={18} color={COLORS.text} />
                <Text style={styles.toggleLabel}>Llamadas automáticas</Text>
              </View>
              <Switch value={autoCall} onValueChange={setAutoCall} trackColor={{ false: '#2A2A34', true: 'rgba(204,255,0,0.4)' }} thumbColor={autoCall ? COLORS.accent : '#9A9AA8'} />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelRow}>
                <Ionicons name="logo-whatsapp" size={18} color={COLORS.success} />
                <Text style={styles.toggleLabel}>Alertas por WhatsApp</Text>
              </View>
              <Switch value={autoWhatsapp} onValueChange={setAutoWhatsapp} trackColor={{ false: '#2A2A34', true: 'rgba(52,211,153,0.4)' }} thumbColor={autoWhatsapp ? COLORS.success : '#9A9AA8'} />
            </View>

            <TouchableOpacity testID="save-settings-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveServer} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : (
                <>
                  <Ionicons name="save" size={16} color="#000" />
                  <Text style={styles.saveBtnText}>GUARDAR ALERTAS</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={() => setLogoutOpen(true)}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Text style={styles.version}>C.R.A.S.H. v1.0</Text>
        </ScrollView>

        <PremiumModal
          visible={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          title="Cerrar sesión"
          eyebrow="C.R.A.S.H. · Cuenta"
          accent={COLORS.primary}
          closeOnBackdrop={false}
        >
          <Text style={{ color: COLORS.textSec, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            ¿Seguro que quieres salir de tu cuenta?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
            <TouchableOpacity
              onPress={() => setLogoutOpen(false)}
              style={{ flex: 1, backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '800', letterSpacing: 0.7 }}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={doLogout}
              style={{ flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', letterSpacing: 1 }}>Sí, salir</Text>
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
    backgroundColor: 'rgba(204,255,0,0.012)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  subtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 4 },
  deviceStatus: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, marginBottom: SPACING.md },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 10, fontWeight: '900', color: COLORS.text, letterSpacing: 1.5 },
  statusDevice: { fontSize: 13, color: COLORS.textSec, marginTop: 2 },
  inlineBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  inlineBtnAccent: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  inlineBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 10, fontWeight: '800', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  helper: { fontSize: 11, color: COLORS.textDim, marginBottom: 8, lineHeight: 16 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, paddingHorizontal: 14, minHeight: 48, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveInlineBtn: { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12 },
  saveInlineBtnText: { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  toggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleLabel: { fontSize: 14, color: COLORS.text },
  warnBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(96,165,250,0.06)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.15)', padding: 10, borderRadius: RADIUS.md, marginTop: 4 },
  warnBoxText: { fontSize: 11, color: COLORS.textSec, flex: 1, lineHeight: 16 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gSymbol: { fontSize: 22, fontWeight: '900', color: COLORS.textSec },
  thresholdScale: { flexDirection: 'row', gap: 8 },
  threshBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', backgroundColor: COLORS.glassBg },
  threshText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  threshVal: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  saveBtn: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...SHADOWS.glow(COLORS.accent) },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.glassBg },
  langBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  langBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSec },
  langBtnTextActive: { color: COLORS.accent },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', marginTop: 8 },
  logoutText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  version: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, marginTop: 12 },
});

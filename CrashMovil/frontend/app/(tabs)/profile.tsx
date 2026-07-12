import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useAlert } from '../../src/context/AlertContext';
import { useI18n } from '../../src/i18n';
import { profileAPI } from '../../src/services/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileScreen() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const { alert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [disabilitiesText, setDisabilitiesText] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const p = await profileAPI.get(token);
      setFullName(p.full_name || '');
      setBloodType(p.blood_type || '');
      setAllergiesText((p.allergies || []).join(', '));
      setConditionsText((p.medical_conditions || []).join(', '));
      setDisabilitiesText((p.disabilities || []).join(', '));
      setNotes(p.emergency_notes || '');
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await profileAPI.update(token, {
        full_name: fullName.trim(),
        blood_type: bloodType,
        allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
        medical_conditions: conditionsText.split(',').map(s => s.trim()).filter(Boolean),
        disabilities: disabilitiesText.split(',').map(s => s.trim()).filter(Boolean),
        emergency_notes: notes.trim(),
      });
      alert({ title: t('common.save'), message: t('profile.saveSuccess') });
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('profile.saveError') });
    } finally { setSaving(false); }
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={GOLD} />}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.profileTitle')}</Text>
            <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
          </View>

          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={26} color={GOLD} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.personalData')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.fullName')}</Text>
              <TextInput testID="profile-fullname-input" style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor={COLORS.textDim} placeholder={t('profile.fullNamePlaceholder')} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.bloodType')}</Text>
              <View style={styles.bloodGrid}>
                {BLOOD_TYPES.map(bt => (
                  <TouchableOpacity key={bt} testID={`blood-type-${bt}`} style={[styles.bloodBtn, bloodType === bt && styles.bloodBtnActive]} onPress={() => setBloodType(bt)}>
                    <Text style={[styles.bloodText, bloodType === bt && styles.bloodTextActive]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.medicalInfo')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.allergies')}</Text>
              <TextInput testID="profile-allergies-input" style={styles.input} value={allergiesText} onChangeText={setAllergiesText} placeholder={t('profile.allergiesPlaceholder')} placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.conditions')}</Text>
              <TextInput testID="profile-conditions-input" style={styles.input} value={conditionsText} onChangeText={setConditionsText} placeholder={t('profile.conditionsPlaceholder')} placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.disabilities')}</Text>
              <TextInput testID="profile-disabilities-input" style={styles.input} value={disabilitiesText} onChangeText={setDisabilitiesText} placeholder={t('profile.disabilitiesPlaceholder')} placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.emergencyNotes')}</Text>
              <TextInput testID="profile-notes-input" style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder={t('profile.notesPlaceholder')} placeholderTextColor={COLORS.textDim} multiline numberOfLines={3} textAlignVertical="top" />
            </View>
          </View>

          <TouchableOpacity testID="save-profile-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : (
              <>
                <Ionicons name="save" size={16} color="#000" />
                <Text style={styles.saveBtnText}>{t('profile.saveBtn')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'rgba(255,215,0,0.008)',
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
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 4 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    marginBottom: SPACING.md,
  },
  userAvatar: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,215,0,0.10)', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  section: {
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: SPACING.md },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, minHeight: 48, color: COLORS.text, fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  textArea: { height: 90, paddingTop: 12 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  bloodBtnActive: { backgroundColor: 'rgba(255,215,0,0.10)', borderColor: GOLD },
  bloodText: { fontSize: 14, fontWeight: '700', color: COLORS.textSec },
  bloodTextActive: { color: GOLD },
  saveBtn: {
    flexDirection: 'row', gap: 8, backgroundColor: GOLD,
    borderRadius: RADIUS.pill, height: 50, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
    ...SHADOWS.glow(GOLD),
  },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});

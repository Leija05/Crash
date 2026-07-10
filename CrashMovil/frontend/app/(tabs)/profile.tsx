import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useAlert } from '../../src/context/AlertContext';
import { profileAPI } from '../../src/services/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileScreen() {
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
      alert({ title: 'Guardado', message: 'Tu perfil médico fue actualizado' });
    } catch (e: any) {
      alert({ title: 'Error', message: e.message });
    } finally { setSaving(false); }
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.accent} />}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>PERFIL MÉDICO</Text>
            <Text style={styles.subtitle}>Esta información se comparte automáticamente con emergencias.</Text>
          </View>

          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={26} color={COLORS.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE COMPLETO</Text>
              <TextInput testID="profile-fullname-input" style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor={COLORS.textDim} placeholder="Tu nombre" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TIPO DE SANGRE</Text>
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
            <Text style={styles.sectionTitle}>INFORMACIÓN MÉDICA</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ALERGIAS (separadas por coma)</Text>
              <TextInput testID="profile-allergies-input" style={styles.input} value={allergiesText} onChangeText={setAllergiesText} placeholder="Penicilina, aspirina..." placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONDICIONES MÉDICAS</Text>
              <TextInput testID="profile-conditions-input" style={styles.input} value={conditionsText} onChangeText={setConditionsText} placeholder="Diabetes, hipertensión..." placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DISCAPACIDADES</Text>
              <TextInput testID="profile-disabilities-input" style={styles.input} value={disabilitiesText} onChangeText={setDisabilitiesText} placeholder="Ninguna" placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOTAS DE EMERGENCIA</Text>
              <TextInput testID="profile-notes-input" style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Información adicional para servicios de emergencia..." placeholderTextColor={COLORS.textDim} multiline numberOfLines={3} textAlignVertical="top" />
            </View>
          </View>

          <TouchableOpacity testID="save-profile-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#000" /> : (
              <>
                <Ionicons name="save" size={16} color="#000" />
                <Text style={styles.saveBtnText}>GUARDAR PERFIL</Text>
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
    backgroundColor: 'rgba(204,255,0,0.01)',
    borderBottomLeftRadius: 120, borderBottomRightRadius: 120,
  },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl + 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: SPACING.md },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 4 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  userAvatar: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: 'rgba(204,255,0,0.15)' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  section: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.textSec, letterSpacing: 2, marginBottom: SPACING.md },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, minHeight: 48, color: COLORS.text, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  textArea: { height: 90, paddingTop: 12 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  bloodBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  bloodText: { fontSize: 14, fontWeight: '700', color: COLORS.textSec },
  bloodTextActive: { color: COLORS.accent },
  saveBtn: {
    flexDirection: 'row', gap: 8, backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md, height: 50, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, ...SHADOWS.glow(COLORS.accent),
  },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});

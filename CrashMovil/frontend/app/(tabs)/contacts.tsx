import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useAlert } from '../../src/context/AlertContext';
import { useI18n } from '../../src/i18n';
import { contactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD } from '../../src/theme';

export default function ContactsScreen() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { alert } = useAlert();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await contactsAPI.list(token);
      setContacts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchContacts(); }, [fetchContacts]));

  const addContact = async () => {
    if (!token || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const created = await contactsAPI.add(token, { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
      setContacts((prev) => [created, ...prev]);
      setName(''); setPhone(''); setRelationship('');
      setShowAdd(false);
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('contacts.addError') });
    } finally { setSubmitting(false); }
  };

  const deleteContact = async (contactId: string) => {
    if (!token) return;
    try {
      await contactsAPI.delete(token, contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (e: any) {
      alert({ title: t('common.error'), message: e.message || t('contacts.deleteError') });
    }
  };

  const renderContact = ({ item }: { item: any }) => (
    <View style={styles.card} testID={`contact-${item.id}`}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: item.verified ? GOLD_SOFT : 'rgba(255,255,255,0.03)' }]}>
          <Ionicons name="person" size={18} color={item.verified ? GOLD : COLORS.textDim} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardPhone}>{item.phone}</Text>
          {item.relationship ? <Text style={styles.cardRel}>{item.relationship}</Text> : null}
        </View>
        <View style={styles.cardActions}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            <Text style={styles.verifiedText}>{t('contacts.active')}</Text>
          </View>
          <TouchableOpacity
            testID={`delete-contact-${item.id}-btn`}
            onPress={() => deleteContact(item.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const GOLD_SOFT = 'rgba(255,215,0,0.10)';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>{t('contacts.title')}</Text>
          <Text style={styles.subtitle}>{contacts.length} {t('contacts.count')}</Text>
        </View>
        <TouchableOpacity testID="add-contact-btn" style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContacts(); }} tintColor={GOLD} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="people-outline" size={32} color={COLORS.textDim} /></View>
              <Text style={styles.emptyText}>{t('contacts.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('contacts.emptyDesc')}</Text>
            </View>
          }
        />
      )}

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('contacts.addContact')}</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} testID="close-add-modal-btn" style={styles.modalClose}>
                <Ionicons name="close" size={20} color={COLORS.textSec} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('contacts.name')}</Text>
              <TextInput testID="contact-name-input" style={styles.input} value={name} onChangeText={setName} placeholder={t('contacts.namePlaceholder')} placeholderTextColor={COLORS.textDim} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('contacts.phone')}</Text>
              <TextInput testID="contact-phone-input" style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('contacts.phonePlaceholder')} placeholderTextColor={COLORS.textDim} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('contacts.relationship')}</Text>
              <TextInput testID="contact-relationship-input" style={styles.input} value={relationship} onChangeText={setRelationship} placeholder={t('contacts.relationshipPlaceholder')} placeholderTextColor={COLORS.textDim} />
            </View>
            <TouchableOpacity testID="submit-contact-btn" style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={addContact} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{t('contacts.submit')}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  addBtn: { backgroundColor: GOLD, width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 80 },
  card: {
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardPhone: { fontSize: 12, color: COLORS.textSec, marginTop: 2, fontFamily: 'monospace' as any },
  cardRel: { fontSize: 11, color: COLORS.textDim, marginTop: 1 },
  cardActions: { alignItems: 'flex-end', gap: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill, backgroundColor: 'rgba(52,211,153,0.08)' },
  verifiedText: { fontSize: 9, fontWeight: '800', color: COLORS.success, letterSpacing: 1 },
  deleteBtn: { padding: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  emptySubtext: { fontSize: 12, color: COLORS.textDim, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: {
    backgroundColor: 'rgba(20,20,28,0.96)',
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,10,10,0.85)', alignItems: 'center', justifyContent: 'center' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, height: 48, color: COLORS.text, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: GOLD, borderRadius: RADIUS.pill, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});

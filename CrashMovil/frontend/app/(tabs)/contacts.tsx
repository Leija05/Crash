import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInRight, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { useAlert } from '../../src/context/AlertContext';
import { useI18n } from '../../src/i18n';
import { contactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD, FONT, FONT_SIZE, ANIMATION } from '../../src/theme';
import GlassCard from '../../src/components/GlassCard';
import { haptics } from '../../src/utils/haptics';

export default function ContactsScreen() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { alert, confirm } = useAlert();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fabAnim = useSharedValue(0);

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
    haptics.medium();
    try {
      const created = await contactsAPI.add(token, { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
      setContacts((prev) => [created, ...prev]);
      setName(''); setPhone(''); setRelationship('');
      setShowAdd(false);
      haptics.success();
    } catch (e: any) {
      haptics.error();
      alert({ title: t('common.error'), message: e.message || t('contacts.addError') });
    } finally { setSubmitting(false); }
  };

  const deleteContact = async (contactId: string) => {
    if (!token) return;
    haptics.warning();
    try {
      await contactsAPI.delete(token, contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (e: any) {
      haptics.error();
      alert({ title: t('common.error'), message: e.message || t('contacts.deleteError') });
    }
  };

  const toWhatsappPhone = (raw: string): string => {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('521')) digits = '52' + digits.slice(3);
    if (digits.length === 10) digits = '52' + digits;
    return digits;
  };

  const verifyContact = async (contact: any) => {
    if (!token) return;
    const phone = toWhatsappPhone(contact.phone);
    const waUrl = `whatsapp://send?phone=${phone}`;
    const opened = await Linking.canOpenURL(waUrl).then((ok) => (ok ? Linking.openURL(waUrl) : Promise.resolve())).then(() => true).catch(() => false);
    haptics.medium();
    const confirmed = await confirm({
      title: t('contacts.verifyTitle'),
      message: t('contacts.verifyConfirm', { phone: contact.phone }),
      confirmText: t('contacts.verifyConfirmBtn'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) return;
    try {
      const updated = await contactsAPI.verify(token, contact.id);
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, ...updated } : c)));
      if (updated?.verified) {
        haptics.success();
        alert({ title: t('contacts.verifiedTitle'), message: t('contacts.verifiedMessage', { name: contact.name }) });
      } else {
        haptics.warning();
        alert({ title: t('contacts.notVerifiedTitle'), message: t('contacts.notVerifiedMessage', { phone: contact.phone }) });
      }
    } catch (e: any) {
      haptics.error();
      alert({ title: t('common.error'), message: e.message || t('contacts.verifyError') });
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const renderContact = ({ item }: { item: any }) => (
    <Animated.View entering={FadeInUp.duration(300).springify().damping(26).stiffness(200)} style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: item.verified ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)' }]}>
          <Ionicons name="person" size={18} color={item.verified ? GOLD : COLORS.textDim} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardPhone}>{item.phone}</Text>
          {item.relationship ? <Text style={styles.cardRel}>{item.relationship}</Text> : null}
        </View>
        <View style={styles.cardActions}>
          {item.verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.verifiedText}>{t('contacts.active')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              testID={`verify-contact-${item.id}-btn`}
              style={styles.verifyBtn}
              onPress={() => verifyContact(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={14} color={GOLD} />
              <Text style={styles.verifyText}>{t('contacts.verify')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID={`delete-contact-${item.id}-btn`}
            onPress={() => deleteContact(item.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      
      <Animated.View entering={FadeInDown.duration(500).springify().damping(26).stiffness(200)} style={styles.headerSection}>
        <View>
          <Text style={styles.title}>{t('contacts.title')}</Text>
          <Text style={styles.subtitle}>{filteredContacts.length} {t('contacts.count')}</Text>
        </View>
        <TouchableOpacity testID="add-contact-btn" style={styles.addBtn} onPress={() => { haptics.light(); setShowAdd(true); fabAnim.value = withSpring(1, ANIMATION.springBouncy); }}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(100).springify().damping(26).stiffness(200)}
        style={styles.searchCard}
      >
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={COLORS.textDim} style={styles.searchIcon} />
          <TextInput
            testID="contacts-search-input"
            style={styles.searchField}
            placeholder={t('contacts.searchPlaceholder')}
            placeholderTextColor={COLORS.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContacts(); }} tintColor={GOLD} />}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.duration(500).delay(200).springify().damping(26).stiffness(200)} style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="people-outline" size={32} color={COLORS.textDim} /></View>
              <Text style={styles.emptyText}>{t('contacts.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('contacts.emptyDesc')}</Text>
            </Animated.View>
          }
        />
      )}

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInRight.duration(300).springify().damping(26).stiffness(200)}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('contacts.addContact')}</Text>
              <TouchableOpacity onPress={() => { haptics.light(); setShowAdd(false); }} testID="close-add-modal-btn" style={styles.modalClose}>
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
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Animated.View
        style={styles.fab}
        entering={FadeIn.duration(500).delay(300).springify().damping(26).stiffness(200)}
      >
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => { haptics.light(); setShowAdd(true); fabAnim.value = withSpring(1, ANIMATION.springBouncy); }}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={28} color="#000" />
        </TouchableOpacity>
      </Animated.View>
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
  title: { fontSize: FONT_SIZE.xl, fontWeight: '900', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSec, marginTop: 2 },
  addBtn: { backgroundColor: GOLD, width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(GOLD) },
  searchCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.glassBorder,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchField: { flex: 1, color: COLORS.text, fontSize: FONT_SIZE.md },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.glassBg, borderRadius: RADIUS.md,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  cardPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textSec, marginTop: 2, fontFamily: FONT.mono },
  cardRel: { fontSize: FONT_SIZE.xs, color: COLORS.textDim, marginTop: 1 },
  cardActions: { alignItems: 'flex-end', gap: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill, backgroundColor: 'rgba(52,211,153,0.08)' },
  verifiedText: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.success, letterSpacing: 1 },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(217,180,91,0.10)',
    borderWidth: 1, borderColor: 'rgba(240,216,154,0.30)',
  },
  verifyText: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: GOLD, letterSpacing: 0.5 },
  deleteBtn: { padding: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.text, fontWeight: '700' },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textDim, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: {
    backgroundColor: 'rgba(20,20,28,0.96)',
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.glassBg, alignItems: 'center', justifyContent: 'center' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, height: 48, color: COLORS.text, fontSize: FONT_SIZE.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: GOLD, borderRadius: RADIUS.pill, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...SHADOWS.glow(GOLD),
  },
  submitText: { color: '#000', fontSize: FONT_SIZE.sm, fontWeight: '900', letterSpacing: 2 },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl + 20,
    right: SPACING.lg,
  },
  fabBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glow(GOLD),
  },
});
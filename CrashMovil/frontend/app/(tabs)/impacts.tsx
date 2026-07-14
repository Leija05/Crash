import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import { impactsAPI } from '../../src/services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD } from '../../src/theme';
import { useTabBarScroll } from '../../src/context/TabBarContext';

function sevColor(s: string) {
  if (s === 'low') return COLORS.success;
  if (s === 'medium') return GOLD;
  if (s === 'high') return '#FB923C';
  return COLORS.danger;
}

export default function ImpactsScreen() {
  const { t } = useI18n();
  const { token } = useAuth();
  const router = useRouter();
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const onTabScroll = useTabBarScroll();

  const fetchImpacts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await impactsAPI.list(token);
      setImpacts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchImpacts(); }, [fetchImpacts]));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderImpact = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50).springify().damping(26).stiffness(200)}>
      <TouchableOpacity
        testID={`impact-item-${item.id}`}
        style={styles.card}
        onPress={() => router.push(`/impact/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={[styles.sevStrip, { backgroundColor: sevColor(item.severity) }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardSeverity, { color: sevColor(item.severity) }]}>
              {item.severity_label || (t(`impacts.severity.${item.severity}`) || item.severity)}
            </Text>
            <Text style={[styles.cardGForce, { color: sevColor(item.severity) }]}>{item.g_force?.toFixed(1)}<Text style={styles.cardGUnit}>G</Text></Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          {item.ai_diagnosis && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={GOLD} />
              <Text style={styles.aiText}>{t('impacts.aiDiagnosis')}</Text>
            </View>
          )}
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <Animated.View entering={FadeInUp.duration(500).springify().damping(26).stiffness(200)} style={styles.headerSection}>
        <View>
          <Text style={styles.title}>{t('impacts.title')}</Text>
          <Text style={styles.countText}>{impacts.length} {t('impacts.count')}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
      ) : (
        <Animated.FlatList
          data={impacts}
          keyExtractor={(item) => item.id}
          renderItem={renderImpact}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchImpacts(); }} tintColor={GOLD} />}
          onScroll={onTabScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="shield-checkmark" size={32} color={COLORS.success} /></View>
              <Text style={styles.emptyText}>{t('impacts.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('impacts.emptyDesc')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'rgba(255,215,0,0.015)',
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
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 6 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  countText: { fontSize: 12, color: COLORS.textSec, marginTop: 4 },
  list: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, paddingBottom: 110 },
  card: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    overflow: 'hidden',
  },
  sevStrip: { width: 4, borderRadius: 2, margin: 6 },
  cardBody: { flex: 1, padding: 14, paddingLeft: 10 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSeverity: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardDate: { fontSize: 11, color: COLORS.textSec, marginTop: 4 },
  cardGForce: { fontSize: 22, fontWeight: '900' },
  cardGUnit: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
  aiBadge: {
    flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,215,0,0.10)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.sm, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  aiText: { fontSize: 9, fontWeight: '800', color: GOLD, letterSpacing: 1 },
  chevronWrap: { justifyContent: 'center', paddingRight: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.06)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  emptySubtext: { fontSize: 12, color: COLORS.textSec, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});

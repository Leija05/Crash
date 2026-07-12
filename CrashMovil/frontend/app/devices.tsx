import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, SHADOWS, GOLD } from '../src/theme';
import { useBluetooth } from '../src/context/BluetoothContext';
import { useI18n } from '../src/i18n';
import type { ScanDevice } from '../src/services/bluetooth';

export default function DevicesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { startDeviceScan, connect, status, statusDetail, disconnect, connected } = useBluetooth();
  const [devices, setDevices] = useState<ScanDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [customName, setCustomName] = useState('');

  const scan = useCallback(async () => {
    setDevices([]);
    setScanning(true);
    await startDeviceScan((newDev) => {
      setDevices((prev) => {
        if (prev.find(d => d.id === newDev.id)) return prev;
        return [...prev, newDev];
      });
    });
    setTimeout(() => setScanning(false), 8000);
  }, [startDeviceScan]);

  useEffect(() => { scan(); }, []);

  const handleConnect = async (id: string) => {
    const ok = await connect(id, customName);
    if (ok) router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('devices.title')}</Text>
        <TouchableOpacity onPress={scan} disabled={scanning} style={styles.refreshBtn}>
          {scanning ? <ActivityIndicator color={GOLD} size="small" /> : <Ionicons name="refresh" size={20} color={GOLD} />}
        </TouchableOpacity>
      </View>

      <View style={styles.nameCard}>
        <Text style={styles.nameLabel}>{t('devices.customName')}</Text>
        <TextInput value={customName} onChangeText={setCustomName} placeholder={t('devices.customNamePlaceholder')} placeholderTextColor={COLORS.textDim} style={styles.nameInput} />
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleConnect(item.id)} activeOpacity={0.7}>
            <View style={styles.bluetoothIcon}>
              <Ionicons name="bluetooth" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceAddr}>{item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bluetooth-outline" size={40} color={COLORS.textDim} />
            <Text style={styles.emptyText}>{t('devices.empty')}</Text>
          </View>
        }
      />
      <Text style={styles.footer}>{t('devices.statusLabel')}: {statusDetail || status}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, paddingTop: SPACING.sm },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: 'rgba(10,10,10,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)' },
  nameCard: {
    backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS.md,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    marginBottom: SPACING.md,
  },
  nameLabel: { color: COLORS.textSec, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  nameInput: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    color: COLORS.text, borderRadius: RADIUS.md, paddingHorizontal: 12,
    paddingVertical: 12, fontSize: 15,
  },
  listContent: { paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.85)', padding: 14, borderRadius: RADIUS.md,
    marginBottom: 8, gap: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
  },
  bluetoothIcon: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,215,0,0.10)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  deviceName: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  deviceAddr: { color: COLORS.textDim, fontSize: 11, marginTop: 2, fontFamily: 'monospace' as any },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', fontSize: 14 },
  footer: { color: COLORS.textDim, fontSize: 10, textAlign: 'center', marginTop: 8 },
});

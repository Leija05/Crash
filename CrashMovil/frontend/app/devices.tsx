import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, interpolateColor, withDelay } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOWS, FONT, FONT_SIZE, GOLD, ANIMATION } from '../src/theme';
import { useBluetooth } from '../src/context/BluetoothContext';
import { useI18n } from '../src/i18n';
import GlassCard from '../src/components/GlassCard';
import type { ScanDevice } from '../src/services/bluetooth';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export default function DevicesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { startDeviceScan, connect, status, statusDetail, disconnect, connected } = useBluetooth();
  const [devices, setDevices] = useState<ScanDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [customName, setCustomName] = useState('');

  const pulseAnim = useSharedValue(0);
  const scanAnim = useSharedValue(0);

  const scan = useCallback(async () => {
    setDevices([]);
    setScanning(true);
    scanAnim.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) })
    );
    await startDeviceScan((newDev) => {
      setDevices((prev) => {
        if (prev.find((d) => d.id === newDev.id)) return prev;
        return [...prev, newDev];
      });
    });
    setTimeout(() => setScanning(false), 8000);
  }, [startDeviceScan]);

  useEffect(() => {
    scan();
  }, []);

  useEffect(() => {
    if (scanning) {
      pulseAnim.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }, () => {
        pulseAnim.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) });
      });
      const interval = setInterval(() => {
        if (scanning) {
          pulseAnim.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }, () => {
            pulseAnim.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) });
          });
        }
      }, 2000);
      return () => clearInterval(interval);
    }
    pulseAnim.value = 0;
  }, [scanning]);

  const handleConnect = async (id: string) => {
    const ok = await connect(id, customName);
    if (ok) router.replace('/(tabs)');
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
    transform: [{ scale: interpolateColor(pulseAnim.value, [0, 1], [0.8, 1.3]) }],
  }));

  const scanIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanAnim.value * 360}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />

      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        style={styles.header}
      >
        <Text style={styles.title}>{t('devices.title')}</Text>
        <TouchableOpacity onPress={scan} disabled={scanning} style={styles.refreshBtn} activeOpacity={0.7}>
          <AnimatedIonicons
            name={scanning ? 'refresh' : 'refresh'}
            size={20}
            color={GOLD}
            style={[styles.refreshIcon, scanIconStyle]}
          />
          {scanning && <ActivityIndicator color={GOLD} size="small" />}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(100).springify()}
        style={styles.nameCard}
      >
        <Text style={styles.nameLabel}>{t('devices.customName')}</Text>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder={t('devices.customNamePlaceholder')}
          placeholderTextColor={COLORS.textDim}
          style={styles.nameInput}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(200).springify()}
        style={styles.scannerCard}
      >
        <View style={styles.scannerCenter}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} pointerEvents="none" />
          <Animated.View style={[styles.pulseRing, pulseStyle]} pointerEvents="none" />
          <View style={styles.bluetoothIcon}>
            <Ionicons name="bluetooth" size={32} color={GOLD} />
          </View>
          <Animated.View style={[styles.pulseRing, pulseStyle]} pointerEvents="none" />
        </View>
        <Text style={styles.scannerText}>
          {scanning ? t('devices.scanning') : t('devices.tapToScan')}
        </Text>
        <Text style={styles.scannerSubtext}>
          {scanning ? t('devices.searchingDevices') : t('devices.pullToRefresh')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(300).springify()}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{t('devices.foundDevices')}</Text>
        <Text style={styles.sectionCount}>{devices.length} {t('devices.count')}</Text>
      </Animated.View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInUp.duration(300).delay(index * 50).springify().damping(24)}
            style={styles.listItem}
          >
            <TouchableOpacity
              testID={`device-item-${item.id}`}
              style={styles.deviceCard}
              onPress={() => handleConnect(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.bluetoothIcon}>
                <Ionicons name="bluetooth" size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceAddr}>{item.id}</Text>
                <View style={styles.deviceMeta}>
                  <Text style={styles.deviceRssi}>{item.rssi} dBm</Text>
                  {item.isCrashDevice && (
                    <View style={styles.crashBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={GOLD} />
                      <Text style={styles.crashBadgeText}>{t('devices.crashHelmet')}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
            </TouchableOpacity>
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Animated.View
            entering={FadeInUp.duration(500).delay(400).springify()}
            style={styles.empty}
          >
            <View style={styles.emptyIcon}>
              <Ionicons name="bluetooth-outline" size={40} color={COLORS.textDim} />
            </View>
            <Text style={styles.emptyText}>{t('devices.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('devices.emptyDesc')}</Text>
          </Animated.View>
        }
      />

      <Animated.View
        entering={FadeInUp.duration(500).delay(500).springify()}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          {t('devices.statusLabel')}: {statusDetail || status}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(255,215,0,0.012)',
    borderBottomLeftRadius: 140,
    borderBottomRightRadius: 140,
  },
  goldGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,215,0,0.035)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: FONT.headingBold,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  refreshIcon: {
    marginRight: 4,
  },
  nameCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
  },
  nameLabel: {
    color: COLORS.textSec,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nameInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    color: COLORS.text,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
  },
  scannerCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  scannerCenter: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: GOLD,
    opacity: 0,
  },
  bluetoothIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    zIndex: 1,
    ...SHADOWS.glow(GOLD, 0.2, 20),
  },
  scannerText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  scannerSubtext: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: COLORS.textSec,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: FONT_SIZE.sm,
    color: GOLD,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  listItem: {},
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  bluetoothIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  deviceName: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  deviceAddr: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    fontFamily: FONT.mono,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  deviceRssi: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    fontFamily: FONT.mono,
  },
  crashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  crashBadgeText: {
    color: GOLD,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptySubtext: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
});
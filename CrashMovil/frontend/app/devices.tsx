import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, interpolate, Extrapolate, withDelay } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, SHADOWS, FONT, FONT_SIZE, GOLD, ANIMATION } from '../src/theme';
import { useBluetooth } from '../src/context/BluetoothContext';
import { useI18n } from '../src/i18n';
import GlassCard from '../src/components/GlassCard';
import type { ScanDevice } from '../src/services/bluetooth';
import { haptics } from '../src/utils/haptics';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function signalStrength(rssi?: number): number {
  if (rssi == null) return 1;
  if (rssi >= -60) return 3;
  if (rssi >= -75) return 2;
  return 1;
}

export default function DevicesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { startDeviceScan, connect, status, statusDetail, disconnect, connected, deviceName: connectedName } = useBluetooth();
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
    haptics.medium();
    const ok = await connect(id, customName);
    if (ok) { haptics.success(); router.replace('/(tabs)'); }
    else haptics.error();
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [0.8, 1.3], Extrapolate.CLAMP) }],
  }));

  const scanIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanAnim.value * 360}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />

      <Animated.View
        entering={FadeInDown.duration(500).springify().damping(26).stiffness(200)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>C.R.A.S.H.</Text>
          <Text style={styles.title}>{t('devices.title')}</Text>
        </View>
        <TouchableOpacity onPress={() => { haptics.light(); scan(); }} disabled={scanning} style={styles.refreshBtn} activeOpacity={0.7}>
          {scanning ? (
            <ActivityIndicator color={GOLD} size="small" />
          ) : (
            <AnimatedIonicons name="refresh" size={20} color={GOLD} style={scanIconStyle} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(80).springify().damping(26).stiffness(200)}>
        <View style={[styles.statusCard, connected ? styles.statusCardOn : styles.statusCardOff]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.textDim }]}>
            <View style={[styles.statusDotCore, { backgroundColor: connected ? COLORS.success : COLORS.textDim }]} />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusTitle, { color: connected ? COLORS.success : COLORS.textSec }]}>
              {connected ? t('devices.connectedTitle') : t('devices.disconnectedTitle')}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {connected
                ? (connectedName || t('devices.connectedSubtitle'))
                : t('devices.disconnectedSubtitle')}
            </Text>
          </View>
          <Ionicons
            name={connected ? 'checkmark-circle' : 'bluetooth-outline'}
            size={22}
            color={connected ? COLORS.success : COLORS.textDim}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(140).springify().damping(26).stiffness(200)}
        style={styles.nameCard}
      >
        <Text style={styles.nameLabel}>{t('devices.customName')}</Text>
        <View style={styles.inputRow}>
          <Ionicons name="create-outline" size={18} color={COLORS.textDim} />
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder={t('devices.customNamePlaceholder')}
            placeholderTextColor={COLORS.textDim}
            style={styles.nameInput}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(200).springify().damping(26).stiffness(200)}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { haptics.light(); scan(); }}
          disabled={scanning}
          style={styles.scannerCard}
        >
          <View style={styles.scannerCenter}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} pointerEvents="none" />
            <Animated.View style={[styles.pulseRingWide, pulseStyle]} pointerEvents="none" />
            <View style={styles.bluetoothIcon}>
              <AnimatedIonicons name="bluetooth" size={34} color={GOLD} style={scanIconStyle} />
            </View>
          </View>
          <Text style={styles.scannerText}>
            {scanning ? t('devices.scanning') : t('devices.tapToScan')}
          </Text>
          <Text style={styles.scannerSubtext}>
            {scanning ? t('devices.searchingDevices') : t('devices.scanCta')}
          </Text>
          {scanning && (
            <View style={styles.scanningPill}>
              <ActivityIndicator color={GOLD} size="small" />
              <Text style={styles.scanningPillText}>{t('devices.searchingDevices')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(300).springify().damping(26).stiffness(200)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{t('devices.foundDevices')}</Text>
        <View style={styles.countPill}>
          <Text style={styles.sectionCount}>{devices.length}</Text>
          <Text style={styles.countLabel}>{t('devices.count')}</Text>
        </View>
      </Animated.View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const bars = signalStrength(item.rssi);
          return (
            <Animated.View
              entering={FadeInUp.duration(300).delay(index * 50).springify().damping(26).stiffness(200)}
            >
              <TouchableOpacity
                testID={`device-item-${item.id}`}
                style={[styles.deviceCard, item.isCrashDevice && styles.deviceCardCrash]}
                onPress={() => handleConnect(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.deviceIcon, item.isCrashDevice && styles.deviceIconCrash]}>
                  <Ionicons name={item.isCrashDevice ? 'shield-checkmark' : 'bluetooth'} size={20} color={GOLD} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.deviceAddr} numberOfLines={1}>{item.id}</Text>
                  <View style={styles.deviceMeta}>
                    <View style={styles.signalBars}>
                      {[0, 1, 2].map((b) => (
                        <View
                          key={b}
                          style={[
                            styles.signalBar,
                            { height: 6 + b * 4 },
                            b < bars ? styles.signalBarOn : styles.signalBarOff,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.deviceRssi}>{item.rssi ?? '--'} dBm</Text>
                    {item.isCrashDevice && (
                      <View style={styles.crashBadge}>
                        <Ionicons name="shield-checkmark" size={10} color={GOLD} />
                        <Text style={styles.crashBadgeText}>{t('devices.crashHelmet')}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.connectChip}>
                  <Ionicons name="chevron-forward" size={16} color={GOLD} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          devices.length > 0 ? (
            <Text style={styles.connectHint}>{t('devices.connectHint')}</Text>
          ) : null
        }
        ListEmptyComponent={
          <Animated.View
            entering={FadeInUp.duration(500).delay(400).springify().damping(26).stiffness(200)}
            style={styles.empty}
          >
            <View style={styles.emptyIcon}>
              <Ionicons name={scanning ? 'search' : 'bluetooth-outline'} size={40} color={COLORS.textDim} />
            </View>
            <Text style={styles.emptyText}>{scanning ? t('devices.scanning') : t('devices.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('devices.emptyDesc')}</Text>
          </Animated.View>
        }
      />

      <Animated.View
        entering={FadeInUp.duration(500).delay(500).springify().damping(26).stiffness(200)}
        style={styles.footer}
      >
        <View style={styles.footerDot} />
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
    backgroundColor: 'rgba(217,180,91,0.012)',
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
    backgroundColor: 'rgba(217,180,91,0.035)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: GOLD,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: FONT.headingBold,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  statusCardOn: {
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderColor: 'rgba(52,199,89,0.28)',
    ...SHADOWS.glow(COLORS.success, 0.18, 16),
  },
  statusCardOff: {
    backgroundColor: COLORS.glassBg,
    borderColor: COLORS.glassBorder,
  },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  statusDotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statusSubtitle: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  nameCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.lg,
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
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  nameInput: {
    flex: 1,
    color: COLORS.text,
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
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: GOLD,
    opacity: 0,
  },
  pulseRingWide: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: GOLD,
    opacity: 0,
  },
  bluetoothIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(217,180,91,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.24)',
    zIndex: 1,
    ...SHADOWS.glow(GOLD, 0.25, 22),
  },
  scannerText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scannerSubtext: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(217,180,91,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.20)',
  },
  scanningPillText: {
    color: GOLD,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  countPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(217,180,91,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.18)',
  },
  sectionCount: {
    fontSize: FONT_SIZE.md,
    color: GOLD,
    fontWeight: '900',
  },
  countLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDim,
    fontWeight: '600',
  },
  connectHint: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    marginBottom: 10,
    paddingHorizontal: SPACING.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBg,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  deviceCardCrash: {
    borderColor: 'rgba(217,180,91,0.30)',
    backgroundColor: 'rgba(217,180,91,0.05)',
    ...SHADOWS.glow(GOLD, 0.15, 14),
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(217,180,91,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.18)',
  },
  deviceIconCrash: {
    backgroundColor: 'rgba(217,180,91,0.20)',
    borderColor: 'rgba(217,180,91,0.35)',
  },
  deviceInfo: {
    flex: 1,
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
    marginTop: 8,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
  },
  signalBarOn: {
    backgroundColor: GOLD,
  },
  signalBarOff: {
    backgroundColor: 'rgba(217,180,91,0.20)',
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
    backgroundColor: 'rgba(217,180,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.2)',
  },
  crashBadgeText: {
    color: GOLD,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(217,180,91,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,180,91,0.18)',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  footerText: {
    color: COLORS.textDim,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
});

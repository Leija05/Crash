import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { CrashLogoSVG, CrashLogoIcon } from '../src/components/CrashLogo';
import { COLORS, GOLD, FONT, FONT_SIZE, SPACING, SHADOWS } from '../src/theme';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />
      <View style={styles.goldGlow} pointerEvents="none" />
      <View style={styles.topGoldLine} pointerEvents="none" />

      <Animated.View entering={FadeInDown.duration(800).springify().damping(20)} style={styles.logoWrapper}>
        <Animated.View
          entering={FadeIn.duration(1000).delay(200).springify().damping(18)}
          style={styles.logoContainer}
        >
          <CrashLogoIcon size={96} color={GOLD} />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(400).springify()} style={styles.titleGroup}>
        <Text style={styles.title}>C.R.A.S.H.</Text>
        <Text style={styles.subtitle}>CRITICAL RESPONSE ALERT SYSTEM FOR HELMETS</Text>
      </Animated.View>

      <Animated.View entering={SlideInUp.duration(600).delay(600).springify()} style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={GOLD} />
        <Text style={styles.loadingText}>Inicializando telemetría...</Text>
      </Animated.View>

      <Text style={styles.version}>v3.0 · Gold Edition</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGoldLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: GOLD,
    zIndex: 10,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: 'rgba(255,215,0,0.02)',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  goldGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,215,0,0.04)',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(GOLD, 0.25, 30),
  },
  titleGroup: {
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 8,
    fontFamily: FONT.headingBold,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontFamily: FONT.body,
  },
  loaderWrap: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONT.body,
  },
  version: {
    position: 'absolute',
    bottom: SPACING.xl,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDim,
    letterSpacing: 2,
    fontFamily: FONT.body,
  },
});
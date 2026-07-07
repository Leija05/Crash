import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme';

interface CrashLogoProps {
  size?: number;
  color?: string;
}

export function CrashLogo({ size = 36, color = COLORS.primary }: CrashLogoProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="flash" size={size * 0.7} color={color} />
    </View>
  );
}

export function CrashLogoFull({ size = 28 }: { size?: number }) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoBox,
          {
            width: size + 14,
            height: size + 14,
            borderRadius: (size + 14) / 3.5,
          },
        ]}
      >
        <Ionicons
          name="flash"
          size={size * 0.6}
          color={COLORS.primary}
        />
      </View>
      <View>
        <Text style={styles.badge}>CRITICAL RESPONSE</Text>
        <Text style={[styles.name, { fontSize: size > 30 ? 16 : 13 }]}>
          C.R.A.S.H.
        </Text>
      </View>
    </View>
  );
}

export function CrashLogoIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size + 8,
        height: size + 8,
        borderRadius: (size + 8) / 3,
        borderWidth: 1,
        borderColor: 'rgba(255,59,48,0.3)',
        backgroundColor: 'rgba(255,59,48,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="flash" size={size * 0.55} color={color || COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    backgroundColor: 'rgba(255,59,48,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.textDim,
    fontWeight: '700',
  },
  name: {
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.text,
  },
});
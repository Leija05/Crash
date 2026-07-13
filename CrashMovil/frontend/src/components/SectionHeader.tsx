import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT, FONT_SIZE, GOLD, SHADOWS } from '../theme';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  accent?: boolean;
  action?: React.ReactNode;
  subtitle?: string;
}

export default function SectionHeader({ title, icon, accent = false, action, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && (
          <View style={[styles.iconBox, accent && styles.iconBoxAccent]}>
            <Ionicons name={icon} size={16} color={accent ? GOLD : COLORS.textSec} />
          </View>
        )}
        <View>
          <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxAccent: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  title: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: COLORS.textSec,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: GOLD,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDim,
    marginTop: 1,
  },
});
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme';

export function BrandLogo({ size = 46, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <View
      style={[
        styles.brandBadge,
        { width: size, height: size, borderRadius: size * 0.28, borderColor: 'rgba(255,59,48,0.35)' },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,59,48,0.12)' }]} />
      <Ionicons name="shield-checkmark" size={size * 0.5} color={color} />
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose?: () => void;
  title: string;
  eyebrow?: string;
  accent?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
};

export default function PremiumModal({
  visible,
  onClose,
  title,
  eyebrow,
  accent = COLORS.primary,
  children,
  footer,
  closeOnBackdrop = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeOnBackdrop ? onClose : undefined}
        />
        <View style={styles.dialog} onStartShouldSetResponder={() => true}>
          <View style={[styles.glow, { backgroundColor: accent }]} pointerEvents="none" />
          <View style={styles.header}>
            <BrandLogo size={46} />
            <View style={{ flex: 1 }}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
            </View>
            {onClose ? (
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textDim} />
              </TouchableOpacity>
            ) : null}
          </View>
          {children ? <View style={styles.body}>{children}</View> : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(20,20,28,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  glow: {
    position: 'absolute',
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.06,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  brandBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  eyebrow: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: { color: COLORS.text, fontSize: 19, fontWeight: '900', textAlign: 'left' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  body: { width: '100%', alignItems: 'center' },
  footer: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 16 },
});

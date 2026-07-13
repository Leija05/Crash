import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, FONT, GOLD } from '../theme';

export type AlertKind = 'alert' | 'confirm' | 'prompt';

export type AlertConfig = {
  kind: AlertKind;
  title: string;
  message?: string;
  eyebrow?: string;
  accent?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  placeholder?: string;
  defaultValue?: string;
  secureTextEntry?: boolean;
  inputLabel?: string;
  onClose: (value: unknown) => void;
};

type Props = AlertConfig;

export function BrandMark({ size = 52, color = GOLD }: { size?: number; color?: string }) {
  return (
    <View
      style={[
        styles.brandBadge,
        { width: size, height: size, borderRadius: size * 0.3, borderColor: 'rgba(200,162,60,0.4)' },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(200,162,60,0.14)' }]} />
      <Ionicons name="shield-checkmark" size={size * 0.5} color={color} />
    </View>
  );
}

export default function FullScreenAlert({
  kind,
  title,
  message,
  eyebrow = 'C.R.A.S.H.',
  accent = GOLD,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false,
  placeholder,
  defaultValue = '',
  secureTextEntry = false,
  inputLabel,
  onClose,
}: Props) {
  const [text, setText] = useState(defaultValue);
  const accentColor = destructive ? COLORS.danger : accent;

  const handleConfirm = () => {
    if (kind === 'prompt') onClose(text.trim());
    else if (kind === 'confirm') onClose(true);
    else onClose(undefined);
  };

  const handleCancel = () => {
    if (kind === 'prompt') onClose(null);
    else if (kind === 'confirm') onClose(false);
    else onClose(undefined);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <View style={[styles.glow, { backgroundColor: accentColor }]} pointerEvents="none" />
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <BrandMark size={56} color={accentColor} />
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {kind === 'prompt' ? (
                <View style={styles.inputWrap}>
                  {inputLabel ? <Text style={styles.inputLabel}>{inputLabel}</Text> : null}
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textDim}
                    secureTextEntry={secureTextEntry}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleConfirm}
                  />
                </View>
              ) : null}

              <View style={styles.actions}>
                {kind !== 'alert' ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.btnText, styles.btnGhostText]}>{cancelText}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.btn,
                    destructive ? styles.btnDanger : styles.btnPrimary,
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnText, styles.btnPrimaryText]}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  brandBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  eyebrow: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: FONT.headingBold,
    marginTop: 6,
  },
  message: {
    color: COLORS.textSec,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  inputWrap: { width: '100%', marginTop: SPACING.lg },
  inputLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
  },
  actions: { width: '100%', marginTop: SPACING.lg, gap: SPACING.sm },
  btn: {
    width: '100%',
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: GOLD },
  btnDanger: { backgroundColor: COLORS.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.borderStrong },
  btnText: { fontSize: 16, fontWeight: '800' },
  btnPrimaryText: { color: '#000' },
  btnGhostText: { color: COLORS.textSec },
});

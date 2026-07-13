import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn } from 'react-native-reanimated';
import PremiumModal from './PremiumModal';
import GlassButton from './GlassButton';
import { installApk } from '../native/ApkInstaller';
import { API_BASE, versionsAPI } from '../services/api';
import { useI18n } from '../i18n';
import { COLORS, RADIUS, SPACING, SHADOWS, FONT, FONT_SIZE, GOLD } from '../theme';

export type UpdateInfo = {
  version?: string;
  download_url?: string;
  notes?: string;
  mandatory?: boolean;
  platform?: string;
};

type Props = {
  visible: boolean;
  info: UpdateInfo | null;
  localVersion: string;
  onClose: () => void;
  onDismiss: () => void;
};

type Phase = 'idle' | 'downloading' | 'verifying' | 'installing' | 'done' | 'error';

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UpdateDownloader({ visible, info, localVersion, onClose, onDismiss }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const prog = useSharedValue(0);
  const totalRef = useRef(0);
  const lastRef = useRef({ time: 0, bytes: 0 });

  const animatedRing = useAnimatedStyle(() => ({ transform: [{ rotate: `${prog.value * 360}deg` }] }));

  const reset = () => {
    setPhase('idle');
    setProgress(0);
    setSpeed(0);
    setEta(0);
    setErrorMsg('');
    prog.value = withTiming(0, { duration: 300 });
  };

  const startDownload = async () => {
    if (!info?.download_url) return;
    setPhase('downloading');
    setProgress(0);
    setErrorMsg('');

    const url = info.download_url.startsWith('/') ? `${API_BASE}${info.download_url}` : info.download_url;
    const dest = `${FileSystem.cacheDirectory}crash-update-${info.version || 'latest'}.apk`;
    totalRef.current = 0;
    lastRef.current = { time: Date.now(), bytes: 0 };

    try {
      const res = await FileSystem.downloadAsync(url, dest, {
        downloadProgressCallback: (p) => {
          totalRef.current = p.totalBytes > 0 ? p.totalBytes : totalRef.current;
          const now = Date.now();
          const dt = (now - lastRef.current.time) / 1000;
          if (dt >= 0.4) {
            const db = p.totalBytesWritten - lastRef.current.bytes;
            setSpeed(db / dt);
            if (totalRef.current > 0) {
              const remaining = totalRef.current - p.totalBytesWritten;
              setEta(db > 0 ? remaining / (db / dt) : 0);
            }
            lastRef.current = { time: now, bytes: p.totalBytesWritten };
          }
          const ratio = totalRef.current > 0 ? p.totalBytesWritten / totalRef.current : 0;
          setProgress(ratio);
          prog.value = withTiming(ratio, { duration: 150 });
        },
      });

      if (!res.uri || !res.uri.endsWith('.apk')) {
        throw new Error('El archivo recibido no es un APK válido');
      }

      setPhase('verifying');
      await new Promise((r) => setTimeout(r, 500));

      setPhase('installing');
      await installApk(res.uri.replace('file://', ''));
      setPhase('done');
    } catch (e: any) {
      setErrorMsg(e?.message || t('update.errorGeneric', 'No se pudo completar la descarga'));
      setPhase('error');
    }
  };

  const mandatory = !!info?.mandatory;

  return (
    <PremiumModal
      visible={visible}
      onClose={mandatory && phase !== 'done' ? undefined : onClose}
      eyebrow={t('update.eyebrow', 'Nueva versión')}
      title={t('update.title', 'Actualización disponible')}
      closeOnBackdrop={false}
      footer={
        phase === 'downloading' || phase === 'verifying' || phase === 'installing' ? (
          <View style={styles.statusBar}>
            <View style={[styles.statusDot, { backgroundColor: GOLD }]} />
            <Text style={styles.statusText}>
              {phase === 'downloading' && t('update.downloading', 'Descargando…')}
              {phase === 'verifying' && t('update.verifying', 'Verificando…')}
              {phase === 'installing' && t('update.installing', 'Instalando…')}
            </Text>
          </View>
        ) : phase === 'error' ? (
          <>
            {!mandatory && (
              <GlassButton title={t('update.later', 'Más tarde')} onPress={onDismiss} variant="ghost" size="md" style={{ flex: 1 }} />
            )}
            <GlassButton title={t('update.retry', 'Reintentar')} onPress={startDownload} variant="accent" icon="refresh" size="md" style={{ flex: 1.4 }} />
          </>
        ) : phase === 'done' ? (
          <GlassButton title={t('common.ok', 'OK')} onPress={onClose} variant="accent" size="md" style={{ flex: 1 }} />
        ) : (
          <>
            {!mandatory && (
              <GlassButton title={t('update.later', 'Más tarde')} onPress={onDismiss} variant="ghost" size="md" style={{ flex: 1 }} />
            )}
            <GlassButton title={t('update.download', 'Actualizar')} onPress={startDownload} variant="accent" icon="download-outline" size="md" style={{ flex: mandatory ? 1 : 1.4 }} />
          </>
        )
      }
    >
      <View style={styles.body}>
        <View style={styles.versionRow}>
          <Text style={styles.versionOld}>v{localVersion}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.versionNew}>v{info?.version}</Text>
        </View>

        {(phase === 'downloading' || phase === 'verifying' || phase === 'installing' || phase === 'done') && (
          <View style={styles.ringWrap}>
            <Animated.View style={[styles.ringTrack]} />
            <Animated.View style={[styles.ringFill, animatedRing]} />
            <View style={styles.ringCenter}>
              {phase === 'done' ? (
                <Animated.View entering={FadeIn} style={[styles.checkBadge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </Animated.View>
              ) : (
                <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
              )}
            </View>
          </View>
        )}

        {phase === 'downloading' && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{humanBytes(progress * (totalRef.current || 0))}{totalRef.current > 0 ? ` / ${humanBytes(totalRef.current)}` : ''}</Text>
            <Text style={styles.metaText}>{speed > 0 ? `${humanBytes(speed)}/s` : ''}</Text>
          </View>
        )}
        {phase === 'downloading' && eta > 0 && (
          <Text style={styles.eta}>{t('update.eta', 'Tiempo restante ~{{s}}s', { s: Math.ceil(eta) })}</Text>
        )}

        <Text style={styles.desc}>
          {mandatory
            ? t('update.mandatoryDesc', 'Esta actualización es obligatoria para seguir usando C.R.A.S.H.')
            : t('update.optionalDesc', 'Hay una nueva versión de C.R.A.S.H. disponible para descargar.')}
        </Text>

        {info?.notes ? <Text style={styles.notes}>{info.notes}</Text> : null}
        {phase === 'error' ? <Text style={styles.error}>{errorMsg}</Text> : null}
      </View>
    </PremiumModal>
  );
}

const styles = StyleSheet.create({
  body: { width: '100%', alignItems: 'center', gap: 12 },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionOld: { color: COLORS.textDim, fontSize: 15, fontWeight: '700' },
  arrow: { color: COLORS.textSec, fontSize: 15 },
  versionNew: { color: GOLD, fontSize: 18, fontWeight: '900' },
  desc: { color: COLORS.textSec, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  notes: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    width: '100%',
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  statusText: { color: COLORS.textSec, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  ringWrap: {
    width: 132, height: 132, alignItems: 'center', justifyContent: 'center',
    marginVertical: 6,
  },
  ringTrack: {
    position: 'absolute', width: 132, height: 132, borderRadius: 66,
    borderWidth: 8, borderColor: 'rgba(217,180,91,0.12)',
  },
  ringFill: {
    position: 'absolute', width: 132, height: 132, borderRadius: 66,
    borderWidth: 8, borderColor: 'transparent',
    borderTopColor: GOLD, borderRightColor: GOLD,
  },
  ringCenter: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(217,180,91,0.06)',
  },
  percent: { color: GOLD, fontSize: 26, fontWeight: '900' },
  checkBadge: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glow(COLORS.success, 0.4, 16),
  },
  checkMark: { color: '#fff', fontSize: 30, fontWeight: '900' },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingHorizontal: 8,
  },
  metaText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600' },
  eta: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
});

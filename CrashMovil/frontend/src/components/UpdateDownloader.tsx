import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, FadeIn } from 'react-native-reanimated';
import PremiumModal from './PremiumModal';
import GlassButton from './GlassButton';
import { installApk, openInstallPermissionSettings } from '../native/ApkInstaller';
import { API_BASE, versionsAPI } from '../services/api';
import { useI18n } from '../i18n';
import { COLORS, RADIUS, SHADOWS, FONT, RED } from '../theme';

export type UpdateInfo = {
  version?: string;
  download_url?: string;
  notes?: string;
  mandatory?: boolean;
  platform?: string;
  size_mb?: number;
};

type Props = {
  visible: boolean;
  info: UpdateInfo | null;
  localVersion: string;
  onClose: () => void;
  onDismiss: () => void;
};

type Phase = 'idle' | 'downloading' | 'verifying' | 'installing' | 'done' | 'error';

const RING = 150;
const STROKE = 10;
const RADIUS_RING = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS_RING;

function humanBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UpdateDownloader({ visible, info, localVersion, onClose, onDismiss }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [bytesWritten, setBytesWritten] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);

  const totalRef = useRef(0);
  const lastRef = useRef({ time: 0, bytes: 0 });
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const downloadedApkPathRef = useRef<string | null>(null);

  const centerScale = useAnimatedStyle(() => ({
    transform: [{ scale: phase === 'done' ? 1.06 : 1 }],
  }));

  // Cancelar descarga activa si el modal se cierra o desmonta
  useEffect(() => {
    return () => {
      if (downloadResumableRef.current) {
        downloadResumableRef.current.cancelAsync().catch(() => {});
        downloadResumableRef.current = null;
      }
    };
  }, []);

  const reset = () => {
    setPhase('idle');
    setProgress(0);
    setBytesWritten(0);
    setSpeed(0);
    setEta(0);
    setErrorMsg('');
    setNeedsPermission(false);
  };

  const handleInstallLocal = async (apkPath: string) => {
    setPhase('installing');
    setErrorMsg('');
    try {
      const rawPath = apkPath.replace(/^file:\/\//, '');
      await installApk(rawPath);
      setPhase('done');
    } catch (e: any) {
      const msg = e?.message || 'No se pudo iniciar la instalación';
      if (msg.includes('PERMISSION') || msg.includes('autorizar') || msg.includes('Ajustes')) {
        setNeedsPermission(true);
      }
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  const startDownload = async () => {
    if (!info?.download_url) return;

    // Si ya fue descargado previamente y el archivo existe y es válido, intentar instalar directamente
    if (downloadedApkPathRef.current) {
      try {
        const check = await FileSystem.getInfoAsync(downloadedApkPathRef.current);
        if (check.exists && check.size && check.size > 1024 * 1024) {
          await handleInstallLocal(downloadedApkPathRef.current);
          return;
        }
      } catch {}
    }

    setPhase('downloading');
    setProgress(0);
    setBytesWritten(0);
    setErrorMsg('');
    setNeedsPermission(false);

    const url = info.download_url.startsWith('/') ? `${API_BASE}${info.download_url}` : info.download_url;
    const dest = `${FileSystem.cacheDirectory || ''}crash-update-${info.version || 'latest'}.apk`;

    // Tamaño inicial estimado si el backend lo proporciona
    const estimatedTotal = (info.size_mb && info.size_mb > 0) ? Math.round(info.size_mb * 1024 * 1024) : 0;
    totalRef.current = estimatedTotal;
    lastRef.current = { time: Date.now(), bytes: 0 };

    try {
      // Limpiar archivo previo en caché si existía para evitar corrupción
      try {
        const infoCheck = await FileSystem.getInfoAsync(dest);
        if (infoCheck.exists) {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        }
      } catch {}

      // Crear tarea de descarga con callback de progreso en tiempo real
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        dest,
        {},
        (p: FileSystem.DownloadProgressData) => {
          const written = p.totalBytesWritten || 0;
          const expected = p.totalBytesExpectedToWrite;

          if (expected > 0) {
            totalRef.current = expected;
          }

          setBytesWritten(written);

          const now = Date.now();
          const dt = (now - lastRef.current.time) / 1000;
          if (dt >= 0.25) {
            const db = written - lastRef.current.bytes;
            if (db > 0 && dt > 0) {
              const curSpeed = db / dt;
              setSpeed(curSpeed);
              if (totalRef.current > 0) {
                const remaining = totalRef.current - written;
                setEta(remaining > 0 ? remaining / curSpeed : 0);
              }
            }
            lastRef.current = { time: now, bytes: written };
          }

          if (totalRef.current > 0) {
            const ratio = Math.min(Math.max(written / totalRef.current, 0), 1);
            setProgress(ratio);
          }
        }
      );

      downloadResumableRef.current = downloadResumable;
      const res = await downloadResumable.downloadAsync();
      downloadResumableRef.current = null;

      if (!res || !res.uri) {
        throw new Error('La descarga falló o el archivo no fue guardado');
      }

      setPhase('verifying');
      setProgress(1);

      // Verificación de integridad básica
      const verified = await FileSystem.getInfoAsync(res.uri);
      if (!verified.exists) {
        throw new Error('No se encontró el archivo APK descargado');
      }
      if (!verified.size || verified.size < 1024 * 1024) {
        throw new Error(`El archivo descargado está incompleto (${humanBytes(verified.size || 0)})`);
      }

      downloadedApkPathRef.current = res.uri;

      // Iniciar instalación nativa
      await handleInstallLocal(res.uri);
    } catch (e: any) {
      downloadResumableRef.current = null;
      const msg = e?.message || t('update.errorGeneric', 'No se pudo completar la descarga');
      if (msg.includes('PERMISSION') || msg.includes('autorizar') || msg.includes('Ajustes')) {
        setNeedsPermission(true);
      }
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  const mandatory = !!info?.mandatory;
  const showRing = phase === 'downloading' || phase === 'verifying' || phase === 'installing' || phase === 'done';

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
            <Animated.View style={[styles.statusDot, { backgroundColor: RED }]} />
            <Text style={styles.statusText}>
              {phase === 'downloading' && t('update.downloading', 'Descargando…')}
              {phase === 'verifying' && t('update.verifying', 'Verificando…')}
              {phase === 'installing' && t('update.installing', 'Instalando…')}
            </Text>
          </View>
        ) : phase === 'error' ? (
          needsPermission ? (
            <>
              <GlassButton
                title={t('update.settings', 'Abrir Ajustes')}
                onPress={() => openInstallPermissionSettings()}
                variant="accent"
                icon="settings-outline"
                size="md"
                style={{ flex: 1.2 }}
              />
              <GlassButton
                title={t('update.installNow', 'Instalar')}
                onPress={() => {
                  if (downloadedApkPathRef.current) {
                    handleInstallLocal(downloadedApkPathRef.current);
                  } else {
                    startDownload();
                  }
                }}
                variant="outline"
                icon="download-outline"
                size="md"
                style={{ flex: 1 }}
              />
            </>
          ) : (
            <>
              {!mandatory && (
                <GlassButton title={t('update.later', 'Más tarde')} onPress={onDismiss} variant="ghost" size="md" style={{ flex: 1 }} />
              )}
              <GlassButton title={t('update.retry', 'Reintentar')} onPress={startDownload} variant="accent" icon="refresh" size="md" style={{ flex: 1.4 }} />
            </>
          )
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
        {mandatory && (
          <View style={styles.mandatoryBadge}>
            <Text style={styles.mandatoryText}>{t('update.required', 'Requerida')}</Text>
          </View>
        )}

        <View style={styles.versionCard}>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillLabel}>{t('update.current', 'Actual')}</Text>
            <Text style={[styles.versionPillValue, { color: COLORS.textSec }]}>v{localVersion}</Text>
          </View>
          <View style={styles.versionArrow}>
            <Animated.Text style={{ color: RED, fontSize: 18, fontWeight: '900' }}>→</Animated.Text>
          </View>
          <View style={[styles.versionPill, styles.versionPillNew]}>
            <Text style={styles.versionPillLabel}>{t('update.new', 'Nueva')}</Text>
            <Text style={[styles.versionPillValue, { color: RED }]}>v{info?.version}</Text>
          </View>
        </View>

        {showRing && (
          <View style={styles.ringWrap}>
            <View style={styles.ringGlow} pointerEvents="none" />
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#F3DEA6" />
                  <Stop offset="0.5" stopColor="#E0BE6E" />
                  <Stop offset="1" stopColor="#C29A3E" />
                </LinearGradient>
              </Defs>
              <Circle cx={RING / 2} cy={RING / 2} r={RADIUS_RING} stroke="rgba(239,68,68,0.12)" strokeWidth={STROKE} fill="none" />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={RADIUS_RING}
                stroke="url(#ringGrad)"
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            </Svg>
            <Animated.View style={[styles.ringCenter, centerScale]}>
              {phase === 'done' ? (
                <Animated.View entering={FadeIn.duration(350)} style={[styles.checkBadge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </Animated.View>
              ) : phase === 'downloading' ? (
                <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
              ) : (
                <ActivityIndicator size="small" color={RED} />
              )}
            </Animated.View>
          </View>
        )}

        {phase === 'downloading' && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{humanBytes(bytesWritten)}{totalRef.current > 0 ? ` / ${humanBytes(totalRef.current)}` : ''}</Text>
            <Text style={styles.metaText}>{speed > 0 ? `${humanBytes(speed)}/s` : ''}</Text>
          </View>
        )}
        {phase === 'downloading' && eta > 0 && (
          <Text style={styles.eta}>{t('update.eta', { s: Math.ceil(eta) })}</Text>
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
  mandatoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  mandatoryText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  versionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  versionPill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  versionPillNew: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  versionPillLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  versionPillValue: {
    fontSize: 17,
    fontWeight: '900',
    fontFamily: FONT.mono,
  },
  versionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.20)',
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  ringGlow: {
    position: 'absolute',
    width: RING * 0.7,
    height: RING * 0.7,
    borderRadius: RING * 0.35,
    backgroundColor: RED,
    opacity: 0.08,
  },
  ringCenter: {
    width: RING - 34,
    height: RING - 34,
    borderRadius: (RING - 34) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.16)',
  },
  percent: { color: RED, fontSize: 28, fontWeight: '900', fontFamily: FONT.mono },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
  },
  checkBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow(COLORS.success, 0.4, 16),
  },
  checkMark: { color: '#fff', fontSize: 30, fontWeight: '900' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  metaText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600', fontFamily: FONT.mono },
  eta: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
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
    marginTop: 2,
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
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
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumModal from './PremiumModal';
import GlassButton from './GlassButton';
import { API_BASE, versionsAPI } from '../services/api';
import { useI18n } from '../i18n';
import { COLORS, GOLD } from '../theme';

const DISMISS_KEY = 'crash.update.dismissed.v2';

type LatestVersion = {
  version?: string;
  download_url?: string;
  notes?: string;
  mandatory?: boolean;
  platform?: string;
};

function versionTuple(v?: string): number[] {
  const parts = (v || '').match(/\d+/g) || [];
  return parts.map((p) => parseInt(p, 10));
}

function isNewer(remote?: string, local?: string): boolean {
  const a = versionTuple(remote);
  const b = versionTuple(local);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export default function UpdateGate() {
  const { t } = useI18n();
  const [info, setInfo] = useState<LatestVersion | null>(null);
  const [visible, setVisible] = useState(false);

  const localVersion =
    Constants.expoConfig?.version || (Constants as any).manifest?.version || '0.0.0';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data: LatestVersion = await versionsAPI.latest('android');
        if (!alive || !data?.download_url || !data?.version) return;
        if (!isNewer(data.version, localVersion)) return;
        if (!data.mandatory) {
          const dismissed = await AsyncStorage.getItem(DISMISS_KEY);
          if (dismissed === data.version) return;
        }
        setInfo(data);
        setVisible(true);
      } catch {
        // silencioso: la verificación de versión nunca debe bloquear la app
      }
    })();
    return () => {
      alive = false;
    };
  }, [localVersion]);

  const handleUpdate = () => {
    if (info?.download_url) {
      const url = info.download_url.startsWith('/') ? `${API_BASE}${info.download_url}` : info.download_url;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleLater = async () => {
    if (info?.version) await AsyncStorage.setItem(DISMISS_KEY, info.version);
    setVisible(false);
  };

  if (!info) return null;

  const mandatory = !!info.mandatory;

  return (
    <PremiumModal
      visible={visible}
      onClose={mandatory ? undefined : handleLater}
      accent={GOLD}
      eyebrow={t('update.eyebrow', 'Nueva versión')}
      title={t('update.title', 'Actualización disponible')}
      closeOnBackdrop={false}
      footer={
        <>
          {!mandatory && (
            <GlassButton
              title={t('update.later', 'Más tarde')}
              onPress={handleLater}
              variant="ghost"
              size="md"
              style={{ flex: 1 }}
            />
          )}
          <GlassButton
            title={t('update.download', 'Actualizar')}
            onPress={handleUpdate}
            variant="accent"
            icon="download-outline"
            size="md"
            style={{ flex: mandatory ? 1 : 1.4 }}
          />
        </>
      }
    >
      <View style={styles.body}>
        <View style={styles.versionRow}>
          <Text style={styles.versionOld}>v{localVersion}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.versionNew}>v{info.version}</Text>
        </View>
        <Text style={styles.desc}>
          {mandatory
            ? t('update.mandatoryDesc', 'Esta actualización es obligatoria para seguir usando C.R.A.S.H.')
            : t('update.optionalDesc', 'Hay una nueva versión de C.R.A.S.H. disponible para descargar.')}
        </Text>
        {info.notes ? <Text style={styles.notes}>{info.notes}</Text> : null}
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
});

import { Platform } from 'react-native';

export const COLORS = {
  bg: '#000000',
  bgElevated: '#0A0A0A',
  surface: '#0D0D0D',
  surfaceAlt: '#121212',
  elevated: '#1A1A1A',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSec: '#888888',
  textDim: '#555555',
  primary: '#FF3B30',
  primaryHover: '#D63026',
  primarySoft: 'rgba(255,59,48,0.10)',
  primaryStrong: 'rgba(255,59,48,0.18)',
  accent: '#CCFF00',
  accentSoft: 'rgba(204,255,0,0.08)',
  accentStrong: 'rgba(204,255,0,0.16)',
  success: '#34C759',
  warning: '#FF9500',
  info: '#5AC8FA',
  danger: '#FF3B30',
  cardBg: '#0D0D0D',
  overlay: 'rgba(0,0,0,0.85)',
  glassBg: 'rgba(10,10,10,0.80)',
  glassBorder: 'rgba(255,255,255,0.06)',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT = Platform.select({
  ios: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'Menlo' },
  android: { heading: 'sans-serif-condensed', headingBold: 'sans-serif-condensed', body: 'sans-serif', medium: 'sans-serif-medium', mono: 'monospace' },
  default: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'monospace' },
})!;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  }),
};

export function severityColor(gForce: number) {
  if (gForce < 5) return COLORS.success;
  if (gForce < 10) return '#FFD60A';
  if (gForce < 15) return COLORS.warning;
  return COLORS.primary;
}

export function severityLabel(gForce: number, t?: (k: string) => string) {
  if (gForce < 5) return t ? t('dashboard.severityStable') : 'ESTABLE';
  if (gForce < 10) return t ? t('dashboard.severityMedium') : 'MEDIO';
  if (gForce < 15) return t ? t('dashboard.severityHigh') : 'ALTO';
  return t ? t('dashboard.severityCritical') : 'CRÍTICO';
}

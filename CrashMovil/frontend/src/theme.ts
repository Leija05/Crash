import { Platform } from 'react-native';

export const GOLD = '#FFD700';
export const GOLD_DARK = '#B8860B';
export const GOLD_SOFT = 'rgba(255,215,0,0.10)';
export const GOLD_STRONG = 'rgba(255,215,0,0.20)';
export const GOLD_GLASS = 'rgba(255,215,0,0.06)';

export const COLORS = {
  bg: '#0A0A0A',
  bgElevated: '#000000',
  surface: '#0D0D0D',
  surfaceAlt: '#111111',
  elevated: '#1A1A1A',
  border: 'rgba(255,215,0,0.12)',
  borderStrong: 'rgba(255,215,0,0.20)',
  text: '#FFFFFF',
  textSec: '#CCCCCC',
  textDim: '#888888',
  primary: GOLD,
  primaryHover: '#E6C200',
  primarySoft: GOLD_SOFT,
  primaryStrong: GOLD_STRONG,
  accent: GOLD,
  accentSoft: GOLD_SOFT,
  accentStrong: GOLD_STRONG,
  success: '#34C759',
  warning: '#FF9500',
  info: '#5AC8FA',
  danger: '#FF3B30',
  cardBg: '#0D0D0D',
  overlay: 'rgba(0,0,0,0.85)',
  glassBg: 'rgba(10,10,10,0.85)',
  glassBorder: 'rgba(255,215,0,0.10)',
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
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
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
    shadowColor: color || GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  }),
};

export function severityColor(gForce: number) {
  if (gForce < 5) return COLORS.success;
  if (gForce < 10) return GOLD;
  if (gForce < 15) return COLORS.warning;
  return COLORS.danger;
}

export function severityLabel(gForce: number, t?: (k: string) => string) {
  if (gForce < 5) return t ? t('dashboard.severityStable') : 'ESTABLE';
  if (gForce < 10) return t ? t('dashboard.severityMedium') : 'MEDIO';
  if (gForce < 15) return t ? t('dashboard.severityHigh') : 'ALTO';
  return t ? t('dashboard.severityCritical') : 'CRÍTICO';
}

import { Platform } from 'react-native';

export const COLORS = {
  bg: '#050506',
  surface: '#0D0D12',
  surfaceAlt: '#14141C',
  elevated: '#1A1A26',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#F2F2F5',
  textSec: '#9494A5',
  textDim: '#5C5C6E',
  primary: '#FF3B30',
  primarySoft: 'rgba(255,59,48,0.12)',
  accent: '#CCFF00',
  accentSoft: 'rgba(204,255,0,0.10)',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  danger: '#F87171',
  cardBg: '#0D0D12',
  overlay: 'rgba(0,0,0,0.75)',
  glassBg: 'rgba(13,13,18,0.85)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
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
  ios: { mono: 'Menlo' },
  android: { mono: 'monospace' },
  default: { mono: 'monospace' },
})!;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  }),
};

export function severityColor(gForce: number) {
  if (gForce < 1.5) return COLORS.success;
  if (gForce < 5) return COLORS.info;
  if (gForce < 10) return COLORS.warning;
  if (gForce < 15) return '#FB923C';
  return COLORS.primary;
}

export function severityLabel(gForce: number) {
  if (gForce < 1.5) return 'ESTABLE';
  if (gForce < 5) return 'NORMAL';
  if (gForce < 10) return 'MEDIO';
  if (gForce < 15) return 'ALTO';
  return 'CRÍTICO';
}

import { Platform } from 'react-native';

export const GOLD = '#C8A23C';
export const GOLD_LIGHT = '#E6C878';
export const GOLD_DARK = '#9C7521';
export const GOLD_DEEP = '#6E5214';
export const GOLD_SOFT = 'rgba(200,162,60,0.10)';
export const GOLD_STRONG = 'rgba(200,162,60,0.20)';
export const GOLD_GLASS = 'rgba(200,162,60,0.06)';
export const GOLD_HAIRLINE = 'rgba(230,200,120,0.22)';
export const GOLD_GRADIENT = ['#E9CD82', '#C8A23C', '#9C7521'];
export const GOLD_GRADIENT_VERTICAL = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
};

export const COLORS = {
  bg: '#0A0A0A',
  bgElevated: '#000000',
  surface: '#0D0D0D',
  surfaceAlt: '#111111',
  elevated: '#1A1A1A',
  border: 'rgba(200,162,60,0.12)',
  borderStrong: 'rgba(200,162,60,0.22)',
  hairline: 'rgba(230,200,120,0.22)',
  text: '#FFFFFF',
  textSec: '#D8D2C4',
  textDim: '#8C8674',
  primary: GOLD,
  primaryHover: GOLD_LIGHT,
  primaryDark: GOLD_DARK,
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
  glassBorder: 'rgba(200,162,60,0.10)',
  glassBgStrong: 'rgba(18,16,10,0.95)',
  glassBorderStrong: 'rgba(200,162,60,0.18)',
  sevGreen: '#34C759',
  sevYellow: '#FFD700',
  sevOrange: '#FF9500',
  sevRed: '#FF3B30',
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT = Platform.select({
  ios: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'Menlo' },
  android: { heading: 'sans-serif-condensed', headingBold: 'sans-serif-condensed', body: 'sans-serif', medium: 'sans-serif-medium', mono: 'monospace' },
  default: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'monospace' },
})!;

export const FONT_SIZE = {
  xs: 9,
  sm: 10,
  md: 13,
  lg: 15,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 48,
  hero: 64,
};

export const SHADOWS = {
  none: {},
  xs: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
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
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  },
  glow: (color: string = GOLD, intensity: number = 0.35, radius: number = 16) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: radius,
    elevation: 5,
  }),
  glowStrong: (color: string = GOLD) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  }),
  redGlow: (intensity: number = 0.3) => ({
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 6,
  }),
  goldGlow: (intensity: number = 0.3) => ({
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 6,
  }),
};

export const ANIMATION = {
  fast: { duration: 200 },
  normal: { duration: 300 },
  slow: { duration: 500 },
  spring: { stiffness: 300, damping: 20 },
  springBouncy: { stiffness: 400, damping: 12 },
  springGentle: { stiffness: 200, damping: 25 },
  stagger: 60,
};

export const Z_INDEX = {
  base: 0,
  ambient: 0,
  content: 1,
  header: 10,
  modal: 100,
  modalOverlay: 99,
  toast: 200,
  notification: 300,
};

export function severityColor(gForce: number): string {
  if (gForce < 5) return COLORS.sevGreen;
  if (gForce < 10) return COLORS.sevYellow;
  if (gForce < 15) return COLORS.sevOrange;
  return COLORS.sevRed;
}

export function severityLabel(gForce: number, t?: (k: string) => string): string {
  if (gForce < 5) return t ? t('dashboard.severityStable') : 'ESTABLE';
  if (gForce < 10) return t ? t('dashboard.severityMedium') : 'MEDIO';
  if (gForce < 15) return t ? t('dashboard.severityHigh') : 'ALTO';
  return t ? t('dashboard.severityCritical') : 'CRÍTICO';
}

export function severityIndex(gForce: number): number {
  if (gForce < 5) return 0;
  if (gForce < 10) return 1;
  if (gForce < 15) return 2;
  return 3;
}

export const SEVERITY_CONFIG = {
  0: { color: COLORS.sevGreen, label: 'ESTABLE', range: '0-5G' },
  1: { color: COLORS.sevYellow, label: 'MEDIO', range: '5-10G' },
  2: { color: COLORS.sevOrange, label: 'ALTO', range: '10-15G' },
  3: { color: COLORS.sevRed, label: 'CRÍTICO', range: '15+G' },
} as const;

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const IMPACT_SEGMENTS = 40;
export const MAX_G_RING = 20;
export const COUNTDOWN_SECONDS_DEFAULT = 8;
export const ALERT_THRESHOLD_DEFAULT = 5;
export const PLAYBACK_INTERVAL_MS = 500;
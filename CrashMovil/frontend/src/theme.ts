import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

/* ============================================================
   C.R.A.S.H. — Design System v2 (Premium Instrument Edition)
   Dark luxury: negro profundo + oro. Tipografía Space Grotesk
   + JetBrains Mono. Materialidad: glass refinado, double-bezel,
   glows controlados.
   ============================================================ */

/* ---------- Paleta Oro (acento único) ---------- */
export const GOLD = '#D9B45B';
export const GOLD_LIGHT = '#F4E0A8';
export const GOLD_BRIGHT = '#FFE9B3';
export const GOLD_DARK = '#A87E2E';
export const GOLD_DEEP = '#6E5214';
export const GOLD_SOFT = 'rgba(217,180,91,0.10)';
export const GOLD_STRONG = 'rgba(217,180,91,0.20)';
export const GOLD_GLASS = 'rgba(217,180,91,0.06)';
export const GOLD_HAIRLINE = 'rgba(244,224,168,0.22)';
export const GOLD_HAIRLINE_STRONG = 'rgba(244,224,168,0.40)';
export const GOLD_GRADIENT = ['#FFF3D1', '#F3DEA6', '#E0BE6E', '#C29A3E', '#8C6824', '#5E4414'] as const;
export const GOLD_GRADIENT_SOFT = ['rgba(240,216,154,0.55)', 'rgba(200,154,62,0.30)', 'rgba(140,104,36,0.18)'] as const;
export const GOLD_GRADIENT_VERTICAL = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
export const GOLD_GRADIENT_DIAGONAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };

/* ---------- Escala de neutros ---------- */
export const NEUTRALS = {
  black: '#000000',
  blackSoft: '#040404',
  bg: '#0A0A0A',
  surface: '#0E0E0C',
  surfaceAlt: '#13120F',
  elevated: '#1B1915',
  line: 'rgba(255,255,255,0.06)',
  lineStrong: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSec: '#DDD6C6',
  textDim: '#948C78',
  textFaint: '#5C5749',
};

/* ---------- Colores funcionales ---------- */
export const COLORS = {
  bg: NEUTRALS.bg,
  bgElevated: NEUTRALS.black,
  surface: NEUTRALS.surface,
  surfaceAlt: NEUTRALS.surfaceAlt,
  elevated: NEUTRALS.elevated,
  border: 'rgba(217,180,91,0.14)',
  borderStrong: 'rgba(217,180,91,0.26)',
  hairline: 'rgba(244,224,168,0.24)',
  text: NEUTRALS.text,
  textSec: NEUTRALS.textSec,
  textDim: NEUTRALS.textDim,
  textFaint: NEUTRALS.textFaint,
  primary: GOLD,
  primaryHover: GOLD_LIGHT,
  primaryDark: GOLD_DARK,
  primarySoft: GOLD_SOFT,
  primaryStrong: GOLD_STRONG,
  accent: GOLD,
  accentSoft: GOLD_SOFT,
  accentStrong: GOLD_STRONG,
  success: '#4ADE80',
  successSoft: 'rgba(74,222,128,0.10)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.10)',
  info: '#7DD3FC',
  infoSoft: 'rgba(125,211,252,0.10)',
  danger: '#FF4D4D',
  dangerSoft: 'rgba(255,77,77,0.10)',
  cardBg: NEUTRALS.surface,
  overlay: 'rgba(0,0,0,0.85)',
  glassBg: 'rgba(10,10,9,0.78)',
  glassBorder: 'rgba(217,180,91,0.12)',
  glassBgStrong: 'rgba(16,14,9,0.96)',
  glassBorderStrong: 'rgba(217,180,91,0.22)',
  sevGreen: '#4ADE80',
  sevYellow: '#FDE047',
  sevOrange: '#FB923C',
  sevRed: '#FF4D4D',
};

/* ---------- Severidad por fuerza G ---------- */
export const SEVERITY_COLORS: Record<0 | 1 | 2 | 3, string> = {
  0: COLORS.sevGreen,
  1: COLORS.sevYellow,
  2: COLORS.sevOrange,
  3: COLORS.sevRed,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 36,
  pill: 999,
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const LINE_HEIGHT = {
  tight: 1.05,
  normal: 1.2,
  relaxed: 1.45,
};

export const LETTER_SPACING = {
  none: 0,
  tight: -0.5,
  wide: 1,
  wider: 2,
  label: 2.5,
  display: 4,
};

/* ---------- Tipografía premium (Space Grotesk + JetBrains Mono) ---------- */
export const FONT = Platform.select({
  ios: {
    display: 'SpaceGrotesk_700Bold',
    heading: 'SpaceGrotesk_600SemiBold',
    headingBold: 'SpaceGrotesk_700Bold',
    body: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    mono: 'JetBrainsMono_700Bold',
    monoMedium: 'JetBrainsMono_500Medium',
  },
  android: {
    display: 'SpaceGrotesk_700Bold',
    heading: 'SpaceGrotesk_600SemiBold',
    headingBold: 'SpaceGrotesk_700Bold',
    body: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    mono: 'JetBrainsMono_700Bold',
    monoMedium: 'JetBrainsMono_500Medium',
  },
  default: {
    display: 'SpaceGrotesk_700Bold',
    heading: 'SpaceGrotesk_600SemiBold',
    headingBold: 'SpaceGrotesk_700Bold',
    body: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    mono: 'JetBrainsMono_700Bold',
    monoMedium: 'JetBrainsMono_500Medium',
  },
})!;

export const FONT_FALLBACK = Platform.select({
  ios: {
    display: 'System',
    heading: 'System',
    body: 'System',
    medium: 'System',
    mono: 'Menlo',
  },
  android: {
    display: 'sans-serif-condensed',
    heading: 'sans-serif-condensed',
    body: 'sans-serif',
    medium: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: { display: 'System', heading: 'System', body: 'System', medium: 'System', mono: 'monospace' },
})!;

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
  xxxl: 34,
  display: 48,
  hero: 72,
};

/* ---------- Sombras / glows ---------- */
const shadow = (color: string, y: number, opacity: number, radius: number, elevation: number) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const SHADOWS = {
  none: {},
  xs: shadow('#000', 1, 0.25, 2, 1),
  sm: shadow('#000', 2, 0.3, 5, 2),
  md: shadow('#000', 4, 0.35, 10, 4),
  lg: shadow('#000', 10, 0.5, 24, 8),
  xl: shadow('#000', 20, 0.65, 40, 14),
  innerTop: { shadowColor: GOLD_LIGHT, shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 0 },
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
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 10,
  }),
  redGlow: (intensity: number = 0.35) => ({
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 24,
    elevation: 8,
  }),
  goldGlow: (intensity: number = 0.35) => ({
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 22,
    elevation: 8,
  }),
};

/* ---------- Curvas de animación premium ---------- */
export const EASING = {
  premium: Easing.bezier(0.16, 1, 0.3, 1), // expo-out (Linear-style)
  soft: Easing.bezier(0.32, 0.72, 0, 1),   // muy fluida
  enter: Easing.out(Easing.cubic),
  exit: Easing.in(Easing.cubic),
  springy: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const ANIMATION = {
  fast: { duration: 180 },
  normal: { duration: 280 },
  slow: { duration: 480 },
  spring: { stiffness: 280, damping: 26 },
  springBouncy: { stiffness: 340, damping: 20 },
  springGentle: { stiffness: 190, damping: 28 },
  springSnappy: { stiffness: 420, damping: 18 },
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

/* ---------- Helpers de severidad ---------- */
export function severityColor(gForce: number): string {
  return SEVERITY_COLORS[severityIndex(gForce)];
}

export function severityLabel(gForce: number, t?: (k: string) => string): string {
  if (gForce < 5) return t ? t('dashboard.severityStable') : 'ESTABLE';
  if (gForce < 10) return t ? t('dashboard.severityMedium') : 'MEDIO';
  if (gForce < 15) return t ? t('dashboard.severityHigh') : 'ALTO';
  return t ? t('dashboard.severityCritical') : 'CRÍTICO';
}

export function severityIndex(gForce: number): 0 | 1 | 2 | 3 {
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

export const IMPACT_SEGMENTS = 44;
export const MAX_G_RING = 12;
export const COUNTDOWN_SECONDS_DEFAULT = 8;
export const ALERT_THRESHOLD_DEFAULT = 5;
export const PLAYBACK_INTERVAL_MS = 500;

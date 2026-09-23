import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

/* ============================================================
   C.R.A.S.H. — Design System v3 (Tactical Telemetry Edition)
   Fiel al logo de marca: rojo aviación/hazard (#EF4444) sobre
   negro profundo. Tipografía Space Grotesk + JetBrains Mono.
   Materialidad: glass refinado, doble bezel, glows controlados.
   ============================================================ */

/* ---------- Paleta Rojo Marca (acento único, del logo) ---------- */
export const RED = '#EF4444';
export const RED_LIGHT = '#F87171';
export const RED_BRIGHT = '#FCA5A5';
export const RED_DARK = '#DC2626';
export const RED_DEEP = '#991B1B';
export const RED_SOFT = 'rgba(239,68,68,0.10)';
export const RED_STRONG = 'rgba(239,68,68,0.20)';
export const RED_GLASS = 'rgba(239,68,68,0.06)';
export const RED_HAIRLINE = 'rgba(248,113,113,0.22)';
export const RED_HAIRLINE_STRONG = 'rgba(248,113,113,0.40)';
export const RED_GRADIENT = ['#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#991B1B', '#450A0A'] as const;
export const RED_GRADIENT_SOFT = ['rgba(248,113,113,0.55)', 'rgba(239,68,68,0.30)', 'rgba(153,27,27,0.18)'] as const;
export const RED_GRADIENT_VERTICAL = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
export const RED_GRADIENT_DIAGONAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };

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
  textSec: '#E4DFD7',
  textDim: '#B5AFA6',
  textFaint: '#8E887E',
};

/* ---------- Colores funcionales ---------- */
export const COLORS = {
  bg: NEUTRALS.bg,
  bgElevated: NEUTRALS.black,
  surface: NEUTRALS.surface,
  surfaceAlt: NEUTRALS.surfaceAlt,
  elevated: NEUTRALS.elevated,
  border: 'rgba(239,68,68,0.14)',
  borderStrong: 'rgba(239,68,68,0.26)',
  hairline: 'rgba(248,113,113,0.24)',
  text: NEUTRALS.text,
  textSec: NEUTRALS.textSec,
  textDim: NEUTRALS.textDim,
  textFaint: NEUTRALS.textFaint,
  primary: RED,
  primaryHover: RED_LIGHT,
  primaryDark: RED_DARK,
  primarySoft: RED_SOFT,
  primaryStrong: RED_STRONG,
  accent: RED,
  accentSoft: RED_SOFT,
  accentStrong: RED_STRONG,
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.10)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.10)',
  info: '#7DD3FC',
  infoSoft: 'rgba(125,211,252,0.10)',
  danger: '#FF3B30',
  dangerSoft: 'rgba(255,59,48,0.10)',
  cardBg: NEUTRALS.surface,
  overlay: 'rgba(0,0,0,0.85)',
  glassBg: 'rgba(10,10,9,0.78)',
  glassBorder: 'rgba(239,68,68,0.12)',
  glassBgStrong: 'rgba(16,14,9,0.96)',
  glassBorderStrong: 'rgba(239,68,68,0.22)',
  sevGreen: '#10B981',
  sevYellow: '#F59E0B',
  sevOrange: '#FB923C',
  sevRed: '#FF3B30',
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
  innerTop: { shadowColor: RED_LIGHT, shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 0 },
  glow: (color: string = RED, intensity: number = 0.35, radius: number = 16) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: radius,
    elevation: 5,
  }),
  glowStrong: (color: string = RED) => ({
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
  brandGlow: (intensity: number = 0.35) => ({
    shadowColor: RED,
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
import { Platform } from 'react-native';

// Paleta alineada a design_guidelines.json ("Performance Pro" · tactical dark).
export const COLORS = {
  bg: '#0A0A0A',
  bgElevated: '#141414',
  surface: '#171717',
  surfaceAlt: '#1E1E1E',
  elevated: '#262626',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#FFFFFF',
  textSec: '#A3A3A3',
  textDim: '#6B6B6B',
  primary: '#FF3B30',
  primaryHover: '#D63026',
  primarySoft: 'rgba(255,59,48,0.12)',
  primaryStrong: 'rgba(255,59,48,0.22)',
  accent: '#CCFF00',
  accentSoft: 'rgba(204,255,0,0.10)',
  accentStrong: 'rgba(204,255,0,0.20)',
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
  danger: '#FF3B30',
  cardBg: '#171717',
  overlay: 'rgba(0,0,0,0.80)',
  glassBg: 'rgba(10,10,10,0.72)',
  glassBorder: 'rgba(255,255,255,0.10)',
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

// Tipografía premium usando fuentes nativas del sistema (sin dependencias extra).
// En Android usamos la familia condensada para un look "tactical" tipo Barlow Condensed.
export const FONT = Platform.select({
  ios: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'Menlo' },
  android: { heading: 'sans-serif-condensed', headingBold: 'sans-serif-condensed', body: 'sans-serif', medium: 'sans-serif-medium', mono: 'monospace' },
  default: { heading: 'System', headingBold: 'System', body: 'System', medium: 'System', mono: 'monospace' },
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

// Clasificación de impactos alineada a design_guidelines.json:
// Low <5G verde · Med 5-10 amarillo · High 10-15 naranja · Critical >15 rojo.
export function severityColor(gForce: number) {
  if (gForce < 5) return COLORS.success;
  if (gForce < 10) return '#FFD60A';
  if (gForce < 15) return COLORS.warning;
  return COLORS.primary;
}

export function severityLabel(gForce: number) {
  if (gForce < 5) return 'ESTABLE';
  if (gForce < 10) return 'MEDIO';
  if (gForce < 15) return 'ALTO';
  return 'CRÍTICO';
}

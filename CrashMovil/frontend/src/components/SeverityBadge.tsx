import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT } from '../theme';
import { severityColor, severityLabel } from '../theme';

interface SeverityBadgeProps {
  gForce: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function SeverityBadge({
  gForce,
  size = 'md',
}: SeverityBadgeProps) {
  const color = severityColor(gForce);
  const label = severityLabel(gForce);

  const dims = { sm: 6, md: 10, lg: 14 }[size];
  const fontSize = { sm: 9, md: 11, lg: 14 }[size];

  return (
    <View style={[styles.badge, { borderColor: color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: color, width: dims, height: dims }]} />
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 99,
  },
  label: {
    fontFamily: FONT.mono,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

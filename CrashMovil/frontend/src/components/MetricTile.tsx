import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT } from '../theme';

interface MetricTileProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export default function MetricTile({
  label,
  value,
  icon,
  color = COLORS.accent,
  style,
  size = 'md',
}: MetricTileProps) {
  const dims = { sm: 80, md: 100, lg: 140 }[size];
  const iconSize = { sm: 14, md: 18, lg: 22 }[size];
  const fontSize = { sm: 16, md: 20, lg: 28 }[size];

  return (
    <View style={[styles.card, { minHeight: dims }, style]}>
      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={color}
          style={styles.icon}
        />
      )}
      <Text style={[styles.value, { color, fontSize }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  icon: {
    marginBottom: 2,
    opacity: 0.7,
  },
  value: {
    fontFamily: FONT.mono,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 9,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});

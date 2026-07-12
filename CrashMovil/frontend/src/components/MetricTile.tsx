import { Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { COLORS, RADIUS, FONT } from '../theme';

interface MetricTileProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

export default function MetricTile({
  label,
  value,
  icon,
  color = COLORS.accent,
  style,
  size = 'md',
  delay = 0,
}: MetricTileProps) {
  const dims = { sm: 80, md: 100, lg: 140 }[size];
  const iconSize = { sm: 14, md: 18, lg: 22 }[size];
  const fontSize = { sm: 16, md: 20, lg: 28 }[size];

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(delay).springify().damping(24)}
      style={[styles.card, { minHeight: dims }, style]}
    >
      {icon && (
        <AnimatedIonicon
          name={icon}
          size={iconSize}
          color={color}
          style={styles.icon}
        />
      )}
      <Animated.Text
        entering={SlideInUp.duration(300).delay(delay + 80).springify()}
        style={[styles.value, { color, fontSize }]}
        numberOfLines={1}
      >
        {value}
      </Animated.Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
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

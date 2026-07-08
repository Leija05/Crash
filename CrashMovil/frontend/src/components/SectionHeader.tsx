import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  accent,
}: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      {icon && (
        <View style={[styles.iconBox, accent && styles.iconBoxAccent]}>
          <Ionicons
            name={icon}
            size={14}
            color={accent ? COLORS.accent : COLORS.textDim}
          />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={[styles.title, accent && styles.titleAccent]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxAccent: {
    backgroundColor: COLORS.accentSoft,
    borderColor: 'rgba(204,255,0,0.2)',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: COLORS.accent,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 1,
  },
});

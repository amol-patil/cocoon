import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCategoryColorHex } from '../shared/colors';
import { colors, typography } from '../theme/colors';

interface Props {
  label: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ label, size = 'md' }: Props) {
  const color = getCategoryColorHex(label);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, size === 'sm' && styles.dotSm, { backgroundColor: color }]} />
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSm: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelSm: {
    fontSize: 11,
  },
});

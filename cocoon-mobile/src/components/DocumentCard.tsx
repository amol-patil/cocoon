import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CocoonDocument } from '../shared/types';
import { resolveTagColor } from '../shared/colors';
import { colors, typography } from '../theme/colors';
import { useSettings } from '../hooks/useSettings';

interface Props {
  doc: CocoonDocument;
  onPress: () => void;
}

export function DocumentCard({ doc, onPress }: Props) {
  const { settings } = useSettings();
  const categoryLabel = doc.category || doc.type;
  const categoryColor = resolveTagColor(categoryLabel, settings.categories);
  const accentColor = categoryColor;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{doc.type}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaCategory, { color: categoryColor }]}>{categoryLabel}</Text>
          {doc.owner ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaOwner}>{doc.owner}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  accent: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.serifMedium20,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaCategory: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  metaOwner: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

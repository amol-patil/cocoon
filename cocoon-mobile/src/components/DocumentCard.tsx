import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { type FuseResultMatch } from 'fuse.js';
import { CocoonDocument } from '../shared/types';
import { resolveTagColor } from '../shared/colors';
import { colors, typography } from '../theme/colors';
import { useSettings } from '../hooks/useSettings';
import { HighlightedText } from './HighlightedText';

interface Props {
  doc: CocoonDocument;
  onPress: () => void;
  matches?: readonly FuseResultMatch[];
}

export function DocumentCard({ doc, onPress, matches }: Props) {
  const { settings } = useSettings();
  const categoryLabel = doc.category || doc.type;
  const categoryColor = resolveTagColor(categoryLabel, settings.categories);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={[styles.accent, { backgroundColor: categoryColor }]} />
        <View style={styles.content}>
          <HighlightedText
            text={doc.type}
            matches={matches}
            fieldKey="type"
            style={styles.title}
            numberOfLines={1}
          />
          <View style={styles.metaRow}>
            <HighlightedText
              text={categoryLabel}
              matches={matches}
              fieldKey="category"
              style={[styles.metaCategory, { color: categoryColor }]}
              highlightColor={colors.accentPrimary}
            />
            {doc.owner ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <HighlightedText
                  text={doc.owner}
                  matches={matches}
                  fieldKey="owner"
                  style={styles.metaOwner}
                />
              </>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
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

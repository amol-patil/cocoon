import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

const SUGGESTIONS: Record<string, string[]> = {
  Passport: ['Passport Number', 'Expiry Date', 'Issue Date', 'Full Name', 'Nationality', 'Date of Birth'],
  License: ['License Number', 'Expiry Date', 'State', 'Class'],
  Insurance: ['Policy Number', 'Group Number', 'Provider', 'Member ID'],
  Medical: ['Record ID', 'Provider', 'Date', 'Condition'],
  Financial: ['Account Number', 'Routing Number', 'Institution', 'Balance'],
};
const DEFAULT_SUGGESTIONS = ['Number', 'Expiry Date', 'Notes'];

function getSuggestions(category: string): string[] {
  for (const key of Object.keys(SUGGESTIONS)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return SUGGESTIONS[key];
  }
  return DEFAULT_SUGGESTIONS;
}

interface AddFieldSheetProps {
  visible: boolean;
  category: string;
  existingLabels: string[];
  onAdd: (label: string, value: string) => void;
  onDone: () => void;
}

export function AddFieldSheet({ visible, category, existingLabels, onAdd, onDone }: AddFieldSheetProps) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const suggestions = getSuggestions(category);

  function handleDone() {
    if (label.trim() && value.trim()) {
      onAdd(label.trim(), value.trim());
    }
    setLabel('');
    setValue('');
    setSelectedSuggestion(null);
    onDone();
  }

  function selectSuggestion(s: string) {
    if (existingLabels.includes(s)) return;
    setSelectedSuggestion(s);
    setLabel(s);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onDone} activeOpacity={1} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add Field</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Label */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FIELD LABEL</Text>
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={(t) => {
                  setLabel(t);
                  setSelectedSuggestion(null);
                }}
                placeholder="e.g. Passport Number"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                autoCapitalize="words"
              />
            </View>

            {/* Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SUGGESTIONS</Text>
              <View style={styles.chipsRow}>
                {suggestions.map((s) => {
                  const used = existingLabels.includes(s);
                  const active = selectedSuggestion === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        used && styles.chipUsed,
                      ]}
                      onPress={() => selectSuggestion(s)}
                      disabled={used}
                    >
                      <Text style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                        used && styles.chipTextUsed,
                      ]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => { setLabel(''); setSelectedSuggestion(null); }}
                >
                  <Text style={styles.chipText}>+ Custom</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Value */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VALUE</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder="Enter value"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Hint */}
            <View style={styles.hint}>
              <Text style={styles.hintIcon}>ℹ</Text>
              <Text style={styles.hintText}>Suggestions are based on the document category</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  handleArea: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderPrimary,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: colors.textPrimary,
  },
  doneBtn: {
    borderRadius: 26,
    backgroundColor: colors.accentPrimary,
    height: 36,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1C',
  },
  body: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  input: {
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    fontSize: 16,
    color: colors.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  chipUsed: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#1A1A1C',
    fontWeight: '500',
  },
  chipTextUsed: {
    color: colors.textTertiary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#C9A96214',
    borderWidth: 1,
    borderColor: '#C9A96230',
    padding: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  hintIcon: {
    fontSize: 14,
    color: colors.accentPrimary,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: colors.accentPrimary,
    lineHeight: 17,
  },
});

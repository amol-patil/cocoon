import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

const TAG_COLORS = ['#4A7FA5', '#C9A962', '#4AA56A', '#7A5AF8', '#E8833A', '#D94A4A', '#6E6E70'];

interface TagItem {
  name: string;
  color: string;
}

interface TagPickerProps {
  visible: boolean;
  title: string;
  tags: TagItem[];
  selectedTag: string | null;
  onSelect: (tag: string) => void;
  onCreate: (name: string) => void;
  onSaveEdit: (oldName: string, newName: string, color: string) => void;
  onDelete: (name: string) => void;
  onDone: () => void;
}

export function TagPicker({
  visible, title, tags, selectedTag,
  onSelect, onCreate, onSaveEdit, onDelete, onDone,
}: TagPickerProps) {
  const [searchText, setSearchText] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(TAG_COLORS[0]);
  const keyboardHeight = useKeyboardHeight();

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );
  const showCreate =
    searchText.trim().length > 0 &&
    !tags.some((t) => t.name.toLowerCase() === searchText.trim().toLowerCase());

  function startEdit(tag: TagItem) {
    setEditingTag(tag.name);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function confirmEdit() {
    if (editingTag && editName.trim()) {
      onSaveEdit(editingTag, editName.trim(), editColor);
      if (selectedTag === editingTag) onSelect(editName.trim());
    }
    setEditingTag(null);
  }

  function handleCreate() {
    const name = searchText.trim();
    onCreate(name);
    onSelect(name);
    setSearchText('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onDone} activeOpacity={1} />
        <View style={[styles.sheet, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
          {/* Handle */}
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search or create..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tag list */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {showCreate && (
              <TouchableOpacity style={styles.tagRow} onPress={handleCreate}>
                <Feather name="plus-circle" size={18} color={colors.accentPrimary} />
                <Text style={styles.createLabel}>Create </Text>
                <Text style={styles.createValue}>"{searchText.trim()}"</Text>
              </TouchableOpacity>
            )}

            {filtered.map((tag) => {
              const isSelected = selectedTag === tag.name;
              const isEditing = editingTag === tag.name;

              if (isEditing) {
                return (
                  <View key={tag.name} style={styles.editWrapper}>
                    {/* Top row: dot + input + check + more */}
                    <View style={styles.editTopRow}>
                      <View style={[styles.tagDot, { backgroundColor: editColor }]} />
                      <TextInput
                        style={styles.editInput}
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                        autoCapitalize="words"
                      />
                      <TouchableOpacity onPress={confirmEdit} style={styles.editIconBtn}>
                        <Feather name="check" size={18} color={colors.accentPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingTag(null)}
                        style={styles.moreBtn}
                      >
                        <Text style={styles.moreIcon}>···</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Color row */}
                    <View style={styles.colorRow}>
                      <Text style={styles.colorLabel}>Color</Text>
                      <View style={styles.colorSpacer} />
                      {TAG_COLORS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: c },
                            editColor === c && styles.colorSwatchSelected,
                          ]}
                          onPress={() => setEditColor(c)}
                        />
                      ))}
                    </View>

                    {/* Save + Delete */}
                    <View style={styles.editActionsRow}>
                      <TouchableOpacity style={styles.editSaveBtn} onPress={confirmEdit}>
                        <Text style={styles.editSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editDeleteBtn}
                        onPress={() => {
                          onDelete(tag.name);
                          setEditingTag(null);
                        }}
                      >
                        <Feather name="trash-2" size={14} color={colors.error} />
                        <Text style={styles.editDeleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={tag.name}
                  style={[styles.tagRow, isSelected && styles.tagRowSelected]}
                  onPress={() => onSelect(tag.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={styles.tagLabel}>{tag.name}</Text>
                  <View style={styles.tagSpacer} />
                  {isSelected && <Feather name="check" size={18} color={colors.accentPrimary} />}
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => startEdit(tag)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.moreIcon}>···</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          {/* Done */}
          <View style={styles.doneArea}>
            <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#00000077',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handleArea: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderPrimary,
  },
  sheetHeader: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPrimary,
  },
  list: {
    maxHeight: 340,
  },
  listContent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    gap: 12,
  },
  tagRowSelected: {
    backgroundColor: '#C9A96220',
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  tagSpacer: { flex: 1 },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: -0.5,
    lineHeight: 16,
  },
  createLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  createValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  // Edit mode
  editWrapper: {
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    marginVertical: 4,
    overflow: 'hidden',
  },
  editTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 12,
    gap: 10,
  },
  editInput: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.bgPrimary,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    fontSize: 15,
    color: colors.textPrimary,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  colorLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginRight: 4,
  },
  colorSpacer: { flex: 1 },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: '#F5F5F0',
  },
  editActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    gap: 10,
  },
  editSaveBtn: {
    flex: 2,
    borderRadius: 10,
    backgroundColor: colors.accentPrimary,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1C',
  },
  editDeleteBtn: {
    flex: 1,
    borderRadius: 10,
    height: 40,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editDeleteBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.error,
  },
  doneArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
  },
  doneBtn: {
    borderRadius: 28,
    backgroundColor: colors.accentPrimary,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1C',
  },
});

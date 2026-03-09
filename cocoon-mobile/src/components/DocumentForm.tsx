import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CocoonDocument, DocumentField, TagItem } from '../shared/types';
import { colors } from '../theme/colors';
import { TagPicker } from './TagPicker';
import { AddFieldSheet } from './AddFieldSheet';
import * as Crypto from 'expo-crypto';

const DEFAULT_TAG_COLORS = ['#4A7FA5', '#C9A962', '#4AA56A', '#7A5AF8', '#E8833A', '#D94A4A', '#6E6E70'];

interface Props {
  initial?: Partial<CocoonDocument>;
  owners: TagItem[];
  categories: TagItem[];
  onSave: (doc: Omit<CocoonDocument, 'id'>) => void;
  onCancel: () => void;
  onRetake?: () => void;
  onCategoriesChange?: (categories: TagItem[]) => void;
  onOwnersChange?: (owners: TagItem[]) => void;
}

export function DocumentForm({
  initial, owners: initOwners, categories: initCategories,
  onSave, onCancel, onRetake, onCategoriesChange, onOwnersChange,
}: Props) {
  const [type, setType] = useState(initial?.type ?? '');
  const [owner, setOwner] = useState(initial?.owner ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [fileLink] = useState(initial?.fileLink ?? '');
  const [fields, setFields] = useState<{ key: string; value: string; id: string }[]>(
    Object.entries(initial?.fields ?? {}).map(([key, value]) => ({
      key, value: value ?? '', id: Crypto.randomUUID(),
    }))
  );
  const [defaultField] = useState(initial?.defaultField ?? '');
  const [categories, setCategories] = useState<TagItem[]>(initCategories);
  const [ownersList, setOwnersList] = useState<TagItem[]>(initOwners);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [showAddFieldSheet, setShowAddFieldSheet] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');

  function handleSave() {
    if (!type.trim()) {
      Alert.alert('Name required', 'Please enter a document name.');
      return;
    }
    const docFields: DocumentField = {};
    for (const f of fields) {
      if (f.key.trim()) docFields[f.key.trim()] = f.value.trim() || undefined;
    }
    const firstKey = Object.keys(docFields)[0] ?? '';
    onSave({
      type: type.trim(),
      owner: owner.trim() || undefined,
      category: category.trim() || undefined,
      defaultField: defaultField || firstKey,
      fields: docFields,
      fileLink,
      isTemporary: false,
    });
  }

  function startEditField(field: { key: string; value: string; id: string }) {
    setEditingFieldId(field.id);
    setEditLabel(field.key);
    setEditValue(field.value);
  }

  function confirmEditField() {
    if (!editLabel.trim()) return;
    setFields((prev) =>
      prev.map((f) =>
        f.id === editingFieldId ? { ...f, key: editLabel.trim(), value: editValue } : f
      )
    );
    setEditingFieldId(null);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setEditingFieldId(null);
  }

  const catColor = category
    ? (categories.find((c) => c.name === category)?.color ?? colors.accentPrimary)
    : colors.textTertiary;

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Feather name="chevron-left" size={18} color={colors.accentPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <Text style={styles.screenTitle}>
          {onRetake ? 'Review Document' : initial?.id ? 'Edit Document' : 'New Document'}
        </Text>

        {/* Scanned-from-photo banner */}
        {onRetake && (
          <View style={styles.retakeBanner}>
            <View style={styles.retakeBannerLeft}>
              <Feather name="camera" size={16} color={colors.accentPrimary} />
              <Text style={styles.retakeBannerText}>Scanned from photo</Text>
            </View>
            <TouchableOpacity onPress={onRetake}>
              <Text style={styles.retakeBannerLink}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Document Info card */}
        <View style={styles.infoCard}>
          {/* Name row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Document Name</Text>
            <TextInput
              style={styles.infoValueInput}
              value={type}
              onChangeText={setType}
              placeholder="e.g. Canada Passport"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.infoDivider} />

          {/* Category row */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.infoLabel}>Category</Text>
            <View style={styles.pickerRow}>
              {category ? (
                <View style={styles.catBadgeRow}>
                  <View style={[styles.catDot, { backgroundColor: catColor }]} />
                  <Text style={styles.infoValueText}>{category}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Select category</Text>
              )}
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          {/* Owner row */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowOwnerPicker(true)}
          >
            <Text style={styles.infoLabel}>Owner</Text>
            <View style={styles.pickerRow}>
              {owner ? (
                <Text style={styles.infoValueText}>{owner}</Text>
              ) : (
                <Text style={styles.placeholderText}>Select owner</Text>
              )}
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Fields section header */}
        <View style={styles.fieldsHeader}>
          <Text style={styles.fieldsSectionLabel}>FIELDS</Text>
          <TouchableOpacity style={styles.addFieldBtn} onPress={() => setShowAddFieldSheet(true)}>
            <Feather name="plus" size={14} color={colors.accentPrimary} />
            <Text style={styles.addFieldText}>Add Field</Text>
          </TouchableOpacity>
        </View>

        {/* Empty fields state */}
        {fields.length === 0 ? (
          <View style={styles.emptyFieldsCard}>
            <View style={styles.emptyIconRing}>
              <Feather name="list" size={24} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No fields yet</Text>
            <Text style={styles.emptyDesc}>
              Fields let you store any info for this document — passport number, expiry date, policy ID, etc.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddFieldSheet(true)}>
              <Feather name="plus" size={14} color={colors.accentPrimary} />
              <Text style={styles.addFirstText}>Add your first field</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fieldsCard}>
            {fields.map((field, idx) => {
              const isEditing = editingFieldId === field.id;
              return (
                <View key={field.id}>
                  {idx > 0 && <View style={styles.fieldDivider} />}

                  {/* Read-only row */}
                  <TouchableOpacity
                    style={styles.fieldReadRow}
                    onPress={() => startEditField(field)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.fieldLabel}>{field.key || 'Untitled'}</Text>
                      <Text style={styles.fieldValue}>{field.value || '—'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeField(field.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Inline edit mode */}
                  {isEditing && (
                    <View style={styles.editWrapper}>
                      <View style={styles.editInner}>
                        <View style={styles.editInputGroup}>
                          <View style={{ gap: 4 }}>
                            <Text style={styles.editInputLabel}>LABEL</Text>
                            <TextInput
                              style={styles.editInputBox}
                              value={editLabel}
                              onChangeText={setEditLabel}
                              autoCapitalize="words"
                            />
                          </View>
                          <View style={{ gap: 4 }}>
                            <Text style={styles.editInputLabel}>VALUE</Text>
                            <TextInput
                              style={[styles.editInputBox, styles.editInputBoxActive]}
                              value={editValue}
                              onChangeText={setEditValue}
                              autoFocus
                            />
                          </View>
                        </View>
                      </View>
                      <View style={styles.editDivider} />
                      <View style={styles.editFooter}>
                        <TouchableOpacity
                          style={styles.deleteFieldLink}
                          onPress={() => removeField(field.id)}
                        >
                          <Feather name="trash-2" size={14} color={colors.error} />
                          <Text style={styles.deleteFieldText}>Delete field</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.doneFieldBtn} onPress={confirmEditField}>
                          <Feather name="check" size={14} color="#1A1A1C" />
                          <Text style={styles.doneFieldText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tag Pickers */}
      <TagPicker
        visible={showCategoryPicker}
        title="Category"
        tags={categories}
        selectedTag={category || null}
        onSelect={(tag) => setCategory(tag)}
        onCreate={(name) => {
          const newItem: TagItem = { name, color: DEFAULT_TAG_COLORS[categories.length % DEFAULT_TAG_COLORS.length] };
          const updated = [...categories, newItem];
          setCategories(updated);
          onCategoriesChange?.(updated);
          setCategory(name);
        }}
        onSaveEdit={(oldName, newName, color) => {
          const updated = categories.map((c) => c.name === oldName ? { name: newName, color } : c);
          setCategories(updated);
          onCategoriesChange?.(updated);
          if (category === oldName) setCategory(newName);
        }}
        onDelete={(name) => {
          const updated = categories.filter((c) => c.name !== name);
          setCategories(updated);
          onCategoriesChange?.(updated);
          if (category === name) setCategory('');
        }}
        onDone={() => setShowCategoryPicker(false)}
      />

      <TagPicker
        visible={showOwnerPicker}
        title="Owner"
        tags={ownersList}
        selectedTag={owner || null}
        onSelect={(tag) => setOwner(tag)}
        onCreate={(name) => {
          const newItem: TagItem = { name, color: DEFAULT_TAG_COLORS[ownersList.length % DEFAULT_TAG_COLORS.length] };
          const updated = [...ownersList, newItem];
          setOwnersList(updated);
          onOwnersChange?.(updated);
          setOwner(name);
        }}
        onSaveEdit={(oldName, newName, color) => {
          const updated = ownersList.map((o) => o.name === oldName ? { name: newName, color } : o);
          setOwnersList(updated);
          onOwnersChange?.(updated);
          if (owner === oldName) setOwner(newName);
        }}
        onDelete={(name) => {
          const updated = ownersList.filter((o) => o.name !== name);
          setOwnersList(updated);
          onOwnersChange?.(updated);
          if (owner === name) setOwner('');
        }}
        onDone={() => setShowOwnerPicker(false)}
      />

      <AddFieldSheet
        visible={showAddFieldSheet}
        category={category}
        existingLabels={fields.map((f) => f.key)}
        onAdd={(lbl, val) => {
          setFields((prev) => [...prev, { key: lbl, value: val, id: Crypto.randomUUID() }]);
        }}
        onDone={() => setShowAddFieldSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  navBar: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 16, fontWeight: '500', color: colors.accentPrimary },
  saveBtn: {
    borderRadius: 26,
    backgroundColor: colors.accentPrimary,
    height: 36,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#1A1A1C' },
  scroll: { flex: 1 },
  scrollContent: { gap: 24, paddingHorizontal: 28, paddingBottom: 40 },
  screenTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    lineHeight: 42,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoRow: { paddingHorizontal: 24, paddingVertical: 18 },
  infoLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  infoValueInput: { fontSize: 16, color: colors.textPrimary, padding: 0 },
  infoValueText: { fontSize: 16, color: colors.textPrimary },
  placeholderText: { fontSize: 16, color: colors.textTertiary },
  infoDivider: { height: 1, backgroundColor: colors.borderDivider },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  fieldsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldsSectionLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, letterSpacing: 3 },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addFieldText: { fontSize: 12, fontWeight: '500', color: colors.accentPrimary },
  emptyFieldsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
  },
  emptyIconRing: {
    width: 64,
    height: 64,
    borderRadius: 40,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  emptyDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 19.5,
    textAlign: 'center',
  },
  addFirstBtn: {
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  addFirstText: { fontSize: 13, fontWeight: '500', color: colors.accentPrimary },
  fieldsCard: { backgroundColor: colors.bgSurface, borderRadius: 20, overflow: 'hidden' },
  fieldReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  fieldValue: { fontSize: 15, color: colors.textPrimary },
  fieldDivider: { height: 1, backgroundColor: colors.borderDivider },
  editWrapper: {
    backgroundColor: colors.bgElevated,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  editInner: { paddingHorizontal: 16, paddingTop: 12 },
  editInputGroup: { gap: 8 },
  editInputLabel: { fontSize: 10, fontWeight: '500', color: colors.textSecondary, letterSpacing: 1.5 },
  editInputBox: {
    borderRadius: 10,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    fontSize: 14,
    color: colors.textPrimary,
  },
  editInputBoxActive: { borderColor: colors.accentPrimary },
  editDivider: { height: 1, backgroundColor: colors.borderDivider, marginTop: 12 },
  editFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteFieldLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteFieldText: { fontSize: 13, fontWeight: '500', color: colors.error },
  doneFieldBtn: {
    borderRadius: 20,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  doneFieldText: { fontSize: 13, fontWeight: '600', color: '#1A1A1C' },
  retakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(201,169,98,0.10)',
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retakeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  retakeBannerLink: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accentPrimary,
    textDecorationLine: 'underline',
  },
});

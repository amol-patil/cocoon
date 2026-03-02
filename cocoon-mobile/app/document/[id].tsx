import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSettings } from '../../src/hooks/useSettings';
import { Toast } from '../../src/components/Toast';
import { copyToClipboard } from '../../src/services/clipboardService';
import { resolveTagColor } from '../../src/shared/colors';
import { colors } from '../../src/theme/colors';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, remove } = useDocuments();
  const { settings } = useSettings();
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const doc = documents.find((d) => d.id === id);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 10);
  }, []);

  async function copyField(fieldName: string, value: string) {
    await copyToClipboard(value, settings.clipboardAutoClearSeconds);
    showToast(`${fieldName} copied`);
  }

  async function copyAll() {
    const all = Object.entries(doc!.fields)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    await copyToClipboard(all, settings.clipboardAutoClearSeconds);
    showToast('All fields copied');
  }

  function handleDelete() {
    Alert.alert(
      'Delete Document',
      `Delete "${doc?.type}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove(id!);
            router.back();
          },
        },
      ]
    );
  }

  if (!doc) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={colors.accentPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fieldEntries = Object.entries(doc.fields).filter(([, v]) => v != null);
  const catColor = resolveTagColor(doc.category || doc.type, settings.categories);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={colors.accentPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/document/edit/${doc.id}`)}
          >
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.docHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgeDot, { backgroundColor: catColor }]} />
            <Text style={[styles.badgeLabel, { color: catColor }]}>{doc.category || doc.type}</Text>
          </View>
          <Text style={styles.docTitle}>{doc.type}</Text>
          {doc.owner && (
            <View style={styles.ownerRow}>
              <Feather name="user" size={14} color={colors.textSecondary} />
              <Text style={styles.ownerText}>{doc.owner}</Text>
            </View>
          )}
        </View>

        {/* Fields */}
        <View style={styles.fieldsCard}>
          {fieldEntries.map(([key, value], idx) => (
            <View key={key}>
              {idx > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.fieldRow}
                onPress={() => copyField(key, value!)}
                activeOpacity={0.7}
              >
                <View style={styles.fieldLeft}>
                  <Text style={styles.fieldLabel}>{key}</Text>
                  <Text style={styles.fieldValue}>{value}</Text>
                </View>
                <View style={[
                  styles.copyBtn,
                  key === doc.defaultField && styles.copyBtnActive,
                ]}>
                  <Feather
                    name="clipboard"
                    size={15}
                    color={key === doc.defaultField ? colors.accentPrimary : colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Copy All */}
        {fieldEntries.length > 0 && (
          <TouchableOpacity style={styles.copyAllBtn} onPress={copyAll} activeOpacity={0.8}>
            <Feather name="clipboard" size={16} color={colors.bgPrimary} />
            <Text style={styles.copyAllText}>Copy All Fields</Text>
          </TouchableOpacity>
        )}

        {/* Linked file */}
        {doc.fileLink ? (
          <View style={styles.linkedSection}>
            <Text style={styles.linkedSectionLabel}>LINKED FILE</Text>
            <TouchableOpacity
              style={styles.linkedCard}
              onPress={() => Linking.openURL(doc.fileLink)}
              activeOpacity={0.7}
            >
              <View style={styles.linkedIconFrame}>
                <Feather name="file" size={20} color={colors.accentPrimary} />
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedFilename} numberOfLines={1}>
                  {doc.fileLink.split('/').pop() || doc.fileLink}
                </Text>
                <Text style={styles.linkedMeta}>Document</Text>
              </View>
              <Feather name="external-link" size={16} color={colors.accentPrimary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Document</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Toast message={toastMessage} visible={toastVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { paddingHorizontal: 28, paddingTop: 0, gap: 32 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 14, fontWeight: '500', color: colors.accentPrimary },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  editText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  docHeader: { gap: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot: { width: 10, height: 10, borderRadius: 5 },
  badgeLabel: { fontSize: 12, fontWeight: '500' },
  docTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    lineHeight: 46,
    color: colors.textPrimary,
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerText: { fontSize: 13, color: colors.textSecondary },
  fieldsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  fieldLeft: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  fieldValue: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 20,
    color: colors.textPrimary,
  },
  divider: { height: 1, backgroundColor: colors.borderDivider, marginHorizontal: 24 },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnActive: {
    backgroundColor: colors.accentAlpha14,
    borderColor: colors.accentPrimary,
  },
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentPrimary,
  },
  copyAllText: { fontSize: 14, fontWeight: '600', color: colors.bgPrimary },
  linkedSection: { gap: 8 },
  linkedSectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 3,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  linkedIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedInfo: { flex: 1, gap: 4 },
  linkedFilename: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  linkedMeta: { fontSize: 11, color: colors.textSecondary },
  deleteBtn: { alignItems: 'center', padding: 16 },
  deleteBtnText: { fontSize: 13, color: colors.error },
});

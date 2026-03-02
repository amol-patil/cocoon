import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSettings } from '../../src/hooks/useSettings';
import { DocumentCard } from '../../src/components/DocumentCard';
import { EmptyState } from '../../src/components/EmptyState';
import { copyToClipboard } from '../../src/services/clipboardService';
import { colors } from '../../src/theme/colors';
import { CocoonDocument } from '../../src/shared/types';

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
      <Feather name="trash-2" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

function CopyAction({ onCopy }: { onCopy: () => void }) {
  return (
    <TouchableOpacity style={styles.copyAction} onPress={onCopy}>
      <Feather name="clipboard" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

export default function DocumentsTab() {
  const { documents, remove, isLoading } = useDocuments();
  const { settings } = useSettings();

  const handleDelete = useCallback(
    (doc: CocoonDocument) => {
      Alert.alert(
        'Delete Document',
        `Delete "${doc.type}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => remove(doc.id),
          },
        ]
      );
    },
    [remove]
  );

  const handleCopy = useCallback(
    async (doc: CocoonDocument) => {
      const defaultValue = doc.fields[doc.defaultField];
      if (defaultValue) {
        await copyToClipboard(defaultValue, settings.clipboardAutoClearSeconds);
      }
    },
    [settings.clipboardAutoClearSeconds]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/document/new')}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color={colors.bgPrimary} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? null : documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          subtitle="Add your first document to get started"
          actionLabel="Add Document"
          onAction={() => router.push('/document/new')}
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <DeleteAction onDelete={() => handleDelete(item)} />
              )}
              renderLeftActions={() => (
                <CopyAction onCopy={() => handleCopy(item)} />
              )}
              friction={2}
              rightThreshold={40}
              leftThreshold={40}
            >
              <DocumentCard doc={item} onPress={() => router.push(`/document/${item.id}`)} />
            </Swipeable>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListHeaderComponent={
            <View style={styles.sortRow}>
              <Text style={styles.countText}>
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.sortChip}>
                <Text style={styles.sortLabel}>Recent</Text>
                <Feather name="chevron-down" size={14} color={colors.textSecondary} />
              </View>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 0,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    lineHeight: 42,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bgPrimary,
  },
  list: {
    paddingHorizontal: 28,
    paddingBottom: 120,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  deleteAction: {
    backgroundColor: colors.error,
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  copyAction: {
    backgroundColor: '#3A7BD5',
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 8,
  },
});

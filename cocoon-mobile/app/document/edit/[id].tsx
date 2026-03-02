import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDocuments } from '../../../src/hooks/useDocuments';
import { useSettings } from '../../../src/hooks/useSettings';
import { DocumentForm } from '../../../src/components/DocumentForm';
import { colors } from '../../../src/theme/colors';
import { CocoonDocument } from '../../../src/shared/types';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, update } = useDocuments();
  const { settings, updateSetting } = useSettings();

  const doc = documents.find((d) => d.id === id);

  if (!doc) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Document not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.accentPrimary, marginTop: 12 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSave(updated: Omit<CocoonDocument, 'id'>) {
    await update({ ...updated, id: doc!.id });
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <DocumentForm
        initial={doc}
        owners={settings.owners}
        categories={settings.categories}
        onSave={handleSave}
        onCancel={() => router.back()}
        onCategoriesChange={(cats) => updateSetting('categories', cats)}
        onOwnersChange={(owners) => updateSetting('owners', owners)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
});

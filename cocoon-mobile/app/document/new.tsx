import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSettings } from '../../src/hooks/useSettings';
import { DocumentForm } from '../../src/components/DocumentForm';
import { colors } from '../../src/theme/colors';
import { CocoonDocument } from '../../src/shared/types';

export default function NewDocumentScreen() {
  const { add } = useDocuments();
  const { settings, updateSetting } = useSettings();

  async function handleSave(doc: Omit<CocoonDocument, 'id'>) {
    await add(doc);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <DocumentForm
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

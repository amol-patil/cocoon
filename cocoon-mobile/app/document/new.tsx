import React, { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSettings } from '../../src/hooks/useSettings';
import { DocumentForm } from '../../src/components/DocumentForm';
import { SourcePickerSheet } from '../../src/components/SourcePickerSheet';
import { ProcessingScreen } from '../../src/components/ProcessingScreen';
import { ModelDownloadScreen } from '../../src/components/ModelDownloadScreen';
import { ScanErrorScreen } from '../../src/components/ScanErrorScreen';
import { colors } from '../../src/theme/colors';
import { CocoonDocument } from '../../src/shared/types';
import {
  isModelDownloaded, captureDocumentPhoto, pickDocumentPhoto, runFullPipeline,
} from '../../src/services/scanService';
import { scanResultToDocument } from '../../src/utils/fieldMapping';

type ScreenState = 'picker' | 'downloading' | 'processing' | 'error' | 'form';
type PendingSource = 'scan' | 'photos' | null;

export default function NewDocumentScreen() {
  const { add } = useDocuments();
  const { settings, updateSetting } = useSettings();

  const [state, setState] = useState<ScreenState>('picker');
  const [initialDoc, setInitialDoc] = useState<Partial<CocoonDocument> | undefined>(undefined);
  const [imageUri, setImageUri] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [ocrDone, setOcrDone] = useState(false);
  const [pendingSource, setPendingSource] = useState<PendingSource>(null);
  const [isScanned, setIsScanned] = useState(false);

  async function handleSave(doc: Omit<CocoonDocument, 'id'>) {
    await add(doc);
    router.back();
  }

  const openImageSource = useCallback(async (source: 'scan' | 'photos') => {
    try {
      const uri = source === 'scan'
        ? await captureDocumentPhoto()
        : await pickDocumentPhoto();

      if (!uri) {
        setState('picker');
        return;
      }

      setImageUri(uri);
      setState('processing');
      setOcrDone(false);
      setProcessingStatus('Extracting text...');

      const result = await runFullPipeline(uri);
      setOcrDone(true);
      setProcessingStatus('Parsing document...');

      const doc = scanResultToDocument(result);
      if (doc) {
        setInitialDoc(doc);
        setIsScanned(true);
        setState('form');
      } else {
        setState('error');
      }
    } catch (e: any) {
      Alert.alert('Scan failed', e.message);
      setState('error');
    }
  }, []);

  const handleSourceSelected = useCallback(async (source: 'scan' | 'photos') => {
    setPendingSource(source);
    const ready = await isModelDownloaded();
    if (!ready) {
      setState('downloading');
    } else {
      await openImageSource(source);
    }
  }, [openImageSource]);

  function handleScan() {
    handleSourceSelected('scan');
  }

  function handlePhotos() {
    handleSourceSelected('photos');
  }

  function handleManual() {
    setInitialDoc(undefined);
    setIsScanned(false);
    setState('form');
  }

  function handleCancel() {
    router.back();
  }

  function handleRetake() {
    setInitialDoc(undefined);
    setIsScanned(false);
    setImageUri('');
    setState('picker');
  }

  async function handleDownloadComplete() {
    if (pendingSource) {
      await openImageSource(pendingSource);
    } else {
      setState('picker');
    }
  }

  function handleRetryFromError() {
    setState('picker');
  }

  function handleManualFromError() {
    setInitialDoc(undefined);
    setIsScanned(false);
    setState('form');
  }

  return (
    <SafeAreaView style={styles.container}>
      {state === 'form' && (
        <DocumentForm
          initial={initialDoc}
          owners={settings.owners}
          categories={settings.categories}
          onSave={handleSave}
          onCancel={handleCancel}
          onRetake={isScanned ? handleRetake : undefined}
          onCategoriesChange={(cats) => updateSetting('categories', cats)}
          onOwnersChange={(owners) => updateSetting('owners', owners)}
        />
      )}

      <SourcePickerSheet
        visible={state === 'picker'}
        onScan={handleScan}
        onPhotos={handlePhotos}
        onManual={handleManual}
        onCancel={handleCancel}
      />

      <ModelDownloadScreen
        visible={state === 'downloading'}
        onDownloadComplete={handleDownloadComplete}
        onCancel={() => setState('picker')}
      />

      <ProcessingScreen
        visible={state === 'processing'}
        imageUri={imageUri}
        status={processingStatus}
        ocrDone={ocrDone}
        onCancel={() => setState('picker')}
      />

      <ScanErrorScreen
        visible={state === 'error'}
        onRetry={handleRetryFromError}
        onManual={handleManualFromError}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
});

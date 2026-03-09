import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { downloadModel } from '../services/scanService';

interface Props {
  visible: boolean;
  onDownloadComplete: () => void;
  onCancel: () => void;
}

export function ModelDownloadScreen({ visible, onDownloadComplete, onCancel }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleDownload() {
    setDownloading(true);
    setProgress(0);
    try {
      await downloadModel((pct) => setProgress(pct));
      setDownloading(false);
      onDownloadComplete();
    } catch (e: any) {
      setDownloading(false);
      // Stay on screen so user can retry
    }
  }

  function handleCancel() {
    setDownloading(false);
    setProgress(0);
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Feather name="x" size={20} color={colors.textSecondary} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="cpu" size={32} color={colors.accentPrimary} />
          </View>

          <Text style={styles.title}>Document AI Required</Text>
          <Text style={styles.subtitle}>
            A one-time download is needed to enable on-device document scanning and field extraction.
          </Text>
          <Text style={styles.sizeText}>~1 GB download</Text>

          {downloading ? (
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
              <TouchableOpacity style={styles.cancelDownloadBtn} onPress={handleCancel}>
                <Text style={styles.cancelDownloadText}>Cancel Download</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
              <Feather name="download" size={18} color={colors.bgPrimary} />
              <Text style={styles.downloadBtnText}>Download Model</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 28,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentAlpha14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  sizeText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentPrimary,
    height: 52,
    width: 280,
    borderRadius: 26,
    marginTop: 16,
  },
  downloadBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bgPrimary,
  },
  progressSection: {
    width: 280,
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cancelDownloadBtn: {
    marginTop: 8,
  },
  cancelDownloadText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

import React from 'react';
import {
  View, Text, Image, Modal, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  imageUri: string;
  status: string;
  ocrDone: boolean;
  onCancel: () => void;
}

function StepRow({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <View style={styles.stepRow}>
      {done ? (
        <View style={styles.stepCheckCircle}>
          <Feather name="check" size={14} color={colors.bgPrimary} />
        </View>
      ) : active ? (
        <ActivityIndicator size="small" color={colors.accentPrimary} />
      ) : (
        <View style={styles.stepEmptyCircle} />
      )}
      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
        {label}
      </Text>
    </View>
  );
}

export function ProcessingScreen({ visible, imageUri, status, ocrDone, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Feather name="x" size={20} color={colors.textSecondary} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderIcon}>
              <Feather name="file-text" size={48} color={colors.textTertiary} />
            </View>
          )}

          <Text style={styles.statusText}>{status}</Text>

          <View style={styles.stepsContainer}>
            <StepRow label="Extracting text..." done={ocrDone} active={!ocrDone} />
            <StepRow label="Parsing document..." done={false} active={ocrDone} />
          </View>
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
    gap: 24,
  },
  thumbnail: {
    width: 200,
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  placeholderIcon: {
    width: 200,
    height: 260,
    borderRadius: 16,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  stepsContainer: {
    gap: 16,
    alignSelf: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepLabelDone: {
    color: colors.textPrimary,
  },
});

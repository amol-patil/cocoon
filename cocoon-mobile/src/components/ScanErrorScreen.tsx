import React from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onRetry: () => void;
  onManual: () => void;
  onCancel: () => void;
}

export function ScanErrorScreen({ visible, onRetry, onManual, onCancel }: Props) {
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
          <View style={styles.iconCircle}>
            <Feather name="eye-off" size={32} color={colors.error} />
          </View>

          <Text style={styles.title}>Couldn't Read Image</Text>
          <Text style={styles.subtitle}>
            We weren't able to extract document details from this photo. Try taking a clearer, well-lit photo of the document.
          </Text>

          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.manualLink} onPress={onManual}>
            <Text style={styles.manualLinkText}>Enter Manually</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.errorAlpha10,
    borderWidth: 1,
    borderColor: colors.error,
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
  retryBtn: {
    backgroundColor: colors.accentPrimary,
    height: 52,
    width: 280,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bgPrimary,
  },
  manualLink: {
    marginTop: 8,
  },
  manualLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentPrimary,
    textDecorationLine: 'underline',
  },
});

import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onScan: () => void;
  onPhotos: () => void;
  onManual: () => void;
  onCancel: () => void;
}

function OptionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={20} color={colors.bgPrimary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export function SourcePickerSheet({ visible, onScan, onPhotos, onManual, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Document</Text>

          <View style={styles.optionsCard}>
            <OptionRow
              icon="camera"
              title="Scan Document"
              subtitle="Take a photo and auto-fill fields"
              onPress={onScan}
            />
            <View style={styles.divider} />
            <OptionRow
              icon="image"
              title="Choose from Photos"
              subtitle="Select an existing photo to scan"
              onPress={onPhotos}
            />
            <View style={styles.divider} />
            <OptionRow
              icon="edit-3"
              title="Manual Entry"
              subtitle="Type document details by hand"
              onPress={onManual}
            />
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderPrimary,
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: colors.textPrimary,
  },
  optionsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDivider,
  },
  cancelBtn: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

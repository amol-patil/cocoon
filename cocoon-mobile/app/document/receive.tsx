/**
 * Receive/Import Screen (Flow B — recipient side)
 *
 * Shown when opening a .cocoon file. User enters PIN to decrypt,
 * then can import into their vault or just view.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, Keyboard, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useDocuments } from '../../src/hooks/useDocuments';
import { decryptAndImportFile, PickedFile } from '../../src/services/exportImportService';
import { colors } from '../../src/theme/colors';

export default function ReceiveScreen() {
  const { uri, name, content } = useLocalSearchParams<{
    uri: string;
    name: string;
    content: string;
  }>();
  const { documents, replaceAll } = useDocuments();
  const [pin, setPin] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const pinInputRef = useRef<TextInput>(null);

  const fileName = name || 'shared-document.cocoon';
  const fileSize = content ? `${(content.length / 1024).toFixed(1)} KB` : '';

  const handleDecrypt = async (importAfter: boolean) => {
    if (pin.length < 4 || !content) return;
    setIsDecrypting(true);
    Keyboard.dismiss();
    try {
      const pickedFile: PickedFile = {
        uri: uri || '',
        name: fileName,
        content: content,
        needsPassword: true,
      };
      const result = await decryptAndImportFile(documents, pickedFile, pin);
      if (importAfter) {
        await replaceAll(result.merged);
        Alert.alert(
          'Import Complete',
          `${result.added} document${result.added !== 1 ? 's' : ''} added` +
            (result.updated > 0 ? `, ${result.updated} updated` : ''),
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        // View without saving — show the decrypted fields
        const doc = result.merged.find(
          (d) => !documents.some((existing) => existing.id === d.id),
        ) || result.merged[0];
        if (doc) {
          Alert.alert(
            doc.type,
            Object.entries(doc.fields)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n'),
            [{ text: 'Done', onPress: () => router.back() }],
          );
        }
      }
    } catch (e: any) {
      Alert.alert('Decryption Failed', e.message || 'Check your PIN and try again');
    } finally {
      setIsDecrypting(false);
    }
  };

  const pinDigits = pin.split('');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Nav */}
            <View style={styles.navBar}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 1 }} />
            </View>

            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.screenTitle}>Received Document</Text>
              <Text style={styles.screenSubtitle}>
                Enter the PIN to decrypt this document
              </Text>
            </View>

            {/* File Info Card */}
            <View style={styles.fileCard}>
              <View style={styles.fileIconWrap}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.accentPrimary} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                <Text style={styles.fileMeta}>Encrypted · {fileSize}</Text>
              </View>
            </View>

            {/* PIN Entry */}
            <View style={styles.pinCenter}>
              <Text style={styles.pinLabel}>ENTER PIN</Text>

              <TouchableOpacity
                style={styles.pinDotsRow}
                onPress={() => pinInputRef.current?.focus()}
                activeOpacity={0.9}
              >
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinBox,
                      pinDigits[i] ? styles.pinBoxFilled : styles.pinBoxEmpty,
                    ]}
                  >
                    {pinDigits[i] ? (
                      <Text style={styles.pinDigit}>{pinDigits[i]}</Text>
                    ) : (
                      <View style={styles.pinDot} />
                    )}
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={pinInputRef}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                style={styles.hiddenInput}
                autoFocus
              />
            </View>

            {/* Bottom */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={[styles.primaryBtn, pin.length < 4 && styles.primaryBtnDisabled]}
                onPress={() => handleDecrypt(true)}
                activeOpacity={0.8}
                disabled={pin.length < 4 || isDecrypting}
              >
                <Feather name="lock" size={18} color={colors.bgPrimary} />
                <Text style={styles.primaryBtnText}>
                  {isDecrypting ? 'Decrypting...' : 'Decrypt & Import'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, pin.length < 4 && styles.primaryBtnDisabled]}
                onPress={() => handleDecrypt(false)}
                activeOpacity={0.8}
                disabled={pin.length < 4 || isDecrypting}
              >
                <Text style={styles.secondaryBtnText}>View Without Saving</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, paddingHorizontal: 28, gap: 28 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },

  headerSection: { gap: 8 },
  screenTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  screenSubtitle: { fontSize: 14, color: colors.textSecondary },

  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: { flex: 1, gap: 4 },
  fileName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  fileMeta: { fontSize: 12, color: colors.textSecondary },

  pinCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 3,
  },
  pinDotsRow: { flexDirection: 'row', gap: 16 },
  pinBox: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFilled: { borderWidth: 1.5, borderColor: colors.accentPrimary },
  pinBoxEmpty: { borderWidth: 1.5, borderColor: colors.borderPrimary },
  pinDigit: { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textTertiary,
  },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },

  bottomSection: { gap: 12, paddingBottom: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentPrimary,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.bgPrimary },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
});

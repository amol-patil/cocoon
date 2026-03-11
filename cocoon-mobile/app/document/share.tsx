/**
 * Share Document Flow
 *
 * Three steps:
 * 1. Field Selection — pick fields, choose Quick Share vs Secure Share
 * 2a. Card Preview (Quick Share) — preview image card, tap to share
 * 2b. PIN Entry (Secure Share) — set a 4-digit PIN, encrypt & share
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Keyboard,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSettings } from '../../src/hooks/useSettings';
import { ShareCardView, ShareCardField } from '../../src/components/ShareCardView';
import { shareAsImage, shareEncrypted, getShareMessage } from '../../src/services/shareService';
import { resolveTagColor } from '../../src/shared/colors';
import { colors } from '../../src/theme/colors';

type ShareMode = 'quick' | 'secure';
type Step = 'select' | 'preview' | 'pin';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents } = useDocuments();
  const { settings } = useSettings();
  const doc = documents.find((d) => d.id === id);

  const [mode, setMode] = useState<ShareMode>('quick');
  const [step, setStep] = useState<Step>('select');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => {
    if (!doc) return new Set();
    // Pre-select default field if it exists
    const fields = Object.entries(doc.fields).filter(([, v]) => v != null);
    if (doc.defaultField && doc.fields[doc.defaultField]) {
      return new Set([doc.defaultField]);
    }
    return new Set(fields.slice(0, 2).map(([k]) => k));
  });
  const [pin, setPin] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const pinInputRef = useRef<TextInput>(null);

  if (!doc) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fieldEntries = Object.entries(doc.fields).filter(([, v]) => v != null) as [string, string][];
  const category = doc.category || doc.type;

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFields(new Set(fieldEntries.map(([k]) => k)));
  };

  const selectedFieldsList: ShareCardField[] = fieldEntries
    .filter(([k]) => selectedFields.has(k))
    .map(([k, v]) => ({ label: k, value: v }));

  const handleNext = () => {
    if (selectedFields.size === 0) return;
    if (mode === 'quick') setStep('preview');
    else setStep('pin');
  };

  const handleQuickShare = async () => {
    setIsSharing(true);
    try {
      await shareAsImage(viewShotRef);
    } catch (e: any) {
      if (!e.message?.includes('cancelled') && !e.message?.includes('canceled')) {
        Alert.alert('Share Failed', e.message);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleSecureShare = async () => {
    if (pin.length < 4) return;
    setIsSharing(true);
    Keyboard.dismiss();
    try {
      const fieldsMap: Record<string, string> = {};
      for (const [k, v] of fieldEntries) {
        if (selectedFields.has(k)) fieldsMap[k] = v;
      }
      await shareEncrypted(
        {
          sourceDocType: doc.type,
          sourceDocCategory: doc.category,
          sourceDocOwner: doc.owner,
          fields: fieldsMap,
        },
        pin,
      );
    } catch (e: any) {
      if (!e.message?.includes('cancelled') && !e.message?.includes('canceled')) {
        Alert.alert('Share Failed', e.message);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBack = () => {
    if (step === 'select') router.back();
    else {
      setStep('select');
      setPin('');
    }
  };

  // --- RENDER ---

  if (step === 'preview') return renderPreview();
  if (step === 'pin') return renderPinEntry();
  return renderFieldSelection();

  // --- Step 1: Field Selection ---
  function renderFieldSelection() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Nav */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color={colors.accentPrimary} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.screenTitle}>Share Document</Text>
            <Text style={styles.screenSubtitle}>{doc!.type}</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleTab, mode === 'quick' && styles.toggleTabActive]}
              onPress={() => setMode('quick')}
              activeOpacity={0.7}
            >
              <Feather name="image" size={16} color={mode === 'quick' ? colors.bgPrimary : colors.textSecondary} />
              <Text style={[styles.toggleLabel, mode === 'quick' && styles.toggleLabelActive]}>
                Quick Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, mode === 'secure' && styles.toggleTabActive]}
              onPress={() => setMode('secure')}
              activeOpacity={0.7}
            >
              <Feather name="lock" size={16} color={mode === 'secure' ? colors.bgPrimary : colors.textSecondary} />
              <Text style={[styles.toggleLabel, mode === 'secure' && styles.toggleLabelActive]}>
                Secure Share
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode Description */}
          <Text style={styles.modeDesc}>
            {mode === 'quick'
              ? 'Sends a styled image card — no app needed'
              : 'Sends an encrypted file — recipient needs Cocoon & a PIN'}
          </Text>

          {/* Fields Header */}
          <View style={styles.fieldsHeader}>
            <Text style={styles.fieldsHeaderLabel}>SELECT FIELDS</Text>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          </View>

          {/* Fields List */}
          <ScrollView style={styles.fieldsList} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldsCard}>
              {fieldEntries.map(([key, value], idx) => {
                const isSelected = selectedFields.has(key);
                return (
                  <View key={key}>
                    {idx > 0 && <View style={styles.fieldDivider} />}
                    <TouchableOpacity
                      style={styles.fieldRow}
                      onPress={() => toggleField(key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fieldLeft}>
                        <Text style={styles.fieldLabel}>{key}</Text>
                        <Text style={styles.fieldValue}>{value}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && (
                          <Feather name="check" size={16} color={colors.bgPrimary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom */}
          <View style={styles.bottomSection}>
            <Text style={styles.selectedCount}>
              {selectedFields.size} of {fieldEntries.length} fields selected
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, selectedFields.size === 0 && styles.primaryBtnDisabled]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={selectedFields.size === 0}
            >
              <Feather name="share" size={18} color={colors.bgPrimary} />
              <Text style={styles.primaryBtnText}>Preview & Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Step 2a: Card Preview (Quick Share) ---
  function renderPreview() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Nav */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color={colors.accentPrimary} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('select')}>
              <Text style={styles.editFieldsText}>Edit Fields</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Text style={styles.screenTitle}>Preview</Text>
          <Text style={styles.previewDesc}>This is exactly what the recipient will see</Text>

          {/* Card Preview */}
          <View style={styles.cardPreviewArea}>
            <View style={styles.cardWrapper}>
              <ShareCardView
                ref={viewShotRef}
                documentTitle={doc!.type}
                category={category}
                fields={selectedFieldsList}
                categories={settings.categories}
              />
            </View>

            {/* Accompanying message preview */}
            <View style={styles.messagePreview}>
              <Text style={styles.messageLabel}>ACCOMPANYING MESSAGE</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{getShareMessage()}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleQuickShare}
            activeOpacity={0.8}
            disabled={isSharing}
          >
            <Feather name="share" size={18} color={colors.bgPrimary} />
            <Text style={styles.primaryBtnText}>
              {isSharing ? 'Sharing...' : 'Share Image'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Step 2b: PIN Entry (Secure Share) ---
  function renderPinEntry() {
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
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Feather name="chevron-left" size={24} color={colors.accentPrimary} />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.back(); }}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Header */}
              <View style={styles.headerSection}>
                <Text style={styles.screenTitle}>Set a PIN</Text>
                <Text style={styles.screenSubtitle}>
                  {doc!.type} · {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.pinDescription}>
                  Share this PIN separately with the recipient so they can decrypt the document in their Cocoon app.
                </Text>
              </View>

              {/* PIN Display */}
              <View style={styles.pinCenter}>
                <View style={styles.lockCircle}>
                  <Feather name="lock" size={32} color={colors.accentPrimary} />
                </View>

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

                {/* Hidden input for keyboard */}
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
                <Text style={styles.pinHint}>
                  Tell the recipient this PIN verbally or via a separate message
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, pin.length < 4 && styles.primaryBtnDisabled]}
                  onPress={handleSecureShare}
                  activeOpacity={0.8}
                  disabled={pin.length < 4 || isSharing}
                >
                  <Feather name="lock" size={18} color={colors.bgPrimary} />
                  <Text style={styles.primaryBtnText}>
                    {isSharing ? 'Encrypting...' : 'Encrypt & Share'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, paddingHorizontal: 28, gap: 28 },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 16, fontWeight: '500', color: colors.accentPrimary },
  editFieldsText: { fontSize: 14, fontWeight: '600', color: colors.accentPrimary },

  // Header
  headerSection: { gap: 8 },
  screenTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  screenSubtitle: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  previewDesc: { fontSize: 13, color: colors.textSecondary, marginTop: -16 },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
  },
  toggleTabActive: {
    backgroundColor: colors.accentPrimary,
  },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleLabelActive: { color: colors.bgPrimary },

  // Mode description
  modeDesc: { fontSize: 12, color: colors.textSecondary, marginTop: -16 },

  // Fields
  fieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldsHeaderLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 3,
  },
  selectAllText: { fontSize: 13, fontWeight: '600', color: colors.accentPrimary },
  fieldsList: { flex: 1 },
  fieldsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fieldLeft: { flex: 1, gap: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  fieldValue: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  fieldDivider: { height: 1, backgroundColor: colors.borderDivider },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },

  // Bottom
  bottomSection: { gap: 12, alignItems: 'center', paddingBottom: 8 },
  selectedCount: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentPrimary,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.bgPrimary },

  // Preview
  cardPreviewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
  },
  messagePreview: { width: '100%', gap: 8, alignItems: 'center' },
  messageLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 1.5,
  },
  messageBubble: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDivider,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  // PIN
  pinDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  pinCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.accentAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
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
  pinBoxFilled: {
    borderWidth: 1.5,
    borderColor: colors.accentPrimary,
  },
  pinBoxEmpty: {
    borderWidth: 1.5,
    borderColor: colors.borderPrimary,
  },
  pinDigit: { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textTertiary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  pinHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

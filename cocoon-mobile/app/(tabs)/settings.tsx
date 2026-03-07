import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Switch,
  TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlowBackground } from '../../src/components/GlowBackground';
import { useSettings } from '../../src/hooks/useSettings';
import { useDocuments } from '../../src/hooks/useDocuments';
import { exportDocuments, importDocuments } from '../../src/services/exportImportService';
import { colors } from '../../src/theme/colors';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';

interface ImportResult { added: number; updated: number; total: number; }

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SettingRow({
  icon, label, subtitle, right,
}: {
  icon: React.ComponentProps<typeof Feather>['name']; label: string; subtitle?: string; right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <Feather name={icon} size={22} color={colors.accentPrimary} style={styles.settingIcon} />
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>{right}</View>
    </View>
  );
}

function ExportModal({
  visible, onConfirm, onCancel,
}: { visible: boolean; onConfirm: (pw: string) => void; onCancel: () => void; }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const keyboardHeight = useKeyboardHeight();

  function handleConfirm() {
    if (!password) { Alert.alert('Password required'); return; }
    if (password.length < 8) { Alert.alert('Password too short', 'Minimum 8 characters.'); return; }
    onConfirm(password);
    setPassword('');
    setConfirm('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <BlurView intensity={60} tint="dark" style={[styles.modalSheet, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconWrapper}>
              <Feather name="lock" size={22} color={colors.accentPrimary} />
            </View>
            <Text style={styles.modalTitle}>Export Data</Text>
            <Text style={styles.modalSubtitle}>Choose a password to encrypt your backup.</Text>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoFocus
            />
            <Text style={styles.inputHint}>ℹ  Minimum 8 characters. Store this safely — lost passwords cannot be recovered.</Text>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.passwordInput}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Export .cocoon File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => { setPassword(''); setConfirm(''); onCancel(); }}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ImportPasswordModal({
  visible, onConfirm, onCancel,
}: { visible: boolean; onConfirm: (pw: string) => void; onCancel: () => void; }) {
  const [password, setPassword] = useState('');
  const keyboardHeight = useKeyboardHeight();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={60} tint="dark" style={[styles.modalSheet, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalIconWrapper}>
            <Feather name="download" size={22} color={colors.accentPrimary} />
          </View>
          <Text style={styles.modalTitle}>Import Data</Text>
          <Text style={styles.modalSubtitle}>Enter the password used when this backup was created.</Text>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Backup password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            autoFocus
          />
          <TouchableOpacity style={styles.confirmBtn} onPress={() => { onConfirm(password); setPassword(''); }}>
            <Text style={styles.confirmBtnText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={() => { setPassword(''); onCancel(); }}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

function ImportResultModal({
  visible, result, onDone, onViewDocs,
}: { visible: boolean; result: ImportResult | null; onDone: () => void; onViewDocs: () => void; }) {
  if (!result) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={60} tint="dark" style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.modalTitle}>Import Successful</Text>
          <Text style={styles.modalSubtitle}>Your documents have been imported.</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{result.added}</Text>
              <Text style={styles.statLabel}>Added</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{result.updated}</Text>
              <Text style={styles.statLabel}>Updated</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{result.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={onDone}>
            <Text style={styles.confirmBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onViewDocs}>
            <Text style={styles.viewDocsText}>View Documents</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

function ImportErrorModal({
  visible, message, onRetry, onCancel,
}: { visible: boolean; message: string; onRetry: () => void; onCancel: () => void; }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={60} tint="dark" style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.errorCircle}>
            <Text style={styles.errorX}>✕</Text>
          </View>
          <Text style={styles.modalTitle}>Import Failed</Text>
          <Text style={styles.errorMessage}>{message}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onRetry}>
            <Text style={styles.confirmBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onCancel}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

export default function SettingsTab() {
  const { settings, updateSetting } = useSettings();
  const { documents, replaceAll } = useDocuments();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [importError, setImportError] = useState('');
  const [showImportError, setShowImportError] = useState(false);

  async function handleExport(password: string) {
    setShowExportModal(false);
    setIsExporting(true);
    try {
      await exportDocuments(documents, password);
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(password: string) {
    setShowImportModal(false);
    setIsImporting(true);
    try {
      const result = await importDocuments(documents, password);
      await replaceAll(result.merged);
      setImportResult({ added: result.added, updated: result.updated, total: result.merged.length });
      setShowImportResult(true);
    } catch (e: any) {
      if (e.message !== 'Import cancelled') {
        setImportError(e.message);
        setShowImportError(true);
      }
    } finally {
      setIsImporting(false);
    }
  }

  const clearSeconds = settings.clipboardAutoClearSeconds;
  const clearLabel =
    clearSeconds === 0 ? 'Off' : clearSeconds < 60 ? `${clearSeconds}s` : `${clearSeconds / 60}m`;

  function cycleAutoClear() {
    const options = [0, 15, 30, 60, 120];
    const idx = options.indexOf(clearSeconds);
    const next = options[(idx + 1) % options.length];
    updateSetting('clipboardAutoClearSeconds', next);
  }

  return (
    <GlowBackground variant="settings">
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        <SectionLabel label="SECURITY" />
        <View style={styles.card}>
          <SettingRow
            icon="shield"
            label="Face ID / Touch ID"
            subtitle="Require biometrics to unlock"
            right={
              <Switch
                value={settings.biometricEnabled}
                onValueChange={(v) => updateSetting('biometricEnabled', v)}
                trackColor={{ false: colors.borderPrimary, true: colors.accentPrimary }}
                thumbColor={colors.textPrimary}
              />
            }
          />
          <View style={styles.cardDivider} />
          <SettingRow
            icon="clock"
            label="Clipboard Auto-Clear"
            subtitle="Clear copied values after timeout"
            right={
              <TouchableOpacity onPress={cycleAutoClear}>
                <Text style={styles.valueText}>{clearLabel}</Text>
              </TouchableOpacity>
            }
          />
        </View>

        <SectionLabel label="DATA" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowExportModal(true)}
            disabled={isExporting}
          >
            <Feather name="upload" size={22} color={colors.accentPrimary} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingSubtitle}>Encrypted .cocoon backup</Text>
            </View>
            {isExporting
              ? <ActivityIndicator color={colors.accentPrimary} />
              : <Feather name="chevron-right" size={18} color={colors.textTertiary} />}
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowImportModal(true)}
            disabled={isImporting}
          >
            <Feather name="download" size={22} color={colors.accentPrimary} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Import Data</Text>
              <Text style={styles.settingSubtitle}>Restore from .cocoon backup</Text>
            </View>
            {isImporting
              ? <ActivityIndicator color={colors.accentPrimary} />
              : <Feather name="chevron-right" size={18} color={colors.textTertiary} />}
          </TouchableOpacity>
        </View>

        <SectionLabel label="ABOUT" />
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Cocoon</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutTagline}>Your personal document vault</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <ExportModal
        visible={showExportModal}
        onConfirm={handleExport}
        onCancel={() => setShowExportModal(false)}
      />
      <ImportPasswordModal
        visible={showImportModal}
        onConfirm={handleImport}
        onCancel={() => setShowImportModal(false)}
      />
      <ImportResultModal
        visible={showImportResult}
        result={importResult}
        onDone={() => setShowImportResult(false)}
        onViewDocs={() => { setShowImportResult(false); router.push('/(tabs)/documents'); }}
      />
      <ImportErrorModal
        visible={showImportError}
        message={importError}
        onRetry={() => { setShowImportError(false); setShowImportModal(true); }}
        onCancel={() => setShowImportError(false)}
      />
    </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 28, paddingTop: 0 },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    lineHeight: 42,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: colors.borderDivider },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 14,
  },
  settingIcon: { width: 24 },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 18,
    color: colors.textPrimary,
  },
  settingSubtitle: { fontSize: 11, color: colors.textSecondary },
  settingRight: { alignItems: 'flex-end' },
  valueText: { fontSize: 14, fontWeight: '500', color: colors.accentPrimary },
  aboutCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    gap: 8,
  },
  aboutTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: colors.textPrimary,
  },
  aboutVersion: { fontSize: 12, color: colors.textSecondary },
  aboutTagline: { fontSize: 12, color: colors.textTertiary },
  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalSheet: {
    // backgroundColor is intentionally omitted — BlurView provides the frosted glass surface
    backgroundColor: 'rgba(30,28,24,0.72)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.borderPrimary,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: colors.accentAlpha14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: colors.textPrimary,
  },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: -8,
  },
  passwordInput: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 18,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  inputHint: { fontSize: 11, color: colors.textTertiary, lineHeight: 16 },
  confirmBtn: {
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: colors.bgPrimary },
  cancelLink: { alignItems: 'center', height: 44, justifyContent: 'center' },
  cancelLinkText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  viewDocsText: { fontSize: 14, fontWeight: '500', color: colors.accentPrimary },
  // Import result
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6E9E6E22',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successCheck: { fontSize: 36, color: colors.accentSecondary },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBlock: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
  },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  // Import error
  errorCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#D94A4A22',
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  errorX: { fontSize: 36, color: colors.error },
  errorMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

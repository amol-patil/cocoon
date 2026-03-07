import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography } from '../theme/colors';

interface Props {
  onUnlock: () => void;
  isAuthenticating: boolean;
  biometricType: 'face' | 'fingerprint' | 'none';
}

export function BiometricGate({ onUnlock, isAuthenticating, biometricType }: Props) {
  const label =
    biometricType === 'face'
      ? 'Unlock with Face ID'
      : biometricType === 'fingerprint'
      ? 'Unlock with Touch ID'
      : 'Unlock';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Cocoon</Text>
        <Text style={styles.subtitle}>Your personal document vault</Text>

        {/* Glass icon circle */}
        <BlurView intensity={35} tint="dark" style={styles.iconCircle}>
          <Text style={styles.lockIcon}>
            {biometricType === 'face' ? '⊙' : '🔒'}
          </Text>
        </BlurView>

        <Text style={styles.lockedHint}>Your documents are locked</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isAuthenticating && styles.buttonDisabled]}
        onPress={onUnlock}
        disabled={isAuthenticating}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isAuthenticating ? 'Authenticating…' : label}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    ...typography.displayLarge,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  lockIcon: {
    fontSize: 40,
    color: colors.accentPrimary,
  },
  lockedHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    marginHorizontal: 61,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bgPrimary,
  },
});

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DocumentsProvider } from '../src/hooks/useDocuments';
import { SettingsProvider, useSettings } from '../src/hooks/useSettings';
import { BiometricGate } from '../src/components/BiometricGate';
import { authenticate, getBiometricType, isBiometricAvailable } from '../src/services/biometricService';
import { colors } from '../src/theme/colors';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

// Inner shell — has access to settings context
function AppShell() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const authInProgress = useRef(false);

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  useEffect(() => {
    if (!settingsLoading) SplashScreen.hideAsync();
  }, [settingsLoading]);

  const tryAuthenticate = useCallback(async () => {
    if (authInProgress.current) return;
    authInProgress.current = true;

    if (!settings.biometricEnabled) {
      setIsAuthenticated(true);
      authInProgress.current = false;
      return;
    }

    const available = await isBiometricAvailable();
    if (!available) {
      setIsAuthenticated(true);
      authInProgress.current = false;
      return;
    }

    setIsAuthenticating(true);
    const success = await authenticate('Unlock Cocoon');
    setIsAuthenticating(false);
    if (success) setIsAuthenticated(true);
    authInProgress.current = false;
  }, [settings.biometricEnabled]);

  // Trigger auth once settings load
  useEffect(() => {
    if (!settingsLoading) tryAuthenticate();
  }, [settingsLoading]);

  // Re-lock on background, re-auth on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        if (settings.biometricEnabled) setIsAuthenticated(false);
      }
      if (prev === 'background' && nextState === 'active' && !isAuthenticated) {
        tryAuthenticate();
      }
    });
    return () => sub.remove();
  }, [settings.biometricEnabled, isAuthenticated, tryAuthenticate]);

  if (!isAuthenticated) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar style="light" />
        <BiometricGate
          onUnlock={tryAuthenticate}
          isAuthenticating={isAuthenticating}
          biometricType={biometricType}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="document/[id]" />
        <Stack.Screen name="document/share" />
        <Stack.Screen name="document/receive" />
        <Stack.Screen name="document/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="document/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'CormorantGaramond-Regular': CormorantGaramond_400Regular,
    'CormorantGaramond-Medium': CormorantGaramond_500Medium,
    'CormorantGaramond-SemiBold': CormorantGaramond_600SemiBold,
    'CormorantGaramond-Bold': CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <DocumentsProvider>
          <AppShell />
        </DocumentsProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: colors.bgPrimary },
});

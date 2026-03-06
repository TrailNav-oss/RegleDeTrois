import React, { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '../src/config/sentry';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { useIapStore } from '../src/store/iapStore';
import { lightTheme, darkTheme } from '../src/config/theme';
import { useConsentManager } from '../src/components/ads/ConsentManager';
import { OnboardingScreen } from '../src/components/ui/OnboardingScreen';
import { PurchaseModal } from '../src/components/iap/PurchaseModal';
import { sendHeartbeat } from '../src/services/heartbeat';
import { fetchAppConfig } from '../src/services/remoteConfig';
import { checkForUpdate, reloadApp } from '../src/services/updateChecker';
import { setSentryUser } from '../src/config/sentry';
import { getDeviceId } from '../src/services/deviceId';

try { initSentry(); } catch {}
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useConsentManager();

  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const initAuth = useAuthStore((s) => s.initAuth);
  const initialized = useAuthStore((s) => s.initialized);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const initIap = useIapStore((s) => s.init);
  const cleanupIap = useIapStore((s) => s.cleanup);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    initIap();
    return () => { cleanupIap(); };
  }, [initIap, cleanupIap]);

  // Sentry user + remote config + heartbeat + OTA
  useEffect(() => {
    getDeviceId().then((id) => setSentryUser(id)).catch(() => {});
    fetchAppConfig().catch(() => {});

    const timer = setTimeout(() => {
      sendHeartbeat().catch(() => {});
      checkForUpdate().then((r) => {
        if (r.ready) {
          Alert.alert('Mise a jour', 'Une nouvelle version est disponible. Redemarrer ?', [
            { text: 'Plus tard' },
            { text: 'OK', onPress: () => reloadApp() },
          ]);
        }
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (initialized) {
      await SplashScreen.hideAsync();
    }
  }, [initialized]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!hasSeenOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <OnboardingScreen />
          <PurchaseModal />
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <PurchaseModal />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

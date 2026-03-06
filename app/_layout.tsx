import React, { useEffect, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '../src/config/sentry';
import { useThemeStore } from '../src/store/themeStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { useIapStore } from '../src/store/iapStore';
import { lightTheme, darkTheme } from '../src/config/theme';
import { useConsentManager } from '../src/components/ads/ConsentManager';
import { OnboardingScreen } from '../src/components/ui/OnboardingScreen';
import { PurchaseModal } from '../src/components/iap/PurchaseModal';
import { checkForUpdate, reloadApp } from '../src/services/updateChecker';

try { initSentry(); } catch {}
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useConsentManager();

  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const initIap = useIapStore((s) => s.init);
  const cleanupIap = useIapStore((s) => s.cleanup);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initIap();
    return () => { cleanupIap(); };
  }, [initIap, cleanupIap]);

  // OTA check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate().then((r) => {
        if (r.ready) {
          Alert.alert('Mise a jour', 'Une nouvelle version est disponible. Redemarrer ?', [
            { text: 'Plus tard' },
            { text: 'OK', onPress: () => reloadApp() },
          ]);
        }
      }).catch(() => {});
    }, 2000);

    setReady(true);
    return () => clearTimeout(timer);
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

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

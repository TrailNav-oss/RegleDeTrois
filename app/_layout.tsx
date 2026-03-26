import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import { useTranslation } from '../src/i18n/useTranslation';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';

try { initSentry(); } catch {}

// AdMob init moved to ConsentManager (consent BEFORE init for GDPR)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useConsentManager();
  const { t } = useTranslation();

  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [ready, setReady] = useState(false);
  const iapInitialized = useRef(false);

  useEffect(() => {
    if (iapInitialized.current) return;
    iapInitialized.current = true;
    useIapStore.getState().init();
    return () => { useIapStore.getState().cleanup(); };
  }, []);

  // OTA check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate().then((r) => {
        if (r.ready) {
          Alert.alert(t('profile.updateAvailable'), t('profile.updateRestart'), [
            { text: t('profile.updateLater') },
            { text: t('profile.updateReady'), onPress: () => reloadApp() },
          ]);
        }
      }).catch(() => {});
    }, 2000);

    setReady(true);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <ErrorBoundary>
          <PaperProvider theme={theme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <OnboardingScreen />
            <PurchaseModal />
          </PaperProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <PurchaseModal />
        </PaperProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

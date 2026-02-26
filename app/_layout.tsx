import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { lightTheme, darkTheme } from '../src/config/theme';
import { useConsentManager } from '../src/components/ads/ConsentManager';
import { OnboardingScreen } from '../src/components/ui/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useConsentManager();

  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const initAuth = useAuthStore((s) => s.initAuth);
  const initialized = useAuthStore((s) => s.initialized);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

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
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <OnboardingScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}

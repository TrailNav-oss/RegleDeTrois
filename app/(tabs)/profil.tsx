import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  Switch,
  Divider,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useAdsStore } from '../../src/store/adsStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useLanguageStore, type LanguageOption } from '../../src/store/languageStore';
import { useUnitsStore, type UnitSystem } from '../../src/store/unitsStore';
import { PremiumGate } from '../../src/components/ads/PremiumGate';
import { syncRecipes } from '../../src/utils/syncService';
import { useTranslation } from '../../src/i18n/useTranslation';
import { useIapStore } from '../../src/store/iapStore';
import { APP_VERSION } from '../../src/config/version';

export default function ProfilScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const { user, loading, error, signIn, signUp, logout, clearError, initAuth, initialized } = useAuthStore();
  const isPremium = useAdsStore((s) => s.isPremium);
  const togglePremium = useAdsStore((s) => s.togglePremium);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const recipes = useRecipeStore((s) => s.recipes);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const unitSystem = useUnitsStore((s) => s.unitSystem);
  const setUnitSystem = useUnitsStore((s) => s.setUnitSystem);
  const showPurchaseModal = useIapStore((s) => s.showPurchaseModal);
  const restoreIap = useIapStore((s) => s.restore);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('profile.error'), t('profile.fillAllFields'));
      return;
    }
    if (isSignUp) {
      await signUp(email.trim(), password);
    } else {
      await signIn(email.trim(), password);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    if (!isPremium) {
      Alert.alert(t('profile.premiumRequired'), t('profile.premiumRequiredSync'));
      return;
    }
    setSyncing(true);
    try {
      const merged = await syncRecipes(user.uid, recipes);
      const store = useRecipeStore.getState();
      for (const r of store.recipes) {
        store.deleteRecipe(r.id);
      }
      for (const r of merged) {
        useRecipeStore.setState((state) => ({
          recipes: [...state.recipes.filter((x) => x.id !== r.id), r],
        }));
      }
      Alert.alert(t('profile.syncSuccess'), t('profile.syncCount', { count: merged.length }));
    } catch (err: any) {
      Alert.alert(t('profile.syncError'), err.message || t('profile.syncErrorMessage'));
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logoutAction'), style: 'destructive', onPress: logout },
    ]);
  };

  if (!initialized) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          {t('profile.title')}
        </Text>

        {/* Auth Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {user ? (
              <View style={styles.loggedInSection}>
                <View style={styles.userInfoRow}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {t('profile.connected')}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {user.email}
                  </Text>
                </View>

                <View style={styles.syncSection}>
                  {isPremium ? (
                    <Button
                      mode="contained-tonal"
                      onPress={handleSync}
                      loading={syncing}
                      disabled={syncing}
                      icon="cloud-sync"
                      style={styles.syncButton}
                    >
                      {t('profile.sync', { count: recipes.length })}
                    </Button>
                  ) : (
                    <View style={[styles.syncGate, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>
                        {t('profile.syncPremiumRequired')}
                      </Text>
                    </View>
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  textColor={theme.colors.error}
                  style={styles.logoutButton}
                >
                  {t('profile.logout')}
                </Button>
              </View>
            ) : (
              <View style={styles.authForm}>
                <Text variant="titleMedium" style={[styles.authTitle, { color: theme.colors.onSurface }]}>
                  {isSignUp ? t('profile.createAccount') : t('profile.login')}
                </Text>

                <TextInput
                  label={t('profile.email')}
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError(); }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.authInput}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label={t('profile.password')}
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError(); }}
                  mode="outlined"
                  secureTextEntry
                  style={styles.authInput}
                  activeOutlineColor={theme.colors.primary}
                />

                {error && (
                  <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
                    {error}
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleAuth}
                  loading={loading}
                  disabled={loading}
                  style={styles.authButton}
                >
                  {isSignUp ? t('profile.signUpAction') : t('profile.signInAction')}
                </Button>

                <Button
                  mode="text"
                  onPress={() => { setIsSignUp(!isSignUp); clearError(); }}
                  style={styles.toggleAuth}
                >
                  {isSignUp ? t('profile.alreadyAccount') : t('profile.noAccount')}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Settings Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.settingsTitle, { color: theme.colors.onSurface }]}>
              {t('profile.settings')}
            </Text>

            {/* Language selector */}
            <View style={styles.settingRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('profile.language')}
              </Text>
            </View>
            <SegmentedButtons
              value={language}
              onValueChange={(v) => setLanguage(v as LanguageOption)}
              buttons={[
                { value: 'auto', label: t('profile.langAuto') },
                { value: 'fr', label: t('profile.langFr') },
                { value: 'en', label: t('profile.langEn') },
              ]}
              style={styles.languageToggle}
            />

            <Divider style={styles.settingDivider} />

            {/* Unit system selector */}
            <View style={styles.settingRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('profile.unitSystem')}
              </Text>
            </View>
            <SegmentedButtons
              value={unitSystem}
              onValueChange={(v) => setUnitSystem(v as UnitSystem)}
              buttons={[
                { value: 'metric', label: t('profile.unitMetric') },
                { value: 'imperial', label: t('profile.unitImperial') },
              ]}
              style={styles.languageToggle}
            />

            <Divider style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('profile.darkMode')}
              </Text>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} color={theme.colors.primary} />
            </View>

            <Divider style={styles.settingDivider} />

            {/* Premium toggle (dev only) */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('profile.premium')}
                </Text>
                {__DEV__ && (
                  <Chip compact style={styles.devChip} textStyle={{ fontSize: 10 }}>
                    DEV
                  </Chip>
                )}
              </View>
              <Switch value={isPremium} onValueChange={togglePremium} color={theme.colors.primary} />
            </View>

            {!isPremium && (
              <>
                <Divider style={styles.settingDivider} />
                <Button
                  mode="contained"
                  onPress={showPurchaseModal}
                  style={styles.premiumButton}
                  icon="star"
                >
                  {t('profile.goPremium')}
                </Button>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                  {t('profile.premiumDescription')}
                </Text>
                <Button
                  mode="text"
                  onPress={async () => {
                    const found = await restoreIap();
                    Alert.alert(
                      found ? t('profile.syncSuccess') : t('common.error'),
                      found ? t('profile.restorePurchases') : t('profile.premiumSoon')
                    );
                  }}
                  textColor={theme.colors.onSurfaceVariant}
                  style={styles.restoreButton}
                >
                  {t('profile.restorePurchases')}
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          v{APP_VERSION.label} (build {APP_VERSION.build})
          {__DEV__ ? ` — ${APP_VERSION.channel}` : ''}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  loggedInSection: {
    gap: 16,
  },
  userInfoRow: {
    gap: 4,
  },
  syncSection: {
    gap: 8,
  },
  syncButton: {
    borderRadius: 8,
  },
  syncGate: {
    padding: 12,
    borderRadius: 8,
  },
  logoutButton: {
    borderRadius: 8,
  },
  authForm: {
    gap: 4,
  },
  authTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  authInput: {
    marginBottom: 8,
  },
  authButton: {
    borderRadius: 8,
    marginTop: 4,
  },
  toggleAuth: {
    marginTop: 4,
  },
  settingsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingDivider: {
    marginVertical: 8,
  },
  languageToggle: {
    marginBottom: 8,
  },
  devChip: {
    height: 20,
  },
  premiumButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  restoreButton: {
    marginTop: 4,
  },
  version: {
    textAlign: 'center',
    marginTop: 8,
  },
});

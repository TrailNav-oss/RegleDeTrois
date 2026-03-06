import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  Switch,
  Divider,
  Chip,
  SegmentedButtons,
  Portal,
  Modal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdsStore } from '../../src/store/adsStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useLanguageStore, type LanguageOption } from '../../src/store/languageStore';
import { useUnitsStore, type UnitSystem } from '../../src/store/unitsStore';
import { useTranslation } from '../../src/i18n/useTranslation';
import { useIapStore } from '../../src/store/iapStore';
import { APP_VERSION, BUILD_NUMBER } from '../../src/config/app';
import { checkForUpdate, reloadApp } from '../../src/services/updateChecker';

export default function ProfilScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const isPremium = useAdsStore((s) => s.isPremium);
  const togglePremium = useAdsStore((s) => s.togglePremium);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const unitSystem = useUnitsStore((s) => s.unitSystem);
  const setUnitSystem = useUnitsStore((s) => s.setUnitSystem);
  const showPurchaseModal = useIapStore((s) => s.showPurchaseModal);
  const restoreIap = useIapStore((s) => s.restore);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DEV_PASSWORD = '12334566';

  const handleVersionTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      if (!devUnlocked) {
        setShowPasswordModal(true);
        setDevPassword('');
      }
    }
  };

  const handleDevPasswordSubmit = () => {
    if (devPassword === DEV_PASSWORD) {
      setDevUnlocked(true);
      setShowPasswordModal(false);
      setDevPassword('');
    } else {
      Alert.alert(t('common.error'), t('profile.wrongPassword'));
      setDevPassword('');
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await checkForUpdate();
      if (result.ready) {
        Alert.alert(t('profile.updateAvailable'), t('profile.updateRestart'), [
          { text: t('profile.updateLater') },
          { text: t('profile.updateReady'), onPress: () => reloadApp() },
        ]);
      } else {
        Alert.alert(t('profile.about'), t('profile.updateNotAvailable'));
      }
    } catch {
      Alert.alert(t('profile.about'), t('profile.updateNotAvailable'));
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          {t('profile.title')}
        </Text>

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
          </Card.Content>
        </Card>

        {/* Premium Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {(devUnlocked || __DEV__) && (
              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                    {t('profile.premium')}
                  </Text>
                  <Chip compact style={styles.devChip} textStyle={{ fontSize: 10 }}>
                    DEV
                  </Chip>
                </View>
                <Switch value={isPremium} onValueChange={togglePremium} color={theme.colors.primary} />
              </View>
            )}

            {!isPremium && (
              <>
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

        {/* About Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.settingsTitle, { color: theme.colors.onSurface }]}>
              {t('profile.about')}
            </Text>

            <View style={styles.aboutRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('profile.appVersion')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {APP_VERSION}
              </Text>
            </View>

            <Divider style={styles.settingDivider} />

            <Pressable onPress={handleVersionTap}>
              <View style={styles.aboutRow}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('profile.buildNumber')}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                  {BUILD_NUMBER}
                </Text>
              </View>
            </Pressable>

            <Divider style={styles.settingDivider} />

            <Button
              mode="outlined"
              onPress={handleCheckUpdate}
              loading={checkingUpdate}
              disabled={checkingUpdate}
              icon="update"
              style={styles.updateButton}
            >
              {checkingUpdate ? t('profile.updateChecking') : t('profile.checkUpdate')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={showPasswordModal}
          onDismiss={() => { setShowPasswordModal(false); setDevPassword(''); }}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Mode développeur
          </Text>
          <TextInput
            label="Mot de passe"
            value={devPassword}
            onChangeText={setDevPassword}
            mode="outlined"
            secureTextEntry
            autoFocus
            activeOutlineColor={theme.colors.primary}
            onSubmitEditing={handleDevPasswordSubmit}
          />
          <View style={styles.modalActions}>
            <Button onPress={() => { setShowPasswordModal(false); setDevPassword(''); }}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleDevPasswordSubmit}>
              {t('common.ok')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  updateButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});

import React, { useState, useRef, useEffect } from 'react';
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
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { APP_VERSION, BUILD_NUMBER } from '../../src/config/app';
import { checkForUpdate, reloadApp } from '../../src/services/updateChecker';
import { AdBanner } from '../../src/components/ads/AdBanner';

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
  const multipliers = usePreferencesStore((s) => s.multipliers);
  const addMultiplier = usePreferencesStore((s) => s.addMultiplier);
  const removeMultiplier = usePreferencesStore((s) => s.removeMultiplier);
  const resetMultipliers = usePreferencesStore((s) => s.resetMultipliers);
  const percentagePresets = usePreferencesStore((s) => s.percentagePresets);
  const addPercentagePreset = usePreferencesStore((s) => s.addPercentagePreset);
  const removePercentagePreset = usePreferencesStore((s) => s.removePercentagePreset);
  const resetPercentagePresets = usePreferencesStore((s) => s.resetPercentagePresets);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [newMultiplier, setNewMultiplier] = useState('');
  const [newPreset, setNewPreset] = useState('');
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DEV_PASSWORD = '12334566';

  useEffect(() => {
    return () => { if (tapTimerRef.current) clearTimeout(tapTimerRef.current); };
  }, []);

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
            <View style={styles.chipRow}>
              {([
                { value: 'auto', label: t('profile.langAuto') },
                { value: 'fr', label: t('profile.langFr') },
                { value: 'en', label: t('profile.langEn') },
                { value: 'es', label: t('profile.langEs') },
                { value: 'de', label: t('profile.langDe') },
              ] as const).map((item) => (
                <Chip
                  key={item.value}
                  selected={language === item.value}
                  onPress={() => setLanguage(item.value as LanguageOption)}
                  mode="outlined"
                  compact
                  showSelectedOverlay
                  style={styles.langChip}
                >
                  {item.label}
                </Chip>
              ))}
            </View>

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

        {/* Customization Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.settingsTitle, { color: theme.colors.onSurface }]}>
              {t('profile.customization')}
            </Text>

            {/* Recipe multipliers */}
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              {t('profile.recipeMultipliers')}
            </Text>
            <View style={styles.chipRow}>
              {multipliers.map((m) => (
                <Chip key={m} onClose={() => removeMultiplier(m)} compact style={styles.langChip}>
                  {`\u00d7${m}`}
                </Chip>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={newMultiplier}
                onChangeText={setNewMultiplier}
                placeholder={t('profile.valuePlaceholder')}
                keyboardType="decimal-pad"
                mode="outlined"
                dense
                style={styles.addInput}
                activeOutlineColor={theme.colors.primary}
              />
              <Button
                mode="contained-tonal"
                compact
                onPress={() => {
                  const v = parseFloat(newMultiplier.replace(',', '.'));
                  if (v > 0 && isFinite(v)) { addMultiplier(v); setNewMultiplier(''); }
                }}
              >
                {t('profile.addValue')}
              </Button>
              <Button mode="text" compact onPress={resetMultipliers}>
                {t('profile.resetDefaults')}
              </Button>
            </View>

            <Divider style={styles.settingDivider} />

            {/* Percentage presets */}
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              {t('profile.percentagePresets')}
            </Text>
            <View style={styles.chipRow}>
              {percentagePresets.map((p) => (
                <Chip key={p} onClose={() => removePercentagePreset(p)} compact style={styles.langChip}>
                  {`${p}%`}
                </Chip>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={newPreset}
                onChangeText={setNewPreset}
                placeholder={t('profile.valuePlaceholder')}
                keyboardType="decimal-pad"
                mode="outlined"
                dense
                style={styles.addInput}
                activeOutlineColor={theme.colors.primary}
              />
              <Button
                mode="contained-tonal"
                compact
                onPress={() => {
                  const v = parseFloat(newPreset.replace(',', '.'));
                  if (v > 0 && isFinite(v)) { addPercentagePreset(v); setNewPreset(''); }
                }}
              >
                {t('profile.addValue')}
              </Button>
              <Button mode="text" compact onPress={resetPercentagePresets}>
                {t('profile.resetDefaults')}
              </Button>
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
                    {t('profile.devLabel')}
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
      <AdBanner />

      <Portal>
        <Modal
          visible={showPasswordModal}
          onDismiss={() => { setShowPasswordModal(false); setDevPassword(''); }}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            {t('profile.devMode')}
          </Text>
          <TextInput
            label={t('profile.passwordLabel')}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  langChip: {
    borderRadius: 20,
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addInput: {
    flex: 1,
    maxWidth: 100,
  },
});

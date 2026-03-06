import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Chip, Snackbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  percentOf,
  percentVariation,
  increaseByPercent,
  decreaseByPercent,
  whatPercent,
  roundPercent,
} from '../../src/utils/percentage';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { useInterstitialAd } from '../../src/components/ads/useInterstitialAd';
import { useAdsStore } from '../../src/store/adsStore';
import { successHaptic, lightHaptic } from '../../src/utils/haptics';
import { useTranslation } from '../../src/i18n/useTranslation';

type CalcMode = 'percentOf' | 'variation' | 'increase' | 'decrease' | 'whatPercent';

const PRESETS = [5, 10, 15, 20, 25, 50];

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const RADIUS = { sm: 8, md: 12, lg: 16 };
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#1C1B1F',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export default function PourcentagesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const incrementCalc = useAdsStore((s) => s.incrementCalc);
  const { showIfReady } = useInterstitialAd();

  const [mode, setMode] = useState<CalcMode>('percentOf');
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const parseVal = (s: string): number | null => {
    if (s.trim() === '') return null;
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  const animateResult = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
    ]).start();
  };

  const calculate = useCallback(() => {
    const v1 = parseVal(field1);
    const v2 = parseVal(field2);

    if (v1 === null || v2 === null) {
      setError(null);
      setResult(null);
      return;
    }

    let res: number | { error: string };
    let suffix = '';

    switch (mode) {
      case 'percentOf':
        res = percentOf(v1, v2);
        break;
      case 'variation':
        res = percentVariation(v1, v2);
        suffix = '%';
        break;
      case 'increase':
        res = increaseByPercent(v2, v1);
        break;
      case 'decrease':
        res = decreaseByPercent(v2, v1);
        break;
      case 'whatPercent':
        res = whatPercent(v1, v2);
        suffix = '%';
        break;
    }

    if (typeof res === 'object' && 'error' in res) {
      setError(t(`errors.${res.error}`));
      setResult(null);
      return;
    }

    const formatted = roundPercent(res);
    setResult(suffix ? `${formatted}${suffix}` : formatted);
    setError(null);
    animateResult();
    incrementCalc();
    successHaptic();
    setTimeout(() => showIfReady(), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field1, field2, mode, incrementCalc, showIfReady]);

  const handlePreset = (pct: number) => {
    setField1(pct.toString());
    lightHaptic();
  };

  const handleReset = () => {
    setField1('');
    setField2('');
    setResult(null);
    setError(null);
    lightHaptic();
  };

  const handleCopy = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      setSnackVisible(true);
      lightHaptic();
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as CalcMode);
    setField1('');
    setField2('');
    setResult(null);
    setError(null);
  };

  const getFieldLabels = (): { label1: string; label2: string } => {
    switch (mode) {
      case 'percentOf': return { label1: t('percentages.percent'), label2: t('percentages.value') };
      case 'variation': return { label1: t('percentages.oldValue'), label2: t('percentages.newValue') };
      case 'increase': return { label1: t('percentages.percent'), label2: t('percentages.value') };
      case 'decrease': return { label1: t('percentages.percent'), label2: t('percentages.value') };
      case 'whatPercent': return { label1: t('percentages.part'), label2: t('percentages.total') };
    }
  };

  const labels = getFieldLabels();
  const showPresets = mode === 'percentOf' || mode === 'increase' || mode === 'decrease';

  const modeButtons: { value: string; label: string }[] = [
    { value: 'percentOf', label: t('percentages.percentOf') },
    { value: 'variation', label: t('percentages.variation') },
    { value: 'increase', label: t('percentages.increase') },
    { value: 'decrease', label: t('percentages.decrease') },
    { value: 'whatPercent', label: t('percentages.whatPercent') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <Text style={styles.title}>{t('percentages.title')}</Text>
            </View>
            <IconButton
              icon="help-circle-outline"
              size={24}
              onPress={() => Alert.alert(t('percentages.helpTitle'), t('percentages.helpBody'))}
              iconColor={COLORS.textSecondary}
            />
          </View>

          {/* Mode selector - scrollable chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
            <View style={styles.modeRow}>
              {modeButtons.map((btn) => (
                <Chip
                  key={btn.value}
                  selected={mode === btn.value}
                  onPress={() => handleModeChange(btn.value)}
                  style={[
                    styles.modeChip,
                    mode === btn.value && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  textStyle={[
                    styles.modeChipText,
                    mode === btn.value && { color: theme.colors.primary, fontWeight: '700' },
                  ]}
                  showSelectedOverlay={false}
                >
                  {btn.label}
                </Chip>
              ))}
            </View>
          </ScrollView>

          {/* Description du mode */}
          <Text style={styles.modeDesc}>
            {t(`percentages.${mode}Desc`)}
          </Text>

          {/* Card principale */}
          <View style={styles.card}>
            {/* Presets */}
            {showPresets && (
              <View style={styles.presetsRow}>
                {PRESETS.map((p) => (
                  <Chip
                    key={p}
                    onPress={() => handlePreset(p)}
                    compact
                    style={[
                      styles.presetChip,
                      field1 === p.toString() && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    textStyle={[
                      styles.presetText,
                      field1 === p.toString() && { color: theme.colors.primary },
                    ]}
                  >
                    {p}%
                  </Chip>
                ))}
              </View>
            )}

            <TextInput
              label={labels.label1}
              value={field1}
              onChangeText={(v) => { setField1(v); setResult(null); }}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={theme.colors.primary}
              outlineStyle={{ borderRadius: RADIUS.md }}
              right={
                (mode === 'percentOf' || mode === 'increase' || mode === 'decrease')
                  ? <TextInput.Affix text="%" />
                  : undefined
              }
            />

            <TextInput
              label={labels.label2}
              value={field2}
              onChangeText={(v) => { setField2(v); setResult(null); }}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={theme.colors.primary}
              outlineStyle={{ borderRadius: RADIUS.md }}
            />

            <Button
              mode="contained"
              onPress={calculate}
              style={styles.calcButton}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
              icon="calculator"
            >
              {t('percentages.calculate')}
            </Button>
          </View>

          {/* Résultat */}
          {result && (
            <Animated.View
              style={[
                styles.resultCard,
                { backgroundColor: theme.colors.primaryContainer, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.resultLabel}>{t('percentages.result')}</Text>
              <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                {result}
              </Text>
              <IconButton
                icon="content-copy"
                size={20}
                onPress={handleCopy}
                iconColor={theme.colors.primary}
                style={styles.copyIcon}
              />
            </Animated.View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Reset */}
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.resetButton}
            textColor={theme.colors.primary}
            icon="refresh"
          >
            {t('percentages.reset')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      <AdBanner />
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2000}
      >
        {t('percentages.copied')}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  headerSpacer: { width: 48 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

  modeScroll: { marginBottom: SPACING.sm, flexGrow: 0 },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: 2 },
  modeChip: { borderRadius: 20 },
  modeChipText: { fontSize: 12 },

  modeDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },

  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  presetChip: { borderRadius: 16 },
  presetText: { fontSize: 13 },

  input: { fontSize: 18, backgroundColor: COLORS.surface },

  calcButton: { height: 48, borderRadius: RADIUS.md, justifyContent: 'center', marginTop: SPACING.sm },

  resultCard: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLabel: { fontSize: 14, color: COLORS.textSecondary, marginRight: SPACING.md },
  resultValue: { fontSize: 28, fontWeight: '700', flex: 1 },
  copyIcon: { marginLeft: 'auto' },

  errorCard: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
  },
  errorText: { fontSize: 14, color: '#991B1B', textAlign: 'center' },

  resetButton: { height: 48, borderRadius: RADIUS.md, justifyContent: 'center', marginTop: SPACING.lg },
});

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Keyboard,
} from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Chip, Snackbar } from 'react-native-paper';
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
import { sanitizeNumericInput } from '../../src/utils/sanitize';
import { useHistoryStore } from '../../src/store/historyStore';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { HistoryList } from '../../src/components/ui/HistoryList';

type CalcMode = 'percentOf' | 'variation' | 'increase' | 'decrease' | 'whatPercent';

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
  const PRESETS = usePreferencesStore((s) => s.percentagePresets);
  const percentageEntries = useHistoryStore((s) => s.percentageEntries);
  const addPercentageEntry = useHistoryStore((s) => s.addPercentageEntry);
  const removePercentageEntry = useHistoryStore((s) => s.removePercentageEntry);
  const clearPercentageHistory = useHistoryStore((s) => s.clearPercentageHistory);

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
    Keyboard.dismiss();
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
    addPercentageEntry({ mode, field1: v1, field2: v2, result: suffix ? `${formatted}${suffix}` : formatted });
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

  const getModeLabel = (m: string): string => {
    switch (m) {
      case 'percentOf': return t('percentages.percentOf');
      case 'variation': return t('percentages.variation');
      case 'increase': return t('percentages.increase');
      case 'decrease': return t('percentages.decrease');
      case 'whatPercent': return t('percentages.whatPercent');
      default: return m;
    }
  };

  const getFieldLabels = (): { label1: string; label2: string } => {
    switch (mode) {
      case 'percentOf': return { label1: `${t('percentages.percent')} (X)`, label2: `${t('percentages.value')} (Y)` };
      case 'variation': return { label1: `${t('percentages.oldValue')} (A)`, label2: `${t('percentages.newValue')} (B)` };
      case 'increase': return { label1: `${t('percentages.percent')} (X)`, label2: `${t('percentages.value')} (Y)` };
      case 'decrease': return { label1: `${t('percentages.percent')} (X)`, label2: `${t('percentages.value')} (Y)` };
      case 'whatPercent': return { label1: `${t('percentages.part')} (X)`, label2: `${t('percentages.total')} (Y)` };
    }
  };

  type FormulaElement = { type: 'var'; label: string } | { type: 'text'; label: string };

  const getFormulaElements = (): FormulaElement[] => {
    switch (mode) {
      case 'percentOf': return [
        { type: 'var', label: 'X' }, { type: 'text', label: ` %  ${t('percentages.formulaOf')}  ` }, { type: 'var', label: 'Y' }, { type: 'text', label: '  =  ?' },
      ];
      case 'variation': return [
        { type: 'var', label: 'A' }, { type: 'text', label: '  →  ' }, { type: 'var', label: 'B' }, { type: 'text', label: '  =  ? %' },
      ];
      case 'increase': return [
        { type: 'var', label: 'Y' }, { type: 'text', label: '  +  ' }, { type: 'var', label: 'X' }, { type: 'text', label: ' %  =  ?' },
      ];
      case 'decrease': return [
        { type: 'var', label: 'Y' }, { type: 'text', label: '  −  ' }, { type: 'var', label: 'X' }, { type: 'text', label: ' %  =  ?' },
      ];
      case 'whatPercent': return [
        { type: 'var', label: 'X' }, { type: 'text', label: '  ÷  ' }, { type: 'var', label: 'Y' }, { type: 'text', label: '  =  ? %' },
      ];
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
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
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('percentages.title')}</Text>
            </View>
            <IconButton
              icon="help-circle-outline"
              size={24}
              onPress={() => Alert.alert(t('percentages.helpTitle'), t('percentages.helpBody'))}
              iconColor={theme.colors.onSurfaceVariant}
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

          {/* Card principale */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
            {/* Formula display */}
            <View style={styles.formulaRow}>
              {getFormulaElements().map((el, i) =>
                el.type === 'var' ? (
                  <View key={i} style={[styles.varBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.varBadgeText, { color: theme.colors.primary }]}>{el.label}</Text>
                  </View>
                ) : (
                  <Text key={i} style={[styles.formulaText, { color: theme.colors.onSurfaceVariant }]}>{el.label}</Text>
                ),
              )}
            </View>

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
              onChangeText={(v) => { setField1(sanitizeNumericInput(v)); setResult(null); }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              outlineColor={theme.colors.outlineVariant}
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
              onChangeText={(v) => { setField2(sanitizeNumericInput(v)); setResult(null); }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              outlineColor={theme.colors.outlineVariant}
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
              <Text style={[styles.resultLabel, { color: theme.colors.onSurfaceVariant }]}>{t('percentages.result')}</Text>
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
            <View style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
              <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>{error}</Text>
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

          <HistoryList
            entries={percentageEntries}
            onRemove={removePercentageEntry}
            onClear={clearPercentageHistory}
            onPress={(entry) => {
              setMode(entry.mode as CalcMode);
              setField1(entry.field1.toString());
              setField2(entry.field2.toString());
              setResult(entry.result);
              animateResult();
              lightHaptic();
            }}
            title={t('percentages.history')}
            searchPlaceholder={t('percentages.searchHistory')}
            searchFilter={(entry, q) =>
              entry.result.toLowerCase().includes(q) || entry.field1.toString().includes(q) || entry.field2.toString().includes(q)
            }
            renderContent={(entry) => (
              <>
                <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>{getModeLabel(entry.mode)}</Text>
                <Text style={{ fontSize: 14, color: theme.colors.onSurface }}>
                  {entry.field1} , {entry.field2} → <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{entry.result}</Text>
                </Text>
              </>
            )}
          />
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

  modeScroll: { marginBottom: SPACING.lg, flexGrow: 0 },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: 2 },
  modeChip: { borderRadius: 20 },
  modeChipText: { fontSize: 12 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },

  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  varBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  varBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  formulaText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
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

  historySection: { marginTop: SPACING.xxl },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  historyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  searchInput: { marginBottom: SPACING.md, backgroundColor: COLORS.surface, fontSize: 14 },
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 56, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  historyItem: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyMode: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  historyEquation: { fontSize: 14, color: COLORS.textPrimary },
  historyTime: { fontSize: 12, color: COLORS.textSecondary },
});

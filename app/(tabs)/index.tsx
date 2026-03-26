import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, KeyboardAvoidingView, Platform, Alert, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { solveCrossMultiply } from '../../src/utils/crossMultiply';
import { useAdsStore } from '../../src/store/adsStore';
import { useHistoryStore } from '../../src/store/historyStore';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { useInterstitialAd } from '../../src/components/ads/useInterstitialAd';
import { successHaptic, lightHaptic } from '../../src/utils/haptics';
import { useTranslation } from '../../src/i18n/useTranslation';
import { sanitizeNumericInput } from '../../src/utils/sanitize';
import { HistoryList } from '../../src/components/ui/HistoryList';
import type { HistoryEntry } from '../../src/types/history';

// ── Design tokens ──────────────────────────────────────────────
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const RADIUS = { sm: 8, md: 12, lg: 16 };
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#1C1B1F',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  accent: '#FF6B35',
  segmentBg: '#F3F4F6',
};

type FieldKey = 'a' | 'b' | 'c' | 'x';

export default function SimpleScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [fields, setFields] = useState<Record<FieldKey, string>>({ a: '', b: '', c: '', x: '' });
  const [resultField, setResultField] = useState<FieldKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const incrementCalc = useAdsStore((s) => s.incrementCalc);
  const { showIfReady } = useInterstitialAd();
  const historyEntries = useHistoryStore((s) => s.entries);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const removeEntry = useHistoryStore((s) => s.removeEntry);

  const parseField = (val: string): number | null => {
    if (val.trim() === '') return null;
    const replaced = val.replace(',', '.');
    const num = parseFloat(replaced);
    return isNaN(num) ? null : num;
  };

  const translateError = (errorCode: string): string => {
    const key = `errors.${errorCode}`;
    const translated = t(key);
    return translated === key ? errorCode : translated;
  };

  // ── Auto-compute when 3 fields filled ──
  const compute = useCallback(() => {
    const parsed = {
      a: parseField(fields.a),
      b: parseField(fields.b),
      c: parseField(fields.c),
      x: parseField(fields.x),
    };

    const emptyFields = (Object.keys(parsed) as FieldKey[]).filter(
      (k) => fields[k].trim() === ''
    );

    if (emptyFields.length !== 1) {
      setResultField(null);
      setError(null);
      return;
    }

    const filledFields = (Object.keys(parsed) as FieldKey[]).filter(
      (k) => fields[k].trim() !== ''
    );
    const hasInvalid = filledFields.some((k) => {
      const replaced = fields[k].replace(',', '.');
      return isNaN(parseFloat(replaced));
    });
    if (hasInvalid) {
      setError(t('calculator.invalidNumber'));
      setResultField(null);
      return;
    }

    const result = solveCrossMultiply(parsed);

    if ('error' in result) {
      setError(translateError(result.error));
      setResultField(null);
      return;
    }

    setError(null);
    setResultField(result.field);
    Keyboard.dismiss();

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
    ]).start();

    const formatted = Number.isInteger(result.value)
      ? result.value.toString()
      : result.value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

    const updatedFields = { ...parsed, [result.field]: result.value } as Record<FieldKey, number>;
    setFields((prev) => ({ ...prev, [result.field]: formatted }));
    addHistoryEntry({
      a: updatedFields.a,
      b: updatedFields.b,
      c: updatedFields.c,
      x: updatedFields.x,
      solvedField: result.field,
    });
    incrementCalc();
    successHaptic();
    setTimeout(() => showIfReady(), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, fadeAnim, scaleAnim, incrementCalc, showIfReady, addHistoryEntry]);

  useEffect(() => {
    const filledCount = (Object.keys(fields) as FieldKey[]).filter(
      (k) => fields[k].trim() !== ''
    ).length;
    if (filledCount === 3 && !resultField) {
      compute();
    }
  }, [fields, resultField, compute]);

  const handleChange = (key: FieldKey, value: string) => {
    if (resultField) {
      setResultField(null);
      setFields((prev) => ({ ...prev, [key]: value, [resultField]: '' }));
    } else {
      setFields((prev) => ({ ...prev, [key]: value }));
    }
    setError(null);
  };

  const handleReset = () => {
    setFields({ a: '', b: '', c: '', x: '' });
    setResultField(null);
    setError(null);
    lightHaptic();
  };

  const handleCopy = async () => {
    const toCopy = resultField ? fields[resultField] : null;
    if (toCopy) {
      await Clipboard.setStringAsync(toCopy);
      setSnackVisible(true);
      lightHaptic();
    }
  };

  const loadEntry = (entry: HistoryEntry) => {
    const fmt = (n: number) =>
      Number.isInteger(n) ? n.toString() : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    setFields({ a: fmt(entry.a), b: fmt(entry.b), c: fmt(entry.c), x: fmt(entry.x) });
    setResultField(entry.solvedField);
    setError(null);
    lightHaptic();
  };

  const renderField = (key: FieldKey, label: string) => {
    const isResult = resultField === key;
    return (
      <Animated.View
        style={[
          styles.fieldContainer,
          isResult && { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TextInput
          label={label}
          value={fields[key]}
          onChangeText={(v) => handleChange(key, sanitizeNumericInput(v))}
          keyboardType="decimal-pad"
          mode="outlined"
          style={[
            styles.expertInput,
            { backgroundColor: theme.colors.surface },
            isResult && { backgroundColor: theme.colors.primaryContainer },
          ]}
          outlineColor={isResult ? theme.colors.primary : theme.colors.outlineVariant}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          outlineStyle={{ borderRadius: RADIUS.md }}
          right={isResult ? <TextInput.Icon icon="check-circle" color={theme.colors.primary} /> : undefined}
        />
      </Animated.View>
    );
  };

  const hasResult = resultField !== null;

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
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('calculator.title')}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>{t('calculator.subtitleExpert')}</Text>
            </View>
            <IconButton
              icon="help-circle-outline"
              size={24}
              onPress={() => Alert.alert(t('calculator.helpTitle'), t('calculator.helpBody'))}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>

          {/* ── Card principale ── */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.equation}>
              <View style={styles.fraction}>
                {renderField('a', 'A')}
                <View style={[styles.divider, { backgroundColor: theme.colors.primary }]} />
                {renderField('b', 'B')}
              </View>
              <Text style={[styles.equals, { color: theme.colors.primary }]}>=</Text>
              <View style={styles.fraction}>
                {renderField('c', 'C')}
                <View style={[styles.divider, { backgroundColor: theme.colors.primary }]} />
                {renderField('x', 'X')}
              </View>
            </View>
          </View>

          {/* ── Error card ── */}
          {error && (
            <View style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
              <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>{error}</Text>
            </View>
          )}

          {/* ── Boutons d'action ── */}
          <View style={styles.actionButtons}>
            {hasResult && (
              <Button
                mode="contained"
                onPress={handleCopy}
                style={styles.copyButton}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
                icon="content-copy"
              >
                {t('calculator.copyResult')}
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.resetButton}
              textColor={theme.colors.primary}
              icon="refresh"
            >
              {t('calculator.reset')}
            </Button>
          </View>

          {/* ── Historique ── */}
          <HistoryList
            entries={historyEntries}
            onRemove={removeEntry}
            onClear={clearHistory}
            onPress={loadEntry}
            title={t('calculator.history')}
            searchPlaceholder={t('calculator.searchHistory')}
            searchFilter={(entry, q) =>
              entry.a.toString().includes(q) || entry.b.toString().includes(q) ||
              entry.c.toString().includes(q) || entry.x.toString().includes(q)
            }
            renderContent={(entry) => {
              const fmt = (n: number) =>
                Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
              return (
                <Text style={{ fontSize: 14, color: theme.colors.onSurface }}>
                  <Text style={{ color: entry.solvedField === 'a' ? theme.colors.primary : theme.colors.onSurface, fontWeight: entry.solvedField === 'a' ? 'bold' : 'normal' }}>
                    {fmt(entry.a)}
                  </Text>
                  {' / '}
                  <Text style={{ color: entry.solvedField === 'b' ? theme.colors.primary : theme.colors.onSurface, fontWeight: entry.solvedField === 'b' ? 'bold' : 'normal' }}>
                    {fmt(entry.b)}
                  </Text>
                  {' = '}
                  <Text style={{ color: entry.solvedField === 'c' ? theme.colors.primary : theme.colors.onSurface, fontWeight: entry.solvedField === 'c' ? 'bold' : 'normal' }}>
                    {fmt(entry.c)}
                  </Text>
                  {' / '}
                  <Text style={{ color: entry.solvedField === 'x' ? theme.colors.primary : theme.colors.onSurface, fontWeight: entry.solvedField === 'x' ? 'bold' : 'normal' }}>
                    {fmt(entry.x)}
                  </Text>
                </Text>
              );
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <AdBanner />
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2000}
      >
        {t('calculator.copied')}
      </Snackbar>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  headerSpacer: { width: 48 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  // Card
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl },

  // Expert mode
  equation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  fraction: { flex: 1, alignItems: 'center', gap: 10 },
  divider: { height: 2, width: '100%', borderRadius: 2 },
  equals: { fontSize: 24, fontWeight: '700', marginHorizontal: SPACING.sm },
  fieldContainer: { width: '100%' },
  expertInput: { fontSize: 20, textAlign: 'center', backgroundColor: COLORS.surface },

  // Error
  errorCard: { marginTop: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: SPACING.md },
  errorText: { fontSize: 14, color: '#991B1B', textAlign: 'center' },

  // Action buttons
  actionButtons: { marginTop: SPACING.xl, gap: SPACING.md },
  copyButton: { height: 48, borderRadius: RADIUS.md, justifyContent: 'center' },
  resetButton: { height: 48, borderRadius: RADIUS.md, justifyContent: 'center' },

  // History
  historySection: { marginTop: SPACING.xxl },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  historyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  searchInput: { marginBottom: SPACING.md, backgroundColor: COLORS.surface, fontSize: 14 },
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 56, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  historyItem: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyEquation: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  historyTime: { fontSize: 12, color: COLORS.textTertiary },
});

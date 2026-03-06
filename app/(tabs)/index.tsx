import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { solveCrossMultiply } from '../../src/utils/crossMultiply';
import { useAdsStore } from '../../src/store/adsStore';
import { useHistoryStore } from '../../src/store/historyStore';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { useInterstitialAd } from '../../src/components/ads/useInterstitialAd';
import { successHaptic, lightHaptic } from '../../src/utils/haptics';
import { useTranslation } from '../../src/i18n/useTranslation';
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
  const [historySearch, setHistorySearch] = useState('');
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

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return t('calculator.justNow');
    if (diff < 3600) return t('calculator.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('calculator.hoursAgo', { count: Math.floor(diff / 3600) });
    return t('calculator.daysAgo', { count: Math.floor(diff / 86400) });
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
          onChangeText={(v) => handleChange(key, v)}
          keyboardType="numeric"
          mode="outlined"
          style={[
            styles.expertInput,
            isResult && { backgroundColor: theme.colors.primaryContainer },
          ]}
          outlineColor={isResult ? theme.colors.primary : COLORS.border}
          activeOutlineColor={theme.colors.primary}
          textColor={COLORS.textPrimary}
          outlineStyle={{ borderRadius: RADIUS.md }}
          right={isResult ? <TextInput.Icon icon="check-circle" color={theme.colors.primary} /> : undefined}
        />
      </Animated.View>
    );
  };

  const hasResult = resultField !== null;

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
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <Text style={styles.title}>{t('calculator.title')}</Text>
              <Text style={styles.subtitle}>{t('calculator.subtitleExpert')}</Text>
            </View>
            <IconButton
              icon="help-circle-outline"
              size={24}
              onPress={() => Alert.alert(t('calculator.helpTitle'), t('calculator.helpBody'))}
              iconColor={COLORS.textSecondary}
            />
          </View>

          {/* ── Card principale ── */}
          <View style={styles.card}>
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
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
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
          {historyEntries.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>{t('calculator.history')}</Text>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  onPress={clearHistory}
                  iconColor={theme.colors.error}
                />
              </View>
              {historyEntries.length > 3 && (
                <TextInput
                  placeholder={t('calculator.searchHistory')}
                  value={historySearch}
                  onChangeText={setHistorySearch}
                  mode="outlined"
                  dense
                  left={<TextInput.Icon icon="magnify" size={18} />}
                  right={historySearch ? <TextInput.Icon icon="close" size={18} onPress={() => setHistorySearch('')} /> : undefined}
                  style={styles.searchInput}
                  outlineColor={COLORS.border}
                  activeOutlineColor={theme.colors.primary}
                  outlineStyle={{ borderRadius: RADIUS.md }}
                />
              )}
              {historyEntries.filter((entry) => {
                if (!historySearch.trim()) return true;
                const q = historySearch.trim().toLowerCase();
                const fmt = (n: number) => n.toString();
                return fmt(entry.a).includes(q) || fmt(entry.b).includes(q) || fmt(entry.c).includes(q) || fmt(entry.x).includes(q);
              }).map((entry) => {
                const fmt = (n: number) =>
                  Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
                return (
                  <Swipeable
                    key={entry.id}
                    renderRightActions={() => (
                      <Pressable
                        onPress={() => removeEntry(entry.id)}
                        style={[styles.swipeDelete, { backgroundColor: theme.colors.error }]}
                      >
                        <IconButton icon="delete" iconColor="#fff" size={20} />
                      </Pressable>
                    )}
                    overshootRight={false}
                  >
                    <Pressable onPress={() => loadEntry(entry)} style={({ pressed }) => [
                      styles.historyItem,
                      pressed && { backgroundColor: COLORS.segmentBg },
                    ]}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyEquation}>
                          <Text style={{ color: entry.solvedField === 'a' ? theme.colors.primary : COLORS.textPrimary, fontWeight: entry.solvedField === 'a' ? 'bold' : 'normal' }}>
                            {fmt(entry.a)}
                          </Text>
                          {' / '}
                          <Text style={{ color: entry.solvedField === 'b' ? theme.colors.primary : COLORS.textPrimary, fontWeight: entry.solvedField === 'b' ? 'bold' : 'normal' }}>
                            {fmt(entry.b)}
                          </Text>
                          {' = '}
                          <Text style={{ color: entry.solvedField === 'c' ? theme.colors.primary : COLORS.textPrimary, fontWeight: entry.solvedField === 'c' ? 'bold' : 'normal' }}>
                            {fmt(entry.c)}
                          </Text>
                          {' / '}
                          <Text style={{ color: entry.solvedField === 'x' ? theme.colors.primary : COLORS.textPrimary, fontWeight: entry.solvedField === 'x' ? 'bold' : 'normal' }}>
                            {fmt(entry.x)}
                          </Text>
                        </Text>
                        <Text style={styles.historyTime}>
                          {formatRelativeTime(entry.createdAt)}
                        </Text>
                      </View>
                    </Pressable>
                  </Swipeable>
                );
              })}
            </View>
          )}
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

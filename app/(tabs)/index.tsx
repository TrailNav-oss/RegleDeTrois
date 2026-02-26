import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Snackbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { solveCrossMultiply } from '../../src/utils/crossMultiply';
import { parseNaturalInput, type ParsedInput } from '../../src/utils/naturalLanguageParser';
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
  const [mode, setMode] = useState<'natural' | 'expert'>('natural');
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

  // ── NLP mode state ──
  const [nlInput, setNlInput] = useState('');
  const [parsed, setParsed] = useState<ParsedInput | null>(null);
  const [nlResult, setNlResult] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const nlFadeAnim = useRef(new Animated.Value(1)).current;
  const nlScaleAnim = useRef(new Animated.Value(1)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual fallback fields (inside natural mode)
  const [manualFields, setManualFields] = useState<{ quantity: string; base: string; target: string }>({
    quantity: '',
    base: '',
    target: '',
  });
  const [manualResult, setManualResult] = useState<string | null>(null);
  const manualFadeAnim = useRef(new Animated.Value(1)).current;
  const manualScaleAnim = useRef(new Animated.Value(1)).current;

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

  // ── NLP debounced parse + auto-compute ──
  useEffect(() => {
    if (mode !== 'natural') return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!nlInput.trim()) {
      setParsed(null);
      setNlResult(null);
      setError(null);
      setShowManualFallback(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const result = parseNaturalInput(nlInput);
      setParsed(result);

      if (!result) {
        setNlResult(null);
        setError(null);
        setShowManualFallback(false);
        return;
      }

      if (result.confidence === 'low') {
        setNlResult(null);
        setError(null);
        // Still compute for low confidence
      }

      // Auto compute via cross-multiply
      const cmResult = solveCrossMultiply({
        a: result.quantity,
        b: result.base,
        c: null,
        x: result.target,
      });

      if ('error' in cmResult) {
        setError(translateError(cmResult.error));
        setNlResult(null);
        return;
      }

      setError(null);
      const formatted = Number.isInteger(cmResult.value)
        ? cmResult.value.toString()
        : cmResult.value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

      setNlResult(formatted);

      nlFadeAnim.setValue(0);
      nlScaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.spring(nlFadeAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
        Animated.spring(nlScaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      ]).start();

      addHistoryEntry({
        a: result.quantity,
        b: result.base,
        c: cmResult.value,
        x: result.target,
        solvedField: 'c',
      });
      incrementCalc();
      successHaptic();
      setTimeout(() => showIfReady(), 300);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nlInput, mode]);

  // ── Manual fallback compute ──
  const computeManual = useCallback(() => {
    const q = parseField(manualFields.quantity);
    const b = parseField(manualFields.base);
    const tgt = parseField(manualFields.target);

    if (q === null || b === null || tgt === null) {
      setManualResult(null);
      setError(null);
      return;
    }

    const hasInvalid = [manualFields.quantity, manualFields.base, manualFields.target].some((v) => {
      const replaced = v.replace(',', '.');
      return isNaN(parseFloat(replaced));
    });
    if (hasInvalid) {
      setError(t('calculator.invalidNumber'));
      setManualResult(null);
      return;
    }

    const result = solveCrossMultiply({ a: q, b, c: null, x: tgt });

    if ('error' in result) {
      setError(translateError(result.error));
      setManualResult(null);
      return;
    }

    setError(null);
    const formatted = Number.isInteger(result.value)
      ? result.value.toString()
      : result.value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

    setManualResult(formatted);

    manualFadeAnim.setValue(0);
    manualScaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.spring(manualFadeAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      Animated.spring(manualScaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
    ]).start();

    addHistoryEntry({ a: q, b, c: result.value, x: tgt, solvedField: 'c' });
    incrementCalc();
    successHaptic();
    setTimeout(() => showIfReady(), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualFields, manualFadeAnim, manualScaleAnim, incrementCalc, showIfReady, addHistoryEntry]);

  useEffect(() => {
    if (mode !== 'natural' || !showManualFallback) return;
    const allFilled =
      manualFields.quantity.trim() !== '' &&
      manualFields.base.trim() !== '' &&
      manualFields.target.trim() !== '';
    if (allFilled && manualResult === null) {
      computeManual();
    }
  }, [mode, showManualFallback, manualFields, manualResult, computeManual]);

  const handleManualChange = (key: 'quantity' | 'base' | 'target', value: string) => {
    setManualResult(null);
    setManualFields((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  // ── Expert mode compute ──
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
    if (mode !== 'expert') return;
    const filledCount = (Object.keys(fields) as FieldKey[]).filter(
      (k) => fields[k].trim() !== ''
    ).length;
    if (filledCount === 3 && !resultField) {
      compute();
    }
  }, [mode, fields, resultField, compute]);

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
    if (mode === 'natural') {
      setNlInput('');
      setParsed(null);
      setNlResult(null);
      setShowManualFallback(false);
      setManualFields({ quantity: '', base: '', target: '' });
      setManualResult(null);
    } else {
      setFields({ a: '', b: '', c: '', x: '' });
      setResultField(null);
    }
    setError(null);
    lightHaptic();
  };

  const handleCopy = async () => {
    let toCopy: string | null = null;
    if (mode === 'natural') {
      toCopy = showManualFallback ? manualResult : nlResult;
    } else {
      toCopy = resultField ? fields[resultField] : null;
    }
    if (toCopy) {
      await Clipboard.setStringAsync(toCopy);
      setSnackVisible(true);
      lightHaptic();
    }
  };

  const handleModeChange = (value: 'natural' | 'expert') => {
    setMode(value);
    setFields({ a: '', b: '', c: '', x: '' });
    setResultField(null);
    setNlInput('');
    setParsed(null);
    setNlResult(null);
    setShowManualFallback(false);
    setManualFields({ quantity: '', base: '', target: '' });
    setManualResult(null);
    setError(null);
  };

  const loadEntry = (entry: HistoryEntry) => {
    const fmt = (n: number) =>
      Number.isInteger(n) ? n.toString() : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    if (mode === 'expert') {
      setFields({ a: fmt(entry.a), b: fmt(entry.b), c: fmt(entry.c), x: fmt(entry.x) });
      setResultField(entry.solvedField);
    } else {
      // Load into manual fallback
      setShowManualFallback(true);
      setManualFields({ quantity: fmt(entry.a), base: fmt(entry.b), target: fmt(entry.x) });
      setManualResult(fmt(entry.c));
      setNlInput('');
      setParsed(null);
      setNlResult(null);
    }
    setError(null);
    lightHaptic();
  };

  const handleSuggestion = (text: string) => {
    setNlInput(text);
    setShowManualFallback(false);
    setManualResult(null);
    setError(null);
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

  const hasResult = mode === 'natural'
    ? (showManualFallback ? manualResult !== null : nlResult !== null)
    : resultField !== null;

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
          <Text style={styles.title}>{t('calculator.title')}</Text>
          <Text style={styles.subtitle}>
            {mode === 'natural'
              ? t('calculator.subtitleNatural')
              : t('calculator.subtitleExpert')}
          </Text>

          {/* ── Segmented Control ── */}
          <View style={styles.segmentContainer}>
            <Pressable
              onPress={() => handleModeChange('natural')}
              style={[styles.segmentButton, mode === 'natural' && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, mode === 'natural' ? styles.segmentTextActive : styles.segmentTextInactive]}>
                {t('calculator.modeNatural')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleModeChange('expert')}
              style={[styles.segmentButton, mode === 'expert' && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, mode === 'expert' ? styles.segmentTextActive : styles.segmentTextInactive]}>
                {t('calculator.modeExpert')}
              </Text>
            </Pressable>
          </View>

          {/* ── Card principale ── */}
          {mode === 'natural' ? (
            <View style={styles.card}>
              {/* NLP TextInput */}
              <TextInput
                value={nlInput}
                onChangeText={(v) => {
                  setNlInput(v);
                  setNlResult(null);
                  setParsed(null);
                  setShowManualFallback(false);
                  setManualResult(null);
                  setError(null);
                }}
                mode="outlined"
                placeholder={t('calculator.nlpPlaceholder')}
                multiline
                numberOfLines={3}
                style={styles.nlpInput}
                outlineColor={COLORS.border}
                activeOutlineColor={theme.colors.primary}
                textColor={COLORS.textPrimary}
                outlineStyle={{ borderRadius: RADIUS.md }}
              />

              {/* Detected values chips */}
              {parsed && nlResult !== null && (
                <View style={styles.detectedSection}>
                  <Text style={styles.detectedLabel}>{t('calculator.nlpDetected')}</Text>
                  <View style={styles.chipRow}>
                    <Chip compact style={styles.valueChip} textStyle={styles.chipText}>
                      {parsed.quantity}{parsed.item ? ` ${parsed.item}` : ''}
                    </Chip>
                    <Chip compact style={styles.valueChip} textStyle={styles.chipText}>
                      {parsed.base}{parsed.baseUnit ? ` ${parsed.baseUnit}` : ''}
                    </Chip>
                    <Text style={styles.chipArrow}>→</Text>
                    <Chip compact style={styles.valueChip} textStyle={styles.chipText}>
                      {parsed.target}{parsed.baseUnit ? ` ${parsed.baseUnit}` : ''}
                    </Chip>
                  </View>
                </View>
              )}

              {/* Low confidence warning */}
              {parsed && parsed.confidence === 'low' && nlResult !== null && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>{t('calculator.nlpLowConfidence')}</Text>
                </View>
              )}

              {/* Result */}
              {nlResult !== null && !showManualFallback && (
                <>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultZone}>
                    <Text style={styles.resultLabel}>{t('calculator.result')}</Text>
                    <Animated.View style={{ opacity: nlFadeAnim, transform: [{ scale: nlScaleAnim }] }}>
                      <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                        {nlResult}{parsed?.item ? ` ${parsed.item}` : ''}
                      </Text>
                    </Animated.View>
                  </View>
                </>
              )}

              {/* No result + no parse: suggestions */}
              {!nlInput.trim() && !showManualFallback && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsLabel}>{t('calculator.nlpTryFormat')}</Text>
                  <Pressable onPress={() => handleSuggestion(t('calculator.nlpSuggestion1'))}>
                    <View style={styles.suggestionChip}>
                      <Text style={styles.suggestionText}>{t('calculator.nlpSuggestion1')}</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => handleSuggestion(t('calculator.nlpSuggestion2'))}>
                    <View style={styles.suggestionChip}>
                      <Text style={styles.suggestionText}>{t('calculator.nlpSuggestion2')}</Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Manual fallback button (when NLP input exists but no result) */}
              {nlInput.trim() !== '' && nlResult === null && !showManualFallback && !parsed && (
                <View style={styles.fallbackSection}>
                  <Text style={styles.fallbackText}>{t('calculator.nlpFailed')}</Text>
                  <Text style={styles.fallbackSubtext}>{t('calculator.nlpTryFormat')}</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowManualFallback(true)}
                    style={styles.fallbackButton}
                    textColor={theme.colors.primary}
                    icon="pencil"
                  >
                    {t('calculator.nlpManualFallback')}
                  </Button>
                </View>
              )}

              {/* Manual fallback fields */}
              {showManualFallback && (
                <View style={styles.manualSection}>
                  <View style={styles.natFieldBlock}>
                    <Text style={styles.fieldLabel}>{t('calculator.manualQuantity')}</Text>
                    <TextInput
                      value={manualFields.quantity}
                      onChangeText={(v) => handleManualChange('quantity', v)}
                      keyboardType="numeric"
                      mode="outlined"
                      placeholder={t('calculator.placeholderQty')}
                      style={styles.natInput}
                      outlineColor={COLORS.border}
                      activeOutlineColor={theme.colors.primary}
                      textColor={COLORS.textPrimary}
                      outlineStyle={{ borderRadius: RADIUS.md }}
                    />
                  </View>
                  <View style={styles.natFieldBlock}>
                    <Text style={styles.fieldLabel}>{t('calculator.manualBase')}</Text>
                    <TextInput
                      value={manualFields.base}
                      onChangeText={(v) => handleManualChange('base', v)}
                      keyboardType="numeric"
                      placeholder={t('calculator.placeholderBase')}
                      mode="outlined"
                      style={styles.natInput}
                      outlineColor={COLORS.border}
                      activeOutlineColor={theme.colors.primary}
                      textColor={COLORS.textPrimary}
                      outlineStyle={{ borderRadius: RADIUS.md }}
                    />
                  </View>
                  <View style={styles.natFieldBlock}>
                    <Text style={styles.fieldLabel}>{t('calculator.manualTarget')}</Text>
                    <TextInput
                      value={manualFields.target}
                      onChangeText={(v) => handleManualChange('target', v)}
                      keyboardType="numeric"
                      placeholder={t('calculator.placeholderTarget')}
                      mode="outlined"
                      style={styles.natInput}
                      outlineColor={COLORS.border}
                      activeOutlineColor={theme.colors.primary}
                      textColor={COLORS.textPrimary}
                      outlineStyle={{ borderRadius: RADIUS.md }}
                    />
                  </View>
                  {manualResult !== null && (
                    <>
                      <View style={styles.resultDivider} />
                      <View style={styles.resultZone}>
                        <Text style={styles.resultLabel}>{t('calculator.result')}</Text>
                        <Animated.View style={{ opacity: manualFadeAnim, transform: [{ scale: manualScaleAnim }] }}>
                          <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                            {manualResult}
                          </Text>
                        </Animated.View>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          ) : (
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
          )}

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
              {historyEntries.map((entry) => {
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
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },

  // Segmented control
  segmentContainer: { flexDirection: 'row', height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.segmentBg, padding: 3, marginBottom: SPACING.xl },
  segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentButtonActive: { backgroundColor: COLORS.surface, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 14 },
  segmentTextActive: { fontWeight: '600', color: COLORS.textPrimary },
  segmentTextInactive: { fontWeight: '500', color: COLORS.textSecondary },

  // Card
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl },

  // NLP input
  nlpInput: { fontSize: 16, backgroundColor: COLORS.surface, minHeight: 80 },

  // Detected values
  detectedSection: { marginTop: SPACING.lg },
  detectedLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm },
  valueChip: { backgroundColor: COLORS.segmentBg },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  chipArrow: { fontSize: 18, fontWeight: '700', color: COLORS.accent },

  // Warning
  warningBox: { marginTop: SPACING.sm, backgroundColor: '#FEF9C3', borderRadius: RADIUS.sm, padding: SPACING.md },
  warningText: { fontSize: 13, color: '#92400E', textAlign: 'center' },

  // Suggestions
  suggestionsSection: { marginTop: SPACING.xl, gap: SPACING.sm },
  suggestionsLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  suggestionChip: { backgroundColor: COLORS.segmentBg, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  suggestionText: { fontSize: 14, color: COLORS.accent, fontWeight: '500' },

  // Fallback
  fallbackSection: { marginTop: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  fallbackText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  fallbackSubtext: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },
  fallbackButton: { borderRadius: RADIUS.md, marginTop: SPACING.sm },

  // Manual section
  manualSection: { marginTop: SPACING.lg },

  // Natural mode fields
  natFieldBlock: { marginBottom: SPACING.lg },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  natInput: { height: 52, fontSize: 18, backgroundColor: COLORS.surface },

  // Result zone
  resultDivider: { height: 1, backgroundColor: COLORS.border, marginTop: SPACING.sm },
  resultZone: { paddingTop: SPACING.lg },
  resultLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  resultValue: { fontSize: 32, fontWeight: '600' },
  resultPlaceholder: { fontSize: 32, fontWeight: '600', color: COLORS.border },

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
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 56, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  historyItem: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyEquation: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  historyTime: { fontSize: 12, color: COLORS.textTertiary },
});

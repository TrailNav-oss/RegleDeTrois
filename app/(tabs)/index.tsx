import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { solveCrossMultiply } from '../../src/utils/crossMultiply';
import { useAdsStore } from '../../src/store/adsStore';
import { useHistoryStore } from '../../src/store/historyStore';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { useInterstitialAd } from '../../src/components/ads/useInterstitialAd';
import { successHaptic, lightHaptic } from '../../src/utils/haptics';
import type { HistoryEntry } from '../../src/types/history';

type FieldKey = 'a' | 'b' | 'c' | 'x';

export default function SimpleScreen() {
  const theme = useTheme();
  const [fields, setFields] = useState<Record<FieldKey, string>>({ a: '', b: '', c: '', x: '' });
  const [resultField, setResultField] = useState<FieldKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const incrementCalc = useAdsStore((s) => s.incrementCalc);
  const { showIfReady } = useInterstitialAd();
  const historyEntries = useHistoryStore((s) => s.entries);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const parseField = (val: string): number | null => {
    if (val.trim() === '') return null;
    const replaced = val.replace(',', '.');
    const num = parseFloat(replaced);
    return isNaN(num) ? null : num;
  };

  const compute = useCallback(() => {
    const parsed = {
      a: parseField(fields.a),
      b: parseField(fields.b),
      c: parseField(fields.c),
      x: parseField(fields.x),
    };

    // Count empty fields
    const emptyFields = (Object.keys(parsed) as FieldKey[]).filter(
      (k) => fields[k].trim() === ''
    );

    if (emptyFields.length !== 1) {
      setResultField(null);
      setError(null);
      return;
    }

    // Check for non-numeric inputs
    const filledFields = (Object.keys(parsed) as FieldKey[]).filter(
      (k) => fields[k].trim() !== ''
    );
    const hasInvalid = filledFields.some((k) => {
      const replaced = fields[k].replace(',', '.');
      return isNaN(parseFloat(replaced));
    });
    if (hasInvalid) {
      setError('Valeur non numérique détectée.');
      setResultField(null);
      return;
    }

    const result = solveCrossMultiply(parsed);

    if ('error' in result) {
      setError(result.error);
      setResultField(null);
      return;
    }

    setError(null);
    setResultField(result.field);

    // Animate result with spring effect
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }),
    ]).start();

    // Format result
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
    // Show interstitial after every N calculations
    setTimeout(() => showIfReady(), 300);
  }, [fields, fadeAnim, scaleAnim, incrementCalc, showIfReady, addHistoryEntry]);

  // Auto-compute when exactly 3 fields are filled
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
      // Clear previous result so auto-compute re-triggers with updated input
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
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
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
            styles.input,
            isResult && { backgroundColor: theme.colors.primaryContainer },
          ]}
          outlineColor={isResult ? theme.colors.primary : theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          right={isResult ? <TextInput.Icon icon="check-circle" color={theme.colors.primary} /> : undefined}
        />
      </Animated.View>
    );
  };

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
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Règle de trois
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Remplissez 3 valeurs, la 4e se calcule automatiquement
          </Text>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Content style={styles.cardContent}>
              {/* A / B = C / X layout */}
              <View style={styles.equation}>
                <View style={styles.fraction}>
                  {renderField('a', 'A')}
                  <View style={[styles.divider, { backgroundColor: theme.colors.primary }]} />
                  {renderField('b', 'B')}
                </View>

                <Text variant="headlineMedium" style={[styles.equals, { color: theme.colors.primary }]}>
                  =
                </Text>

                <View style={styles.fraction}>
                  {renderField('c', 'C')}
                  <View style={[styles.divider, { backgroundColor: theme.colors.primary }]} />
                  {renderField('x', 'X')}
                </View>
              </View>
            </Card.Content>
          </Card>

          {error && (
            <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
              <Card.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer, textAlign: 'center' }}>
                  {error}
                </Text>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.resetButton}
            textColor={theme.colors.primary}
            icon="refresh"
          >
            Réinitialiser
          </Button>

          {historyEntries.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  Historique
                </Text>
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
                  <Pressable key={entry.id} onPress={() => loadEntry(entry)} style={({ pressed }) => [
                    styles.historyItem,
                    { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface },
                  ]}>
                    <View style={styles.historyRow}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
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
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatRelativeTime(entry.createdAt)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    borderRadius: 20,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  equation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  fraction: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
  equals: {
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  fieldContainer: {
    width: '100%',
  },
  input: {
    fontSize: 24,
    textAlign: 'center',
  },
  errorCard: {
    marginTop: 16,
    borderRadius: 12,
  },
  resetButton: {
    marginTop: 24,
    borderRadius: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  historySection: {
    marginTop: 32,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

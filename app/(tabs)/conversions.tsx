import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Text, TextInput, useTheme, IconButton, Snackbar, SegmentedButtons, type MD3Theme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  convert,
  roundConversion,
  getUnitsForCategory,
  type ConversionCategory,
  type ConversionUnit,
} from '../../src/utils/conversions';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { lightHaptic } from '../../src/utils/haptics';
import { useTranslation } from '../../src/i18n/useTranslation';
import { sanitizeNumericInput } from '../../src/utils/sanitize';
import { useHistoryStore } from '../../src/store/historyStore';
import { HistoryList } from '../../src/components/ui/HistoryList';

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const RADIUS = { sm: 8, md: 12, lg: 16 };
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#1C1B1F',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

function UnitSelector({ label, selected, onSelect, units, theme }: {
  label: string;
  selected: string;
  onSelect: (id: string) => void;
  units: ConversionUnit[];
  theme: MD3Theme;
}) {
  const [showMore, setShowMore] = useState(false);
  const containerWidth = useRef(0);
  const contentWidth = useRef(0);
  const scrollX = useRef(0);

  const checkOverflow = useCallback(() => {
    setShowMore(contentWidth.current > containerWidth.current + scrollX.current + 8);
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    containerWidth.current = e.nativeEvent.layout.width;
    checkOverflow();
  }, [checkOverflow]);

  const handleContentSizeChange = useCallback((w: number) => {
    contentWidth.current = w;
    checkOverflow();
  }, [checkOverflow]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
    checkOverflow();
  }, [checkOverflow]);

  return (
    <View style={styles.unitSelectorContainer}>
      <Text style={[styles.unitSelectorLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.unitChipsRow}>
            {units.map((u) => (
              <IconButton
                key={u.id}
                icon={() => (
                  <Text style={[
                    styles.unitChipText,
                    { color: theme.colors.onSurface },
                    selected === u.id && { color: theme.colors.onPrimary, fontWeight: '700' },
                  ]}>
                    {u.label}
                  </Text>
                )}
                onPress={() => { onSelect(u.id); lightHaptic(); }}
                style={[
                  styles.unitChip,
                  selected === u.id
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outlineVariant },
                ]}
                size={16}
              />
            ))}
          </View>
        </ScrollView>
        {showMore && (
          <View style={[styles.scrollIndicator, { backgroundColor: theme.colors.background }]} pointerEvents="none">
            <Text style={[styles.scrollIndicatorIcon, { color: theme.colors.primary }]}>›</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ConversionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [category, setCategory] = useState<ConversionCategory>('weight');
  const [fromUnit, setFromUnit] = useState('g');
  const [toUnit, setToUnit] = useState('kg');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);

  const conversionEntries = useHistoryStore((s) => s.conversionEntries);
  const addConversionEntry = useHistoryStore((s) => s.addConversionEntry);
  const removeConversionEntry = useHistoryStore((s) => s.removeConversionEntry);
  const clearConversionHistory = useHistoryStore((s) => s.clearConversionHistory);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const units = getUnitsForCategory(category);

  // Reset units when category changes
  useEffect(() => {
    const catUnits = getUnitsForCategory(category);
    setFromUnit(catUnits[0].id);
    setToUnit(catUnits.length > 1 ? catUnits[1].id : catUnits[0].id);
    setInputValue('');
    setResult(null);
  }, [category]);

  // Real-time conversion
  useEffect(() => {
    if (inputValue.trim() === '') {
      setResult(null);
      return;
    }
    const val = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(val)) {
      setResult(null);
      return;
    }
    const converted = convert(val, fromUnit, toUnit, category);
    if (converted === null) {
      setResult(null);
      return;
    }
    setResult(roundConversion(converted));

    fadeAnim.setValue(0.5);
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200 }).start();
  }, [inputValue, fromUnit, toUnit, category, fadeAnim]);

  const handleSwap = () => {
    const prevFrom = fromUnit;
    const prevTo = toUnit;
    setFromUnit(prevTo);
    setToUnit(prevFrom);
    lightHaptic();
  };

  const handleCopy = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      const parsedValue = parseFloat(inputValue.replace(',', '.'));
      if (!isNaN(parsedValue)) {
        addConversionEntry({ category, fromUnit, toUnit, value: parsedValue, result });
      }
      setSnackVisible(true);
      lightHaptic();
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val as ConversionCategory);
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
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('conversions.title')}</Text>
            </View>
            <IconButton
              icon="help-circle-outline"
              size={24}
              onPress={() => Alert.alert(t('conversions.helpTitle'), t('conversions.helpBody'))}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>

          {/* Category selector */}
          <SegmentedButtons
            value={category}
            onValueChange={handleCategoryChange}
            buttons={[
              { value: 'weight', label: t('conversions.weight'), icon: 'weight' },
              { value: 'volume', label: t('conversions.volume'), icon: 'cup-water' },
              { value: 'temperature', label: t('conversions.temperature'), icon: 'thermometer' },
            ]}
            style={styles.categoryToggle}
          />

          {/* Conversion card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
            {/* From */}
            <UnitSelector label={t('conversions.from')} selected={fromUnit} onSelect={setFromUnit} units={units} theme={theme} />

            <TextInput
              label={t('conversions.value')}
              value={inputValue}
              onChangeText={(v) => setInputValue(sanitizeNumericInput(v))}
              keyboardType="decimal-pad"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              outlineStyle={{ borderRadius: RADIUS.md }}
              right={<TextInput.Affix text={fromUnit} />}
            />

            {/* Swap button */}
            <View style={styles.swapRow}>
              <View style={[styles.swapLine, { backgroundColor: theme.colors.outlineVariant }]} />
              <IconButton
                icon="swap-vertical"
                size={28}
                onPress={handleSwap}
                iconColor={theme.colors.primary}
                style={[styles.swapButton, { backgroundColor: theme.colors.primaryContainer }]}
              />
              <View style={[styles.swapLine, { backgroundColor: theme.colors.outlineVariant }]} />
            </View>

            {/* To */}
            <UnitSelector label={t('conversions.to')} selected={toUnit} onSelect={setToUnit} units={units} theme={theme} />

            {/* Result */}
            {result !== null && (
              <Animated.View
                style={[
                  styles.resultRow,
                  { backgroundColor: theme.colors.primaryContainer, opacity: fadeAnim },
                ]}
              >
                <View style={styles.resultContent}>
                  <Text style={[styles.resultLabel, { color: theme.colors.onSurfaceVariant }]}>{t('conversions.result')}</Text>
                  <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                    {result} {toUnit}
                  </Text>
                </View>
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={handleCopy}
                  iconColor={theme.colors.primary}
                />
              </Animated.View>
            )}
          </View>

          <HistoryList
            entries={conversionEntries}
            onRemove={removeConversionEntry}
            onClear={clearConversionHistory}
            onPress={(entry) => {
              setCategory(entry.category as ConversionCategory);
              setTimeout(() => {
                if (!mountedRef.current) return;
                setFromUnit(entry.fromUnit);
                setToUnit(entry.toUnit);
                setInputValue(entry.value.toString());
              }, 50);
              lightHaptic();
            }}
            title={t('conversions.history')}
            searchPlaceholder={t('conversions.searchHistory')}
            searchFilter={(entry, q) =>
              entry.value.toString().includes(q) || entry.result.includes(q) ||
              entry.fromUnit.toLowerCase().includes(q) || entry.toUnit.toLowerCase().includes(q)
            }
            renderContent={(entry) => (
              <Text style={{ fontSize: 14, color: theme.colors.onSurface }}>
                {entry.value} {entry.fromUnit} → <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{entry.result} {entry.toUnit}</Text>
              </Text>
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
        {t('conversions.copied')}
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

  categoryToggle: { marginBottom: SPACING.xl },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },

  unitSelectorContainer: { gap: SPACING.sm },
  unitSelectorLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  unitChipsRow: { flexDirection: 'row', gap: SPACING.sm },
  unitChip: { borderRadius: 20, width: 'auto', minWidth: 48, paddingHorizontal: 12, height: 36 },
  unitChipText: { fontSize: 14, color: COLORS.textPrimary },

  scrollIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 2,
  },
  scrollIndicatorIcon: {
    fontSize: 22,
    fontWeight: '700',
  },

  input: { fontSize: 20, backgroundColor: COLORS.surface },

  swapRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  swapLine: { flex: 1, height: 1 },
  swapButton: { borderRadius: 24 },

  resultRow: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultContent: { flex: 1, gap: 4 },
  resultLabel: { fontSize: 13, color: COLORS.textSecondary },
  resultValue: { fontSize: 24, fontWeight: '700' },

  historySection: { marginTop: SPACING.xxl },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  historyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 56, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  historyItem: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyEquation: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  historyTime: { fontSize: 12, color: COLORS.textSecondary },
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useHistoryStore } from '../store/historyStore';

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [], percentageEntries: [], conversionEntries: [] });
  });

  // ── Cross-multiply entries ──
  it('adds a cross-multiply entry', () => {
    useHistoryStore.getState().addEntry({ a: 1, b: 2, c: 3, x: 6, solvedField: 'x' });
    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].a).toBe(1);
    expect(entries[0].solvedField).toBe('x');
    expect(entries[0].id).toBeDefined();
    expect(entries[0].createdAt).toBeGreaterThan(0);
  });

  it('prepends new entries (most recent first)', () => {
    useHistoryStore.getState().addEntry({ a: 1, b: 2, c: 3, x: 6, solvedField: 'x' });
    useHistoryStore.getState().addEntry({ a: 10, b: 20, c: 30, x: 60, solvedField: 'a' });
    const { entries } = useHistoryStore.getState();
    expect(entries[0].a).toBe(10);
    expect(entries[1].a).toBe(1);
  });

  it('caps entries at MAX_ENTRIES (50)', () => {
    for (let i = 0; i < 55; i++) {
      useHistoryStore.getState().addEntry({ a: i, b: 1, c: 1, x: i, solvedField: 'x' });
    }
    expect(useHistoryStore.getState().entries).toHaveLength(50);
  });

  it('removes an entry by id', () => {
    useHistoryStore.getState().addEntry({ a: 1, b: 2, c: 3, x: 6, solvedField: 'x' });
    const id = useHistoryStore.getState().entries[0].id;
    useHistoryStore.getState().removeEntry(id);
    expect(useHistoryStore.getState().entries).toHaveLength(0);
  });

  it('clears all cross-multiply entries', () => {
    useHistoryStore.getState().addEntry({ a: 1, b: 2, c: 3, x: 6, solvedField: 'x' });
    useHistoryStore.getState().addEntry({ a: 2, b: 4, c: 6, x: 12, solvedField: 'x' });
    useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().entries).toHaveLength(0);
  });

  // ── Percentage entries ──
  it('adds a percentage entry', () => {
    useHistoryStore.getState().addPercentageEntry({ mode: 'percentOf', field1: 15, field2: 200, result: '30' });
    const { percentageEntries } = useHistoryStore.getState();
    expect(percentageEntries).toHaveLength(1);
    expect(percentageEntries[0].mode).toBe('percentOf');
  });

  it('caps percentage entries at 50', () => {
    for (let i = 0; i < 55; i++) {
      useHistoryStore.getState().addPercentageEntry({ mode: 'percentOf', field1: i, field2: 100, result: String(i) });
    }
    expect(useHistoryStore.getState().percentageEntries).toHaveLength(50);
  });

  it('removes a percentage entry', () => {
    useHistoryStore.getState().addPercentageEntry({ mode: 'variation', field1: 80, field2: 100, result: '25%' });
    const id = useHistoryStore.getState().percentageEntries[0].id;
    useHistoryStore.getState().removePercentageEntry(id);
    expect(useHistoryStore.getState().percentageEntries).toHaveLength(0);
  });

  it('clears percentage history', () => {
    useHistoryStore.getState().addPercentageEntry({ mode: 'percentOf', field1: 10, field2: 200, result: '20' });
    useHistoryStore.getState().clearPercentageHistory();
    expect(useHistoryStore.getState().percentageEntries).toHaveLength(0);
  });

  // ── Conversion entries ──
  it('adds a conversion entry', () => {
    useHistoryStore.getState().addConversionEntry({ category: 'weight', fromUnit: 'kg', toUnit: 'lb', value: 1, result: '2.205' });
    const { conversionEntries } = useHistoryStore.getState();
    expect(conversionEntries).toHaveLength(1);
    expect(conversionEntries[0].category).toBe('weight');
  });

  it('caps conversion entries at 50', () => {
    for (let i = 0; i < 55; i++) {
      useHistoryStore.getState().addConversionEntry({ category: 'volume', fromUnit: 'ml', toUnit: 'L', value: i, result: String(i / 1000) });
    }
    expect(useHistoryStore.getState().conversionEntries).toHaveLength(50);
  });

  it('removes a conversion entry', () => {
    useHistoryStore.getState().addConversionEntry({ category: 'temperature', fromUnit: '°C', toUnit: '°F', value: 100, result: '212' });
    const id = useHistoryStore.getState().conversionEntries[0].id;
    useHistoryStore.getState().removeConversionEntry(id);
    expect(useHistoryStore.getState().conversionEntries).toHaveLength(0);
  });

  it('clears conversion history', () => {
    useHistoryStore.getState().addConversionEntry({ category: 'weight', fromUnit: 'g', toUnit: 'oz', value: 100, result: '3.527' });
    useHistoryStore.getState().clearConversionHistory();
    expect(useHistoryStore.getState().conversionEntries).toHaveLength(0);
  });

  // ── Independence ──
  it('clearing one history type does not affect others', () => {
    useHistoryStore.getState().addEntry({ a: 1, b: 2, c: 3, x: 6, solvedField: 'x' });
    useHistoryStore.getState().addPercentageEntry({ mode: 'percentOf', field1: 10, field2: 100, result: '10' });
    useHistoryStore.getState().addConversionEntry({ category: 'weight', fromUnit: 'g', toUnit: 'kg', value: 1000, result: '1' });

    useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().entries).toHaveLength(0);
    expect(useHistoryStore.getState().percentageEntries).toHaveLength(1);
    expect(useHistoryStore.getState().conversionEntries).toHaveLength(1);
  });
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentry } from '../config/sentry';
import type { HistoryEntry, PercentageHistoryEntry, ConversionHistoryEntry } from '../types/history';

const MAX_ENTRIES = 50;

interface HistoryState {
  entries: HistoryEntry[];
  percentageEntries: PercentageHistoryEntry[];
  conversionEntries: ConversionHistoryEntry[];

  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;

  addPercentageEntry: (entry: Omit<PercentageHistoryEntry, 'id' | 'createdAt'>) => void;
  removePercentageEntry: (id: string) => void;
  clearPercentageHistory: () => void;

  addConversionEntry: (entry: Omit<ConversionHistoryEntry, 'id' | 'createdAt'>) => void;
  removeConversionEntry: (id: string) => void;
  clearConversionHistory: () => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      percentageEntries: [],
      conversionEntries: [],

      // Cross-multiply
      addEntry: (data) => {
        const newEntry: HistoryEntry = { ...data, id: generateId(), createdAt: Date.now() };
        set((state) => ({ entries: [newEntry, ...state.entries].slice(0, MAX_ENTRIES) }));
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clearHistory: () => set({ entries: [] }),

      // Percentages
      addPercentageEntry: (data) => {
        const newEntry: PercentageHistoryEntry = { ...data, id: generateId(), createdAt: Date.now() };
        set((state) => ({ percentageEntries: [newEntry, ...state.percentageEntries].slice(0, MAX_ENTRIES) }));
      },
      removePercentageEntry: (id) => set((state) => ({ percentageEntries: state.percentageEntries.filter((e) => e.id !== id) })),
      clearPercentageHistory: () => set({ percentageEntries: [] }),

      // Conversions
      addConversionEntry: (data) => {
        const newEntry: ConversionHistoryEntry = { ...data, id: generateId(), createdAt: Date.now() };
        set((state) => ({ conversionEntries: [newEntry, ...state.conversionEntries].slice(0, MAX_ENTRIES) }));
      },
      removeConversionEntry: (id) => set((state) => ({ conversionEntries: state.conversionEntries.filter((e) => e.id !== id) })),
      clearConversionHistory: () => set({ conversionEntries: [] }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

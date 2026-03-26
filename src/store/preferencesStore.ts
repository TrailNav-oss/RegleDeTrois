import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentry } from '../config/sentry';

const DEFAULT_MULTIPLIERS = [0.5, 2, 3];
const DEFAULT_PERCENTAGE_PRESETS = [5, 10, 15, 20, 25, 50];

interface PreferencesState {
  multipliers: number[];
  percentagePresets: number[];
  setMultipliers: (values: number[]) => void;
  addMultiplier: (value: number) => void;
  removeMultiplier: (value: number) => void;
  resetMultipliers: () => void;
  setPercentagePresets: (values: number[]) => void;
  addPercentagePreset: (value: number) => void;
  removePercentagePreset: (value: number) => void;
  resetPercentagePresets: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      multipliers: DEFAULT_MULTIPLIERS,
      percentagePresets: DEFAULT_PERCENTAGE_PRESETS,

      setMultipliers: (values) => set({ multipliers: [...values].sort((a, b) => a - b) }),
      addMultiplier: (value) =>
        set((state) => {
          if (state.multipliers.includes(value)) return state;
          return { multipliers: [...state.multipliers, value].sort((a, b) => a - b) };
        }),
      removeMultiplier: (value) =>
        set((state) => ({ multipliers: state.multipliers.filter((m) => m !== value) })),
      resetMultipliers: () => set({ multipliers: DEFAULT_MULTIPLIERS }),

      setPercentagePresets: (values) => set({ percentagePresets: [...values].sort((a, b) => a - b) }),
      addPercentagePreset: (value) =>
        set((state) => {
          if (state.percentagePresets.includes(value)) return state;
          return { percentagePresets: [...state.percentagePresets, value].sort((a, b) => a - b) };
        }),
      removePercentagePreset: (value) =>
        set((state) => ({ percentagePresets: state.percentagePresets.filter((p) => p !== value) })),
      resetPercentagePresets: () => set({ percentagePresets: DEFAULT_PERCENTAGE_PRESETS }),
    }),
    {
      name: 'preferences-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

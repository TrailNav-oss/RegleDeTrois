import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentry } from '../config/sentry';

export type UnitSystem = 'metric' | 'imperial';

interface UnitsState {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
}

export const useUnitsStore = create<UnitsState>()(
  persist(
    (set) => ({
      unitSystem: 'metric',
      setUnitSystem: (system) => set({ unitSystem: system }),
    }),
    {
      name: 'units-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

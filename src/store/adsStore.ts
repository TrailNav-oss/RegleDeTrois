import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADS_CONFIG } from '../config/ads';

interface AdsState {
  isPremium: boolean;
  calcCount: number;
  incrementCalc: () => void;
  shouldShowInterstitial: () => boolean;
  resetCount: () => void;
  togglePremium: () => void;
  setPremium: (value: boolean) => void;
}

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      calcCount: 0,

      incrementCalc: () => {
        set((state) => ({ calcCount: state.calcCount + 1 }));
      },

      shouldShowInterstitial: () => {
        const { isPremium, calcCount } = get();
        if (isPremium) return false;
        return calcCount > 0 && calcCount % ADS_CONFIG.INTERSTITIAL_EVERY_N === 0;
      },

      resetCount: () => set({ calcCount: 0 }),

      togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),

      setPremium: (value) => set({ isPremium: value }),
    }),
    {
      name: 'ads-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADS_CONFIG } from '../config/ads';
import { Sentry } from '../config/sentry';

interface AdsState {
  isPremium: boolean;
  calcCount: number;
  adsInitialized: boolean;
  incrementCalc: () => void;
  shouldShowInterstitial: () => boolean;
  togglePremium: () => void;
  setPremium: (value: boolean) => void;
  setAdsInitialized: () => void;
}

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      calcCount: 0,
      adsInitialized: false,

      incrementCalc: () => {
        set((state) => ({ calcCount: state.calcCount + 1 }));
      },

      shouldShowInterstitial: () => {
        const { isPremium, calcCount } = get();
        if (isPremium) return false;
        return calcCount > 0 && calcCount % ADS_CONFIG.INTERSTITIAL_EVERY_N === 0;
      },

      togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),

      setPremium: (value) => set({ isPremium: value }),

      setAdsInitialized: () => set({ adsInitialized: true }),
    }),
    {
      name: 'ads-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        calcCount: state.calcCount,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentry } from '../config/sentry';

export type LanguageOption = 'auto' | 'fr' | 'en' | 'es' | 'de';

interface LanguageState {
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'auto',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'language-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

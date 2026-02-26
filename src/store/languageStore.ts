import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageOption = 'auto' | 'fr' | 'en';

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
    }
  )
);

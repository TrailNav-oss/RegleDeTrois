import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentry } from '../config/sentry';
import type { Recipe, Ingredient } from '../types/recipe';

export interface DraftRecipe {
  name: string;
  basePortions: string;
  ingredients: Ingredient[];
  savedAt: number;
}

interface RecipeState {
  recipes: Recipe[];
  draft: DraftRecipe | null;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Recipe;
  updateRecipe: (id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => void;
  deleteRecipe: (id: string) => void;
  getRecipe: (id: string) => Recipe | undefined;
  setDraft: (draft: DraftRecipe) => void;
  clearDraft: () => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      draft: null,

      addRecipe: (data) => {
        const now = Date.now();
        const newRecipe: Recipe = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ recipes: [...state.recipes, newRecipe] }));
        return newRecipe;
      },

      updateRecipe: (id, data) => {
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: Date.now() } : r
          ),
        }));
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        }));
      },

      getRecipe: (id) => {
        return get().recipes.find((r) => r.id === id);
      },

      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'recipe-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (error) try { Sentry.captureException(error); } catch {}
      },
    }
  )
);

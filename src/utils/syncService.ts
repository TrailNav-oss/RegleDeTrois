import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Recipe } from '../types/recipe';

function getUserRecipesRef(uid: string) {
  return collection(db, 'users', uid, 'recipes');
}

export async function fetchCloudRecipes(uid: string): Promise<Recipe[]> {
  const q = query(getUserRecipesRef(uid), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Recipe));
}

export async function uploadRecipeToCloud(uid: string, recipe: Recipe): Promise<void> {
  const recipeRef = doc(db, 'users', uid, 'recipes', recipe.id);
  await setDoc(recipeRef, {
    name: recipe.name,
    basePortions: recipe.basePortions,
    ingredients: recipe.ingredients,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  });
}

export async function deleteCloudRecipe(uid: string, recipeId: string): Promise<void> {
  const recipeRef = doc(db, 'users', uid, 'recipes', recipeId);
  await deleteDoc(recipeRef);
}

/**
 * Merge local recipes to cloud (last-write-wins strategy).
 * - Uploads all local recipes
 * - Downloads cloud-only recipes
 * Returns the merged list.
 */
export async function syncRecipes(
  uid: string,
  localRecipes: Recipe[]
): Promise<Recipe[]> {
  const cloudRecipes = await fetchCloudRecipes(uid);

  const mergedMap = new Map<string, Recipe>();

  // Add cloud recipes first
  for (const recipe of cloudRecipes) {
    mergedMap.set(recipe.id, { ...recipe, syncedToCloud: true });
  }

  // Merge local recipes (last-write-wins)
  for (const recipe of localRecipes) {
    const existing = mergedMap.get(recipe.id);
    if (!existing || recipe.updatedAt > existing.updatedAt) {
      mergedMap.set(recipe.id, recipe);
    }
  }

  // Upload all merged recipes to cloud
  const merged = Array.from(mergedMap.values());
  for (const recipe of merged) {
    await uploadRecipeToCloud(uid, recipe);
  }

  // Mark all as synced
  return merged.map((r) => ({ ...r, syncedToCloud: true }));
}

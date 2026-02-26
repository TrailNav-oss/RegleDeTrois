export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cl' | 'pièce' | 'c.à.s' | 'c.à.c';

export interface Ingredient {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  basePortions: number;
  ingredients: Ingredient[];
  createdAt: number;
  updatedAt: number;
  syncedToCloud?: boolean;
}

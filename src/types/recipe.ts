export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cl' | 'pièce' | 'c.à.s' | 'c.à.c'
  | 'lb' | 'oz' | 'cup' | 'fl oz';

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

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Sentry
jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useRecipeStore } from '../store/recipeStore';

describe('recipeStore — draft', () => {
  beforeEach(() => {
    useRecipeStore.setState({ recipes: [], draft: null });
  });

  it('starts with no draft', () => {
    expect(useRecipeStore.getState().draft).toBeNull();
  });

  it('setDraft saves a draft', () => {
    const draft = {
      name: 'Crêpes',
      basePortions: '4',
      ingredients: [{ id: '1', name: 'Farine', qty: 250, unit: 'g' as const }],
      savedAt: Date.now(),
    };
    useRecipeStore.getState().setDraft(draft);
    expect(useRecipeStore.getState().draft).toEqual(draft);
  });

  it('clearDraft removes the draft', () => {
    useRecipeStore.getState().setDraft({
      name: 'Test',
      basePortions: '2',
      ingredients: [],
      savedAt: Date.now(),
    });
    expect(useRecipeStore.getState().draft).not.toBeNull();

    useRecipeStore.getState().clearDraft();
    expect(useRecipeStore.getState().draft).toBeNull();
  });

  it('setDraft overwrites previous draft', () => {
    useRecipeStore.getState().setDraft({
      name: 'Draft 1',
      basePortions: '4',
      ingredients: [],
      savedAt: 1000,
    });
    useRecipeStore.getState().setDraft({
      name: 'Draft 2',
      basePortions: '6',
      ingredients: [{ id: '1', name: 'Sucre', qty: 100, unit: 'g' as const }],
      savedAt: 2000,
    });

    const draft = useRecipeStore.getState().draft;
    expect(draft?.name).toBe('Draft 2');
    expect(draft?.basePortions).toBe('6');
    expect(draft?.ingredients).toHaveLength(1);
  });

  it('draft does not affect recipes array', () => {
    useRecipeStore.getState().setDraft({
      name: 'Draft',
      basePortions: '4',
      ingredients: [],
      savedAt: Date.now(),
    });
    expect(useRecipeStore.getState().recipes).toHaveLength(0);
  });

  it('addRecipe still works with draft present', () => {
    useRecipeStore.getState().setDraft({
      name: 'Draft',
      basePortions: '4',
      ingredients: [],
      savedAt: Date.now(),
    });

    useRecipeStore.getState().addRecipe({
      name: 'Real Recipe',
      basePortions: 4,
      ingredients: [{ id: '1', name: 'Eau', qty: 500, unit: 'ml' as const }],
    });

    expect(useRecipeStore.getState().recipes).toHaveLength(1);
    expect(useRecipeStore.getState().draft).not.toBeNull();
  });
});

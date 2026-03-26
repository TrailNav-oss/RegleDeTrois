jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useLanguageStore } from '../store/languageStore';

describe('languageStore', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'auto' });
  });

  it('starts with auto language', () => {
    expect(useLanguageStore.getState().language).toBe('auto');
  });

  it('sets language to fr', () => {
    useLanguageStore.getState().setLanguage('fr');
    expect(useLanguageStore.getState().language).toBe('fr');
  });

  it('sets language to en', () => {
    useLanguageStore.getState().setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');
  });

  it('sets language to es', () => {
    useLanguageStore.getState().setLanguage('es');
    expect(useLanguageStore.getState().language).toBe('es');
  });

  it('sets language to de', () => {
    useLanguageStore.getState().setLanguage('de');
    expect(useLanguageStore.getState().language).toBe('de');
  });

  it('resets to auto', () => {
    useLanguageStore.getState().setLanguage('fr');
    useLanguageStore.getState().setLanguage('auto');
    expect(useLanguageStore.getState().language).toBe('auto');
  });
});

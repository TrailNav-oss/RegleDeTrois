jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useThemeStore } from '../store/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ isDarkMode: false });
  });

  it('starts in light mode', () => {
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('toggles to dark mode', () => {
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(true);
  });

  it('toggles back to light mode', () => {
    useThemeStore.getState().toggleDarkMode();
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('multiple toggles alternate correctly', () => {
    const store = useThemeStore.getState();
    for (let i = 0; i < 5; i++) {
      useThemeStore.getState().toggleDarkMode();
      expect(useThemeStore.getState().isDarkMode).toBe(i % 2 === 0);
    }
  });
});

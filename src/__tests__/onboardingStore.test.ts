jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useOnboardingStore } from '../store/onboardingStore';

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ hasSeenOnboarding: false });
  });

  it('starts with onboarding not seen', () => {
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false);
  });

  it('completes onboarding', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });

  it('stays completed after multiple calls', () => {
    useOnboardingStore.getState().completeOnboarding();
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });
});

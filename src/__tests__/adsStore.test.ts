// Mock react-native Platform used in ads config
jest.mock('react-native', () => ({
  Platform: {
    select: (obj: any) => obj.android || obj.default || '',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { useAdsStore } from '../store/adsStore';

describe('adsStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAdsStore.setState({
      isPremium: false,
      calcCount: 0,
    });
  });

  it('starts with isPremium false and calcCount 0', () => {
    const state = useAdsStore.getState();
    expect(state.isPremium).toBe(false);
    expect(state.calcCount).toBe(0);
  });

  it('increments calcCount', () => {
    useAdsStore.getState().incrementCalc();
    expect(useAdsStore.getState().calcCount).toBe(1);
    useAdsStore.getState().incrementCalc();
    expect(useAdsStore.getState().calcCount).toBe(2);
  });

  it('shouldShowInterstitial returns false when premium', () => {
    useAdsStore.setState({ isPremium: true, calcCount: 5 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(false);
  });

  it('shouldShowInterstitial returns true every N calculations', () => {
    // INTERSTITIAL_EVERY_N = 5
    useAdsStore.setState({ calcCount: 5 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(true);

    useAdsStore.setState({ calcCount: 10 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(true);
  });

  it('shouldShowInterstitial returns false between intervals', () => {
    useAdsStore.setState({ calcCount: 3 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(false);

    useAdsStore.setState({ calcCount: 7 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(false);
  });

  it('shouldShowInterstitial returns false at count 0', () => {
    useAdsStore.setState({ calcCount: 0 });
    expect(useAdsStore.getState().shouldShowInterstitial()).toBe(false);
  });

  it('resets count', () => {
    useAdsStore.setState({ calcCount: 10 });
    useAdsStore.getState().resetCount();
    expect(useAdsStore.getState().calcCount).toBe(0);
  });

  it('toggles premium', () => {
    expect(useAdsStore.getState().isPremium).toBe(false);
    useAdsStore.getState().togglePremium();
    expect(useAdsStore.getState().isPremium).toBe(true);
    useAdsStore.getState().togglePremium();
    expect(useAdsStore.getState().isPremium).toBe(false);
  });

  it('sets premium explicitly', () => {
    expect(useAdsStore.getState().isPremium).toBe(false);
    useAdsStore.getState().setPremium(true);
    expect(useAdsStore.getState().isPremium).toBe(true);
    useAdsStore.getState().setPremium(false);
    expect(useAdsStore.getState().isPremium).toBe(false);
  });
});

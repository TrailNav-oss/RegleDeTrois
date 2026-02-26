// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    select: (obj: any) => obj.android || obj.default || '',
  },
}));

// Mock AsyncStorage (needed by adsStore)
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock react-native-iap
const mockInitConnection = jest.fn().mockResolvedValue(true);
const mockEndConnection = jest.fn().mockResolvedValue(true);
const mockFetchProducts = jest.fn().mockResolvedValue([
  { productId: 'com.regledetrois.premium', displayPrice: '2,99 €', price: 2.99, id: 'com.regledetrois.premium' },
]);
const mockRequestPurchase = jest.fn().mockResolvedValue({});
const mockGetAvailablePurchases = jest.fn().mockResolvedValue([]);
const mockFinishTransaction = jest.fn().mockResolvedValue(true);

jest.mock('react-native-iap', () => ({
  initConnection: () => mockInitConnection(),
  endConnection: () => mockEndConnection(),
  fetchProducts: (params: any) => mockFetchProducts(params),
  requestPurchase: (params: any) => mockRequestPurchase(params),
  getAvailablePurchases: () => mockGetAvailablePurchases(),
  finishTransaction: (params: any) => mockFinishTransaction(params),
}));

import { useIapStore } from '../store/iapStore';
import { useAdsStore } from '../store/adsStore';

describe('iapStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIapStore.setState({
      connected: false,
      products: [],
      loading: false,
      error: null,
      purchaseModalVisible: false,
    });
    useAdsStore.setState({ isPremium: false, calcCount: 0 });
    mockGetAvailablePurchases.mockResolvedValue([]);
  });

  it('initializes connection and checks purchases', async () => {
    await useIapStore.getState().init();
    expect(mockInitConnection).toHaveBeenCalled();
    expect(useIapStore.getState().connected).toBe(true);
    expect(mockGetAvailablePurchases).toHaveBeenCalled();
  });

  it('restores premium if purchase found on init', async () => {
    mockGetAvailablePurchases.mockResolvedValue([
      { productId: 'com.regledetrois.premium' },
    ]);
    await useIapStore.getState().init();
    expect(useAdsStore.getState().isPremium).toBe(true);
  });

  it('loads products', async () => {
    await useIapStore.getState().loadProducts();
    expect(mockFetchProducts).toHaveBeenCalledWith({ skus: ['com.regledetrois.premium'] });
    expect(useIapStore.getState().products).toHaveLength(1);
  });

  it('handles init failure gracefully', async () => {
    mockInitConnection.mockRejectedValueOnce(new Error('Store unavailable'));
    await useIapStore.getState().init();
    expect(useIapStore.getState().error).toBe('Store unavailable');
    expect(useIapStore.getState().connected).toBe(false);
  });

  it('restores purchases successfully', async () => {
    mockGetAvailablePurchases.mockResolvedValue([
      { productId: 'com.regledetrois.premium' },
    ]);
    const found = await useIapStore.getState().restore();
    expect(found).toBe(true);
    expect(useAdsStore.getState().isPremium).toBe(true);
  });

  it('returns false when no purchases to restore', async () => {
    mockGetAvailablePurchases.mockResolvedValue([]);
    const found = await useIapStore.getState().restore();
    expect(found).toBe(false);
    expect(useAdsStore.getState().isPremium).toBe(false);
  });

  it('toggles purchase modal visibility', () => {
    expect(useIapStore.getState().purchaseModalVisible).toBe(false);
    useIapStore.getState().showPurchaseModal();
    expect(useIapStore.getState().purchaseModalVisible).toBe(true);
    useIapStore.getState().hidePurchaseModal();
    expect(useIapStore.getState().purchaseModalVisible).toBe(false);
  });

  it('cleans up connection', async () => {
    useIapStore.setState({ connected: true });
    await useIapStore.getState().cleanup();
    expect(mockEndConnection).toHaveBeenCalled();
    expect(useIapStore.getState().connected).toBe(false);
  });
});

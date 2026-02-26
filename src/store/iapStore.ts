import { create } from 'zustand';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type Product,
  type Purchase,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { IAP_SKUS, IAP_PRODUCT_ID } from '../config/iap';
import { useAdsStore } from './adsStore';

interface IapState {
  connected: boolean;
  products: Product[];
  loading: boolean;
  error: string | null;
  purchaseModalVisible: boolean;

  init: () => Promise<void>;
  cleanup: () => Promise<void>;
  loadProducts: () => Promise<void>;
  purchase: () => Promise<void>;
  restore: () => Promise<boolean>;
  showPurchaseModal: () => void;
  hidePurchaseModal: () => void;
  clearError: () => void;
}

export const useIapStore = create<IapState>()((set, get) => ({
  connected: false,
  products: [],
  loading: false,
  error: null,
  purchaseModalVisible: false,

  init: async () => {
    try {
      await initConnection();
      set({ connected: true });

      // Check existing purchases (restore)
      const purchases = await getAvailablePurchases();
      const hasPremium = purchases.some(
        (p: Purchase) => p.productId === IAP_PRODUCT_ID
      );
      if (hasPremium) {
        useAdsStore.getState().setPremium(true);
      }
    } catch (err: any) {
      set({ error: err.message || 'IAP init failed' });
    }
  },

  cleanup: async () => {
    try {
      await endConnection();
      set({ connected: false });
    } catch {
      // Silent cleanup
    }
  },

  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const result = await fetchProducts({ skus: IAP_SKUS });
      const products = (result ?? []) as Product[];
      set({ products, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to load products' });
    }
  },

  purchase: async () => {
    set({ loading: true, error: null });
    try {
      const requestProps = Platform.OS === 'ios'
        ? { request: { apple: { sku: IAP_PRODUCT_ID } }, type: 'in-app' as const }
        : { request: { google: { skus: [IAP_PRODUCT_ID] } }, type: 'in-app' as const };

      await requestPurchase(requestProps);

      const purchases = await getAvailablePurchases();
      const premium = purchases.find(
        (p: Purchase) => p.productId === IAP_PRODUCT_ID
      );
      if (premium) {
        await finishTransaction({ purchase: premium });
        useAdsStore.getState().setPremium(true);
      }
      set({ loading: false, purchaseModalVisible: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Purchase failed' });
    }
  },

  restore: async () => {
    set({ loading: true, error: null });
    try {
      const purchases = await getAvailablePurchases();
      const hasPremium = purchases.some(
        (p: Purchase) => p.productId === IAP_PRODUCT_ID
      );
      if (hasPremium) {
        useAdsStore.getState().setPremium(true);
        set({ loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Restore failed' });
      return false;
    }
  },

  showPurchaseModal: () => set({ purchaseModalVisible: true }),
  hidePurchaseModal: () => set({ purchaseModalVisible: false, error: null }),
  clearError: () => set({ error: null }),
}));

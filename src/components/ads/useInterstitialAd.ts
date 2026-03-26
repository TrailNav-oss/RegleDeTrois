import { useCallback, useEffect, useRef } from 'react';
import { useAdsStore } from '../../store/adsStore';
import { AD_UNIT_IDS, ADS_CONFIG } from '../../config/ads';

let InterstitialAd: any = null;
let AdEventType: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
} catch {
  // AdMob not available
}

export function useInterstitialAd() {
  const isPremium = useAdsStore((s) => s.isPremium);
  const calcCount = useAdsStore((s) => s.calcCount);
  const shouldShowInterstitial = useAdsStore((s) => s.shouldShowInterstitial);
  const adRef = useRef<any>(null);
  const loadedRef = useRef(false);

  // Load ad
  useEffect(() => {
    if (isPremium || __DEV__ || !InterstitialAd || !ADS_CONFIG.INTERSTITIAL_ENABLED) return;

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      // Preload next ad
      ad.load();
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
    });

    ad.load();
    adRef.current = ad;

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      adRef.current = null;
      loadedRef.current = false;
    };
  }, [isPremium]);

  const showIfReady = useCallback(() => {
    if (isPremium || __DEV__) return;
    if (!shouldShowInterstitial()) return;
    if (loadedRef.current && adRef.current) {
      adRef.current.show();
    }
  }, [isPremium, shouldShowInterstitial]);

  return { showIfReady };
}

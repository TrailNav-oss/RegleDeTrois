import { useEffect } from 'react';
import { useAdsStore } from '../../store/adsStore';

let AdsConsent: any = null;
let AdsConsentStatus: any = null;
let mobileAds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  AdsConsent = admob.AdsConsent;
  AdsConsentStatus = admob.AdsConsentStatus;
  mobileAds = admob.default;
} catch (e: any) {
  console.warn('[Ads] require failed:', e?.message);
}

/**
 * Handles GDPR consent via UMP SDK, then initializes MobileAds.
 * Consent MUST be obtained before SDK init in GDPR regions.
 */
export function useConsentManager() {
  const setAdsInitialized = useAdsStore((s) => s.setAdsInitialized);

  useEffect(() => {
    async function initAds() {
      if (__DEV__) return;

      console.warn('[Ads] === Init flow start ===');
      console.warn('[Ads] mobileAds:', typeof mobileAds, !!mobileAds);
      console.warn('[Ads] AdsConsent:', typeof AdsConsent, !!AdsConsent);

      // Step 1: GDPR consent
      if (AdsConsent) {
        try {
          const info = await AdsConsent.requestInfoUpdate();
          console.warn('[Ads] Consent status:', info.status, 'canRequestAds:', info.canRequestAds);
          if (
            info.status === AdsConsentStatus?.REQUIRED ||
            info.status === AdsConsentStatus?.UNKNOWN
          ) {
            await AdsConsent.loadAndShowConsentFormIfRequired();
            console.warn('[Ads] Consent form completed');
          }
        } catch (e: any) {
          console.warn('[Ads] Consent error:', e?.message || e);
        }
      }

      // Step 2: Initialize SDK AFTER consent
      if (mobileAds) {
        try {
          const result = await mobileAds().initialize();
          console.warn('[Ads] SDK initialized OK:', JSON.stringify(result));
        } catch (e: any) {
          console.warn('[Ads] SDK init error:', e?.message || e);
        }
      } else {
        console.warn('[Ads] mobileAds is null — cannot init');
      }

      // Always flag as initialized so BannerAd attempts to render
      // (if SDK truly unavailable, BannerAd/BannerAdSize will be null anyway)
      setAdsInitialized();
      console.warn('[Ads] === Init flow done, adsInitialized=true ===');
    }

    initAds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

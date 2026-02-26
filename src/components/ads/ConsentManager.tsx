import { useEffect } from 'react';

let AdsConsent: any = null;
let AdsConsentStatus: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  AdsConsent = admob.AdsConsent;
  AdsConsentStatus = admob.AdsConsentStatus;
} catch {
  // Not available
}

/**
 * Handles GDPR consent via UMP SDK.
 * Must be called before loading any ads.
 */
export function useConsentManager() {
  useEffect(() => {
    if (__DEV__ || !AdsConsent) return;

    async function requestConsent() {
      try {
        const consentInfo = await AdsConsent.requestInfoUpdate();
        if (
          consentInfo.status === AdsConsentStatus?.REQUIRED ||
          consentInfo.status === AdsConsentStatus?.UNKNOWN
        ) {
          await AdsConsent.loadAndShowConsentFormIfRequired();
        }
      } catch {
        // Consent form not available — continue without
      }
    }

    requestConsent();
  }, []);
}

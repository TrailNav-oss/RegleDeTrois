import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useAdsStore } from '../../store/adsStore';
import { ADS_CONFIG, AD_UNIT_IDS } from '../../config/ads';

let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
} catch {
  // AdMob not available (e.g., in Expo Go)
}

export function AdBanner() {
  const isPremium = useAdsStore((s) => s.isPremium);
  const adsInitialized = useAdsStore((s) => s.adsInitialized);
  const theme = useTheme();
  const [adLoaded, setAdLoaded] = useState(false);

  if (isPremium || !ADS_CONFIG.BANNER_ENABLED) return null;

  // Render real BannerAd when SDK is ready — hidden until loaded (no white space)
  if (!__DEV__ && BannerAd && BannerAdSize && AD_UNIT_IDS.banner && adsInitialized) {
    return (
      <View style={[
        styles.container,
        { borderTopColor: theme.colors.outlineVariant },
        !adLoaded && styles.hidden,
      ]}>
        <BannerAd
          unitId={AD_UNIT_IDS.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            setAdLoaded(true);
          }}
          onAdFailedToLoad={(error: any) => {
            setAdLoaded(false);
            console.warn('[AdBanner] no-fill or error:', error?.code, error?.message);
          }}
        />
      </View>
    );
  }

  // Dev placeholder
  if (__DEV__) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant, borderTopColor: theme.colors.outlineVariant }]}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Ad Banner Placeholder
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
  placeholder: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});

import React from 'react';
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
  const theme = useTheme();

  if (isPremium || !ADS_CONFIG.BANNER_ENABLED) return null;

  // Use real AdMob in production if available
  if (!__DEV__ && BannerAd && BannerAdSize && AD_UNIT_IDS.banner) {
    return (
      <View style={[styles.container, { borderTopColor: theme.colors.outlineVariant }]}>
        <BannerAd
          unitId={AD_UNIT_IDS.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => {
            // Fail silently — no crash
          }}
        />
      </View>
    );
  }

  // Placeholder in dev or when AdMob not loaded
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant, borderTopColor: theme.colors.outlineVariant }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Ad Banner Placeholder
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  placeholder: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});

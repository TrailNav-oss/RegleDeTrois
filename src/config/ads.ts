import { Platform } from 'react-native';

export const AD_UNIT_IDS = {
  banner: Platform.select({
    android: 'ca-app-pub-7858622615498185/5924041091',
    ios: 'ca-app-pub-3940256099942544/2934735716', // iOS test — pas encore de vrai ID
    default: '',
  }),
  interstitial: Platform.select({
    android: 'ca-app-pub-7858622615498185/9835365946',
    ios: 'ca-app-pub-3940256099942544/4411468910',
    default: '',
  }),
  rewarded: Platform.select({
    android: 'ca-app-pub-3940256099942544/5224354917', // Google test rewarded
    ios: 'ca-app-pub-3940256099942544/1712485313',
    default: '',
  }),
};

export const ADS_CONFIG = {
  INTERSTITIAL_EVERY_N: 5,
  MAX_FREE_RECIPES: 5,
  BANNER_ENABLED: true,
  INTERSTITIAL_ENABLED: true,
};

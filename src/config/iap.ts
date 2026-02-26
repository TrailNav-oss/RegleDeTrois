import { Platform } from 'react-native';

export const IAP_PRODUCT_ID = 'com.regledetrois.premium';

export const IAP_SKUS = Platform.select({
  android: [IAP_PRODUCT_ID],
  ios: [IAP_PRODUCT_ID],
  default: [IAP_PRODUCT_ID],
}) as string[];

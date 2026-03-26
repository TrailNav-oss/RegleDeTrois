import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { fr } from './locales/fr';
import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';

const SUPPORTED_LOCALES = ['fr', 'en', 'es', 'de'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const i18n = new I18n({ fr, en, es, de });

// Default locale from device
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = (SUPPORTED_LOCALES as readonly string[]).includes(deviceLocale)
  ? deviceLocale
  : 'en';
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export { SUPPORTED_LOCALES };
export default i18n;

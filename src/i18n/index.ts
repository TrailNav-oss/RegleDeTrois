import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { fr } from './locales/fr';
import { en } from './locales/en';

const i18n = new I18n({ fr, en });

// Default locale from device
const deviceLocale = getLocales()[0]?.languageCode ?? 'fr';
i18n.locale = deviceLocale === 'en' ? 'en' : 'fr';
i18n.defaultLocale = 'fr';
i18n.enableFallback = true;

export default i18n;

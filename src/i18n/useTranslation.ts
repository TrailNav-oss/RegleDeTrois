import { useCallback } from 'react';
import i18n from './index';
import { getLocales } from 'expo-localization';
import { useLanguageStore } from '../store/languageStore';

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);

  // Resolve effective locale
  const resolvedLocale =
    language === 'auto'
      ? (getLocales()[0]?.languageCode === 'en' ? 'en' : 'fr')
      : language;

  // Sync i18n locale
  i18n.locale = resolvedLocale;

  const t = useCallback(
    (key: string, options?: Record<string, any>) => i18n.t(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedLocale]
  );

  return { t, locale: resolvedLocale };
}

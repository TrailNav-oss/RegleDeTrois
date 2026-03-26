import { useCallback } from 'react';
import i18n, { SUPPORTED_LOCALES } from './index';
import { getLocales } from 'expo-localization';
import { useLanguageStore } from '../store/languageStore';

function resolveDeviceLocale(): string {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? code : 'en';
}

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);

  // Resolve effective locale
  const resolvedLocale =
    language === 'auto' ? resolveDeviceLocale() : language;

  // Sync i18n locale
  i18n.locale = resolvedLocale;

  const t = useCallback(
    (key: string, options?: Record<string, any>) => i18n.t(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedLocale]
  );

  return { t, locale: resolvedLocale };
}

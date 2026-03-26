import { I18n } from 'i18n-js';

describe('i18n fallback', () => {
  it('uses English as defaultLocale', () => {
    // Reproduce the app config logic
    const SUPPORTED_LOCALES = ['fr', 'en', 'es', 'de'] as const;
    const i18n = new I18n({
      fr: { test: 'Bonjour' },
      en: { test: 'Hello' },
      es: { test: 'Hola' },
      de: { test: 'Hallo' },
    });

    i18n.defaultLocale = 'en';
    i18n.enableFallback = true;

    // Unsupported locale → should fallback to 'en'
    const resolveLocale = (code: string | undefined) => {
      const c = code ?? 'en';
      return (SUPPORTED_LOCALES as readonly string[]).includes(c) ? c : 'en';
    };

    expect(resolveLocale('pt')).toBe('en');
    expect(resolveLocale('ja')).toBe('en');
    expect(resolveLocale('zh')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');

    // Supported locales stay as-is
    expect(resolveLocale('fr')).toBe('fr');
    expect(resolveLocale('es')).toBe('es');
    expect(resolveLocale('de')).toBe('de');
    expect(resolveLocale('en')).toBe('en');

    // Verify i18n fallback renders English for unknown locale
    i18n.locale = 'pt';
    expect(i18n.t('test')).toBe('Hello');
  });
});

# VERSION — Proportio

> Changelog par session de travail. Chaque session = 1 bloc.
> Permet de reprendre le contexte après interruption.

---

## Session 5 — 2026-03-22 — v0.0.11 build 13

### Résumé
Audit complet + fixes sécurité, robustesse, performance, tests, et features.

### Sécurité
- fix : suppression mots de passe hardcodés dans build.gradle (S1)
- fix : npm audit fix — 5 vulnérabilités HIGH undici corrigées (S3)

### Bugs
- fix : IAP init en boucle — useEffect avec ref guard au lieu de selectors instables (B1)
- fix : guard basePortions <= 0 dans recettes (B2) — UI error + calcul safe
- fix : fuite mémoire interstitial — cleanup adRef/loadedRef au unmount (B3)
- fix : setState sur composant démonté — mountedRef dans conversions.tsx (B4)

### Robustesse
- fix : onRehydrateStorage + Sentry logging sur 7 stores persistés (P1)
- fix : cleanup IAP endConnection() logge erreurs via Sentry (P2)
- fix : guard double-tap purchase — if (loading) return (R1)
- fix : isFinite() checks sur percentage, crossMultiply, conversions (BP8)
- fix : union types PercentageMode + category dans types/history.ts (T1, T2)
- fix : Array.isArray() guard avant cast Product[] dans iapStore (T3)
- fix : clé i18n INVALID_RESULT ajoutée (4 locales)

### Performance
- fix : PurchaseModal — selectors individuels Zustand (PF1)
- fix : HistoryList — useMemo sur filtrage + cleanup fadeAnims (PF2, PF3)

### Features
- feat : multiplicateurs recettes personnalisables (profil)
- feat : presets pourcentages personnalisables (profil)
- feat : pluralisation unités étendue (pièces, cups)
- feat : preferencesStore Zustand persisté

### Tests
- test : 5 nouveaux fichiers (historyStore, themeStore, languageStore, unitsStore, onboardingStore)
- test : setAdsInitialized ajouté à adsStore
- test : mocks Sentry ajoutés à adsStore.test.ts et recipeStore.test.ts
- `npm run check` : PASS (151 tests, 13 suites, tsc clean)

---

## Session 3 — 2026-03-17 — v0.0.9 build 11

### Résumé
Fix bugs testeurs : validation inputs numériques + fallback langue EN.

### Changements
- fix : `sanitizeNumericInput()` — filtre côté onChange sur 8 champs numériques (4 écrans)
- fix : `keyboardType="decimal-pad"` remplace `"numeric"` partout
- fix : fallback i18n `'fr'` → `'en'` (index.ts + useTranslation.ts, 5 occurrences)
- test : `sanitize.test.ts` — 13 tests (digits, virgules, lettres, spéciaux, négatifs, edge cases)
- test : `i18nFallback.test.ts` — 2 tests (locale non supportée → EN, i18n render EN)
- chore : bump v0.0.9 (versionCode 11)

### Déploiement
- OTA → production (update group 92787929)

### Tests
- `npm run check` : PASS (113 tests, 7 suites, tsc clean)

---

## Session 1 — 2026-03-15 — v0.0.7 build 9

### Résumé
Multi-track closed testing + corrections UI.

### Changements
- feat : `scripts/manage-tracks.js` — création/listing de tracks closedTesting via API
- feat : `scripts/deploy.js` — support `--tracks` multi-track + `--version-code` (réutilise AAB existant)
- fix : pluralisation "pièce" → "pièces" quand qty > 1 (recettes.tsx, 6 endroits)
- chore : bump v0.0.7 (versionCode 9)
- chore : npm aliases `tracks:list`, `tracks:create`
- docs : templates de workflow intégrés au projet

### Déploiement
- AAB versionCode 9 → internal + beta-amis + beta-communaute (completed)
- OTA × 2 (pluralisation pièce(s), puis fix bouton unité)

### Tests
- `npm run check` : PASS (99 tests, tsc clean)
- Device : Pixel 8a (Android)

---

## Historique pré-sessions (versionné dans git)

- v0.0.6 (build 8) — Production readiness, ErrorBoundary, Sentry, AdMob prod IDs
- v0.0.5 — 5 tabs (pourcentages, conversions), i18n FR/EN, IAP setup
- v0.0.4 — Recettes CRUD, mode ajusté, partage
- v0.0.1–0.0.3 — Setup initial, calculatrice, onboarding

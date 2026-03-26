# Proportio — CLAUDE.md

## Règle #1 — OBLIGATOIRE
Lire avant de toucher. Après chaque analyse/diagnostic, supposer qu'il y a une erreur et se demander "qu'est-ce que j'ai mal fait ?". Valider 2-3 fois. Robustesse avant rapidité.

## Règle #2 — Build local uniquement
Jamais de cloud build (EAS). Jamais de push sans `npm run check` PASS. Jamais lancer expo (Metro géré par l'utilisateur).

## Règle #3 — Pas de commit sans demande
NE JAMAIS commit sans demande explicite. NE JAMAIS modifier du code sans l'avoir lu d'abord.

---

## Reprise rapide après crash
- **`docs/CACHE.md`** : état courant, branche active, backlog bugs, travail en cours
- **`docs/VERSION.md`** : changelog de tout ce qui a été fait par session
- **`docs/PITFALLS.md`** : pièges connus (LIRE AVANT DE TOUCHER au code concerné)
- **`docs/REFERENCE.md`** : specs détaillées (APIs, flows, architecture)
- **`docs/CONVENTIONS.md`** : conventions code du projet

---

## Protocole d'analyse — OBLIGATOIRE avant tout fix

### Étape 0 — Lecture
Lire le code concerné. Comprendre l'architecture du fichier avant de modifier.

### Étape 1 — Rapport avant action
Analyser SANS modifier. Lister problèmes potentiels, effets de bord, dépendances.

### Étape 2 — Triple passe
1. **Inventaire** : deps stables ? guards ? timers clearés ? cleanup ?
2. **Stress test mental** : edge-cases, données vides/null, mount/unmount rapide
3. **Avocat du diable** : 3 points max que l'analyse aurait pu manquer

### Étape 3 — Un fichier à la fois
Un seul fichier par échange. Vérification complète avant le suivant.

---

## Directives
- CONCIS : pas de récap, pas de résumé. Juste le diff.
- Français pour les réponses. MAX 3 lignes de texte hors code.
- `npm run check` AVANT toute modification terminée.
- UI/texte en français, code en anglais.
- PAS de `any` sauf contrainte forte.

---

## Stack
Expo SDK 55 · React Native Paper (MD3) · Zustand + AsyncStorage · AdMob · IAP · Sentry · i18n-js

| Tech | Version | Notes |
|------|---------|-------|
| Expo SDK | 55 | expo-router (file-based) |
| React / RN | 19.2 / 0.83 | |
| Zustand | 5 | persist + AsyncStorage |
| RN Paper | 5.15 | MD3 theme |
| AdMob | v16 | IDs prod Android |
| react-native-iap | 14.7 | com.regledetrois.premium |
| Sentry | 8.3 | org trailnav |
| Jest | 30 | ts-jest, 99 tests |
| TypeScript | 5.9 | strict mode |

---

## Commandes clés

```bash
cd regle-de-troisV0.0.2

# Vérification complète
npm run check                    # tsc --noEmit + jest

# Build release
cd android && SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew bundleRelease --no-daemon

# Deploy
node scripts/deploy.js <aab> [track] [notes] [--draft]
node scripts/deploy.js <aab> --tracks t1,t2 [notes] [--draft]
node scripts/deploy.js --tracks t1,t2 --version-code N [notes] [--draft]

# OTA
npx eas update --branch production --message "msg" --platform android

# Version bump
node scripts/bump-version.js --patch

# Tracks
node scripts/manage-tracks.js list
node scripts/manage-tracks.js create <name>

# Status
node scripts/play-status.js
```

---

## Structure (src/)

| Dossier | Contenu clé |
|---------|-------------|
| app/(tabs)/ | 5 écrans : index, recettes, pourcentages, conversions, profil |
| src/config/ | theme, ads, iap |
| src/store/ | 8 Zustand stores (recipe, theme, ads, iap, language, units, onboarding, history) |
| src/components/ads/ | AdBanner, ConsentManager, PremiumGate, useInterstitialAd |
| src/components/iap/ | PurchaseModal |
| src/components/ui/ | OnboardingScreen, EmptyState, SkeletonLoader, ErrorBoundary |
| src/i18n/ | i18n-js + locales FR/EN + useTranslation hook |
| src/utils/ | crossMultiply, percentage, conversions, haptics |
| src/types/ | Recipe, Ingredient, Unit, HistoryEntry |
| src/__tests__/ | 5 suites, 99 tests |
| scripts/ | deploy, bump, manage-tracks, play-status, gen-build-info |

---

## Pièges connus (LIRE AVANT DE CODER)

### Build
1. **prebuild --clean** efface android/ → reappliquer signing, keystore
2. **SENTRY_DISABLE_AUTO_UPLOAD=true** requis pour build local
3. **--legacy-peer-deps** requis pour npm install

### Google Play API
4. **Type track** = `CLOSED_TESTING` (UPPER_SNAKE), pas `closedTesting`
5. **--draft** obligatoire tant que store listing incomplet

> Voir `docs/PITFALLS.md` pour la liste complète avec contexte.

---

## Versioning
Fichiers synchronisés par `bump-version.js --patch` :
- `app.json` (version, versionCode, buildNumber)
- `package.json` (version)

---

## Pour le détail
- Specs / APIs / flows → `docs/REFERENCE.md`
- Pièges détaillés → `docs/PITFALLS.md`
- Changelog sessions → `docs/VERSION.md`
- État courant / backlog → `docs/CACHE.md`
- Conventions code → `docs/CONVENTIONS.md`

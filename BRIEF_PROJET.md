# Règle de Trois — Brief projet

## Qu'est-ce que c'est ?

Application mobile Android (React Native / Expo) qui fait deux choses :

1. **Calculatrice de règle de trois** — L'utilisateur remplit 3 valeurs sur 4 dans l'equation A/B = C/X, la 4e se calcule automatiquement. Historique des calculs, copie du resultat, haptic feedback.

2. **Gestionnaire de recettes** — L'utilisateur cree des recettes avec ingredients (nom, quantite, unite). Il peut ensuite ajuster les portions (ex: recette pour 4 → recette pour 7) et toutes les quantites sont recalculees proportionnellement. Deux modes : classique (changer les portions) et ajuste (modifier un ingredient et recalculer les autres).

## Les 3 ecrans (tabs)

### Tab 1 — Calculatrice (Simple)
- 4 champs A, B, C, X affiches en fraction : A/B = C/X
- Auto-calcul des que 3 champs sont remplis
- Historique des calculs (swipe pour supprimer, tap pour recharger)
- Copier le resultat dans le presse-papiers

### Tab 2 — Recettes
- Liste des recettes sauvegardees
- Creation/edition de recettes (nom, portions de base, ingredients)
- Chaque ingredient : nom + quantite + unite (g, kg, ml, L, cl, piece, c.a.s, c.a.c, oz, lb, cup, fl oz)
- Mode "classique" : slider pour changer le nombre de portions → recalcul automatique
- Mode "ajuste" : modifier la quantite d'un ingredient → recalcul des autres proportionnellement
- Limite de 5 recettes gratuites (premium = illimite)

### Tab 3 — Profil
- Authentification Firebase (email/password) — creation de compte + connexion
- Synchronisation cloud des recettes via Firebase (premium uniquement)
- Theme sombre / clair
- Langue : Auto / FR / EN
- Unites : Metrique / Imperial
- Achats in-app (premium) : supprime les pubs, recettes illimitees, sync cloud
- Restauration des achats
- Verification de mise a jour OTA
- Version + build number

## Monetisation

### Publicites (AdMob)
- **Banner** en bas de chaque ecran
- **Interstitiel** toutes les 5 utilisations de la calculatrice
- Supprimees pour les utilisateurs premium

### Premium (achat unique, non-consommable)
- Product ID : `com.regledetrois.premium`
- Avantages : pas de pub, recettes illimitees (au lieu de 5), sync cloud
- Toggle dev disponible en mode __DEV__

## Architecture technique

### Stack
- Expo SDK 55, expo-router (navigation par fichiers), React 19.2, React Native 0.83
- UI : React Native Paper (Material Design 3)
- State : Zustand + AsyncStorage (persistance locale)
- Auth : Firebase JS SDK v12 (email/password)
- Ads : react-native-google-mobile-ads (AdMob)
- IAP : react-native-iap v14 (Google Play Billing)
- i18n : i18n-js + expo-localization (FR/EN, fallback FR)
- Crash reporting : @sentry/react-native
- Backend leger : Supabase (heartbeat, bug reports, config distante)
- OTA : expo-updates (channel production)

### Stores Zustand (persistance AsyncStorage)
- `recipeStore` — recettes et ingredients
- `authStore` — utilisateur Firebase
- `adsStore` — compteur calculs, statut premium
- `iapStore` — achats in-app, modale achat
- `themeStore` — mode sombre
- `languageStore` — langue (auto/fr/en)
- `unitsStore` — systeme d'unites (metric/imperial)
- `historyStore` — historique des calculs
- `onboardingStore` — onboarding vu ou non

### Services backend (Supabase)
- **Heartbeat** : envoie device_id, version, platform, metadata a chaque lancement
- **Remote config** : recupere min_version, maintenance mode, messages personnalises
- **Device ID** : UUID persistant par appareil
- **Update checker** : verifie les mises a jour OTA via expo-updates

### Onboarding
3 slides au premier lancement (calculatrice, recettes, freemium), puis ne s'affiche plus.

## Build & Deploy

### Build local (pas EAS cloud)
- Prebuild : `npx expo prebuild --platform android`
- APK : `cd android && ./gradlew assembleRelease`
- AAB : `cd android && ./gradlew bundleRelease`
- Signing : keystore local (`credentials/regle-de-trois.keystore`)

### Deploy
- Script `deploy.js` : upload AAB sur Google Play via API (service account)
- Track : internal (test interne) → alpha → beta → production
- OTA : `npx eas update --channel production --platform android`

### Versioning
- `version` dans app.json (semver, affiche a l'utilisateur)
- `versionCode` dans app.json (entier incremental, requis par Google Play)
- `runtimeVersion` dans app.json (doit matcher pour les OTA)

## Etat actuel (mars 2026)
- **Version** : 0.0.3, versionCode 4
- **Tests** : 52 tests Jest (3 suites), tous passent
- **TypeScript** : 0 erreur (strict mode)
- **Play Store** : track internal, en test
- **OTA** : channel production configure, fonctionnel a partir du build 4
- **Package** : com.regledetrois.app

## Points d'attention
- Builds locaux avec `gradlew` (pas EAS cloud) → necessite `expo-channel-name` dans app.json pour que l'OTA fonctionne
- `npx expo prebuild --clean` efface android/ → reappliquer keystore, signing, local.properties
- `npm install` necessite `--legacy-peer-deps` (conflit react-dom)
- Les IDs AdMob sont des IDs de test — a remplacer avant la production publique
- Firebase utilise des credentials placeholder
- Sentry : l'upload des source maps necessite un auth token (`SENTRY_AUTH_TOKEN`)

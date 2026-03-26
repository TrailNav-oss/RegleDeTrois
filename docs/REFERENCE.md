# REFERENCE — Proportio

> Specs détaillées. Source de vérité pour les flows complexes et APIs.

---

## Architecture globale

```
┌─────────────┐
│  Expo App   │
│  (local)    │
├─────────────┤
│ expo-router │ ← file-based routing
├─────────────┤
│  Zustand    │ ← state + AsyncStorage persist
├─────────────┤
│  AdMob      │ ← bannières + interstitiels
│  IAP        │ ← achat premium (Play Billing)
│  Sentry     │ ← crash reporting
│  OTA        │ ← expo-updates
└─────────────┘
        │
   Google Play
   (deploy via googleapis)
```

Pas de backend, pas de base de données distante, pas d'auth.

---

## Flows principaux

### Flow 1 : Calcul de proportions (index.tsx)
```
1. User remplit 3 des 4 champs (A, B, C, X)
2. solveCrossMultiply détecte le champ vide
3. Calcul : produit en croix
4. Résultat affiché + copie possible
5. Entrée ajoutée à l'historique (max 50)
6. Compteur interstitiel incrémenté
```

### Flow 2 : Recettes — mode classique (recettes.tsx)
```
1. User crée/charge une recette
2. Définit portions de base + ingrédients
3. Change le nombre de portions
4. scaleIngredients recalcule toutes les quantités
5. smartRound appliqué par unité
6. pluralizeUnit pour l'affichage
```

### Flow 3 : Recettes — mode ajusté (recettes.tsx)
```
1. User modifie la quantité d'UN ingrédient
2. adjustByIngredient calcule le ratio
3. Toutes les autres quantités s'adaptent proportionnellement
4. Portions recalculées
```

### Flow 4 : Deploy multi-track
```
1. bump-version.js (patch/minor/major)
2. expo prebuild --platform android
3. gradlew bundleRelease (avec SENTRY_DISABLE_AUTO_UPLOAD)
4. deploy.js --tracks t1,t2 (1 edit, 1 upload, N tracks, 1 commit)
5. play-status.js pour vérifier
```

---

## APIs externes

### Google Play Developer API (googleapis v3)
- **Auth** : Service account (`GoogleCloud/trailnav-986ada2696e7.json`)
- **Scope** : `androidpublisher`
- **Package** : `com.regledetrois.app`
- **Endpoints utilisés** :
  - `edits.insert` — Créer un edit
  - `edits.bundles.upload` — Upload AAB
  - `edits.tracks.list` — Lister tous les tracks
  - `edits.tracks.create` — Créer un track closedTesting
  - `edits.tracks.update` — Assigner release à un track
  - `edits.commit` — Appliquer les changements
  - `edits.delete` — Annuler un edit
- **Pièges** : voir PITFALLS.md #004, #005

### AdMob
- **App ID** : `ca-app-pub-7858622615498185~6737265596`
- **Banner** : `ca-app-pub-7858622615498185/5924041091`
- **Interstitial** : `ca-app-pub-7858622615498185/9835365946`
- iOS : IDs test (pas encore ciblé)

### Sentry
- **Org** : trailnav
- **Project** : regle2trois
- **SDK** : @sentry/react-native
- **Upload sourcemaps** : désactivé en local (`SENTRY_DISABLE_AUTO_UPLOAD=true`)

### Expo Updates (OTA)
- **Branch** : production
- **Project ID** : 765223d9-4d25-48b7-ae00-031a54cb9f49
- **Owner** : maximeleff

---

## Stockage local (AsyncStorage via Zustand persist)

| Clé store | Contenu | Persisté |
|-----------|---------|----------|
| recipeStore | recipes[] | oui |
| adsStore | isPremium, calcCount | oui |
| iapStore | products, owned | oui |
| themeStore | isDarkMode | oui |
| languageStore | language (auto/fr/en) | oui |
| unitsStore | unitSystem (metric/imperial) | oui |
| onboardingStore | hasSeenOnboarding | oui |
| historyStore | entries[] (max 50) | oui |

---

## Play Store tracks

| Track | Type | Usage |
|-------|------|-------|
| internal | built-in | Tests internes |
| alpha | built-in | Closed testing principal (Google Group) — NE PAS TOUCHER |
| beta | built-in | (vide) |
| production | built-in | (vide — en attente 14j testeurs) |
| beta-amis | custom closedTesting | Recrutement testeurs amis |
| beta-communaute | custom closedTesting | Recrutement testeurs communauté |

---

## Versioning
Fichiers synchronisés par `bump-version.js` :
- `app.json` (version + versionCode + buildNumber)
- `package.json` (version)

Commande : `node scripts/bump-version.js --patch`

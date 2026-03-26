# CONVENTIONS — Proportio

> Règles de code du projet. Claude doit les respecter.

---

## Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers composants | PascalCase | `AdBanner.tsx` |
| Fichiers utils/hooks | camelCase | `useTranslation.ts`, `crossMultiply.ts` |
| Fichiers config | camelCase | `theme.ts`, `ads.ts` |
| Variables / fonctions | camelCase | `scaleIngredients()` |
| Types / Interfaces | PascalCase | `Recipe`, `Ingredient`, `Unit` |
| Constantes globales | UPPER_SNAKE | `MAX_FREE_RECIPES`, `INTERSTITIAL_EVERY_N` |
| Composants | PascalCase | `<PremiumGate />` |
| Stores | use + Name + Store | `useRecipeStore` |
| Hooks | use + PascalCase | `useTranslation` |

---

## Structure des fichiers

### Composant type
```tsx
// 1. React / RN
import React from 'react';
import { View } from 'react-native';
// 2. Libs externes
import { Text, Button } from 'react-native-paper';
// 3. Components internes
import { AdBanner } from '../../src/components/ads/AdBanner';
// 4. Hooks / stores
import { useTranslation } from '../../src/i18n/useTranslation';
import { useRecipeStore } from '../../src/store/recipeStore';
// 5. Types
import type { Recipe } from '../../src/types/recipe';

export default function MonScreen() {
  // hooks
  // derived state
  // handlers
  // render
}

const styles = StyleSheet.create({ ... });
```

---

## TypeScript
- **strict: true** — pas de `any` sauf contrainte forte
- **Pas de `as` cast** sauf interaction avec libs natives
- Types dans `src/types/` pour les types partagés
- `@ts-ignore` documenté (ex: `getReactNativePersistence`)

---

## State management (Zustand)
- Un store par domaine : `use[Name]Store` avec persist + AsyncStorage
- Sélecteurs granulaires : `useRecipeStore(s => s.recipes)`, jamais `useStore()`
- Actions dans le store, pas dans les composants
- Pas de logique métier dans les composants

---

## Styles
- `StyleSheet.create` pour tous les styles statiques
- Inline styles uniquement pour les valeurs dynamiques (theme colors)
- Dimensions en dp (pas de px)
- Safe area via `react-native-safe-area-context`

---

## i18n
- Clés dans `src/i18n/locales/fr.ts` et `en.ts`
- Hook `useTranslation` → `{ t, locale }`
- UI/texte en français, code en anglais
- Fallback : FR
- Interpolation : `%{variable}`

---

## Unités (recettes)
- Type `Unit` : `'g' | 'kg' | 'ml' | 'L' | 'cl' | 'pièce' | 'c.à.s' | 'c.à.c' | 'lb' | 'oz' | 'cup' | 'fl oz'`
- `smartRound` : lb/oz → entier, cup/fl oz → 1 décimale, g/kg → entier
- `pluralizeUnit` : 'pièce' → 'pièces' si qty > 1 (seule unité avec pluriel)
- Erreurs crossMultiply : codes string, traduction côté UI

---

## Tests
- Jest 30 + ts-jest, dans `src/__tests__/`
- Nommage : `nomUtil.test.ts`
- Mocks globaux : Platform, AsyncStorage, expo-*
- `npm run check` = `tsc --noEmit && jest --passWithNoTests --silent`
- 99 tests minimum avant merge

---

## Git

### Commits
```
type: description courte

Types: fix, feat, refactor, perf, docs, test, chore
```

### Règles
- `npm run check` PASS avant tout commit
- Un commit = un changement logique
- Pas de fichiers générés dans le repo (builds/, node_modules/, android/build/)

---

## Ads / Premium
- AdMob IDs production Android dans `src/config/ads.ts`
- `MAX_FREE_RECIPES = 5` — au-delà, PremiumGate bloque
- `INTERSTITIAL_EVERY_N = 5` — interstitiel tous les 5 calculs
- IAP product : `com.regledetrois.premium` (non-consommable)

---

## Sécurité
- Keystore dans `credentials/` (hors android/, hors git)
- Service account dans `GoogleCloud/` (hors git)
- Pas de secrets dans le code — .env si nécessaire
- `SENTRY_DISABLE_AUTO_UPLOAD=true` pour builds locaux

# Plan d'action Claude Code — App "Règle de Trois"

## Stack recommandée
- **Framework** : React Native / Expo (SDK 52)
- **Auth + BDD** : Firebase Auth + Firestore
- **State** : Zustand
- **UI** : React Native Paper ou Tamagui (design minimaliste)
- **Navigation** : Expo Router

---

## Phase 1 — Init projet (Prompt 1)
```
Initialise un projet Expo SDK 52 avec expo-router, zustand, react-native-paper.
Structure : src/screens, src/components, src/store, src/utils, src/types.
Configure un thème clair minimaliste avec couleur primaire #FF6B35 (orange chaud).
Ajoute un BottomTabNavigator avec 3 onglets : "Simple", "Recettes", "Profil".
```

## Phase 2 — Mode Simple (Prompt 2)
```
Crée l'écran "Mode Simple" (règle de trois).
- 4 champs numériques : A, B, C, X (résultat)
- L'utilisateur remplit 3 champs, le 4e se calcule automatiquement
- Détection auto du champ vide = résultat
- Formule : A/B = C/X
- Bouton "Réinitialiser"
- Animation subtile sur le résultat (fade in)
- Gestion erreurs : division par zéro, champs non numériques
- Design épuré, gros champs, adapté usage une main
```

## Phase 3 — Mode Recette (Prompt 3)
```
Crée l'écran "Recettes" avec mode proportionnel multi-ingrédients.
- Champ "Nom de la recette"
- Champ "Nombre de portions de base" (ex: 4)
- Liste dynamique d'ingrédients : nom + quantité + unité (dropdown : g, kg, ml, L, cl, pièce, c.à.s, c.à.c)
- Bouton "+" pour ajouter un ingrédient
- Swipe gauche pour supprimer un ingrédient
- Slider ou input "Nouvelles portions" → recalcul live de toutes les quantités
- Affichage clair avant/après
```

## Phase 4 — Firebase Auth + Sauvegarde (Prompt 4)
```
Intègre Firebase Auth (email/password + Google Sign-In).
- Écran Profil : connexion / inscription / déconnexion
- Firestore : collection "users/{uid}/recipes"
- Document recette : { name, basePortions, ingredients: [{name, qty, unit}], createdAt, updatedAt }
- Bouton "Sauvegarder" sur l'écran recette (visible si connecté)
- Liste des recettes sauvegardées sur l'écran Recettes (FlatList)
- Tap sur recette = charge dans l'éditeur
- Swipe gauche = supprimer avec confirmation
```

## Phase 5 — UX Polish (Prompt 5)
```
Polish UX global :
- Splash screen avec logo
- Animations : react-native-reanimated sur les transitions et le recalcul
- Haptic feedback sur les boutons principaux
- Empty states illustrés (pas de recettes, pas connecté)
- Skeleton loaders sur le chargement des recettes
- Onboarding 3 slides au premier lancement (AsyncStorage flag)
- Mode sombre (toggle dans Profil)
- Icône app + adaptive icon
```

## Phase 6 — Tests + Build (Prompt 6)
```
- Tests unitaires : fonction règle de trois, recalcul proportionnel, edge cases (0, négatifs, décimaux)
- Test composants : react-native-testing-library sur les écrans principaux
- Build EAS : configure eas.json pour preview + production
- Génère l'APK preview pour test interne
- Prépare les métadonnées Play Store : description courte/longue, catégorie, screenshots (liste)
```

---

## Résumé

| Phase | Effort estimé | Dépendances |
|-------|--------------|-------------|
| 1. Init | 30 min | — |
| 2. Mode Simple | 1-2h | Phase 1 |
| 3. Mode Recette | 2-3h | Phase 1 |
| 4. Auth + Save | 2-3h | Phase 3 + Firebase project |
| 5. UX Polish | 3-4h | Phase 4 |
| 6. Tests + Build | 2-3h | Phase 5 |
| **Total** | **~12-16h** | |

> **Note** : Chaque phase = 1 prompt Claude Code. Valide chaque phase avant de passer à la suivante.

# Règle de Trois

Application mobile de calcul de règle de trois et de conversion de recettes.

## Stack

- React Native / Expo (SDK 55)
- TypeScript, Zustand, React Native Paper
- Firebase Auth + Firestore
- AdMob + IAP (freemium)

## Scripts

```bash
npm start          # Démarrer le serveur Expo
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm test           # Lancer les tests
```

## Versioning

On utilise le **SemVer** (`MAJOR.MINOR.PATCH`).

```bash
node scripts/bump-version.js --patch   # 1.0.0 → 1.0.1
node scripts/bump-version.js --minor   # 1.0.0 → 1.1.0
node scripts/bump-version.js --major   # 1.0.0 → 2.0.0
```

Le script met à jour automatiquement `app.json`, `src/config/version.ts` et `CHANGELOG.md`.

## Convention de commits

```
feat: nouvelle fonctionnalité     → bump minor
fix: correction bug               → bump patch
breaking: changement cassant      → bump major
```

Exemples :
```
feat: add dark mode toggle
fix: fix division by zero crash
breaking: remove legacy sync API
```

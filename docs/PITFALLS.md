# PITFALLS — Proportio

> Pièges qui sont revenus 2+ fois. OBLIGATOIRE à lire avant de toucher au code concerné.
> Chaque piège a coûté du temps. Ne pas les ignorer.

---

## Comment utiliser ce fichier
1. **Avant de coder** : ctrl+F la techno/zone que tu vas toucher
2. **Après un bug récurrent** : ajouter ici avec contexte
3. **Format** : titre clair → description → solution → optionnel: test qui protège

---

## Build / Deploy

### PITFALL-001 : prebuild --clean efface la signing config
**Symptôme** : Build échoue après `npx expo prebuild --clean` — keystore introuvable
**Cause** : `--clean` supprime tout android/, y compris la config signing dans build.gradle
**Solution** : Keystore dans `credentials/` (hors android/). Après --clean, vérifier que build.gradle référence bien le keystore. Préférer `prebuild` sans `--clean` quand possible.
**Protégé par** : signing config dans build.gradle pointe vers `../../credentials/`

---

### PITFALL-002 : versionCode doit être strictement croissant
**Symptôme** : Upload AAB rejeté par Google Play
**Cause** : Chaque AAB uploadé doit avoir un versionCode supérieur à tous les précédents
**Solution** : Toujours `node scripts/bump-version.js --patch` avant un nouveau build AAB

---

### PITFALL-003 : SENTRY_DISABLE_AUTO_UPLOAD manquant
**Symptôme** : Build AAB échoue sur la tâche Sentry upload
**Cause** : Sentry essaie d'uploader les sourcemaps mais n'a pas les credentials
**Solution** : `SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew bundleRelease`

---

## Google Play API

### PITFALL-004 : Type track en UPPER_SNAKE_CASE
**Symptôme** : `edits.tracks.create` rejette avec "Invalid value at track_config.type"
**Cause** : L'API attend `CLOSED_TESTING`, pas `closedTesting`
**Solution** : Toujours utiliser `CLOSED_TESTING` (majuscules + underscore)
**Protégé par** : manage-tracks.js corrigé

---

### PITFALL-005 : deploy sans --draft échoue si store listing incomplet
**Symptôme** : `edits.commit` rejette avec erreur draft
**Cause** : Google Play requiert un store listing complet pour status `completed` sur certains tracks
**Solution** : Utiliser `--draft` tant que le store listing n'est pas complet (screenshots, questionnaire)

---

## npm / Dependencies

### PITFALL-006 : --legacy-peer-deps obligatoire
**Symptôme** : `npm install` échoue avec peer dependency conflict
**Cause** : Conflit react-dom peer dependency
**Solution** : Toujours `npm install --legacy-peer-deps`

---

## Index rapide

| ID | Zone | Résumé |
|----|------|--------|
| 001 | Build | prebuild --clean efface signing config |
| 002 | Deploy | versionCode doit être croissant |
| 003 | Build | SENTRY_DISABLE_AUTO_UPLOAD requis |
| 004 | Play API | Type track = CLOSED_TESTING (pas camelCase) |
| 005 | Deploy | --draft si store listing incomplet |
| 006 | npm | --legacy-peer-deps obligatoire |

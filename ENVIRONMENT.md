# Environnement de développement — Machine Maxime

> Guide pour un agent IA travaillant sur un autre projet React Native / Expo
> sur cette même machine et ce même compte Play Store.
> Dernière MAJ : 2026-02-26

---

## 1. Machine

| | |
|--|--|
| OS | Windows 11 Pro 10.0.26200 |
| Shell | bash (Git Bash) — syntaxe Unix, PAS Windows (/ pas \, /dev/null pas NUL) |
| Disque dev | D:\Dev\ |

---

## 2. Outils installés

| Outil | Version | Chemin |
|-------|---------|--------|
| Node.js | 25.6.1 | PATH |
| npm | 11.9.0 | PATH |
| TypeScript | 5.9.3 | local par projet (devDep) |
| Java (JDK) | OpenJDK 21.0.9 | `C:\Program Files\Android\Android Studio\jbr` |
| Android Studio | installé | inclut JDK + SDK Manager |
| Gradle | 8.10.2 | wrapper par projet (`android/gradlew`) |
| Git | installé | PATH |
| PowerShell | installé | pour scripts .ps1 |
| sharp | 0.34.5 | devDep npm (génération images) |

### Variables d'environnement
```
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME=C:\Users\Maxime\AppData\Local\Android\Sdk
```

### Android SDK installé
- **compileSdk** : 35
- **buildTools** : 35.0.0
- **NDK** : 26.1.10909125
- **minSdk supporté** : 24+ (selon projet)

---

## 3. Créer un projet React Native / Expo

```bash
npx create-expo-app@latest mon-app
cd mon-app
npx expo install expo-dev-client    # dev build (PAS Expo Go)
npx expo prebuild --platform android  # génère android/
```

### Structure Android générée
```
android/
├── app/
│   ├── build.gradle          ← versionCode, versionName, signing
│   ├── src/main/             ← code natif
│   └── debug.keystore        ← clé debug auto-générée
├── build.gradle              ← config racine, versions SDK
├── gradle.properties         ← JVM args, flags, mots de passe signing
├── gradlew                   ← wrapper Gradle (utiliser ./gradlew)
└── settings.gradle
```

---

## 4. Builds Android

### Build APK (test direct / sideload)
```bash
cd android && ./gradlew assembleRelease --no-daemon
```
Output : `android/app/build/outputs/apk/release/app-release.apk`
Taille typique : ~100-130 MB

### Build AAB (Play Store — obligatoire)
```bash
cd android && ./gradlew bundleRelease --no-daemon
```
Output : `android/app/build/outputs/bundle/release/app-release.aab`
Taille typique : ~60-70 MB

### Clean
```bash
cd android && ./gradlew clean
```

### Astuce PowerShell
Pour automatiser (clean + build + renommage) :
```powershell
# Exemple build-aab.ps1
$appJson = Get-Content "./app.json" | ConvertFrom-Json
$version = $appJson.expo.version
$build = $appJson.expo.android.versionCode
$date = Get-Date -Format "yyyyMMdd"
$filename = "MonApp_v${version}_b${build}_${date}.aab"

Push-Location ./android
./gradlew clean
./gradlew bundleRelease --no-daemon
Pop-Location

Copy-Item "./android/app/build/outputs/bundle/release/app-release.aab" "./builds/$filename"
```

---

## 5. Signing Release

### Créer une clé release
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias mon-app-release -keyalg RSA -keysize 2048 -validity 10000
```

### Configurer dans build.gradle
```groovy
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword findProperty('MY_STORE_PASSWORD') ?: ''
        keyAlias 'mon-app-release'
        keyPassword findProperty('MY_KEY_PASSWORD') ?: ''
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

### Stocker les mots de passe dans `android/gradle.properties`
```properties
MY_STORE_PASSWORD=MonMotDePasse
MY_KEY_PASSWORD=MonMotDePasse
```
**Ne JAMAIS committer gradle.properties avec les mots de passe** — ajouter au .gitignore ou utiliser des variables d'environnement.

---

## 6. Versioning

Expo/React Native utilise 2 valeurs :
- **version** (semver) : "1.0.0" — affichée aux utilisateurs
- **versionCode** (entier) : 1, 2, 3... — Play Store l'exige strictement croissant

### Fichiers à synchroniser
| Fichier | Champs |
|---------|--------|
| `app.json` | `expo.version` + `expo.android.versionCode` |
| `android/app/build.gradle` | `versionName` + `versionCode` |
| `package.json` | `version` |

Le versionCode **DOIT** être incrémenté à chaque upload Play Store (sinon rejet).

---

## 7. Déploiement Play Store

### Compte Play Store
- **Console** : [play.google.com/console](https://play.google.com/console)
- **Projet GCP** : trailnav (même compte Google)
- **Service account** : `trailnav-deploy@trailnav.iam.gserviceaccount.com`
- **Clé JSON** : stockée hors git (jamais committer)
- **API** : Google Play Android Developer API (activée sur le projet GCP)

### Créer un service account pour un nouveau projet
1. Google Cloud Console → IAM → Service Accounts → créer
2. Donner le rôle "Service Account User"
3. Play Console → Paramètres → Accès API → lier le service account
4. Play Console → App → Utilisateurs et autorisations → ajouter le service account avec droits "Admin" ou "Release manager"
5. Télécharger la clé JSON

### Script deploy automatisé (Node.js)
Installer : `npm install --save-dev googleapis`

```javascript
#!/usr/bin/env node
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const KEY_FILE = path.resolve(__dirname, "../chemin/vers/cle.json");
const PACKAGE_NAME = "com.monapp.package";
const [,, aabPath, track = "internal", ...notesParts] = process.argv;
const notes = notesParts.join(" ") || "Mise à jour";

(async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const api = google.androidpublisher({ version: "v3", auth: await auth.getClient() });

  // 1. Créer edit
  const { data: edit } = await api.edits.insert({ packageName: PACKAGE_NAME });

  // 2. Upload AAB
  const { data: bundle } = await api.edits.bundles.upload({
    packageName: PACKAGE_NAME,
    editId: edit.id,
    media: { mimeType: "application/octet-stream", body: fs.createReadStream(path.resolve(aabPath)) },
  });
  console.log(`versionCode: ${bundle.versionCode}`);

  // 3. Assigner au track
  await api.edits.tracks.update({
    packageName: PACKAGE_NAME,
    editId: edit.id,
    track,
    requestBody: {
      track,
      releases: [{
        versionCodes: [bundle.versionCode],
        status: "completed",  // "draft" si fiche Store incomplète
        releaseNotes: [{ language: "fr-FR", text: notes }],
      }],
    },
  });

  // 4. Commit
  await api.edits.commit({ packageName: PACKAGE_NAME, editId: edit.id });
  console.log(`Déployé sur ${track}`);
})();
```

### Tracks Play Store
| Track | Usage | Review Google |
|-------|-------|---------------|
| `internal` | Test interne (max 100 testeurs, rapide) | Non |
| `alpha` | Test fermé | Non |
| `beta` | Test ouvert | Non |
| `production` | Release publique | Oui (heures/jours) |

### Piège : app en brouillon
Si la fiche Store n'est pas complète, le Play Store force `status: "draft"` (pas `"completed"`).
Erreur : `"Only releases with status draft may be created on draft app."`
Fix : utiliser `status: "draft"` OU compléter la fiche Store d'abord.

### Fiche Store minimale requise
- Description courte (max 80 car.)
- Description longue (max 4000 car.)
- Icône 512x512
- Feature graphic 1024x500
- 2+ screenshots téléphone
- Catégorie
- Politique de confidentialité (URL)
- Questionnaire contenu (PEGI, audience, données)

### Test interne — pour que les testeurs aient l'app dans leur Play Store
1. Play Console → Tests → Test interne → Testeurs → créer liste d'emails
2. Partager le lien d'opt-in aux testeurs
3. Ils acceptent → l'app apparaît dans leur Play Store
4. Mises à jour automatiques comme n'importe quelle app

---

## 8. EAS Build (cloud Expo — alternatif)

Si besoin de builder dans le cloud au lieu de localement :
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # APK
eas build --platform android --profile production # AAB
```

Config dans `eas.json`. Gratuit avec limites, payant pour builds rapides.

### OTA Updates (sans rebuild natif)
```bash
eas update --branch preview --message "description du changement"
```
Uniquement pour du JS/assets — tout changement natif nécessite un rebuild.

---

## 9. Pièges courants

| Piège | Solution |
|-------|----------|
| `JAVA_HOME` pas trouvé | Vérifier que le PATH pointe vers le JDK Android Studio |
| `SDK location not found` | Créer `android/local.properties` avec `sdk.dir=C:\\Users\\Maxime\\AppData\\Local\\Android\\Sdk` |
| `versionCode already used` | Incrémenter versionCode dans app.json + build.gradle |
| Build gradle OOM | Augmenter `-Xmx` dans `gradle.properties` (actuellement 2048m) |
| Metro cache corrompu | `rm -rf $TEMP/metro-* $TEMP/haste-*` ou `npx expo start --clear` |
| `Only draft releases` | Fiche Store incomplète, utiliser status "draft" |
| Signing échoue | Vérifier keystore + mots de passe dans gradle.properties |
| Hook pre-push bloque | `npm run check` échoue — corriger les erreurs TS/tests |

---

## 10. Préférences utilisateur (Maxime)

- Réponses en **français**, concises
- **Ne JAMAIS lancer expo** — il gère le serveur Metro lui-même
- **Ne JAMAIS commit** sans demande explicite
- Vérifier le code (`tsc + jest`) avant de dire que c'est fini
- UI/texte en français, code en anglais
- Pas de sur-ingénierie, pas d'explications longues

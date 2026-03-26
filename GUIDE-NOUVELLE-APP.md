# Guide : ajouter une nouvelle app au portfolio (Sentry + Supabase + OTA + Play Store)

Ce guide utilise TrailNav comme reference. Chaque nouvelle app (regle2troix, etc.) suit le meme pattern mais avec ses **propres projets** Sentry/Supabase/EAS.

---

## 1. Compte Expo / EAS

### Meme compte Expo pour toutes les apps
- Se connecter : `npx eas login` (meme identifiant que TrailNav)
- Chaque app a son propre **project ID** EAS (genere au `eas init`)

### Initialiser le projet EAS
```bash
cd D:\Dev\regle2troix
npx eas init
# -> cree un project ID unique dans app.json > expo.extra.eas.projectId
```

### Fichier `eas.json` (copier ce template)
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": { "buildType": "apk", "credentialsSource": "local" }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "android": { "buildType": "app-bundle", "credentialsSource": "local" }
    }
  }
}
```

### Builds
```bash
# Dev APK (test local)
npx eas build --profile development --platform android

# Preview APK (testeurs)
npx eas build --profile preview --platform android

# Production AAB (Play Store)
npx eas build --profile production --platform android
```

---

## 2. OTA (Over-The-Air Updates via expo-updates)

Permet de pousser des mises a jour JS sans rebuilder l'APK/AAB.

### Installation
```bash
npx expo install expo-updates
```

### Config `app.json`
```json
{
  "expo": {
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/<PROJECT_ID>",
      "enabled": true,
      "fallbackToCacheTimeout": 3000,
      "requestHeaders": {
        "expo-channel-name": "preview"
      }
    }
  }
}
```
- `<PROJECT_ID>` = celui genere par `eas init`
- `runtimeVersion` : incrementer uniquement quand on change du code natif (nouveau module, SDK bump)
- `expo-channel-name` : `development`, `preview`, ou `production` selon le profil

### Service `updateChecker.ts` (pattern commun)
```typescript
import * as Updates from "expo-updates";

export async function checkForUpdate(): Promise<{ available: boolean; ready: boolean }> {
  if (__DEV__) return { available: false, ready: false };
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return { available: false, ready: false };
    await Updates.fetchUpdateAsync();
    return { available: true, ready: true };
  } catch {
    return { available: false, ready: false };
  }
}

export async function reloadApp(): Promise<void> {
  await Updates.reloadAsync();
}
```

### Pousser une mise a jour OTA
```bash
# Preview (testeurs)
npx eas update --branch preview --message "fix: description du fix"

# Production (utilisateurs)
npx eas update --branch production --message "fix: description du fix"
```

### Regle importante
Chaque push OTA ou AAB **doit** incrementer :
- Le **patch** semver (1.0.0 -> 1.0.1 -> 1.0.2)
- Le **build number** (1 -> 2 -> 3)
- Mettre a jour dans : `app.json`, `package.json`, `src/config/app.ts`, `src/constants/buildInfo.ts`
- Pour AAB uniquement : aussi `android/app/build.gradle` (versionCode)

---

## 3. Sentry (crash reporting)

### Creer un NOUVEAU PROJET Sentry (pas reutiliser TrailNav)
1. Aller sur https://trailnav.sentry.io (meme org `trailnav`)
2. **Settings > Projects > Create Project**
3. Plateforme : React Native
4. Nom : `regle2troix` (ou le nom de l'app)
5. Recuperer le **DSN** du nouveau projet

### Installation
```bash
npx expo install @sentry/react-native
```

### Plugin `app.json`
```json
{
  "plugins": [
    ["@sentry/react-native/expo", {
      "organization": "trailnav",
      "project": "regle2troix"
    }]
  ]
}
```

### Fichier `src/config/sentry.ts` (pattern commun)
```typescript
import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";
import { APP_VERSION, BUILD_NUMBER, IS_EMULATOR } from "./app";

// DSN du projet regle2troix (PAS celui de TrailNav)
const SENTRY_DSN = "https://XXXXXXXX@oXXXXXXX.ingest.de.sentry.io/XXXXXXXX";

export function initSentry() {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: `com.regle2troix.app@${APP_VERSION}`,
      dist: String(BUILD_NUMBER),
      environment: __DEV__ ? "development" : "production",
      sendDefaultPii: false,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      sampleRate: __DEV__ ? 1.0 : 0.5,
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      enableAutoSessionTracking: !IS_EMULATOR,
      enableNativeCrashHandling: true,
      debug: false,
      beforeSend(event) {
        if (IS_EMULATOR && !__DEV__) return null;
        return event;
      },
    });
    Sentry.setTag("app_version", APP_VERSION);
    Sentry.setTag("build_number", String(BUILD_NUMBER));
    Sentry.setTag("platform", Platform.OS);
  } catch { /* must not crash */ }
}

export function setSentryUser(deviceId: string) {
  Sentry.setUser({ id: deviceId });
}

export { Sentry };
```

### Source maps (pour des stack traces lisibles)
Creer un token Sentry **org-level** : Settings > Auth Tokens > Create Token (scope: `org:ci`)
```bash
# Au moment du build production
SENTRY_AUTH_TOKEN="sntrys_..." npx eas build --profile production --platform android
```

### Tokens
| Token | Usage | Scope |
|-------|-------|-------|
| `sntrys_...` (org) | Upload source maps au build | `org:ci` |
| `sntryu_...` (user) | Lire issues via API | `project:read`, `event:read` |

Les tokens sont **au niveau org** — ils marchent pour tous les projets de l'org `trailnav`.

---

## 4. Supabase (monitoring, bug reports, heartbeat)

### Creer un NOUVEAU PROJET Supabase (pas reutiliser TrailNav)
1. Aller sur https://supabase.com/dashboard
2. Meme organisation, **New Project** : `regle2troix`
3. Region : EU West (ou la plus proche)
4. Recuperer l'**URL** et la **clef anon**

### Schema SQL (tables de base, a executer dans SQL Editor)
```sql
-- Heartbeats (ping au lancement)
CREATE TABLE device_heartbeats (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  app_version TEXT NOT NULL,
  build_number INTEGER DEFAULT 0,
  platform TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bug reports
CREATE TABLE bug_reports (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bug',
  description TEXT,
  screen_name TEXT,
  app_version TEXT,
  platform TEXT,
  markers JSONB DEFAULT '[]',
  screenshot_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Config remote (kill switch, maintenance)
CREATE TABLE app_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  min_version TEXT DEFAULT '0.0.0',
  maintenance BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT '',
  blocked_devices TEXT[] DEFAULT '{}',
  custom_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserer la config par defaut
INSERT INTO app_config (id) VALUES (1);

-- RLS : lecture publique, ecriture publique (anon key)
ALTER TABLE device_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_heartbeats" ON device_heartbeats FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_bugs" ON bug_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_read_config" ON app_config FOR SELECT TO anon USING (true);
```

### Bucket Storage (screenshots bug reports)
Dans le dashboard Supabase > Storage > New Bucket :
- Nom : `bug-screenshots`
- Public : **oui**

Policy sur le bucket :
```sql
-- Permettre l'upload anon
CREATE POLICY "anon_upload" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'bug-screenshots');

-- Permettre la lecture publique
CREATE POLICY "public_read" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'bug-screenshots');
```

### Fichier `src/config/supabase.ts`
```typescript
import { createClient } from "@supabase/supabase-js";

// Credentials du projet regle2troix (PAS ceux de TrailNav)
const SUPABASE_URL = "https://XXXXXXXX.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Installation
```bash
npx expo install @supabase/supabase-js
```

---

## 5. Logger (pattern commun a toutes les apps)

Meme structure que TrailNav : log fichier local + console + Sentry sur ERROR.

### Fichier `src/utils/logger.ts`
```typescript
import * as FileSystem from "expo-file-system";
import * as Sentry from "@sentry/react-native";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_PRIORITY: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let minLevel: LogLevel = __DEV__ ? "DEBUG" : "WARN";
const LOG_PATH = `${FileSystem.documentDirectory}debug.log`;
const MAX_LINES = 500;

function ts(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(line: string) {
  writeQueue = writeQueue.then(async () => {
    try {
      let existing = "";
      try { existing = await FileSystem.readAsStringAsync(LOG_PATH); } catch { /* new file */ }
      const lines = existing ? existing.split("\n") : [];
      lines.push(line);
      const trimmed = lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines;
      await FileSystem.writeAsStringAsync(LOG_PATH, trimmed.join("\n"));
    } catch { /* best-effort */ }
  });
}

let _isLogging = false;

function log(level: LogLevel, tag: string, message: string, ...args: unknown[]) {
  if (_isLogging) return; // guard anti-recursion
  _isLogging = true;
  try {
    const extra = args.length ? " " + args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ") : "";
    const line = `[${ts()}] [${level}] [${tag.toLowerCase()}] ${message}${extra}`;
    if (LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel]) {
      (level === "WARN" ? console.warn : console.log)(line);
    }
    enqueueWrite(line);
    if (level === "ERROR") {
      try { Sentry.captureMessage(`[${tag}] ${message}`, { level: "error" }); } catch {}
    }
  } finally {
    _isLogging = false;
  }
}

export const logger = {
  debug: (tag: string, msg: string, ...a: unknown[]) => log("DEBUG", tag, msg, ...a),
  info:  (tag: string, msg: string, ...a: unknown[]) => log("INFO", tag, msg, ...a),
  warn:  (tag: string, msg: string, ...a: unknown[]) => log("WARN", tag, msg, ...a),
  error: (tag: string, msg: string, ...a: unknown[]) => log("ERROR", tag, msg, ...a),
  getLogPath: () => LOG_PATH,
};
```

---

## 6. Device ID (pattern commun)

UUID anonyme persiste dans AsyncStorage.

```typescript
// src/services/deviceId.ts
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "regle2troix_device_id"; // prefixer par le nom de l'app

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    let id = await AsyncStorage.getItem(KEY);
    if (!id) {
      id = Crypto.randomUUID();
      await AsyncStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    if (!cached) cached = `fallback-${Date.now()}`;
    return cached;
  }
}
```

---

## 7. Heartbeat (pattern commun)

Ping fire-and-forget au lancement.

```typescript
// src/services/heartbeat.ts
import { Platform, Dimensions } from "react-native";
import * as Device from "expo-device";
import { supabase } from "../config/supabase";
import { APP_VERSION, BUILD_NUMBER } from "../config/app";
import { getDeviceId } from "./deviceId";

export async function sendHeartbeat(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    const screen = Dimensions.get("screen");
    await supabase.from("device_heartbeats").insert({
      device_id: deviceId,
      app_version: APP_VERSION,
      build_number: BUILD_NUMBER,
      platform: `${Platform.OS} ${Platform.Version}`,
      metadata: {
        device_name: Device.modelName,
        device_brand: Device.brand,
        os_version: Device.osVersion,
        screen_size: `${Math.round(screen.width)}x${Math.round(screen.height)}`,
        is_emulator: !Device.isDevice,
      },
    });
  } catch { /* fire-and-forget */ }
}
```

---

## 8. Remote Config / Kill Switch (pattern commun)

```typescript
// src/services/remoteConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { APP_VERSION } from "../config/app";
import { getDeviceId } from "./deviceId";

const CACHE_KEY = "regle2troix_app_config";

interface AppConfig {
  min_version: string;
  maintenance: boolean;
  maintenance_message: string;
  blocked_devices: string[];
  custom_message: string;
}

export interface BlockStatus { blocked: boolean; reason: string; }

export async function fetchAppConfig(): Promise<BlockStatus> {
  let config: AppConfig = { min_version: "0.0.0", maintenance: false, maintenance_message: "", blocked_devices: [], custom_message: "" };

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) config = JSON.parse(cached);
  } catch {}

  try {
    const { data, error } = await Promise.race([
      supabase.from("app_config").select("*").eq("id", 1).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]) as any;
    if (!error && data) {
      config = data;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config)).catch(() => {});
    }
  } catch {}

  if (config.maintenance) return { blocked: true, reason: config.maintenance_message || "Maintenance en cours" };
  const deviceId = await getDeviceId();
  if (config.blocked_devices.includes(deviceId)) return { blocked: true, reason: "Acces revoque" };

  const cmp = (a: string, b: string) => {
    const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) { const d = (pa[i] ?? 0) - (pb[i] ?? 0); if (d) return d; }
    return 0;
  };
  if (cmp(APP_VERSION, config.min_version) < 0) return { blocked: true, reason: `Mise a jour requise (min ${config.min_version})` };

  return { blocked: false, reason: config.custom_message };
}
```

---

## 9. Initialisation dans App.tsx (pattern commun)

```typescript
import { initSentry, Sentry } from "./src/config/sentry";
try { initSentry(); } catch {}
import * as SplashScreen from "expo-splash-screen";
try { SplashScreen.preventAutoHideAsync(); } catch {}

// Dans le composant App :
useEffect(() => {
  // Phase 1 : core init
  Promise.all([
    /* init stores, DB, etc. */
  ]).then(() => {
    // Phase 2 : remote config + UI
    fetchAppConfig().then(setBlockStatus).catch(() => {});
  });

  // Phase 3 : background (2s apres)
  setTimeout(() => {
    sendHeartbeat().catch(() => {});
    checkForUpdate().then((r) => {
      if (r.ready) Alert.alert("Mise a jour", "Redemarrer ?", [
        { text: "Plus tard" },
        { text: "OK", onPress: () => reloadApp() },
      ]);
    }).catch(() => {});
  }, 2000);
}, []);
```

---

## 10. Google Play Store

### Prerequis
- Compte Google Play Developer (25$ une seule fois, meme compte pour toutes les apps)
- L'app doit etre signee avec une **clef de signature** (keystore)

### Keystore
Chaque app a son propre keystore. Generer :
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore regle2troix.keystore -alias regle2troix -keyalg RSA -keysize 2048 -validity 10000
```
Stocker le keystore dans `credentials/` (gitignore!) et configurer dans `credentials.json` :
```json
{
  "android": {
    "keystore": {
      "keystorePath": "./credentials/regle2troix.keystore",
      "keystorePassword": "MOT_DE_PASSE",
      "keyAlias": "regle2troix",
      "keyPassword": "MOT_DE_PASSE"
    }
  }
}
```

### Build AAB pour le Store
```bash
npx eas build --profile production --platform android
# -> Genere un fichier .aab
```

### Publier sur le Play Store
1. **Google Play Console** : https://play.google.com/console
2. **Creer une application** : nom, description, icones, captures d'ecran
3. **Track de test interne** : (recommande pour commencer)
   - Aller dans **Test > Test interne**
   - Creer une release, uploader le `.aab`
   - Ajouter les testeurs par email
   - Les testeurs recoivent un lien d'installation
4. **Track de test ferme** : plus de testeurs, meme principe
5. **Production** : quand l'app est prete
   - Aller dans **Production > Creer une release**
   - Uploader le `.aab`
   - Remplir le questionnaire de classification du contenu
   - Remplir la fiche Store (description, captures, categorie, politique de confidentialite)
   - Soumettre pour review (24-72h)

### Fiche Store obligatoire
| Element | Requis |
|---------|--------|
| Nom de l'app | Oui (max 30 chars) |
| Description courte | Oui (max 80 chars) |
| Description longue | Oui (max 4000 chars) |
| Icone | 512x512 PNG |
| Feature graphic | 1024x500 PNG |
| Captures d'ecran | Min 2, recommande 4-8 (telephone) |
| Politique de confidentialite | URL obligatoire |
| Categorie | Oui |
| Classification contenu | Questionnaire a remplir |

### Versioning Play Store
Le Play Store exige que chaque upload ait un `versionCode` **strictement croissant**.
- `versionCode` (entier) dans `android/app/build.gradle` et `app.json > android.versionCode`
- `versionName` (semver) affichee aux utilisateurs

### Play App Signing
Google recommande d'utiliser Play App Signing (Google garde la clef de signature finale).
- EAS gere ca automatiquement si `credentialsSource: "remote"` dans eas.json
- Si `credentialsSource: "local"`, c'est toi qui gere le keystore (plus de controle, mais si tu perds le keystore, tu perds l'app)

### Monetisation / gratuit
- App gratuite = **irreversible** (ne peut jamais devenir payante)
- App payante ou freemium : decider avant la premiere publication

---

## 11. Arborescence recommandee pour une nouvelle app

```
src/
  config/
    app.ts          <- APP_VERSION, BUILD_NUMBER, IS_EMULATOR
    sentry.ts       <- initSentry(), DSN specifique
    supabase.ts     <- createClient(), URL + anon key specifiques
  constants/
    buildInfo.ts    <- version affichee dans l'UI
    theme.ts        <- couleurs, styles
  services/
    deviceId.ts     <- UUID anonyme AsyncStorage
    heartbeat.ts    <- ping Supabase au lancement
    bugReport.ts    <- envoi bug + screenshot + offline queue
    remoteConfig.ts <- kill switch, maintenance
    updateChecker.ts <- OTA expo-updates
  utils/
    logger.ts       <- fichier + console + Sentry
```

---

## 12. Checklist nouvelle app

- [ ] `npx eas init` (project ID)
- [ ] Creer projet Sentry dans org `trailnav`
- [ ] Creer projet Supabase (tables + bucket + RLS)
- [ ] Keystore genere et stocke dans `credentials/`
- [ ] `credentials.json` configure (gitignore!)
- [ ] `app.json` : slug, package, splash, plugins Sentry
- [ ] `eas.json` copie du template
- [ ] `src/config/sentry.ts` avec DSN du nouveau projet
- [ ] `src/config/supabase.ts` avec URL/key du nouveau projet
- [ ] `src/config/app.ts` avec package name correct
- [ ] `src/utils/logger.ts` copie du pattern
- [ ] `src/services/deviceId.ts` avec prefixe unique
- [ ] Services heartbeat, bugReport, remoteConfig, updateChecker
- [ ] Premier build dev : `npx eas build --profile development --platform android`
- [ ] Tester OTA : `npx eas update --branch development --message "test OTA"`
- [ ] Fiche Play Store preparee (icones, captures, description)

---

## Resume : meme compte, projets separes

| Service | Partage | Separe par app |
|---------|---------|---------------|
| Compte Expo/EAS | Meme login | Project ID different |
| Sentry | Meme org `trailnav` | Projet different (DSN different) |
| Supabase | Meme organisation | Projet different (URL + key differentes) |
| Play Store | Meme compte developer | Fiche Store differente |
| Keystore | Non | 1 keystore par app |
| OTA channels | Non | Propres a chaque project ID |

#!/usr/bin/env node
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const KEY_FILE = path.resolve(__dirname, "../GoogleCloud/trailnav-986ada2696e7.json");
const PACKAGE_NAME = "com.regledetrois.app";

// --- Parse arguments ---
const rawArgs = process.argv.slice(2);
const isDraft = rawArgs.includes("--draft");
const filteredArgs = rawArgs.filter(a => a !== "--draft");

// Extract --tracks <list> flag
let multiTracks = null;
const tracksIdx = filteredArgs.indexOf("--tracks");
if (tracksIdx !== -1) {
  multiTracks = (filteredArgs[tracksIdx + 1] || "").split(",").map(t => t.trim()).filter(Boolean);
  filteredArgs.splice(tracksIdx, 2);
}

// Extract --version-code <code> flag
let forceVersionCode = null;
const vcIdx = filteredArgs.indexOf("--version-code");
if (vcIdx !== -1) {
  forceVersionCode = parseInt(filteredArgs[vcIdx + 1], 10);
  if (isNaN(forceVersionCode)) {
    console.error("Erreur: --version-code doit être un nombre.");
    process.exit(1);
  }
  filteredArgs.splice(vcIdx, 2);
}

// Remaining args: [aabPath] [track] [notes...]
// Multi-track mode: [aabPath] [notes...] or just [notes...] (if --version-code)
// Legacy mode: <aabPath> [track] [notes...]
let aabPath, track, notes;

if (multiTracks) {
  // Multi-track mode
  if (forceVersionCode && (!filteredArgs[0] || !filteredArgs[0].endsWith(".aab"))) {
    // No AAB, just notes
    aabPath = null;
    notes = filteredArgs.join(" ") || "Mise à jour";
  } else {
    aabPath = filteredArgs[0] || null;
    notes = filteredArgs.slice(1).join(" ") || "Mise à jour";
  }
} else {
  // Legacy single-track mode
  aabPath = filteredArgs[0];
  track = filteredArgs[1] || "internal";
  notes = filteredArgs.slice(2).join(" ") || "Mise à jour";
}

const releaseStatus = isDraft ? "draft" : "completed";

// --- Validation ---
if (!multiTracks && !aabPath) {
  console.error("Usage:");
  console.error("  node scripts/deploy.js <path-to.aab> [track] [release notes...] [--draft]");
  console.error("  node scripts/deploy.js <path-to.aab> --tracks t1,t2 [release notes...] [--draft]");
  console.error("  node scripts/deploy.js --tracks t1,t2 --version-code <N> [release notes...] [--draft]");
  console.error("");
  console.error("  track: internal (default), alpha, beta, production, or custom track name");
  console.error("  --tracks: deploy to multiple tracks at once");
  console.error("  --version-code: reuse an existing versionCode (no AAB upload)");
  console.error("  --draft: upload as draft (no automatic rollout)");
  process.exit(1);
}

if (multiTracks && !aabPath && !forceVersionCode) {
  console.error("Erreur: --tracks sans AAB nécessite --version-code.");
  process.exit(1);
}

if (!fs.existsSync(KEY_FILE)) {
  console.error("Clé service account introuvable:", KEY_FILE);
  process.exit(1);
}

if (aabPath && !fs.existsSync(aabPath)) {
  console.error("Fichier AAB introuvable:", aabPath);
  process.exit(1);
}

// --- Deploy ---
(async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const api = google.androidpublisher({ version: "v3", auth: await auth.getClient() });

    // 1. Créer edit
    const { data: edit } = await api.edits.insert({ packageName: PACKAGE_NAME });
    console.log(`Edit créé: ${edit.id}`);

    // 2. Upload AAB (si fourni)
    let versionCode = forceVersionCode;
    if (aabPath) {
      const { data: bundle } = await api.edits.bundles.upload({
        packageName: PACKAGE_NAME,
        editId: edit.id,
        media: { mimeType: "application/octet-stream", body: fs.createReadStream(path.resolve(aabPath)) },
      });
      versionCode = bundle.versionCode;
      console.log(`AAB uploadé — versionCode: ${versionCode}`);
    } else {
      console.log(`Réutilisation versionCode: ${versionCode} (pas d'upload)`);
    }

    // 3. Assigner au(x) track(s)
    const tracks = multiTracks || [track];

    // Safeguard alpha
    if (multiTracks && tracks.includes("alpha")) {
      console.log("⚠ WARNING: 'alpha' est dans la liste des tracks. Le track alpha existant sera mis à jour.");
    }

    const errors = [];
    for (const t of tracks) {
      try {
        await api.edits.tracks.update({
          packageName: PACKAGE_NAME,
          editId: edit.id,
          track: t,
          requestBody: {
            track: t,
            releases: [{
              versionCodes: [versionCode],
              status: releaseStatus,
              releaseNotes: [{ language: "fr-FR", text: notes }],
            }],
          },
        });
        console.log(`  ✓ Track "${t}" mis à jour (status: ${releaseStatus})`);
      } catch (err) {
        console.error(`  ✗ Track "${t}" échoué: ${err.message}`);
        errors.push(t);
      }
    }

    // 4. Commit (seulement si aucune erreur)
    if (errors.length > 0) {
      console.error(`\nErreur sur ${errors.length} track(s): ${errors.join(", ")}`);
      console.error("Edit NON commité. Aucun changement appliqué.");
      try { await api.edits.delete({ packageName: PACKAGE_NAME, editId: edit.id }); } catch (_) {}
      process.exit(1);
    }

    await api.edits.commit({ packageName: PACKAGE_NAME, editId: edit.id });
    console.log(`\nDéployé sur ${tracks.join(", ")} (status: ${releaseStatus})`);
  } catch (err) {
    console.error("Erreur deploy:", err.message);
    if (err.message.includes("draft")) {
      console.error("→ La fiche Store est incomplète. Utilisez status 'draft' ou complétez la fiche.");
    }
    process.exit(1);
  }
})();

#!/usr/bin/env node
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const KEY_FILE = path.resolve(__dirname, "../google-play-service-account.json");
const PACKAGE_NAME = "com.regledetrois.app";
const rawArgs = process.argv.slice(2);
const isDraft = rawArgs.includes("--draft");
const filteredArgs = rawArgs.filter(a => a !== "--draft");
const [aabPath, track = "internal", ...notesParts] = filteredArgs;
const notes = notesParts.join(" ") || "Mise à jour";
const releaseStatus = isDraft ? "draft" : "completed";

if (!aabPath) {
  console.error("Usage: node scripts/deploy.js <path-to.aab> [track] [release notes...] [--draft]");
  console.error("  track: internal (default), alpha, beta, production");
  console.error("  --draft: upload as draft (no automatic rollout)");
  process.exit(1);
}

if (!fs.existsSync(KEY_FILE)) {
  console.error("Clé service account introuvable:", KEY_FILE);
  console.error("Téléchargez-la depuis Google Cloud Console.");
  process.exit(1);
}

if (!fs.existsSync(aabPath)) {
  console.error("Fichier AAB introuvable:", aabPath);
  process.exit(1);
}

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
          status: releaseStatus,
          releaseNotes: [{ language: "fr-FR", text: notes }],
        }],
      },
    });

    // 4. Commit
    await api.edits.commit({ packageName: PACKAGE_NAME, editId: edit.id });
    console.log(`Déployé sur ${track} (status: ${releaseStatus})`);
  } catch (err) {
    console.error("Erreur deploy:", err.message);
    if (err.message.includes("draft")) {
      console.error("→ La fiche Store est incomplète. Utilisez status 'draft' ou complétez la fiche.");
    }
    process.exit(1);
  }
})();

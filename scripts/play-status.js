#!/usr/bin/env node
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const KEY_FILE = path.resolve(__dirname, "../google-play-service-account.json");
const PACKAGE_NAME = "com.regledetrois.app";
const TRACKS = ["internal", "alpha", "beta", "production"];

if (!fs.existsSync(KEY_FILE)) {
  console.error("Cle service account introuvable:", KEY_FILE);
  console.error("Telechargez-la depuis Google Cloud Console.");
  process.exit(1);
}

(async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const api = google.androidpublisher({ version: "v3", auth: await auth.getClient() });

    const { data: edit } = await api.edits.insert({ packageName: PACKAGE_NAME });

    console.log(`\n  Play Store Status — ${PACKAGE_NAME}\n`);

    for (const trackName of TRACKS) {
      try {
        const { data: track } = await api.edits.tracks.get({
          packageName: PACKAGE_NAME,
          editId: edit.id,
          track: trackName,
        });

        if (track.releases && track.releases.length > 0) {
          const latest = track.releases[0];
          const codes = (latest.versionCodes || []).join(", ");
          console.log(`  ${trackName.padEnd(12)} | status: ${latest.status.padEnd(10)} | versionCodes: [${codes}] | name: ${latest.name || "-"}`);
        } else {
          console.log(`  ${trackName.padEnd(12)} | (vide)`);
        }
      } catch {
        console.log(`  ${trackName.padEnd(12)} | (aucune release)`);
      }
    }

    console.log("");

    // Cleanup edit without committing
    await api.edits.delete({ packageName: PACKAGE_NAME, editId: edit.id });
  } catch (err) {
    console.error("Erreur:", err.message);
    process.exit(1);
  }
})();

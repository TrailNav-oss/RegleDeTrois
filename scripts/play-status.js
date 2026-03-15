#!/usr/bin/env node
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const KEY_FILE = path.resolve(__dirname, "../GoogleCloud/trailnav-986ada2696e7.json");
const PACKAGE_NAME = "com.regledetrois.app";

if (!fs.existsSync(KEY_FILE)) {
  console.error("Clé service account introuvable:", KEY_FILE);
  console.error("Téléchargez-la depuis Google Cloud Console.");
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

    // List ALL tracks (built-in + custom closed testing tracks)
    const { data: trackList } = await api.edits.tracks.list({
      packageName: PACKAGE_NAME,
      editId: edit.id,
    });

    if (trackList.tracks && trackList.tracks.length > 0) {
      for (const track of trackList.tracks) {
        const name = track.track;
        if (track.releases && track.releases.length > 0) {
          for (const rel of track.releases) {
            const codes = (rel.versionCodes || []).join(", ");
            const status = (rel.status || "-").padEnd(12);
            console.log(`  ${name.padEnd(24)} | status: ${status} | versionCodes: [${codes}] | name: ${rel.name || "-"}`);
          }
        } else {
          console.log(`  ${name.padEnd(24)} | (vide)`);
        }
      }
    } else {
      console.log("  Aucun track trouvé.");
    }

    console.log("");

    // Cleanup edit without committing
    await api.edits.delete({ packageName: PACKAGE_NAME, editId: edit.id });
  } catch (err) {
    console.error("Erreur:", err.message);
    process.exit(1);
  }
})();

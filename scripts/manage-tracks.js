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

const [command, ...args] = process.argv.slice(2);

if (!command || !["list", "create"].includes(command)) {
  console.error("Usage:");
  console.error("  node scripts/manage-tracks.js list                  # Liste tous les tracks");
  console.error("  node scripts/manage-tracks.js create <track-name>   # Crée un track closedTesting");
  process.exit(1);
}

async function getApi() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  return google.androidpublisher({ version: "v3", auth: await auth.getClient() });
}

async function listTracks() {
  const api = await getApi();
  const { data: edit } = await api.edits.insert({ packageName: PACKAGE_NAME });

  console.log(`\n  Tracks — ${PACKAGE_NAME}\n`);

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
  await api.edits.delete({ packageName: PACKAGE_NAME, editId: edit.id });
}

async function createTrack(trackName) {
  if (!trackName) {
    console.error("Erreur: nom de track requis.");
    console.error("Usage: node scripts/manage-tracks.js create <track-name>");
    process.exit(1);
  }

  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(trackName)) {
    console.error(`Erreur: nom de track invalide "${trackName}".`);
    console.error("Le nom doit commencer par une lettre et ne contenir que lettres, chiffres et tirets.");
    process.exit(1);
  }

  const api = await getApi();
  const { data: edit } = await api.edits.insert({ packageName: PACKAGE_NAME });
  console.log(`Edit créé: ${edit.id}`);

  try {
    await api.edits.tracks.create({
      packageName: PACKAGE_NAME,
      editId: edit.id,
      requestBody: {
        track: trackName,
        type: "CLOSED_TESTING",
        formFactor: "DEFAULT",
      },
    });
    console.log(`Track "${trackName}" créé (type: closedTesting).`);

    await api.edits.commit({ packageName: PACKAGE_NAME, editId: edit.id });
    console.log("Edit commité.");

    console.log("");
    console.log("⚠ Étape suivante (Play Console UI) :");
    console.log("  1. Google Play Console → Tests → Tests fermés");
    console.log(`  2. Sélectionnez le track "${trackName}"`);
    console.log("  3. Gérer testeurs → Listes d'emails → Ajouter les emails");
    console.log("  4. Copiez le lien d'inscription (opt-in) et envoyez-le aux testeurs");
  } catch (err) {
    console.error(`Erreur création track "${trackName}":`, err.message);
    // Cleanup edit
    try { await api.edits.delete({ packageName: PACKAGE_NAME, editId: edit.id }); } catch (_) {}
    process.exit(1);
  }
}

(async () => {
  try {
    if (command === "list") {
      await listTracks();
    } else if (command === "create") {
      await createTrack(args[0]);
    }
  } catch (err) {
    console.error("Erreur:", err.message);
    process.exit(1);
  }
})();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// --- Parse args ---
const args = process.argv.slice(2);
const bump = args.includes('--major') ? 'major'
  : args.includes('--minor') ? 'minor'
  : args.includes('--patch') ? 'patch'
  : null;

if (!bump) {
  console.error('Usage: node scripts/bump-version.js --major | --minor | --patch');
  process.exit(1);
}

// --- Paths ---
const root = path.resolve(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const versionTsPath = path.join(root, 'src', 'config', 'version.ts');
const changelogPath = path.join(root, 'CHANGELOG.md');

// --- Read current version from version.ts ---
const versionTs = fs.readFileSync(versionTsPath, 'utf-8');
const majorMatch = versionTs.match(/major:\s*(\d+)/);
const minorMatch = versionTs.match(/minor:\s*(\d+)/);
const patchMatch = versionTs.match(/patch:\s*(\d+)/);
const buildMatch = versionTs.match(/build:\s*(\d+)/);

if (!majorMatch || !minorMatch || !patchMatch || !buildMatch) {
  console.error('Could not parse version.ts');
  process.exit(1);
}

let major = parseInt(majorMatch[1], 10);
let minor = parseInt(minorMatch[1], 10);
let patch = parseInt(patchMatch[1], 10);
let build = parseInt(buildMatch[1], 10);

const oldVersion = `${major}.${minor}.${patch}`;
const oldBuild = build;

// --- Bump ---
if (bump === 'major') {
  major++;
  minor = 0;
  patch = 0;
} else if (bump === 'minor') {
  minor++;
  patch = 0;
} else {
  patch++;
}
build++;

const newVersion = `${major}.${minor}.${patch}`;

// --- Update app.json ---
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
appJson.expo.version = newVersion;
appJson.expo.runtimeVersion = newVersion;
appJson.expo.android.versionCode = build;
appJson.expo.ios.buildNumber = String(build);
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf-8');

// --- Update version.ts ---
let newVersionTs = versionTs
  .replace(/major:\s*\d+/, `major: ${major}`)
  .replace(/minor:\s*\d+/, `minor: ${minor}`)
  .replace(/patch:\s*\d+/, `patch: ${patch}`)
  .replace(/build:\s*\d+/, `build: ${build}`)
  .replace(/label:\s*'[^']*'/, `label: '${newVersion}'`);
fs.writeFileSync(versionTsPath, newVersionTs, 'utf-8');

// --- Update CHANGELOG.md ---
const today = new Date().toISOString().split('T')[0];
const newEntry = `## [${newVersion}] - ${today}\n### Ajouté\n- \n\n### Corrigé\n- \n`;

let changelog = fs.readFileSync(changelogPath, 'utf-8');
changelog = changelog.replace('# Changelog\n', `# Changelog\n\n${newEntry}`);
fs.writeFileSync(changelogPath, changelog, 'utf-8');

// --- Summary ---
console.log('');
console.log(`  Bump ${bump}: ${oldVersion} -> ${newVersion}`);
console.log(`  Build:   ${oldBuild} -> ${build}`);
console.log('');
console.log('  Updated files:');
console.log(`    - app.json          (version: "${newVersion}", versionCode: ${build})`);
console.log(`    - src/config/version.ts`);
console.log(`    - CHANGELOG.md      (new entry for ${newVersion})`);
console.log('');

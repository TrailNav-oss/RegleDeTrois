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
const packageJsonPath = path.join(root, 'package.json');

// --- Read current version from app.json ---
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
const currentVersion = appJson.expo.version;
const currentBuild = appJson.expo.android.versionCode;

const parts = currentVersion.split('.').map(Number);
let [major, minor, patch] = parts;
let build = currentBuild;

const oldVersion = `${major}.${minor}.${patch}`;

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
appJson.expo.version = newVersion;
appJson.expo.runtimeVersion = newVersion;
appJson.expo.android.versionCode = build;
appJson.expo.ios.buildNumber = String(build);
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf-8');

// --- Update package.json ---
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

// --- Summary ---
console.log('');
console.log(`  Bump ${bump}: ${oldVersion} -> ${newVersion}`);
console.log(`  Build:   ${currentBuild} -> ${build}`);
console.log('');
console.log('  Updated files:');
console.log(`    - app.json       (version: "${newVersion}", versionCode: ${build})`);
console.log(`    - package.json   (version: "${newVersion}")`);
console.log('');
console.log('  Note: run "npx expo prebuild --platform android" to apply to native code.');
console.log('');

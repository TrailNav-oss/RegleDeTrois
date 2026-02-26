# Build AAB pour Play Store
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-aab.ps1

$appJson = Get-Content "./app.json" | ConvertFrom-Json
$version = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode
$date = Get-Date -Format "yyyyMMdd"
$filename = "RegleDeTrois_v${version}_b${versionCode}_${date}.aab"

Write-Host "Building Regle de Trois v${version} (build ${versionCode})..." -ForegroundColor Cyan

# Create builds directory if needed
if (!(Test-Path "./builds")) { New-Item -ItemType Directory -Path "./builds" }

# Clean + build
Push-Location ./android
./gradlew clean
./gradlew bundleRelease --no-daemon
Pop-Location

$aabSource = "./android/app/build/outputs/bundle/release/app-release.aab"
if (Test-Path $aabSource) {
    Copy-Item $aabSource "./builds/$filename"
    Write-Host "AAB copie dans ./builds/$filename" -ForegroundColor Green
    Write-Host "Taille: $((Get-Item "./builds/$filename").Length / 1MB) MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour deployer:" -ForegroundColor Yellow
    Write-Host "  node scripts/deploy.js ./builds/$filename internal `"Release v${version}`"" -ForegroundColor Yellow
} else {
    Write-Host "ERREUR: AAB non trouve. Verifiez les logs Gradle." -ForegroundColor Red
    exit 1
}

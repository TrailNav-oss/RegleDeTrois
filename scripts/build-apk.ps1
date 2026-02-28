# Build APK pour test/sideload
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1

$appJson = Get-Content "./app.json" | ConvertFrom-Json
$version = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode
$date = Get-Date -Format "yyyyMMdd"
$filename = "RegleDeTrois_v${version}_b${versionCode}_${date}.apk"

Write-Host "Building Regle de Trois APK v${version} (build ${versionCode})..." -ForegroundColor Cyan

# Create builds directory if needed
if (!(Test-Path "./builds")) { New-Item -ItemType Directory -Path "./builds" }

# Clean + build
Push-Location ./android
./gradlew clean
./gradlew assembleRelease --no-daemon
Pop-Location

$apkSource = "./android/app/build/outputs/apk/release/app-release.apk"
if (Test-Path $apkSource) {
    Copy-Item $apkSource "./builds/$filename"
    Write-Host "APK copie dans ./builds/$filename" -ForegroundColor Green
    Write-Host "Taille: $([math]::Round((Get-Item "./builds/$filename").Length / 1MB, 2)) MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour installer sur un appareil:" -ForegroundColor Yellow
    Write-Host "  adb install ./builds/$filename" -ForegroundColor Yellow
} else {
    Write-Host "ERREUR: APK non trouve. Verifiez les logs Gradle." -ForegroundColor Red
    exit 1
}

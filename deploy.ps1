# DrishtiAI — One-Command Deploy Script (PowerShell / Windows)
# Usage: .\deploy.ps1

Write-Host "🚀 DrishtiAI Deploy Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check Node
Write-Host "`n✅ Checking Node.js..." -ForegroundColor Green
node --version

# Check npm
Write-Host "✅ Checking npm..." -ForegroundColor Green
npm --version

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if eas-cli is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (!$easInstalled) {
    Write-Host "`n📲 Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

Write-Host "`n🔑 Please login to your Expo account:" -ForegroundColor Cyan
eas login

Write-Host "`n⚙️  Configuring EAS Build..." -ForegroundColor Yellow
eas build:configure

Write-Host "`n🏗️  Building Android preview APK..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes. You'll get a download link when done.`n"
eas build --platform android --profile preview

Write-Host "`n✅ Build complete! Install the APK on your Android device." -ForegroundColor Green
Write-Host "📱 Scan the QR code above with your Android phone to install." -ForegroundColor Green

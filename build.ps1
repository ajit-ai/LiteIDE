# QuantsMind IDE — One-Click Build (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File build.ps1
# Produces: apps/desktop/src-tauri/target/release/bundle/nsis/*.exe + msi/*.msi (Windows)
#           On Linux/macOS/BSD, same script via `pwsh build.ps1` or `bash build.sh` produces AppImage/dmg/binary

Write-Host "QuantsMind IDE — One-Click Build (Windows/Linux/macOS/BSD)" -ForegroundColor Cyan
Write-Host "1. Rust workspace check..." -ForegroundColor Yellow
cargo check --workspace
if ($LASTEXITCODE -ne 0) { Write-Error "cargo check failed — install Visual Studio BuildTools VCTools for link.exe"; exit 1 }

Write-Host "2. Angular build..." -ForegroundColor Yellow
Set-Location apps/desktop
pnpm install
pnpm build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "3. Tauri bundle (all targets for this OS)..." -ForegroundColor Yellow
pnpm tauri build
Write-Host "Done — check apps/desktop/src-tauri/target/release/bundle/" -ForegroundColor Green
Get-ChildItem "src-tauri/target/release/bundle" -Recurse -File -ErrorAction SilentlyContinue | Select-Object FullName | Out-String -Width 800

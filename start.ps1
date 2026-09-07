[CmdletBinding()]
param(
  [switch]$Production,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "apps\backend"
$EnvExample = Join-Path $Backend ".env.example"
$EnvLocal = Join-Path $Backend ".env.local"

function Write-Step([string]$Message) {
  Write-Host "`n[AILO] $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name tidak ditemukan. $InstallHint"
  }
}

Set-Location $Root

Write-Step "Memeriksa Node.js dan npm"
Require-Command "node" "Install Node.js LTS dari https://nodejs.org/ lalu jalankan ulang script ini."
Require-Command "npm" "Install Node.js LTS dari https://nodejs.org/ lalu jalankan ulang script ini."

$NodeVersion = node --version
$NpmVersion = npm --version
Write-Host "Node.js $NodeVersion | npm $NpmVersion"

if (-not (Test-Path $EnvLocal)) {
  if (-not (Test-Path $EnvExample)) {
    throw "Template environment tidak ditemukan di $EnvExample"
  }

  Copy-Item $EnvExample $EnvLocal
  Write-Host "File apps/backend/.env.local dibuat dari .env.example." -ForegroundColor Yellow
  Write-Host "Isi MONGODB_URI sebelum memakai endpoint yang membutuhkan database." -ForegroundColor Yellow
}

if (-not $SkipInstall) {
  Write-Step "Meng-install dependency monorepo"
  npm install
}

if ($Production) {
  Write-Step "Membuat production build"
  npm run build
  Write-Step "Menjalankan production server"
  Write-Host "Backend online di http://localhost:3000"
  npm run start
} else {
  Write-Step "Menjalankan development server"
  Write-Host "Backend online di http://localhost:3000"
  Write-Host "Health check: http://localhost:3000/api/health"
  Write-Host "Tekan Ctrl+C untuk menghentikan server."
  npm run dev
}

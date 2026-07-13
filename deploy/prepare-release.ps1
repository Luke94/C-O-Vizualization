$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $PSScriptRoot "release"

Set-Location $projectRoot

Write-Host "Installing build dependencies..."
npm ci

Write-Host "Building React frontend..."
npm run build

if (Test-Path $releaseRoot) {
  Remove-Item $releaseRoot -Recurse -Force
}

New-Item $releaseRoot -ItemType Directory | Out-Null

$itemsToCopy = @(
  "dist",
  "server",
  "data",
  "logs",
  "package.json",
  "package-lock.json",
  "web.config",
  ".env.example",
  "README.md",
  "DEPLOYMENT.md",
  "MIGRATION_NOTES.md"
)

foreach ($item in $itemsToCopy) {
  Copy-Item (Join-Path $projectRoot $item) $releaseRoot -Recurse -Force
}

Write-Host "Installing production dependencies into release folder..."
npm ci --omit=dev --prefix $releaseRoot

Write-Host "Release prepared at: $releaseRoot"

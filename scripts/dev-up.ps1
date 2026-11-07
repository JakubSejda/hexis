# Brings up the local stack on Windows: Docker Desktop -> MySQL -> migrations.
# Usage: powershell -File scripts/dev-up.ps1   (then `npm run dev`, or preview_start "hexis-dev")
$ErrorActionPreference = 'Stop'

function Test-Docker {
  $j = Start-Job { docker info --format '{{.ServerVersion}}' 2>$null }
  $ok = (Wait-Job $j -Timeout 15) -and ((Receive-Job $j) -match '^\d')
  Stop-Job $j -ErrorAction SilentlyContinue
  return $ok
}

function Start-DockerDesktop {
  Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  for ($i = 0; $i -lt 18; $i++) {
    Start-Sleep 10
    if (Test-Docker) { return $true }
  }
  return $false
}

if (-not (Test-Docker)) {
  Write-Host 'Starting Docker Desktop...'
  if (-not (Start-DockerDesktop)) {
    # Known failure: stale unix-socket files that cannot be deleted block startup. Renaming the folders works.
    Write-Host 'Docker did not start; moving stale socket folders aside and retrying...'
    Get-Process | Where-Object { $_.Name -like '*docker*' } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 3
    $stamp = Get-Date -Format 'yyyyMMddHHmmss'
    foreach ($d in "$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine") {
      if (Test-Path $d) { Rename-Item $d "$(Split-Path $d -Leaf).stale-$stamp" -ErrorAction SilentlyContinue }
    }
    New-Item -ItemType Directory "$env:LOCALAPPDATA\Docker\run" -Force | Out-Null
    if (-not (Start-DockerDesktop)) { throw 'Docker Desktop still not running - check %LOCALAPPDATA%\Docker\log\host\com.docker.backend.exe.log' }
  }
}

Set-Location (Split-Path $PSScriptRoot -Parent)
docker compose up -d mysql
for ($i = 0; $i -lt 30; $i++) {
  if ((docker inspect -f '{{.State.Health.Status}}' hexis-mysql) -eq 'healthy') { break }
  Start-Sleep 3
}
npm run db:migrate
Write-Host 'Ready. Start the app with: npm run dev  (http://localhost:3000)'

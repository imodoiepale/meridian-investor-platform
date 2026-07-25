# Meridian E2E Dry-Run — Windows PowerShell orchestrator
#
# Boots backend (:5001), automations (:5000, HEADFUL), frontend (:3000) in separate
# consoles, then executes the dry-run harness so a viewer can watch the browsers.
#
# No government form is submitted — the harness stops before any final Submit.
#
# Usage:
#   pwsh scripts/run-e2e.ps1
#   pwsh scripts/run-e2e.ps1 -SkipFrontend        # skip Vite dev server
#   pwsh scripts/run-e2e.ps1 -RunHarnessOnly      # assume servers already up
#
param(
    [switch] $SkipFrontend,
    [switch] $RunHarnessOnly,
    [int] $SlowMo = 250
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Start-Server {
    param([string]$Title, [string]$Cwd, [string]$Cmd, [hashtable]$Env)
    Write-Host "▶ Starting $Title …" -ForegroundColor Cyan
    $envAssign = ($Env.GetEnumerator() | ForEach-Object { "`$env:$($_.Key)='$($_.Value)';" }) -join ' '
    $psCmd = "$envAssign Set-Location '$Cwd'; Write-Host '[$Title] $Cmd' -ForegroundColor Green; $Cmd"
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $psCmd -WindowStyle Normal
}

function Wait-Http {
    param([string]$Url, [int]$Seconds = 60, [string]$Label = 'service')
    Write-Host "  · Waiting for $Label at $Url …" -ForegroundColor DarkGray
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { Write-Host "  ✔ $Label up" -ForegroundColor Green; return $true }
        } catch { Start-Sleep -Seconds 2 }
    }
    Write-Host "  ✘ $Label did not respond within $Seconds s" -ForegroundColor Red
    return $false
}

if (-not $RunHarnessOnly) {
    Start-Server -Title 'BACKEND' `
        -Cwd $Root `
        -Cmd 'python run_local.py' `
        -Env @{ MEMORY_BACKEND = 'json' }

    Start-Server -Title 'AUTOMATIONS' `
        -Cwd (Join-Path $Root 'automations') `
        -Cmd 'node server.mjs' `
        -Env @{ HEADLESS = 'false'; AUTO_CLOSE = 'false'; SLOW_MO = "$SlowMo" }

    if (-not $SkipFrontend) {
        Start-Server -Title 'FRONTEND' `
            -Cwd (Join-Path $Root 'frontend') `
            -Cmd 'npm run dev' `
            -Env @{}
    }

    $backendOk    = Wait-Http -Url 'http://localhost:5001/api/agent/tools' -Label 'backend'
    $automationOk = Wait-Http -Url 'http://localhost:5000/health'          -Label 'automations'

    if (-not ($backendOk -and $automationOk)) {
        Write-Host "One or more services failed to start. Fix and rerun." -ForegroundColor Red
        exit 1
    }
    if (-not $SkipFrontend) { Wait-Http -Url 'http://localhost:3000' -Label 'frontend' -Seconds 30 | Out-Null }

    Write-Host "`n▶ All services up. Sleeping 3s so consoles settle …" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

Write-Host "`n▶ Running dry-run harness (headful, no submits) …`n" -ForegroundColor Magenta
Push-Location (Join-Path $Root 'automations')
try {
    $env:HEADLESS = 'false'
    $env:AUTO_CLOSE = 'false'
    $env:SLOW_MO = "$SlowMo"
    node scripts/e2e-dry-run.mjs
} finally {
    Pop-Location
}

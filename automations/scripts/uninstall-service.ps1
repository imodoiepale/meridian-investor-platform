param(
  [switch]$Force,
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

function Log {
  param([string]$Msg)
  if (-not $Quiet) { Write-Host "[uninstall-service] $Msg" }
}

# ---- 1. Confirm ----
if (-not $Force) {
  $confirm = Read-Host "Stop and remove automation-agent from pm2? (y/N) "
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Log "Cancelled"
    exit 0
  }
}

# ---- 2. Stop ----
Log "Stopping automation agent..."
& "pm2" delete automation-agent 2>$null
if ($LASTEXITCODE -ne 0) { Log "(already stopped or not found)" }

# ---- 3. Save ----
Log "Saving pm2 process list..."
& "pm2" save
if ($LASTEXITCODE -ne 0) { Log "(nothing to save)" }

Log "Done. Automation agent removed from pm2."
Log ""
Log "To also uninstall pm2 globally: npm uninstall -g pm2"

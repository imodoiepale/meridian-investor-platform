param(
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

function Log {
  param([string]$Msg)
  if (-not $Quiet) { Write-Host "[update-service] $Msg" }
}

# ---- 1. Pull latest code ----
Log "Pulling latest code from Git..."
& "git" pull
if ($LASTEXITCODE -ne 0) {
  Write-Error "git pull failed. Resolve conflicts or commit changes first."
  exit 1
}
Log "Code updated"

# ---- 2. Install any new dependencies ----
Log "Updating dependencies..."
& "npm" install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
Log "Dependencies updated"

# ---- 3. Restart the agent ----
Log "Restarting automation agent..."
& "pm2" restart ecosystem.config.cjs --cwd (Get-Location)
if ($LASTEXITCODE -ne 0) { Write-Error "pm2 restart failed"; exit 1 }

# ---- 4. Save process list ----
& "pm2" save
if ($LASTEXITCODE -ne 0) { Write-Error "pm2 save failed"; exit 1 }

Log "Update complete! Automation agent is running with the latest code."

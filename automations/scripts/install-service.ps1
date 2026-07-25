param(
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

function Log {
  param([string]$Msg)
  if (-not $Quiet) { Write-Host "[install-service] $Msg" }
}

# ---- 1. Check Node.js ----
$node = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error "Node.js not found. Install from https://nodejs.org (>=18)"
  exit 1
}
Log "Node.js $($node.Version)"

# ---- 2. Install pm2 globally if missing ----
$pm2 = Get-Command "pm2" -ErrorAction SilentlyContinue
if (-not $pm2) {
  Log "Installing pm2 globally..."
  npm install -g pm2
  if ($LASTEXITCODE -ne 0) { Write-Error "pm2 install failed"; exit 1 }
  Log "pm2 installed"
}
else {
  Log "pm2 already installed"
}

# ---- 3. npm install in project ----
Log "Installing project dependencies..."
& "npm" install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }

# ---- 4. Start with pm2 ----
Log "Starting automation agent with pm2..."
& "pm2" start ecosystem.config.cjs --cwd (Get-Location)
if ($LASTEXITCODE -ne 0) { Write-Error "pm2 start failed"; exit 1 }

# ---- 5. Save pm2 process list ----
Log "Saving pm2 process list..."
& "pm2" save
if ($LASTEXITCODE -ne 0) { Write-Error "pm2 save failed"; exit 1 }

# ---- 6. Configure startup on boot ----
# pm2's built-in `startup` command targets systemd/launchd and does not support
# Windows ("Init system not found"). Use the pm2-windows-startup package instead.
Log "Configuring Windows startup..."
$pm2WinStartup = Get-Command "pm2-startup" -ErrorAction SilentlyContinue
if (-not $pm2WinStartup) {
  Log "Installing pm2-windows-startup globally..."
  npm install -g pm2-windows-startup
}
& "pm2-startup" install
if ($LASTEXITCODE -ne 0) {
  Log "Could not configure auto-start. Run manually as Administrator: pm2-startup install"
}

Log "Done! Automation agent is running and will restart on boot."
Log ""
Log "Useful commands:"
Log "  npm run pm2:status   - check status"
Log "  npm run pm2:logs     - view live logs"
Log "  npm run pm2:restart  - restart (after update)"
Log "  npm run pm2:stop     - stop the agent"

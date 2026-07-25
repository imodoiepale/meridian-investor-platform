#!/usr/bin/env bash
# Meridian E2E Dry-Run — Bash orchestrator
#
# Boots backend, automations (HEADFUL), frontend, then runs the dry-run harness.
# Kills the child servers on Ctrl-C.
#
# Usage:
#   bash scripts/run-e2e.sh
#   SKIP_FRONTEND=1 bash scripts/run-e2e.sh
#   HARNESS_ONLY=1 bash scripts/run-e2e.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLOW_MO="${SLOW_MO:-250}"
PIDS=()

cleanup() {
  echo ""
  echo "▶ Cleaning up child processes …"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

wait_http() {
  local url="$1" label="$2" seconds="${3:-60}"
  echo "  · Waiting for $label at $url …"
  local end=$(( $(date +%s) + seconds ))
  while (( $(date +%s) < end )); do
    if curl -fsS -m 3 "$url" >/dev/null 2>&1; then
      echo "  ✔ $label up"
      return 0
    fi
    sleep 2
  done
  echo "  ✘ $label did not respond within ${seconds}s"
  return 1
}

if [[ -z "${HARNESS_ONLY:-}" ]]; then
  echo "▶ Starting backend on :5001 …"
  ( cd "$ROOT" && MEMORY_BACKEND=json python run_local.py ) &
  PIDS+=($!)

  echo "▶ Starting automations on :5000 (headful) …"
  ( cd "$ROOT/automations" && HEADLESS=false AUTO_CLOSE=false SLOW_MO="$SLOW_MO" node server.mjs ) &
  PIDS+=($!)

  if [[ -z "${SKIP_FRONTEND:-}" ]]; then
    echo "▶ Starting frontend on :3000 …"
    ( cd "$ROOT/frontend" && npm run dev ) &
    PIDS+=($!)
  fi

  wait_http 'http://localhost:5001/api/agent/tools' 'backend'
  wait_http 'http://localhost:5000/health'          'automations'
  if [[ -z "${SKIP_FRONTEND:-}" ]]; then
    wait_http 'http://localhost:3000' 'frontend' 30 || true
  fi

  echo ""
  echo "▶ All services up. Sleeping 3s so consoles settle …"
  sleep 3
fi

echo ""
echo "▶ Running dry-run harness (headful, no submits) …"
echo ""
cd "$ROOT/automations"
HEADLESS=false AUTO_CLOSE=false SLOW_MO="$SLOW_MO" node scripts/e2e-dry-run.mjs

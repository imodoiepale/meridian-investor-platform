#!/usr/bin/env bash
set -e

# ── Preflight ─────────────────────────────────────────────────────────────────
echo "=== Meridian Railway Deployment ==="
command -v railway >/dev/null 2>&1 || { echo "ERROR: railway CLI not found. Install: npm i -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { echo "ERROR: not logged in. Run: railway login"; exit 1; }

# ── Load .env if present ──────────────────────────────────────────────────────
if [ -f .env ]; then
  set -a; source .env; set +a
fi

# ── Prompt for required keys ──────────────────────────────────────────────────
if [ -z "$ANTHROPIC_API_KEY" ]; then
  read -rp "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
fi

# ── Init project ──────────────────────────────────────────────────────────────
echo "Initialising Railway project..."
railway init --name meridian-investor-platform 2>/dev/null || true

# ── Create services ───────────────────────────────────────────────────────────
echo "Creating services..."
railway service create backend  2>/dev/null || true
railway service create automations 2>/dev/null || true
railway service create frontend 2>/dev/null || true

# ── Set variables per service ─────────────────────────────────────────────────
echo "Setting environment variables..."

railway variables set --service backend \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  QDRANT_MODE=memory \
  MEMORY_BACKEND=json \
  AUTOMATIONS_URL='https://${{automations.RAILWAY_PUBLIC_DOMAIN}}' \
  ${OPENAI_API_KEY:+OPENAI_API_KEY="$OPENAI_API_KEY"} \
  ${GEMINI_API_KEY:+GEMINI_API_KEY="$GEMINI_API_KEY"} \
  ${RESEND_API_KEY:+RESEND_API_KEY="$RESEND_API_KEY"} \
  ${NEXT_PUBLIC_SUPABASE_URL:+NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"} \
  ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"} \
  ${SUPABASE_SERVICE_ROLE_KEY:+SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"} 2>/dev/null || true

railway variables set --service automations \
  HEADLESS=true \
  AUTO_CLOSE=true \
  SLOW_MO=0 \
  ${EFNS_EMAIL:+EFNS_EMAIL="$EFNS_EMAIL"} \
  ${EFNS_ID_NUMBER:+EFNS_ID_NUMBER="$EFNS_ID_NUMBER"} \
  ${EFNS_PASSWORD:+EFNS_PASSWORD="$EFNS_PASSWORD"} \
  ${NEXT_PUBLIC_SUPABASE_URL:+NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"} \
  ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"} \
  ${SUPABASE_SERVICE_ROLE_KEY:+SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"} \
  ${RESEND_API_KEY:+RESEND_API_KEY="$RESEND_API_KEY"} 2>/dev/null || true

railway variables set --service frontend \
  VITE_API_BASE_URL='https://${{backend.RAILWAY_PUBLIC_DOMAIN}}' 2>/dev/null || true

# ── Generate domains ──────────────────────────────────────────────────────────
echo "Generating public domains..."
railway domain --service backend  2>/dev/null || true
railway domain --service automations 2>/dev/null || true
railway domain --service frontend 2>/dev/null || true

# ── Deploy in order ───────────────────────────────────────────────────────────
echo ""
echo "Deploying backend (root context)..."
railway up --service backend

echo "Deploying automations..."
(cd automations && railway up --service automations)

echo "Deploying frontend..."
(cd frontend && railway up --service frontend)

# ── Print URLs ────────────────────────────────────────────────────────────────
echo ""
echo "=== Deployment complete ==="
echo "Backend:     https://$(railway variables get RAILWAY_PUBLIC_DOMAIN --service backend 2>/dev/null || echo '<check Railway dashboard>')"
echo "Automations: https://$(railway variables get RAILWAY_PUBLIC_DOMAIN --service automations 2>/dev/null || echo '<check Railway dashboard>')"
echo "Frontend:    https://$(railway variables get RAILWAY_PUBLIC_DOMAIN --service frontend 2>/dev/null || echo '<check Railway dashboard>')"
echo ""
echo "Next steps: Run supabase migrations — see docs/SUPABASE.md"

# Deploying Meridian to Railway

## Prerequisites

- A [Railway](https://railway.app) account
- Railway CLI installed: `npm i -g @railway/cli`
- Logged in: `railway login`
- (Optional) Supabase project for persistent storage — see [SUPABASE.md](SUPABASE.md)

---

## One-click deploy

From the repo root:

```bash
bash scripts/deploy_railway.sh
```

The script will:
1. Check for the Railway CLI and that you are logged in
2. Load `.env` if present (so pre-set variables are picked up automatically)
3. Prompt for `ANTHROPIC_API_KEY` if not set
4. Create the Railway project and three services (`backend`, `automations`, `frontend`)
5. Set all environment variables per service
6. Generate public domains for each service
7. Deploy all three services in dependency order

---

## Manual dashboard setup (fallback)

If you prefer the Railway dashboard UI:

1. Go to [railway.app/new](https://railway.app/new) and create a project named `meridian-investor-platform`.
2. Add three services and configure their root directories:

| Service | Root directory | Dockerfile |
|---|---|---|
| backend | `/` (repo root) | `Dockerfile.backend` |
| automations | `/automations` | `Dockerfile` (auto-detected) |
| frontend | `/frontend` | `Dockerfile` (auto-detected) |

3. Set the environment variables listed in the table below for each service.
4. Click **Deploy** on each service.

---

## Environment variables

| Variable | Service | Required | Description |
|---|---|---|---|
| ANTHROPIC_API_KEY | backend | Yes | Claude API key from [console.anthropic.com](https://console.anthropic.com) |
| EFNS_EMAIL | automations | Demo | eFNS portal login email |
| EFNS_ID_NUMBER | automations | Demo | eFNS portal ID/Alien number |
| EFNS_PASSWORD | automations | Demo | eFNS portal password |
| AUTOMATIONS_URL | backend | Auto | Set to automations service URL (auto-set by deploy script) |
| RESEND_API_KEY | backend, automations | Optional | Email invoice delivery via Resend |
| HEADLESS | automations | Auto | `true` in production (auto-set by deploy script) |
| VITE_API_BASE_URL | frontend | Auto | Backend public URL (auto-set by deploy script) |
| NEXT_PUBLIC_SUPABASE_URL | backend, automations | Optional | From [supabase.com](https://supabase.com) dashboard |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | backend, automations | Optional | From supabase.com dashboard |
| SUPABASE_SERVICE_ROLE_KEY | backend, automations | Optional | From supabase.com dashboard — keep secret, never expose to frontend |
| OPENAI_API_KEY | backend | Optional | If using OpenAI models alongside Claude |
| GEMINI_API_KEY | backend | Optional | If using Gemini models |
| QDRANT_MODE | backend | Auto | `memory` (default, set by Dockerfile) |
| MEMORY_BACKEND | backend | Auto | `json` (default) or `supabase` for persistent profiles |

---

## Ephemeral storage note

Railway does not persist files between deploys. Investor profile JSON files stored on disk (the default `MEMORY_BACKEND=json` mode) **will reset on every redeploy**.

To persist investor profiles across deploys:

1. Set up a Supabase project — see [SUPABASE.md](SUPABASE.md)
2. Set `MEMORY_BACKEND=supabase` on the `backend` service
3. Set the three Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) on both `backend` and `automations`

---

## Post-deploy checklist

- [ ] Backend `/health` endpoint returns 200
- [ ] Automations `/health` endpoint returns 200
- [ ] Frontend loads and can reach the backend API
- [ ] (If using Supabase) Run migrations — see [SUPABASE.md](SUPABASE.md)

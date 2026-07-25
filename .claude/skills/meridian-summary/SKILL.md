---
name: meridian-summary
description: Summarize the Meridian Investor OS platform — architecture, agentic harness, deployment, and current status. Invoke when a new session needs quick orientation to the codebase or when asked "what is this project" / "give me a project overview".
---

# Meridian Investor OS — Project Summary

**Meridian** is a Global Investor Operating System that helps foreign investors **Land → Launch → Live** in Kenya (and, via the country-adapter pattern, any other country). It combines a Claude API agentic harness with real government-portal automation, MiroFish-style multi-agent research, and an Apple-polished Vue frontend.

## Read these first (in order)

1. `README.md` — hero, feature matrix, Mermaid architecture diagrams, quick start
2. `docs/PRP.md` — Problem/Solution/Personas/Roadmap (v2.0)
3. `backend/agent/tools.py` — the 11 Claude tools that power the agentic loop
4. `backend/routes/agent_chat.py` — `/api/agent/chat` endpoint (main entry)
5. `frontend/src/views/ConciergeView.vue` — the chat UI
6. `frontend/src/views/ProfileWizard.vue` — 5-step profile onboarding
7. `automations/server.mjs` — Playwright automations microservice (23 endpoints)
8. `docs/DEPLOY_RAILWAY.md` — 3-service Railway deployment

## Architecture at a glance

```
┌───────────────┐   HTTPS    ┌─────────────────┐   HTTPS   ┌────────────────┐
│  Vue 3 + Vite │ ─────────▶ │  Flask backend  │ ────────▶ │ Node/Playwright│
│   (Caddy)     │            │  (:5001)        │           │ automations    │
│   port 3000   │            │                 │           │   (:5000)      │
└───────┬───────┘            └────────┬────────┘           └────────┬───────┘
        │                             │                              │
        │                             ▼                              ▼
        │                    ┌────────────────┐            ┌──────────────────┐
        │                    │  Claude API    │            │  Kenya eFNS,     │
        │                    │  (Sonnet 4.6)  │            │  BRS, NSSF, SHA  │
        │                    │  + web_search  │            │  gov portals     │
        │                    └────────────────┘            └──────────────────┘
        │
        ▼
┌───────────────────┐
│  Supabase Postgres│
│  investor_sessions│
│  automation_jobs  │
│  worker_heartbeats│
└───────────────────┘
```

## Claude agentic harness (11 tools)

Located in `backend/agent/tools.py`, wired through `backend/agent/harness.py`:

- `find_flights` — curated dataset + Scrapling web fallback
- `apply_eta` / `apply_immigration` — dispatches Playwright to eFNS live portal (Class G, Class D, PR)
- `check_application_readiness` — validates profile completeness before form-fill
- `build_licensing_roadmap` — deterministic phase-column roadmap from `kenya.json`
- `market_gap_research` — Claude + `web_search_20250305` tool, Qdrant-cached
- `generate_job_descriptions` — sector-templated JDs with local salary bands
- `list_agents_marketplace` — vetted local advisors
- `find_national_parks` / `book_safari_trip` — tourism module
- `update_investor_profile` — writes to `MemoryStore` / Supabase `investor_sessions`

## Directory map

- `backend/` — Flask app. Blueprints in `routes/`. Agent code in `agent/`. Country JSONs in `data/countries/`. Vector store in `vector_db/`.
- `frontend/` — Vue 3 + Vite + Composition API. Router in `src/router/index.js`. Apple-design skills live in `.claude/skills/apple-design`.
- `automations/` — Node/Playwright microservice. Scripts per government portal in `scripts/`. Supabase migrations in `supabase/migrations/`.
- `supabase/migrations/` — consolidated schema (automation_jobs + worker_heartbeats + investor_sessions).
- `scripts/deploy_railway.sh` — one-shot Railway deploy.
- `docs/` — PRP, DEPLOY_RAILWAY, SUPABASE, PROBLEMS, SPEC, DEMO, CREDITS.

## Country-adapter pattern

Every country is one JSON file in `backend/data/countries/{country}.json`. `kenya.json` defines FX rate, agencies, licensing steps per sector, county metadata, market gaps, immigration classes. To add a new country: drop a JSON and set `country: "xx"` on the chat endpoint. No code changes.

## Current status (as of 2026-07-25)

**Shipped (Phase 1 + 2):**
- Claude tool-use harness with prompt caching + 11 tools
- ConciergeView with Apple polish (`msg-in` animations, translucent chrome, focus-visible)
- 23 automation endpoints (eTA, Class G/D immigration, BRS, NSSF, SHA)
- 5-step ProfileWizard with trickle-research on sector+county
- InvestorDashboard with journey/applications/roadmap tabs
- Dual roadmap views: SVG tree (`RoadmapView.vue`) + step-by-step (`StageTimeline.vue`)
- Field-map translator (`backend/agent/field_map.py`) — profile → eFNS 40-field formData
- Railway 3-service deploy pack (`Dockerfile.backend`, `frontend/Dockerfile`, `automations/Dockerfile`, `scripts/deploy_railway.sh`)
- Real Supabase project `habbcaxtqqiuvryakmot` wired; migration applied
- Deployed at github.com/imodoiepale/meridian-investor-platform

**In progress:**
- Supabase Auth login (magic link)
- Claude Code official skills (security-guidance, frontend-design plugins)

**Not yet:**
- CI/CD (GitHub Actions)
- Second country (Uganda/Rwanda) as proof of adapter pattern

## Run locally

```bash
# Backend
python run_local.py                              # :5001

# Automations
cd automations && npm i && node server.mjs       # :5000

# Frontend
cd frontend && npm i && npm run dev              # :3000
```

## Team

James Epale, Timothy Kipkoech, Joseph Kerandi, Millicent Morara — for the **Claude Hackathon** by Claude Community Kenya (CCK).

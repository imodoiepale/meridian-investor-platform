# Meridian Global Investor OS — Technical Specification

## 1. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND — Vue 3 + Vite + Tailwind                       :5173      │
│  Views: Onboarding · Flights · Immigration · Launch (BRS/Licensing/  │
│  Hiring) · Tourism (KWS) · Agents Marketplace · AgentChat (SSE)      │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ REST + SSE
┌───────────────────────────▼──────────────────────────────────────────┐
│  BACKEND — Flask                                          :5001      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Claude Agentic Harness (agent/orchestrator.py)                 │  │
│  │ claude-sonnet-4-6 · tool-use loop · prompt caching · 12 tools  │  │
│  └───┬──────────────┬──────────────┬─────────────────┬────────────┘  │
│      │              │              │                 │               │
│  countries/     flights/       research_agent/   agent/memory.py     │
│  kenya.json     scrapling →    (Claude web       MemoryStore         │
│  (adapter)      curated JSON   search + Qdrant)  (Graphiti seam)     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTP (job start / progress / stop)
┌──────────────────────────▼───────────────────────────────────────────┐
│  AUTOMATIONS — Node + Express + Playwright (stealth)      :5000      │
│  eta-kenya · class-b/d/g/r/n · special-pass · download-permit        │
│  brs.js (eCitizen) · nssf.mjs + captcha-solver (Tesseract) · sha.mjs │
│  Headed mode (HEADLESS=false) for live demo · async job tracking     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ real browsers
        ┌──────────┬───────┴────┬──────────┬──────────┐
        │ eTA/eFNS │ eCitizen   │  NSSF    │   SHA    │   (gov portals)
        └──────────┴────────────┴──────────┴──────────┘
```

## 2. Claude Agentic Harness

`backend/agent/orchestrator.py` — Anthropic SDK, model **`claude-sonnet-4-6`**.

- **Tool-use loop**: user message → Claude → `tool_use` blocks → local/HTTP execution → `tool_result` → repeat until final text. Streamed to the UI via SSE (`/api/agent/chat`).
- **Prompt caching**: `cache_control` breakpoints on the system prompt and the 12 tool definitions (both static per session) — near-free multi-turn conversations.
- **Country-agnostic**: every tool receives `country` and reads facts from the adapter; the harness contains no Kenya logic.

### 2.1 Tool Schemas (12)

| Tool | Input (JSON schema, abbreviated) | Behavior |
|---|---|---|
| `search_flights` | `{origin, destination, depart_date, return_date?, trip_type: "one_way"\|"return"}` | Provider chain (§5); returns offers `[{airline, price_usd, depart, arrive, stops, layovers[]}]` |
| `advise_immigration_class` | `{nationality, purpose, capital_usd, duration_months, employer?}` | Reasons over adapter `permit_classes`; returns recommended class (B/D/G/R/N/Special Pass), eligibility, documents, itemized fees, formal proposal text |
| `apply_eta` | `{applicant: {passport_no, nationality, dob, arrival_date, ...}}` | POST → automations `/api/eta`; streams job progress |
| `apply_permit` | `{class: "B"\|"D"\|"G"\|"R"\|"N"\|"special_pass", applicant, documents[]}` | POST → automations `/api/permit/:class`; live headed eFNS fill; stops before submit in demo mode |
| `build_licensing_roadmap` | `{industry, county, business_type}` | Adapter `licenses` matrix → ordered steps `{agency, license, fee_kes, timeline_days}` + **total budget** |
| `market_gap_research` | `{sector, county?}` | Claude web-search tool; results cached in Qdrant (memory mode) |
| `register_business` | `{company_name, entity_type, directors[], shareholding[]}` | POST → automations `/api/brs` (eCitizen BRS) |
| `register_nssf` | `{employer_name, kra_pin, contact}` | POST → automations `/api/nssf` (incl. Tesseract captcha solve) |
| `register_sha` | `{employer_name, kra_pin, contact}` | POST → automations `/api/sha` |
| `generate_jds` | `{roles[], industry, county, salary_band?}` | Kenya-compliant JDs (statutory deductions, labor-law clauses) |
| `list_agents` | `{specialty?, county?}` | Curated marketplace JSON: lawyers, immigration agents, accountants |
| `book_park` | `{park, package, date, pax, email}` | Books from 6-park dataset (KES pricing); HTML invoice emailed via Resend if `RESEND_API_KEY`, else saved + rendered in UI |

## 3. REST Endpoints

### Backend (Flask :5001)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/agent/chat` | SSE-streamed Claude tool-use conversation |
| GET | `/api/flights/search` | Direct flight search (provider chain) |
| POST | `/api/immigration/advise` | Class advisor + proposal |
| POST | `/api/immigration/apply` | Proxy → automations, returns `job_id` |
| GET | `/api/jobs/:id` | Poll automation job progress |
| POST | `/api/launch/roadmap` | Licensing roadmap + fee budget |
| POST | `/api/launch/research` | Market-gap research (cached) |
| POST | `/api/launch/register/{brs,nssf,sha}` | Registration proxies |
| POST | `/api/launch/jds` | JD generation |
| GET | `/api/agents` | Marketplace listing |
| POST | `/api/tourism/book` | Park booking + invoice |
| GET/PUT | `/api/profile` | Investor profile (MemoryStore) |

### Automations (Express :5000)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/eta`, `/api/permit/:class`, `/api/brs`, `/api/nssf`, `/api/sha` | Start Playwright job → `{job_id}` |
| GET | `/api/jobs/:id` | `{status, step, screenshot?, log[]}` (async job-tracking pattern) |
| POST | `/api/jobs/:id/stop` | Halt before submit (demo safety) |

## 4. Country-Adapter Contract (`backend/countries/<iso>.json`)

```jsonc
{
  "iso": "KE", "name": "Kenya", "currency": "KES",
  "agencies": [{ "id": "efns", "name": "eFNS Immigration", "portal": "https://fns.immigration.go.ke" }],
  "permit_classes": [{
    "code": "G", "name": "Investor / Trade",
    "eligibility": ["min capital USD 100,000", "..."],
    "documents": ["passport", "bank statement", "..."],
    "fees": [{ "item": "Processing", "kes": 10000 }, { "item": "Issuance", "kes": 100000 }],
    "automation": "permit/class-g"          // → automations script id
  }],
  "licenses": [{
    "industry": "agri-processing", "county": "machakos",
    "steps": [{ "agency": "county", "license": "Single Business Permit", "fee_kes": 15000, "timeline_days": 7 }]
  }],
  "employer_registrations": ["nssf", "sha"],
  "tourism": { "parks": [ /* 6-park dataset, KES pricing */ ] }
}
```

**Contract rule:** tools may only read country facts from the adapter. New country = new JSON + automation scripts; zero core changes.

## 5. Flights Provider Chain

1. **Scrapling live provider** (`backend/flights/scrapling_provider.py`) — stealth-fetches Google Flights; 5s timeout.
2. **Curated fallback** (`backend/data/flights_kenya.json`) — realistic one-way/return offers into NBO/MBA (airlines, prices, layovers).

Any exception or timeout in (1) silently falls through to (2). Response is tagged `"source": "live" | "curated"`. **Search never fails during a demo.**

## 6. MemoryStore & the Graphiti Seam

`backend/agent/memory.py`:

```python
class MemoryStore(Protocol):
    def get_profile(self, investor_id) -> dict: ...
    def save_profile(self, investor_id, profile: dict) -> None: ...
    def add_event(self, investor_id, event: dict) -> None: ...      # journey timeline
    def search(self, investor_id, query: str) -> list[dict]: ...   # semantic recall
```

- **Default impl**: `JsonMemoryStore` (profile JSON on disk) + Qdrant in-memory cache (`QDRANT_MODE=memory`) for research recall. Zero infrastructure.
- **Graphiti drop-in seam**: `GraphitiMemoryStore` implements the same protocol backed by Graphiti's temporal knowledge graph (Neo4j or FalkorDB). `add_event` → graph episodes; `search` → hybrid graph retrieval. Selected via `MEMORY_BACKEND=json|graphiti` — no call-site changes anywhere in the harness.

## 7. Environment Variables

| Var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude harness, research, vision OCR |
| `EFNS_EMAIL` / `EFNS_ID_NUMBER` / `EFNS_PASSWORD` | For live demo | eFNS portal login for permit/eTA automations |
| `HEADLESS` | No (default `false` in demo) | `false` = visible browser (the wow moment) |
| `RESEND_API_KEY` | Optional | Emails booking invoices; else invoice saved locally + shown |

No credentials are hardcoded anywhere; all secrets flow from `.env` (see `.env.example`).

## 8. Runbook

```bash
python run_local.py            # Flask backend  :5001
node automations/server.mjs    # Playwright svc :5000
cd frontend && npm run dev     # Vue app        :5173
```

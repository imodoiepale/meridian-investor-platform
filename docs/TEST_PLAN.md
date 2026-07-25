# Meridian Investor OS — Test Plan

Every service in the platform has a **unit surface**, an **integration surface**, and (for portal automations) an **end-to-end surface**. The matrix below tells you what runs where and what evidence to capture.

## 1. Unit tests

Run with:

```bash
python -m pytest backend/tests -v
```

Coverage:

| File                                          | Tests                                                            |
|-----------------------------------------------|------------------------------------------------------------------|
| `backend/tests/test_country_adapter.py`       | Kenya adapter loads; KRA wired; every immigration class has an endpoint |
| `backend/tests/test_tools_schema.py`          | 10+ Claude tools well-formed; KRA registrations declared; immigration classes declared |
| `backend/tests/test_research_cache_hash.py`   | Cache key deterministic across param order; kind namespaced      |

## 2. Integration smoke (services running)

```bash
python run_local.py                      # :5001
node automations/server.mjs              # :5000
cd frontend && npm run dev               # :3000
```

| Check                                                                        | Expect                                            |
|------------------------------------------------------------------------------|---------------------------------------------------|
| `GET :5001/health`                                                           | `200 {"ok":true}`                                 |
| `GET :5001/api/agent/tools`                                                  | JSON list of 10+ tools including `run_registration_automation` |
| `POST :5001/api/agent/trickle-research` `{sector:"agritech",country:"kenya"}` | Roadmap + market gaps in < 10 s                   |
| `GET :5000/health`                                                           | `200` from automations                            |
| `curl :5001/api/invest/roadmap -d '{sector:"fintech",county:"Nairobi"}'`     | Multi-step roadmap JSON                           |

## 3. Portal automation E2E (headed Playwright)

### One-shot dry-run harness

```powershell
pwsh scripts/run-e2e.ps1              # Windows — boots all 3 servers + runs harness
```
```bash
bash scripts/run-e2e.sh               # Linux/macOS
```

The harness (`automations/scripts/e2e-dry-run.mjs`) exercises every automation endpoint with sample data from `e2e-sample-data.mjs`, watches the Playwright browsers step through the portals, and writes a per-run summary to `automations/scripts/e2e-report-<ISO>.json`. Every flow stops **before** the final Submit — no government form is submitted.

Sample credentials come from the reference PAYE nil-return code (`document-trainer-and-many-more/KRA Dupe/…`); only the KRA logins are real (login-only, no filings).

### Per-endpoint manual runs

Set `HEADLESS=false AUTO_CLOSE=false` and run these one at a time — a real browser opens. **Only click Submit on staging portals or with authorised credentials.**

| Endpoint                            | What runs                                | Evidence                                          |
|-------------------------------------|------------------------------------------|---------------------------------------------------|
| `POST /api/permit/eta-kenya`        | eTA browser fills form                   | Screenshot in `~/Downloads/eta-evidence/`         |
| `POST /api/permit/class-g`          | eFNS Class G — 40 fields                 | Screenshot in `~/Downloads/efns-evidence/`        |
| `POST /api/brs`                     | BRS/eCitizen company retrieval           | Screenshot in `~/Downloads/brs-evidence/`         |
| `POST /api/nssf` / `POST /api/sha`  | Employer enrolment                       | Screenshot in `~/Downloads/{nssf,sha}-evidence/`  |
| `POST /api/kra/register-pin`        | iTax PIN registration                    | Screenshot in `~/Downloads/kra-evidence/`         |
| `POST /api/kra/file-nil-return`     | Annual nil return                        | Screenshot in `~/Downloads/kra-evidence/`         |

## 4. Frontend flows

Walk each in dev mode:

1. **/login** → magic-link OTP → redirects to `/dashboard` after auth
2. **/profile** → 5-step wizard → each step-forward persists via `POST /api/agent/profile`
3. **/dashboard** → journey timeline + apps list + roadmap tab; **live logs strip** appears when a job runs (Supabase Realtime channel `dashboard-live`)
4. **/concierge** → Claude tool-use chat → structured roadmap render
5. **/invest/roadmap** → tree view / step-by-step tabs

## 5. Data-safety checks

- Confirm `.env` is git-ignored (`git check-ignore .env`)
- Confirm no `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` in commits (`git log --all -S SERVICE_ROLE_KEY`)
- Confirm all mutating tables have RLS enabled (`select table_name, rowsecurity from pg_tables where schemaname='public'`)

## 6. Regression backlog (add before shipping)

- Playwright test that logs a synthetic `automation_jobs` INSERT and confirms the dashboard **live logs** strip renders it (Supabase Realtime).
- Field-map contract test: `profile_to_class_g({minimal profile})` returns the same 40-key shape the class-g script consumes.

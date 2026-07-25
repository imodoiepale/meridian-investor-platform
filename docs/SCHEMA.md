# Supabase schema — Meridian Investor OS

The schema is applied by two migrations. Rerunning is safe (all `CREATE TABLE IF NOT EXISTS`, all `DROP POLICY IF EXISTS` before recreate, Realtime `ALTER PUBLICATION ADD TABLE` wrapped in `DO/EXCEPTION`).

| Migration | Purpose |
|-----------|---------|
| `001_automation_jobs.sql` | `automation_jobs`, `worker_heartbeats`, `investor_sessions` — the automation runtime + session store. |
| `002_production_schema.sql` | Users, profiles, notes, research cache, job logs, documents. RLS + Realtime + triggers. |

## Tables

### 1. `users` — mirror of `auth.users`

A `handle_new_user()` trigger (SECURITY DEFINER) fires on every `auth.users` insert and copies id/email/full_name into `public.users`. This is what the frontend joins against.

| Column         | Type          | Notes                                     |
|----------------|---------------|-------------------------------------------|
| `id`           | uuid pk       | FK to `auth.users(id)` on delete cascade  |
| `email`        | text unique   |                                           |
| `full_name`    | text          |                                           |
| `role`         | text          | `investor` \| `agent` \| `admin`          |
| `avatar_url`   | text          |                                           |
| `phone`        | text          |                                           |
| `nationality`  | text          |                                           |
| `onboarded_at` | timestamptz   | when profile wizard was completed         |
| `last_seen_at` | timestamptz   | updated on user activity                  |

### 2. `investor_profiles` — the 40-field investor record

Rich per-user profile that maps 1:1 to the eFNS Class G form via `backend/agent/field_map.py`. Bio fields (surname, other_names, gender, dob, passport dates, immigration status, address hierarchy) plus business intent (sector, county, capital_usd, company_name, timeline). JSONB `dependants`, `previous_permits`, and `raw` for extension.

RLS: `profiles_owner` — `auth.uid() = user_id` for all operations.

### 3. `investor_sessions` (extended)

Legacy session store, extended with `user_id`, `country`, `last_activity`. Powers Meridian's `MemoryStore` when `MEMORY_BACKEND=supabase`.

### 4. `automation_jobs` (extended)

Every browser-automation run gets a row. Extended with `user_id` + `session_id` so the dashboard can filter by session. Live status via Supabase Realtime channel.

### 5. `notes`

Free-form notes attached to a session, job, profile step, or general. `tags text[]` + `pinned bool`.

### 6. `research_cache` — the shared brain

This is the token-saving table. Every deep-research call (`market_gap_research`, `build_licensing_roadmap`, `flights`, deep seed pack) hashes its params into `query_hash` (sha256 of sorted-JSON kind + params) and looks up here first. Hits increment `hit_count`; misses insert a row with a 30-day `expires_at`.

Cache is shared across all authenticated users (`research_read` policy: `USING (true)` for SELECT). Writes go via service role from the Flask backend.

**Cache-key implementation**: `backend/research_agent/claude_researcher.py::ClaudeResearchAgent._hash_key(kind, params)`.

### 7. `job_logs`

Append-only debug/info/warn/error trace per automation run. `level` enum enforced by CHECK constraint. Wired into Supabase Realtime for the dashboard's live-log strip.

### 8. `documents`

Passports, JDs, invoices, screenshots. `kind` enum, `storage_path` points at Supabase Storage.

## RLS policies

| Table | Policy | Rule |
|-------|--------|------|
| `users` | `users_select` | anyone signed in can read (needed for @mentions) |
| `users` | `users_update` | `auth.uid() = id` |
| `investor_profiles` | `profiles_owner` | `auth.uid() = user_id` for ALL |
| `notes` | `notes_owner` | `auth.uid() = user_id` for ALL |
| `research_cache` | `research_read` | anyone signed in can read (shared brain); writes via service role |
| `job_logs` | `job_logs_visible` | visible if the parent job is yours (or unowned/legacy) |
| `documents` | `docs_owner` | `auth.uid() = user_id` for ALL |

## Realtime publication

Tables published to `supabase_realtime`:

- `automation_jobs` — dashboard app status updates
- `job_logs` — live log strip
- `notes` — collab editing
- `investor_sessions` — cross-tab sync

## Storage buckets (optional)

Uncomment section 12 of `002_production_schema.sql` to create `passports`, `evidence` (private), and `avatars` (public).

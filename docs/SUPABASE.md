# Supabase Setup for Meridian

Supabase provides persistent storage for automation job queues and investor profiles.
Without it, the automations worker queue is in-memory only, and investor profiles stored
as JSON files on Railway will reset on every redeploy.

**Your project:** https://supabase.com/dashboard/project/habbcaxtqqiuvryakmot

---

## 1. Create a Supabase project (if you haven't already)

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a region close to your Railway deployment.
3. Save the database password — you'll need it if you use the CLI.

---

## 2. Run the migration

You only need to run one file: `supabase/migrations/001_automation_jobs.sql`

### Option A — Supabase CLI (recommended)

```bash
# Link to your project (run once)
supabase link --project-ref habbcaxtqqiuvryakmot

# Push all migrations
supabase db push
```

Install the CLI if needed: `npm i -g supabase` or see [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli).

### Option B — SQL editor (no CLI needed)

1. Open [supabase.com/dashboard/project/habbcaxtqqiuvryakmot/sql/new](https://supabase.com/dashboard/project/habbcaxtqqiuvryakmot/sql/new)
2. Paste the full contents of `supabase/migrations/001_automation_jobs.sql`
3. Click **Run**

---

## 3. Get your API keys

In the Supabase dashboard, go to **Project Settings → API**:

| Key | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" field |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon / public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (keep secret) |

---

## 4. Add keys to Railway services

Set these variables in the Railway dashboard (or via `railway variables set`):

| Variable | backend | automations | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Project URL from Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | anon/public key — safe to expose to frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes | Service role key — **never** expose to the browser |

> The automations service reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> (not a bare `SUPABASE_URL`) — use the exact variable names above.

To enable persistent investor profiles on the backend, also set:

```
MEMORY_BACKEND=supabase
```

on the `backend` Railway service. The default is `json` (ephemeral, resets on redeploy).

---

## 5. Tables created by the migration

| Table | Purpose |
|---|---|
| `automation_jobs` | Job queue for Playwright automation runs |
| `worker_heartbeats` | Tracks which worker nodes are alive |
| `investor_sessions` | Persistent investor profile + journey state |

All tables have Row Level Security enabled with permissive `USING (true)` policies.
The service-role key bypasses RLS entirely, so keep it server-side only.

---

## Optional: enable Realtime

To stream live job-progress updates to the frontend, run in the SQL editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_jobs;
```

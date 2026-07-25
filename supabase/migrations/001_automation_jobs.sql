-- Consolidated migration: automation_jobs, worker_heartbeats, investor_sessions
-- Run this in the Supabase SQL editor (supabase.com/dashboard/project/habbcaxtqqiuvryakmot)
-- or via: supabase db push

-- ── 1. automation_jobs ────────────────────────────────────────────────────────
-- Columns consolidated from:
--   automations/supabase/migrations/001_automation_jobs.sql
--   automations/supabase/migrations/003_add_job_audit_columns.sql

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'claiming', 'running', 'completed', 'failed')),
  data            JSONB       DEFAULT '{}'::jsonb,
  evidence        JSONB       DEFAULT '[]'::jsonb,
  context         JSONB       DEFAULT '{}'::jsonb,
  -- context shape: { task_id, automation_id, ran_by_user_id, ran_by_name, ran_by_email }
  progress        INTEGER     DEFAULT 0,
  current_step    TEXT,
  message         TEXT,
  logs            JSONB       DEFAULT '[]'::jsonb,
  result          JSONB       DEFAULT '{}'::jsonb,
  error           TEXT,
  retry_count     INTEGER     DEFAULT 0,
  retry_count_max INTEGER     DEFAULT 3,
  worker_id       TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status
  ON public.automation_jobs (status);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_type
  ON public.automation_jobs (type);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_created
  ON public.automation_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_context_task_automation
  ON public.automation_jobs ((context ->> 'task_id'), (context ->> 'automation_id'), created_at DESC);

-- RLS
-- NOTE: policies use USING (true) so service-role and authenticated users can manage all rows.
-- Tighten these policies before going to production if you need per-user isolation.
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_automation_jobs"
  ON public.automation_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── 2. worker_heartbeats ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.worker_heartbeats (
  worker_id           TEXT        PRIMARY KEY,
  last_seen           TIMESTAMPTZ DEFAULT NOW(),
  status              TEXT        DEFAULT 'online',
  active_jobs         INTEGER     DEFAULT 0,
  max_concurrent_jobs INTEGER     DEFAULT 1,
  hostname            TEXT,
  platform            TEXT,
  node_version        TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.worker_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_worker_heartbeats"
  ON public.worker_heartbeats
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── 3. investor_sessions ─────────────────────────────────────────────────────
-- Persists investor profile JSON across Railway redeploys.
-- Set MEMORY_BACKEND=supabase on the backend service to activate.

CREATE TABLE IF NOT EXISTS investor_sessions (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text    UNIQUE NOT NULL,
  profile    jsonb   DEFAULT '{}',
  journey    jsonb   DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_investor_sessions"
  ON investor_sessions
  FOR ALL
  USING (true);


-- ── Realtime / storage (optional) ────────────────────────────────────────────
-- Uncomment and run separately in the SQL editor if needed:

-- Enable Realtime for live job-progress updates:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_jobs;

-- Create a storage bucket for automation evidence screenshots:
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('automation-evidence', 'automation-evidence', true)
--   ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- Meridian Investor OS — Complete production schema (migration 002)
-- Adds: users, investor_profiles, notes, research_cache, job_logs, documents.
-- Extends: automation_jobs (user_id), investor_sessions (user_id, country, activity).
-- Enables: RLS on all tables, updated_at triggers, Realtime publication.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. users — app-level mirror of auth.users ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        UNIQUE NOT NULL,
  full_name    TEXT,
  role         TEXT        NOT NULL DEFAULT 'investor'
                            CHECK (role IN ('investor','agent','admin')),
  avatar_url   TEXT,
  phone        TEXT,
  nationality  TEXT,
  onboarded_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. investor_profiles — rich per-user profile (replaces JSON blob) ─────────
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  surname              TEXT,
  other_names          TEXT,
  gender               TEXT,
  date_of_birth        DATE,
  country_of_birth     TEXT,
  nationality          TEXT,
  email                TEXT,
  phone                TEXT,
  postal_address       TEXT,
  postal_code          TEXT,
  city                 TEXT,
  subcounty            TEXT,
  location             TEXT,
  road                 TEXT,
  plot_no              TEXT,
  nearest_landmark     TEXT,
  passport_no          TEXT,
  passport_issue_date  DATE,
  passport_expiry_date DATE,
  place_of_issue       TEXT,
  immigration_status   TEXT,
  previous_permits     JSONB       DEFAULT '[]'::jsonb,
  spouse_name          TEXT,
  dependants           JSONB       DEFAULT '[]'::jsonb,
  employer_name        TEXT,
  education_level      TEXT,
  profession           TEXT,
  sector               TEXT,
  county               TEXT,
  capital_usd          NUMERIC,
  company_name         TEXT,
  timeline             TEXT,
  destination_country  TEXT        DEFAULT 'kenya',
  completion_pct       INT         DEFAULT 0,
  raw                  JSONB       DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user
  ON public.investor_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sector_county
  ON public.investor_profiles (sector, county);

-- ── 3. investor_sessions — extend with user_id + activity ─────────────────────
ALTER TABLE public.investor_sessions
  ADD COLUMN IF NOT EXISTS user_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS country       TEXT DEFAULT 'kenya',
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON public.investor_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity
  ON public.investor_sessions (last_activity DESC);

-- ── 4. automation_jobs — link to owner ────────────────────────────────────────
ALTER TABLE public.automation_jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_user_status
  ON public.automation_jobs (user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_session
  ON public.automation_jobs (session_id, created_at DESC);

-- ── 5. notes — free-form + linked to session/job/step ────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  job_id      UUID        REFERENCES public.automation_jobs(id) ON DELETE SET NULL,
  entity_type TEXT,       -- 'session' | 'job' | 'profile' | 'roadmap_step' | 'general'
  entity_id   TEXT,
  title       TEXT,
  body        TEXT        NOT NULL,
  tags        TEXT[]      DEFAULT '{}',
  pinned      BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user   ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON public.notes (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_job    ON public.notes (job_id);

-- ── 6. research_cache — dedup Claude web_search calls across users ───────────
CREATE TABLE IF NOT EXISTS public.research_cache (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash   TEXT        UNIQUE NOT NULL,   -- sha256(kind + sorted-params)
  kind         TEXT        NOT NULL,          -- 'market_gap' | 'seed_pack' | 'flights' | 'roadmap'
  query_params JSONB       NOT NULL,
  results      JSONB       NOT NULL,
  engine       TEXT,                          -- 'claude-web-search' | 'curated-fallback' | 'kenya-json'
  hit_count    INT         DEFAULT 1,
  last_hit_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_research_hash    ON public.research_cache (query_hash);
CREATE INDEX IF NOT EXISTS idx_research_kind    ON public.research_cache (kind);
CREATE INDEX IF NOT EXISTS idx_research_expires ON public.research_cache (expires_at);

-- ── 7. job_logs — append-only trace per automation run ───────────────────────
CREATE TABLE IF NOT EXISTS public.job_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID        REFERENCES public.automation_jobs(id) ON DELETE CASCADE,
  level      TEXT        NOT NULL DEFAULT 'info'
                          CHECK (level IN ('debug','info','warn','error')),
  message    TEXT        NOT NULL,
  data       JSONB       DEFAULT '{}',
  step       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job
  ON public.job_logs (job_id, created_at);

-- ── 8. documents — passports, JDs, invoices, evidence ────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  session_id   TEXT,
  job_id       UUID        REFERENCES public.automation_jobs(id) ON DELETE SET NULL,
  kind         TEXT        NOT NULL,   -- 'passport' | 'job_description' | 'invoice' | 'evidence' | 'other'
  filename     TEXT,
  mime_type    TEXT,
  storage_path TEXT,
  size_bytes   BIGINT,
  extracted    JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_user_kind ON public.documents (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_docs_job       ON public.documents (job_id);

-- ── 9. updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','investor_profiles','investor_sessions','automation_jobs','notes'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ── 10. RLS on all app tables ────────────────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents         ENABLE ROW LEVEL SECURITY;

-- Drop any old permissive policies before recreating (idempotent re-runs)
DROP POLICY IF EXISTS users_select              ON public.users;
DROP POLICY IF EXISTS users_update              ON public.users;
DROP POLICY IF EXISTS profiles_owner            ON public.investor_profiles;
DROP POLICY IF EXISTS notes_owner               ON public.notes;
DROP POLICY IF EXISTS research_read             ON public.research_cache;
DROP POLICY IF EXISTS research_service_write    ON public.research_cache;
DROP POLICY IF EXISTS job_logs_visible          ON public.job_logs;
DROP POLICY IF EXISTS docs_owner                ON public.documents;

CREATE POLICY users_select ON public.users
  FOR SELECT USING (true);
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profiles_owner ON public.investor_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY notes_owner ON public.notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Research cache: anyone authenticated can read (shared brain); writes via service role.
CREATE POLICY research_read ON public.research_cache
  FOR SELECT USING (true);

CREATE POLICY job_logs_visible ON public.job_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.automation_jobs j
      WHERE j.id = job_id
        AND (j.user_id IS NULL OR auth.uid() = j.user_id)
    )
  );

CREATE POLICY docs_owner ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 11. Realtime publication ─────────────────────────────────────────────────
-- Wrap each ADD in a DO block so re-runs don't error if already published
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_jobs;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.job_logs;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_sessions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ── 12. Storage buckets (optional, run once) ─────────────────────────────────
-- Uncomment to create private buckets for uploads:
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('passports', 'passports', false),
--   ('evidence',  'evidence',  false),
--   ('avatars',   'avatars',   true)
-- ON CONFLICT (id) DO NOTHING;

-- Migration: Create automation_jobs and worker_heartbeats tables
-- Run this in your Supabase SQL editor

-- 1. automation_jobs table
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claiming', 'running', 'completed', 'failed')),
  data JSONB DEFAULT '{}'::jsonb,
  worker_id TEXT,
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  message TEXT,
  logs JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  retry_count_max INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job queries
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON public.automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON public.automation_jobs(type);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_created ON public.automation_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role full access
CREATE POLICY "Service role can manage all jobs"
  ON public.automation_jobs
  USING (true)
  WITH CHECK (true);

-- 2. worker_heartbeats table
CREATE TABLE IF NOT EXISTS public.worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'online',
  active_jobs INTEGER DEFAULT 0,
  max_concurrent_jobs INTEGER DEFAULT 1,
  hostname TEXT,
  platform TEXT,
  node_version TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.worker_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage heartbeats"
  ON public.worker_heartbeats
  USING (true)
  WITH CHECK (true);

-- 3. Enable Realtime for automation_jobs
-- Run this separately if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_jobs;

-- 4. Create storage bucket for evidence
-- Run this separately:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('automation-evidence', 'automation-evidence', true);

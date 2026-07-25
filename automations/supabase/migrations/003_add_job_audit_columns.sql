-- Migration: Add task/automation linkage + audit trail to automation_jobs
-- Run this in your Supabase SQL editor
--
-- Lets the accounting-task-manager UI show, per automation config on a task,
-- who ran it and when it last completed/failed - even after a page refresh,
-- since that state previously only lived in ephemeral React state.
--
-- Kept as a single JSONB column rather than separate TEXT columns since this
-- is app-specific context riding along on a generic worker-queue table -
-- no FK constraints either, for the same reason.

ALTER TABLE public.automation_jobs
  ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- context shape: { task_id, automation_id, ran_by_user_id, ran_by_name, ran_by_email }

CREATE INDEX IF NOT EXISTS idx_automation_jobs_context_task_automation
  ON public.automation_jobs ((context ->> 'task_id'), (context ->> 'automation_id'), created_at DESC);

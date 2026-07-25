-- Add automation_type column to tm_automations
-- Run this in your Supabase SQL editor

ALTER TABLE public.tm_automations 
ADD COLUMN IF NOT EXISTS automation_type TEXT;

-- Optional: backfill from webhook_url for existing records
-- UPDATE public.tm_automations 
-- SET automation_type = regexp_replace(webhook_url, '^.*/([^/]+)$', '\1')
-- WHERE automation_type IS NULL AND webhook_url IS NOT NULL;

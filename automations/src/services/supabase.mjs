import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.mjs';

let client = null;

export function getSupabase() {
  if (client) return client;
  client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  return client;
}

export function getPublicSupabase() {
  return createClient(config.supabase.url, config.supabase.anonKey);
}

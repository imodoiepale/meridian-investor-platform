import { getSupabase } from '../services/supabase.mjs';
import { logger } from '../services/logger.mjs';
import { config } from '../config/index.mjs';
import { jobQueue } from './queue.mjs';

const WORKER_ID = config.worker.name;

export async function sendHeartbeat() {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    const { error } = await supabase.from('worker_heartbeats').upsert({
      worker_id: WORKER_ID,
      last_seen: now,
      status: 'online',
      active_jobs: jobQueue.activeCount,
      max_concurrent_jobs: config.worker.maxConcurrentJobs,
      hostname: process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown',
      platform: process.platform,
      node_version: process.version,
    }, {
      onConflict: 'worker_id',
    });

    if (error) {
      logger.warn(`[heartbeat] Failed: ${error.message}`);
    }
  } catch (err) {
    logger.warn(`[heartbeat] Error: ${err.message}`);
  }
}

export function startHeartbeat() {
  sendHeartbeat();
  const interval = setInterval(sendHeartbeat, config.worker.heartbeatIntervalMs);
  logger.info(`[heartbeat] Started (every ${config.worker.heartbeatIntervalMs / 1000}s)`);
  return interval;
}

export function stopHeartbeat(interval) {
  if (interval) clearInterval(interval);
}

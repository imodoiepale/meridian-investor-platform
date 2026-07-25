import { config } from '../config/index.mjs';
import { logger } from '../services/logger.mjs';
import { getSupabase } from '../services/supabase.mjs';
import { subscribeToJobs, unsubscribeFromJobs } from './realtime.mjs';
import { jobQueue } from './queue.mjs';
import { startHeartbeat, stopHeartbeat } from './heartbeat.mjs';

let heartbeatInterval = null;
let realtimeChannel = null;

async function main() {
  console.log('');
  console.log('============================================');
  console.log('  IMMIGRATION AUTOMATION AGENT');
  console.log(`  Worker: ${config.worker.name}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Node: ${process.version}`);
  console.log('============================================');
  console.log('');

  const supabase = getSupabase();
  const { error: dbCheck } = await supabase.from('automation_jobs').select('id').limit(1);
  if (dbCheck) {
    logger.error(`Cannot connect to Supabase: ${dbCheck.message}`);
    process.exit(1);
  }
  logger.info('Supabase connection OK');

  logger.info(`Worker config: maxConcurrent=${config.worker.maxConcurrentJobs}, pollInterval=${config.worker.pollIntervalMs}ms`);

  await jobQueue.start();

  realtimeChannel = subscribeToJobs((job) => jobQueue.addJobFromRealtime(job));

  heartbeatInterval = startHeartbeat();

  logger.info('============================================');
  logger.info('  Agent is running. Waiting for jobs...');
  logger.info('  Press Ctrl+C to stop gracefully.');
  logger.info('============================================');

  const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGBREAK'];
  for (const signal of shutdownSignals) {
    process.on(signal, async () => {
      console.log('');
      logger.info(`Received ${signal}, shutting down gracefully...`);

      stopHeartbeat(heartbeatInterval);
      unsubscribeFromJobs(realtimeChannel);
      await jobQueue.stop();

      const active = jobQueue.getActiveJobs();
      if (active.length > 0) {
        logger.info(`Waiting for ${active.length} active job(s) to finish...`);
      }

      logger.info('Agent stopped');
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

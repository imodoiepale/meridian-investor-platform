import { getSupabase } from '../services/supabase.mjs';
import { logger } from '../services/logger.mjs';
import { config } from '../config/index.mjs';

const SUBSCRIPTION_CHANNEL = 'automation-jobs-channel';
const SUBSCRIPTION_TABLE = 'automation_jobs';

export function subscribeToJobs(onNewJob) {
  const supabase = getSupabase();

  const channel = supabase.channel(SUBSCRIPTION_CHANNEL, {
    selfBroadcast: true,
    private: false,
  });

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: SUBSCRIPTION_TABLE,
      filter: `status=eq.pending`,
    },
    async (payload) => {
      const job = payload.new;
      logger.info(`[realtime] New job received: ${job.id} type=${job.type}`);

      try {
        await onNewJob(job);
      } catch (err) {
        logger.error(`[realtime] Error handling job ${job.id}: ${err.message}`);
      }
    }
  );

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: SUBSCRIPTION_TABLE,
      filter: `status=eq.pending`,
    },
    async (payload) => {
      const job = payload.new;
      if (job.retry_count > 0) {
        logger.info(`[realtime] Retry job received: ${job.id} type=${job.type} retry=${job.retry_count}`);
        try {
          await onNewJob(job);
        } catch (err) {
          logger.error(`[realtime] Error handling retry job ${job.id}: ${err.message}`);
        }
      }
    }
  );

  channel.subscribe((status) => {
    logger.info(`[realtime] Subscription status: ${status}`);
  });

  logger.info('[realtime] Listening for new automation jobs...');
  return channel;
}

export function unsubscribeFromJobs(channel) {
  if (channel) {
    getSupabase().removeChannel(channel);
    logger.info('[realtime] Unsubscribed from job updates');
  }
}

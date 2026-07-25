import { getSupabase } from '../services/supabase.mjs';
import { logger } from '../services/logger.mjs';
import { config } from '../config/index.mjs';
import { processJob } from '../dispatcher.mjs';

class JobQueue {
  constructor() {
    this.activeJobs = new Map();
    this.processing = false;
    this.pollTimer = null;
  }

  get activeCount() {
    return this.activeJobs.size;
  }

  get canAcceptMore() {
    return this.activeCount < config.worker.maxConcurrentJobs;
  }

  async start() {
    this.processing = true;
    logger.info(`[queue] Started (max ${config.worker.maxConcurrentJobs} concurrent jobs)`);
    await this.pollForPendingJobs();
    this.pollTimer = setInterval(() => this.pollForPendingJobs(), config.worker.pollIntervalMs);
  }

  async stop() {
    this.processing = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('[queue] Stopped');
  }

  async pollForPendingJobs() {
    if (!this.processing) return;
    if (!this.canAcceptMore) return;

    try {
      const supabase = getSupabase();

      const { data: jobs, error } = await supabase
        .from('automation_jobs')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', config.worker.maxRetries)
        .order('created_at', { ascending: true })
        .limit(config.worker.maxConcurrentJobs - this.activeCount);

      if (error) {
        logger.error(`[queue] Poll error: ${error.message}`);
        return;
      }

      if (jobs && jobs.length > 0) {
        for (const job of jobs) {
          if (this.canAcceptMore && job.status === 'pending') {
            const locked = await this.lockJob(job.id);
            if (locked) {
              this.executeJob(job);
            }
          }
        }
      }
    } catch (err) {
      logger.error(`[queue] Poll exception: ${err.message}`);
    }
  }

  async lockJob(jobId) {
    try {
      const supabase = getSupabase();
      const workerName = config.worker.name;

      const { data, error } = await supabase
        .from('automation_jobs')
        .update({
          worker_id: workerName,
          status: 'claiming',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !data) {
        logger.debug(`[queue] Failed to lock job ${jobId} (maybe taken by another worker)`);
        return false;
      }

      return true;
    } catch (err) {
      logger.error(`[queue] Lock error for ${jobId}: ${err.message}`);
      return false;
    }
  }

  async executeJob(job) {
    const { id: jobId, type } = job;

    logger.info(`[queue] Executing job ${jobId} (${type})`);

    const promise = processJob(job)
      .then((result) => {
        logger.info(`[queue] Job ${jobId} completed`);
        this.activeJobs.delete(jobId);
        return result;
      })
      .catch((err) => {
        logger.error(`[queue] Job ${jobId} failed: ${err.message}`);
        this.activeJobs.delete(jobId);
      });

    this.activeJobs.set(jobId, promise);
    return promise;
  }

  async addJobFromRealtime(job) {
    if (this.activeJobs.has(job.id)) {
      logger.debug(`[queue] Job ${job.id} already active, skipping`);
      return;
    }

    if (!this.canAcceptMore) {
      logger.debug(`[queue] At capacity, job ${job.id} will be picked up by poll later`);
      return;
    }

    const locked = await this.lockJob(job.id);
    if (locked) {
      await this.executeJob(job);
    }
  }

  getActiveJobs() {
    return Array.from(this.activeJobs.keys());
  }
}

export const jobQueue = new JobQueue();

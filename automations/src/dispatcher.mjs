import { config } from './config/index.mjs';
import { logger } from './services/logger.mjs';
import { getSupabase } from './services/supabase.mjs';
import { runJob } from './runners/index.mjs';

export async function processJob(job) {
  const supabase = getSupabase();
  const { id: jobId, type } = job;

  logger.info(`[${jobId}] Processing job type=${type}`);

  const updateProgress = async (progress, currentStep, message = null) => {
    await supabase.from('automation_jobs').update({
      progress,
      current_step: currentStep,
      message,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
  };

  const addLog = async (level, message, step = null) => {
    logger.job(jobId, level, message, step);
    const { data: current } = await supabase
      .from('automation_jobs')
      .select('logs')
      .eq('id', jobId)
      .single();

    const logs = current?.logs || [];
    logs.push({ timestamp: new Date().toISOString(), level, message, step });
    await supabase.from('automation_jobs').update({ logs }).eq('id', jobId);
  };

  let result = null;
  try {
    await supabase.from('automation_jobs').update({
      status: 'running',
      started_at: new Date().toISOString(),
      worker_id: config.worker.name,
      progress: 0,
      current_step: 'Starting',
    }).eq('id', jobId);

    addLog('info', `Starting ${type} automation`, 'start');

    result = await runJob(job, updateProgress, addLog);

    await supabase.from('automation_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      current_step: 'Complete',
      result: result || {},
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);

    addLog('info', 'Job completed successfully', 'complete');
    logger.info(`[${jobId}] Completed successfully`);

  } catch (error) {
    logger.error(`[${jobId}] Failed: ${error.message}`);

    const retryCount = (job.retry_count || 0) + 1;
    const maxRetries = job.retry_count_max || 3;
    const shouldRetry = retryCount <= maxRetries;
    const newStatus = shouldRetry ? 'pending' : 'failed';

    await supabase.from('automation_jobs').update({
      status: newStatus,
      error: error.message,
      retry_count: retryCount,
      completed_at: shouldRetry ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);

    addLog('error', `Failed: ${error.message}${shouldRetry ? `. Will retry (${retryCount}/${maxRetries})` : '. All retries exhausted'}`, 'error');
  }

  return result;
}

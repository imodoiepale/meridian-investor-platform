import fs from 'fs';
import path from 'path';
import { config } from '../config/index.mjs';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

let logStream = null;

function getLogStream() {
  if (logStream) return logStream;
  const date = new Date().toISOString().slice(0, 10);
  const logFile = path.join(config.paths.logs, `worker-${date}.log`);
  logStream = fs.createWriteStream(logFile, { flags: 'a' });
  return logStream;
}

function formatEntry(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    worker: config.worker.name,
    message,
    ...meta,
  });
}

function write(level, message, meta = {}) {
  const entry = formatEntry(level, message, meta);
  const stream = getLogStream();
  stream.write(entry + '\n');

  if (LOG_LEVELS[level] >= LOG_LEVELS.info) {
    const prefix = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍' }[level] || '';
    console.log(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),

  job: (jobId, level, message, step = null) => {
    write(level, `[job:${jobId}] ${message}`, { jobId, step });
  },

  async logToSupabase(jobId, level, message, step = null) {
    const { getSupabase } = await import('./supabase.mjs');
    const supabase = getSupabase();
    const { error } = await supabase.rpc('append_job_log', {
      p_job_id: jobId,
      p_log: { timestamp: new Date().toISOString(), level, message, step },
    });
    if (error) {
      const { data: job } = await supabase
        .from('automation_jobs')
        .select('logs')
        .eq('id', jobId)
        .single();
      if (job) {
        const logs = job.logs || [];
        logs.push({ timestamp: new Date().toISOString(), level, message, step });
        await supabase.from('automation_jobs').update({ logs }).eq('id', jobId);
      }
    }
  },

  async updateProgress(jobId, progress, currentStep, message = null) {
    const { getSupabase } = await import('./supabase.mjs');
    const supabase = getSupabase();
    await supabase.from('automation_jobs').update({
      progress,
      current_step: currentStep,
      message,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
  },
};

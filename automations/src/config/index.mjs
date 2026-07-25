import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const hostname = process.env.COMPUTERNAME || process.env.HOSTNAME || 'office-pc';

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  worker: {
    name: process.env.WORKER_NAME || `agent-${hostname}`,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 1,
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS) || 5000,
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS) || 30000,
    jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS) || 7200000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },
  browser: {
    headless: process.env.HEADLESS?.toLowerCase() === 'true',
    slowMo: parseInt(process.env.SLOW_MO) || 100,
    viewport: { width: 1920, height: 1080 },
    sessionDir: path.resolve(__dirname, '../../sessions'),
    timeout: parseInt(process.env.NAVIGATION_TIMEOUT) || 120000,
  },
  paths: {
    logs: path.resolve(__dirname, '../../logs'),
    sessions: path.resolve(__dirname, '../../sessions'),
    automation: path.resolve(__dirname, '../../automation'),
  },
};

['logs', 'sessions'].forEach(dir => {
  const p = path.resolve(__dirname, `../../${dir}`);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

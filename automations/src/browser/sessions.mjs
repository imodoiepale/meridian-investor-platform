import fs from 'fs';
import path from 'path';
import { config } from '../config/index.mjs';

function getSessionPath(portalId, accountId) {
  const safe = accountId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(config.paths.sessions, `${portalId}-${safe}.json`);
}

export function hasSavedSession(portalId, accountId) {
  return fs.existsSync(getSessionPath(portalId, accountId));
}

export function getSavedSession(portalId, accountId) {
  const sessionPath = getSessionPath(portalId, accountId);
  if (!fs.existsSync(sessionPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function saveSession(portalId, accountId, storageState) {
  const sessionPath = getSessionPath(portalId, accountId);
  fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));
}

export function deleteSession(portalId, accountId) {
  const sessionPath = getSessionPath(portalId, accountId);
  if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
}

export function getSessionForJob(job) {
  const portalId = job.portal || job.type?.split('-')[0] || 'ecitizen';
  const accountId = job.data?.login?.email || 'default';
  return {
    portalId,
    accountId,
    exists: hasSavedSession(portalId, accountId),
    data: getSavedSession(portalId, accountId),
  };
}

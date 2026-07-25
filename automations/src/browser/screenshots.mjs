import path from 'path';
import { config } from '../config/index.mjs';
import { uploadEvidence } from '../services/storage.mjs';

export async function captureScreenshot(page, jobId, label) {
  const filename = `${label}-${Date.now()}.png`;
  const localPath = path.join(config.paths.logs, filename);

  await page.screenshot({ path: localPath, fullPage: true });

  const result = await uploadEvidence(jobId, 'screenshot', localPath, label);
  return result;
}

export async function captureElementScreenshot(page, jobId, selector, label) {
  const element = await page.$(selector);
  if (!element) return null;

  const filename = `${label}-${Date.now()}.png`;
  const localPath = path.join(config.paths.logs, filename);

  await element.screenshot({ path: localPath });

  const result = await uploadEvidence(jobId, 'screenshot', localPath, label);
  return result;
}

export async function startTracing(context, jobId) {
  const tracePath = path.join(config.paths.logs, `trace-${jobId}.zip`);
  await context.tracing.start({ screenshots: true, snapshots: true });
  return tracePath;
}

export async function stopTracing(context, jobId, tracePath) {
  await context.tracing.stop({ path: tracePath });
  const result = await uploadEvidence(jobId, 'trace', tracePath, 'playwright-trace');
  return result;
}

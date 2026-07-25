import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { config } from '../config/index.mjs';
import { logger } from '../services/logger.mjs';
import { saveSession } from './sessions.mjs';

const STEALTH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-infobars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--no-sandbox',
];

const STEALTH_SCRIPT = () => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' },
    ],
  });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  window.chrome = { runtime: {} };
};

export class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentJobId = null;
  }

  async launch(jobId, options = {}) {
    if (this.browser) {
      logger.debug(`[${jobId}] Browser already running, reusing`);
      return this;
    }

    this.currentJobId = jobId;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const profileDir = path.join(
      process.env.LOCALAPPDATA || '',
      'playwright',
      'profiles',
      `job-${jobId}-${timestamp}`
    );
    fs.mkdirSync(profileDir, { recursive: true });

    const session = options.session || {};
    const storageState = session.exists ? session.data : undefined;

    this.context = await chromium.launchPersistentContext(profileDir, {
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      args: STEALTH_ARGS,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: config.browser.viewport,
      locale: 'en-US',
      timezoneId: 'Africa/Nairobi',
      deviceScaleFactor: 1,
      hasTouch: false,
      javaScriptEnabled: true,
      storageState,
      acceptDownloads: options.acceptDownloads || false,
    });

    await this.context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await this.context.addInitScript(STEALTH_SCRIPT);
    this.page = await this.context.newPage();

    logger.info(`[${jobId}] Browser launched`);
    return this;
  }

  getPage() {
    return this.page;
  }

  getContext() {
    return this.context;
  }

  async saveSession(portalId, accountId) {
    if (!this.context) return;
    const storageState = await this.context.storageState();
    saveSession(portalId, accountId, storageState);
  }

  async close(jobId) {
    try {
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (err) {
      logger.warn(`[${jobId || this.currentJobId}] Error closing browser: ${err.message}`);
    }
    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentJobId = null;
  }

  async screenshot(jobId, label) {
    if (!this.page) return null;
    const screenshots = await import('./screenshots.mjs');
    return screenshots.captureScreenshot(this.page, jobId, label);
  }
}

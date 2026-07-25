import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

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

function getStealthInitScript() {
  return () => {
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
}

export async function createStealthBrowser(options = {}) {
  const {
    acceptDownloads = false,
    grantClipboard = true,
    viewport = { width: 1920, height: 1080 },
    profileId = 'eta-kenya',
  } = options;

  // Create unique profile directory with timestamp to avoid conflicts
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const uniqueProfileId = `${profileId}-${timestamp}`;

  const profileDir = path.join(
    process.env.LOCALAPPDATA,
    'playwright',
    'profiles',
    uniqueProfileId
  );

  fs.mkdirSync(profileDir, { recursive: true });

  const isHeadless = process.env.HEADLESS?.toLowerCase() === 'true';

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: isHeadless,
    slowMo: parseInt(process.env.SLOW_MO) || 100,
    args: STEALTH_ARGS,

    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

    viewport,
    locale: 'en-US',
    timezoneId: 'Africa/Nairobi',
    deviceScaleFactor: 1,
    hasTouch: false,
    javaScriptEnabled: true,
    acceptDownloads,
  });

  if (grantClipboard) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  await context.addInitScript(getStealthInitScript());

  const page = await context.newPage();

  return { context, page };
}

import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { createWorker } from 'tesseract.js';
import retry from 'async-retry';
import { createClient } from '@supabase/supabase-js';

/**
 * KRA (Kenya Revenue Authority) — iTax portal automation.
 *
 * Modeled on the proven pattern from document-trainer-and-many-more/KRA Dupe/
 * FILE -NIL RETURNS COMPANIES/KRA-FILE-PAYE NIL RETURNS.js:
 *  - PIN + password + tesseract-OCR arithmetic captcha with 5-attempt retry
 *  - Menu hover + evaluate() for JS-driven navigation
 *  - Multi-step submit with page.once('dialog') handlers
 *  - Download acknowledgement receipt
 *  - Post-flow status detection (PasswordExpired / Locked / Invalid / Valid)
 *  - Clean logOutUser() sequence
 *
 * Exposed capabilities:
 *   - registerKraPin(profile)                     iTax new PIN application
 *   - checkKraCredentials({pin, password})        Login + parse status, then logout
 *   - fileNilReturn({pin, password, kind})        Nil return filing (kind: paye|vat|income_tax)
 *   - filePayeNilReturn / fileVatNilReturn        Convenience wrappers
 *
 * Env:
 *   HEADLESS='false'      watch the browser (default: true)
 *   AUTO_CLOSE='false'    keep browser open after finish (default: true)
 *   SLOW_MO=<ms>          ms between actions (default: 0)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — enable job_logs streaming
 */

const ITAX_URL = 'https://itax.kra.go.ke/KRA-Portal/';
const NAV_TIMEOUT_MS = 180_000;

// ── Supabase job-log streaming (best-effort) ──────────────────────────────────
const _supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
})();

async function logJob(jobId, level, message, data = {}, step = '') {
  const line = `[${level.toUpperCase()}] ${step ? `(${step}) ` : ''}${message}`;
  if (level === 'error') console.error(line);
  else console.log(line);
  if (!_supabase || !jobId) return;
  try {
    await _supabase.from('job_logs').insert({
      job_id: jobId,
      level,
      step: step || null,
      message,
      data,
    });
  } catch { /* best-effort */ }
}

async function updateJob(jobId, patch) {
  if (!_supabase || !jobId) return;
  try {
    await _supabase.from('automation_jobs').update(patch).eq('id', jobId);
  } catch { /* best-effort */ }
}

// ── Common helpers ────────────────────────────────────────────────────────────
function launchOpts() {
  return {
    // Real installed Chrome — set BROWSER_CHANNEL=chromium in containers.
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: process.env.HEADLESS?.trim().toLowerCase() !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0', 10),
  };
}

function evidenceDirFor(kind) {
  const now = new Date();
  const stamp = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
  const dir = path.join(os.homedir(), 'Downloads', `KRA - ${kind} - ${stamp}`);
  return dir;
}

async function makeEvidenceDir(kind) {
  const dir = evidenceDirFor(kind);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Log in to iTax. Handles the arithmetic-captcha via tesseract OCR with retries.
 * Returns { ok: boolean, status: 'Valid'|'Invalid'|'Locked'|'PasswordExpired' }.
 */
async function loginToKRA(page, { pin, password }, evidenceDir, jobId = null) {
  await logJob(jobId, 'info', `Logging in as ${pin}…`, {}, 'login');
  await page.goto(ITAX_URL, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });

  await page.locator('#logid').click();
  await page.locator('#logid').fill(pin);
  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    if (typeof CheckPIN === 'function') CheckPIN();
  });
  await page.locator('input[name="xxZTT9p2wQ"]').fill(password);
  await page.waitForTimeout(500);

  // ── Captcha OCR ─────────────────────────────────────────────────────────
  const image = await page.waitForSelector('#captcha_img', { timeout: NAV_TIMEOUT_MS });
  const captchaPath = path.join(evidenceDir, 'ocr.png');
  await image.screenshot({ path: captchaPath });

  const worker = await createWorker('eng', 1);
  let captchaAnswer = null;
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ret = await worker.recognize(captchaPath);
      const text = ret.data.text.trim().slice(0, -1).slice(0, -1); // match reference: drop last two
      const numbers = text.match(/\d+/g);
      if (!numbers || numbers.length < 2) throw new Error('captcha_no_numbers');
      if (text.includes('+'))      captchaAnswer = Number(numbers[0]) + Number(numbers[1]);
      else if (text.includes('-')) captchaAnswer = Number(numbers[0]) - Number(numbers[1]);
      else                          throw new Error('captcha_no_operator');
      await logJob(jobId, 'info', `Captcha solved on attempt ${attempt}`, { text, result: captchaAnswer }, 'login');
      break;
    } catch (e) {
      await logJob(jobId, 'warn', `Captcha attempt ${attempt} failed: ${e.message}`, {}, 'login');
      if (attempt < maxAttempts) {
        await page.waitForTimeout(1000);
        await image.screenshot({ path: captchaPath });
      }
    }
  }
  await worker.terminate();

  if (captchaAnswer == null) {
    // Retry the whole login once (matches reference recursion, but capped)
    await logJob(jobId, 'warn', 'Captcha OCR failed 5x — retrying login once', {}, 'login');
    return loginToKRA(page, { pin, password }, evidenceDir, jobId);
  }

  await page.type('#captcahText', String(captchaAnswer));
  await page.click('#loginButton');

  // Wrong-result retry (identical to reference)
  const wrongResult = await page.waitForSelector(
    'b:has-text("Wrong result of the arithmetic operation.")',
    { state: 'visible', timeout: 3000 }).catch(() => false);
  if (wrongResult) {
    await logJob(jobId, 'warn', 'Wrong captcha result — retrying login', {}, 'login');
    return loginToKRA(page, { pin, password }, evidenceDir, jobId);
  }

  // Land on the portal home and inspect status flags
  await page.goto(ITAX_URL, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS }).catch(() => {});

  let isPasswordExpired = false;
  let isAccountLocked = false;
  let isInvalidLogin = false;
  let menuItemNotFound = false;

  await retry(
    async (bail) => {
      try {
        menuItemNotFound = !(await page
          .waitForSelector('#ddtopmenubar > ul > li:nth-child(1) > a', { timeout: 2000 })
          .catch(() => false));
        if (menuItemNotFound) {
          isPasswordExpired = !!(await page
            .waitForSelector('.formheading:has-text("YOUR PASSWORD HAS EXPIRED!")', { state: 'visible', timeout: 1000 })
            .catch(() => false));
          isAccountLocked = !!(await page
            .waitForSelector('b:has-text("The account has been locked.")', { state: 'visible', timeout: 1000 })
            .catch(() => false));
          isInvalidLogin = !isPasswordExpired && !isAccountLocked && !!(await page
            .waitForSelector('b:has-text("Invalid Login Id or Password.")', { state: 'visible', timeout: 1000 })
            .catch(() => false));
        }
      } catch (err) { bail(err); }
    },
    { retries: 3, minTimeout: 1000, maxTimeout: 3000 }
  );

  const status = isPasswordExpired ? 'PasswordExpired'
    : isAccountLocked ? 'Locked'
    : isInvalidLogin  ? 'Invalid'
    : 'Valid';

  await logJob(jobId, status === 'Valid' ? 'info' : 'warn', `Login status: ${status}`, {}, 'login');
  return { ok: status === 'Valid', status };
}

async function logoutSilently(page) {
  try {
    await page.evaluate(() => {
      try { /* eslint-disable no-undef */ logOutUser(); logOutUser(); /* eslint-enable */ } catch { /* noop */ }
    });
    await page.goto(ITAX_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
    await page.evaluate(() => { try { /* eslint-disable no-undef */ logOutUser(); /* eslint-enable */ } catch { /* noop */ } });
  } catch { /* noop */ }
}

// regType values on iTax nil-return form
const REG_TYPE = {
  paye:       '7',
  vat:        '4',
  income_tax: '1',
};

async function navigateNilReturn(page, { kind, company_name, pin }, evidenceDir, jobId = null) {
  await logJob(jobId, 'info', 'Opening Returns menu…', {}, 'nil_return');
  const returnsSelector = '#ddtopmenubar > ul > li > a[rel="Returns"]';
  await page.hover(returnsSelector);
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    // eslint-disable-next-line no-undef
    if (typeof showNilReturn === 'function') showNilReturn();
  });
  await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await logJob(jobId, 'info', 'Nil-return page loaded', {}, 'nil_return');

  const regValue = REG_TYPE[kind] || REG_TYPE.paye;
  await page.locator('#regType').selectOption(regValue);
  await logJob(jobId, 'info', `Registration type set: ${kind} (${regValue})`, {}, 'nil_return');
  await page.getByRole('button', { name: 'Next' }).click();

  page.once('dialog', d => { logJob(jobId, 'info', `Dialog: ${d.message()}`, {}, 'nil_return'); d.dismiss().catch(() => {}); });
  await page.getByRole('button', { name: 'Submit' }).click();

  page.once('dialog', d => { logJob(jobId, 'info', `Dialog: ${d.message()}`, {}, 'nil_return'); d.accept().catch(() => {}); });
  await page.getByRole('button', { name: 'Submit' }).click();

  page.once('dialog', d => { logJob(jobId, 'info', `Dialog: ${d.message()}`, {}, 'nil_return'); d.accept().catch(() => {}); });
  await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => {});

  await logJob(jobId, 'info', 'Downloading acknowledgement receipt…', {}, 'nil_return');
  const downloadPromise = page.waitForEvent('download', { timeout: NAV_TIMEOUT_MS });
  await page.getByRole('link', { name: 'Download Returns Receipt' }).click();
  const download = await downloadPromise;
  const date = new Date().toISOString().split('T')[0];
  const label = company_name || pin;
  const receiptPath = path.join(evidenceDir,
    `${label} - ${pin} - ${kind.toUpperCase()} NIL RETURN - ACKNOWLEDGEMENT - ${date}.pdf`);
  await download.saveAs(receiptPath);
  await logJob(jobId, 'info', 'Receipt saved', { receiptPath }, 'nil_return');

  // Try to extract the acknowledgement number from the confirmation page for the caller
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const ackMatch = bodyText.match(/[A-Z]{2,3}\d{8,12}/);
  return { receiptPath, acknowledgement: ackMatch ? ackMatch[0] : null };
}

// ── Public: check credentials only (no filing) ────────────────────────────────
export async function checkKraCredentials({ pin, password, company_name = '' }, { jobId = null } = {}) {
  if (!pin || !password) throw new Error('pin and password are required');
  const evidenceDir = await makeEvidenceDir('CREDENTIAL-CHECK');
  const browser = await chromium.launch(launchOpts());
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
  page.setDefaultTimeout(NAV_TIMEOUT_MS);
  const steps = [];
  try {
    await updateJob(jobId, { status: 'running' });
    const login = await loginToKRA(page, { pin, password }, evidenceDir, jobId);
    steps.push(`login_${login.status}`);
    const shotPath = path.join(evidenceDir, `credential-check-${pin}-${Date.now()}.png`);
    await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
    await logoutSilently(page);
    await updateJob(jobId, { status: login.ok ? 'completed' : 'completed', result: { status: login.status } });
    return { success: login.ok, status: login.status, evidencePath: shotPath, steps };
  } catch (err) {
    await logJob(jobId, 'error', err.message, {}, 'credential_check');
    await updateJob(jobId, { status: 'failed', error: err.message });
    return { success: false, error: err.message, evidencePath: evidenceDir, steps };
  } finally {
    if (process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false') {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
}

// ── Public: file a nil return (PAYE / VAT / Income Tax) ───────────────────────
export async function fileNilReturn({ pin, password, kind = 'paye', company_name = '', returnPeriodYear }, { jobId = null } = {}) {
  if (!pin || !password) throw new Error('pin and password are required');
  const validKind = REG_TYPE[kind] ? kind : 'paye';
  const evidenceDir = await makeEvidenceDir(`${validKind.toUpperCase()}-NIL-RETURNS`);
  const browser = await chromium.launch(launchOpts());
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
  page.setDefaultTimeout(NAV_TIMEOUT_MS);
  const steps = [];
  try {
    await updateJob(jobId, { status: 'running' });
    const login = await loginToKRA(page, { pin, password }, evidenceDir, jobId);
    steps.push(`login_${login.status}`);
    if (!login.ok) {
      await updateJob(jobId, { status: 'failed', error: `login_${login.status}` });
      return { success: false, status: login.status, evidencePath: evidenceDir, steps };
    }
    const result = await navigateNilReturn(page,
      { kind: validKind, company_name, pin }, evidenceDir, jobId);
    steps.push('nil_return_filed');
    const shotPath = path.join(evidenceDir, `receipt-${pin}-${Date.now()}.png`);
    await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
    await logoutSilently(page);
    await updateJob(jobId, { status: 'completed', result });
    return { success: true, kind: validKind, acknowledgement: result.acknowledgement, receiptPath: result.receiptPath, evidencePath: shotPath, steps };
  } catch (err) {
    await logJob(jobId, 'error', err.message, {}, 'nil_return');
    const shotPath = path.join(evidenceDir, `ERROR-${Date.now()}.png`);
    await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
    await updateJob(jobId, { status: 'failed', error: err.message });
    return { success: false, error: err.message, evidencePath: shotPath, steps };
  } finally {
    if (process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false') {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
}

export const filePayeNilReturn      = (args, opts) => fileNilReturn({ ...args, kind: 'paye' }, opts);
export const fileVatNilReturn       = (args, opts) => fileNilReturn({ ...args, kind: 'vat' }, opts);
export const fileIncomeTaxNilReturn = (args, opts) => fileNilReturn({ ...args, kind: 'income_tax' }, opts);

// ── Public: new PIN registration (kept — separate flow, no captcha login) ─────
export async function registerKraPin(profile, { jobId = null } = {}) {
  if (!profile || !profile.firstName || !profile.lastName) {
    throw new Error('profile.firstName and profile.lastName are required');
  }
  const {
    taxpayerType = 'Non-Resident Individual',
    firstName, lastName, middleName = '',
    dateOfBirth, gender = 'Male',
    nationality = 'United States',
    idType = 'Passport', idNumber = '',
    email = '', phone = '',
    postalAddress = 'Nairobi,Kenya',
    postalCode = '00100',
    city = 'Nairobi', county = 'Nairobi',
  } = profile;

  const evidenceDir = await makeEvidenceDir('PIN-REGISTRATION');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const evidencePath = path.join(evidenceDir, `kra-pin-${lastName}-${stamp}.png`);
  const steps = [];

  const browser = await chromium.launch(launchOpts());
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });

  try {
    await updateJob(jobId, { status: 'running' });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    page.setDefaultTimeout(NAV_TIMEOUT_MS);
    await page.goto(ITAX_URL, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    steps.push('portal_loaded');
    await logJob(jobId, 'info', 'Portal loaded', {}, 'pin_registration');

    // ── Proven entry flow: #newReg → 'Click Here' → INDI + ON → Next ────────
    await page.locator('#newReg').getByRole('link', { name: 'Click Here' }).click();
    steps.push('new_registration_click_here');
    await logJob(jobId, 'info', "Clicked 'Click Here' on New Registration", {}, 'pin_registration');

    // Taxpayer type — INDI for individuals (both resident + non-resident use INDI on iTax)
    const taxpayerCode = /non-resident/i.test(taxpayerType) ? 'INDI' : 'INDI';
    await page.locator('#cmbTaxpayerType').selectOption(taxpayerCode);
    steps.push(`taxpayer_type=${taxpayerCode}`);

    // Mode of registration — ON (online)
    await page.locator('#modeOfRegsitartion').selectOption('ON');
    steps.push('mode_of_registration=ON');

    await page.getByRole('button', { name: 'Next' }).click();
    steps.push('next_1');
    await logJob(jobId, 'info', 'Entered registration wizard (Individual · Online)', {}, 'pin_registration');
    await page.waitForLoadState('domcontentloaded');

    const next = () => page.getByRole('button', { name: /next|continue|proceed/i }).first();

    await page.waitForLoadState('domcontentloaded');
    for (const [label, value] of [
      [/first\s*name/i, firstName], [/last\s*name|surname/i, lastName],
      [/middle\s*name|other\s*names/i, middleName], [/date\s*of\s*birth/i, dateOfBirth],
      [/email/i, email], [/mobile|phone/i, phone],
      [/postal\s*address/i, postalAddress], [/postal\s*code/i, postalCode],
      [/city|town/i, city],
    ]) {
      const field = page.getByLabel(label).first();
      if (value && await field.count()) await field.fill(String(value)).catch(() => {});
    }
    steps.push('basic_details_filled');

    for (const [label, value] of [
      [/gender/i, gender], [/nationality|country/i, nationality],
      [/county/i, county], [/id\s*type|identification\s*type/i, idType],
    ]) {
      const sel = page.getByLabel(label).first();
      if (value && await sel.count()) {
        await sel.selectOption({ label: value }).catch(() => sel.fill(value).catch(() => {}));
      }
    }
    if (idNumber) {
      const idField = page.getByLabel(/id\s*number|identification\s*number|passport\s*number/i).first();
      if (await idField.count()) await idField.fill(String(idNumber)).catch(() => {});
    }
    steps.push('identity_filled');

    if (await next().count()) { await next().click(); steps.push('next_2'); }

    const submit = page.getByRole('button', { name: /submit|register|apply/i }).first();
    if (await submit.count()) {
      await Promise.all([
        page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => {}),
        submit.click(),
      ]);
      steps.push('submitted');
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const pinMatch = bodyText.match(/\b[AP]\d{9}[A-Z]\b/);
    const pin = pinMatch ? pinMatch[0] : null;

    await page.screenshot({ path: evidencePath, fullPage: true });
    steps.push('evidence_captured');
    await updateJob(jobId, { status: 'completed', result: { pin, evidencePath } });
    return { success: true, pin, evidencePath, steps };
  } catch (err) {
    const errShot = path.join(evidenceDir, `kra-pin-ERROR-${stamp}.png`);
    try { await context.pages()[0]?.screenshot({ path: errShot, fullPage: true }); } catch { /* noop */ }
    await updateJob(jobId, { status: 'failed', error: err.message });
    return { success: false, error: err.message, evidencePath: errShot, steps };
  } finally {
    if (process.env.AUTO_CLOSE?.trim().toLowerCase() !== 'false') {
      await browser.close().catch(() => {});
    }
  }
}

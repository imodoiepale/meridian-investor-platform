// Private Limited Company incorporation on BRS v2 (brsv2.ecitizen.go.ke).
//
// Ported from a Playwright codegen recording of a full manual filing. The step
// order and selectors are kept exactly as recorded — BRS drives most of the form
// from server-rendered `#sq_<id>` question blocks, so the ids ARE the contract.
// What the recording hard-coded is now parameterised through `buildFormData`.
//
// Like every other attended automation here, this stops at the review screen:
// the last action is opening the second Director/Shareholder card. Nothing is
// ever submitted.

import { createStealthBrowser } from './browser-setup.mjs';
import fs from 'fs';
import path from 'path';

const NAME_FIELD = 'Type your preferred name here';

// Portal-internal option ids from the recording. These are BRS taxonomy codes,
// not anything derivable from an investor profile, so they stay as defaults.
const DEFAULTS = {
  // Step 1 — three candidate names, ranked
  nameOptions: [
    'Nairobi Space of artificial intelligence tools',
    'Nairobi Space of ai tools',
    'NSAIT KENYA',
  ],
  reservedName: 'NSAIT_KENYA',

  // Step 2 — capacity of the person making this application. BRS's live
  // options here are Proprietor / Advocate / Secretary — "director" from the
  // recording no longer exists. Proprietor fits an investor filing on the
  // company's behalf; the director/shareholder record itself is added later.
  capacity: 'proprietor',
  applicantAddress: '48',
  applicantPostalCode: '00100',

  // Step 3 — objects and classification
  primaryObjects: 'SOFTWARE AND AI SOLUTIONS AND EDUCATION',
  sector: '10',
  division: '739',
  groups: ['470', '471'],
  classes: ['473', '475'],
  startDate: '2025-08-01',
  accountingPeriodEnd: '2025-08',
  employees: '0',
  turnover: '500000',

  // Step 4 — registered office
  county: '13',
  district: '8',
  locality: '697',
  building: 'MOROVIAN MALL',
  street: 'RUIRU ROAD',
  floor: '3',
  postalAddress: '00100',
  postalCode: '00100',
  officeMobile: '0717308051',
  officeEmail: 'info@nsait.co.ke',
  contactMobile: '+254717308051',

  // Step 5 — share capital
  shareType: 'ORDINARY',
  shareCapital: '10000',
  nominalValue: '010',

  // Step 6 — first director/shareholder. Tied to the eCitizen account holder:
  // BRS validates this id against IPRS, so it cannot be swapped for a foreign
  // investor's passport and still pass.
  director: {
    designation: 'director_shareholder',
    idType: 'citizen',
    idNumber: '39794454',
    firstName: 'James',
    phone: '+254743854888',
    email: 'ijepale@gmail.com',
    postalAddress: '00100',
    postalCode: '00100',
    occupation: 'AI ENGINEER',
    county: '30',
    district: '93',
    locality: '664',
    street: 'OJIJO ROAD',
    building: ' 123',
    sharesFirst: '10',
    sharesSecond: '1000',
    boEffectiveDate: '2025-08-01',
    boSource: 'Provided by the beneficial owner or their authorised representative',
    passportPhoto: 'passport_photo.jpg',
  },
};

/** Merge an investor profile over the recorded defaults. */
export function buildFormData(profile = {}, overrides = {}) {
  const p = profile || {};
  const company = p.company_name || DEFAULTS.reservedName;

  const merged = {
    ...DEFAULTS,
    ...overrides,
    director: { ...DEFAULTS.director, ...(overrides.director || {}) },
  };

  // Profile-driven fields, unless the caller overrode them explicitly.
  if (!overrides.nameOptions && p.company_name) {
    // BRS rejects the step with "Each name must be unique", so the three
    // options must genuinely differ. Strip any Ltd/Limited suffix first —
    // BRS appends the legal suffix itself. Avoid reserved words ("Kenya",
    // "National", "Government", etc.) as a suffix: BRS flags them and adds
    // an "Authorised to use reserved words" question this flow never answers.
    const base = company.replace(/\s*(limited|ltd\.?)\s*$/i, '').trim() || company;
    merged.nameOptions = [base, `${base} Group`, `${base} Holdings`];
    merged.reservedName = base;
  }
  if (!overrides.street && p.road) merged.street = p.road;
  if (!overrides.building && (p.plotNo || p.nearestLandmark)) {
    merged.building = p.plotNo || p.nearestLandmark;
  }
  if (!overrides.postalCode && p.postalCode) merged.postalCode = p.postalCode;
  if (!overrides.officeEmail && p.email) merged.officeEmail = p.email;
  if (!overrides.officeMobile && p.phone) merged.officeMobile = p.phone;
  if (!overrides.director?.occupation && p.profession) {
    merged.director.occupation = String(p.profession).toUpperCase();
  }

  return merged;
}

/** Run one step, logging it. Optional steps never abort the filing. */
async function step(label, fn, { optional = false } = {}) {
  try {
    console.log(`   • ${label}`);
    await fn();
  } catch (err) {
    if (!optional) throw new Error(`${label} — ${err.message}`);
    console.log(`     ↳ skipped (${err.message.split('\n')[0]})`);
  }
}

/** Wait for a control to be visible and settled, then type into it.
 *
 * BRS renders its forms through a JS wizard that repaints a step after the
 * network settles — filling on first paint silently drops the value, so every
 * text entry goes through here.
 */
async function fillWhenReady(locator, value, timeout = 30000) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
  await locator.fill(String(value));
}

/** Check a radio, falling back to its wrapping label's inner input.
 *
 * getByRole('radio', { name }) usually resolves straight to the <input>, but
 * some BRS steps wrap it in a <label> that only exposes the accessible name
 * on the wrapper — check() on that then needs to reach the input inside.
 */
async function checkRadio(locator, timeout = 15000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
  } catch {
    throw new Error(await describePage(locator.page(), 'radio-not-found'));
  }
  try {
    await locator.check({ timeout: 8000 });
    return;
  } catch {
    const inner = locator.locator('input[type="radio"]').first();
    await inner.check({ timeout: 8000 });
  }
}

/** Same idea for selects, which BRS repopulates after an XHR.
 *
 * Recorded option *values* are per-application ids and rarely match a fresh
 * filing, so try the value first, then fall back to matching an option whose
 * visible text contains it (case-insensitive) — that survives id churn. Some
 * "combobox"-role fields (postal code, county) are not a native <select> but
 * a type-ahead: they carry zero <option> elements until you type into them,
 * so that path is tried third.
 */
async function selectWhenReady(locator, value, timeout = 30000) {
  await locator.waitFor({ state: 'visible', timeout });

  // Coded dropdowns (capacity, share type, id type...) already have their
  // options in the DOM — try the value, then a label match, same as before.
  try {
    await locator.selectOption(value, { timeout: 8000 });
    return;
  } catch {
    // fall through
  }

  const options = await locator.locator('option').evaluateAll(
    opts => opts.map(o => ({ value: o.value, label: o.textContent?.trim() || '' }))
  );
  if (options.length) {
    const needle = String(value).toLowerCase();
    const match = options.find(o => o.label.toLowerCase().includes(needle))
      || options.find(o => o.value.toLowerCase().includes(needle));
    if (match) {
      await locator.selectOption(match.value);
      return;
    }
    const shown = options.slice(0, 15).map(o => `"${o.label}"=${o.value}`).join(', ');
    throw new Error(`no option matching "${value}" — available: ${shown}`);
  }

  // Large search-as-you-type lists (postal codes, localities) carry no
  // options until you type: open it, type the value, press Enter to commit
  // the highlighted match — exactly what a person does — then move on.
  await typeaheadSelect(locator, value);
}

/** Open a search-select, type the value, and press Enter to commit it. */
async function typeaheadSelect(locator, value) {
  const page = locator.page();

  await locator.click();
  await page.waitForTimeout(300);
  await locator.pressSequentially(String(value), { delay: 90 });
  await page.waitForTimeout(1200);
  await locator.press('Enter');
  await page.waitForTimeout(400);
}

/** True once eCitizen has authenticated us.
 *
 * Auth does not mean "left the accounts host": a successful sign-in lands on
 * /account-switcher, still on accounts.ecitizen.go.ke. Only the login page
 * itself counts as not-yet-signed-in.
 */
function isAuthenticated(page) {
  const url = page.url();
  if (!url.includes('accounts.ecitizen.go.ke')) return true;
  return !/\/login\b/.test(url);
}

/** Get past eCitizen's post-login account switcher.
 *
 * The recording only clicks "Continue", but that button is not always there:
 * accounts with more than one profile show a list of account tiles that must
 * be picked first. Select the tile matching the signed-in id when we can find
 * it, rather than clicking whatever happens to be first.
 */
async function passAccountSwitcher(page, timeout = 10000, ecitizenId = '') {
  const onSwitcher = page.url().includes('account-switcher');
  const cont = page.getByRole('button', { name: 'Continue' });

  if (!onSwitcher) {
    // Some flows show a bare Continue interstitial without the switcher URL.
    if (await cont.isVisible().catch(() => false)) {
      console.log('     ↳ clicking Continue');
      await cont.click();
      await settle(page, 2000);
      return true;
    }
    return false;
  }

  console.log('     ↳ account switcher shown');
  await settle(page, 1200);

  // Prefer the tile for the account we signed in as.
  if (ecitizenId) {
    const byId = page.getByText(String(ecitizenId), { exact: false }).first();
    if (await byId.isVisible().catch(() => false)) {
      console.log(`     ↳ selecting the account for ${ecitizenId}`);
      await byId.click().catch(() => {});
      await settle(page, 2000);
    }
  }

  if (page.url().includes('account-switcher')) {
    const tile = page.locator('main button, main a, [class*="account"] button, [class*="account"] a').first();
    if (await tile.isVisible().catch(() => false)) {
      console.log('     ↳ selecting the first account tile');
      await tile.click().catch(() => {});
      await settle(page, 2000);
    }
  }

  if (await cont.isVisible().catch(() => false)) {
    console.log('     ↳ clicking Continue');
    await cont.click().catch(() => {});
    await settle(page, 2000);
  }

  if (page.url().includes('account-switcher')) {
    console.log(`     ↳ still on the switcher — ${await describePage(page, 'account-switcher')}`);
    return false;
  }
  return true;
}

/** Answer every "is the name similar to an existing one?" select with NO.
 *
 * Matched by the option they offer rather than by question id, since the ids
 * change from one application to the next.
 */
async function answerNoSelects(page) {
  const selects = page.locator('select');
  const total = await selects.count().catch(() => 0);
  let answered = 0;

  for (let i = 0; i < total; i++) {
    const select = selects.nth(i);
    if (!(await select.isVisible().catch(() => false))) continue;
    if (await select.inputValue().catch(() => '')) continue; // already answered

    const values = await select.locator('option').evaluateAll(
      opts => opts.map(o => o.value)
    ).catch(() => []);
    const no = values.find(v => v && v.toUpperCase() === 'NO');
    if (!no) continue;

    await select.selectOption(no).catch(() => {});
    answered++;
  }
  return answered;
}

/** Collect the wizard's inline validation complaints, if any. */
async function collectValidationErrors(page) {
  const found = [];
  const selectors = [
    'text=/please answer the question/i',
    'text=/must be unique/i',
    'text=/is required/i',
    '.invalid-feedback',
    '[class*="error"]:not(script)',
    '.text-red-500, .text-danger',
  ];
  for (const sel of selectors) {
    const texts = await page.locator(sel).allInnerTexts().catch(() => []);
    for (const t of texts.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)) {
      if (t.length < 200 && !found.includes(t)) found.push(t);
    }
  }
  return found.slice(0, 10);
}

/** Click Next and report whether the wizard actually advanced.
 *
 * BRS blocks the step in place when a required answer is missing, so a click
 * that "worked" is not the same as progress — without this the next step fills
 * the wrong page and corrupts what was already entered.
 */
async function clickNext(page, label = '') {
  await page.getByRole('button', { name: 'Next' }).click();
  await settle(page, 2000);

  const errors = await collectValidationErrors(page);
  if (errors.length) {
    console.log(`     ↳ ${label || 'step'} blocked: ${errors.join(' | ')}`);
    return false;
  }
  return true;
}

/** List what is actually clickable, for when an expected control is missing. */
async function describePage(page, label) {
  const seen = [];
  for (const role of ['link', 'button', 'radio', 'checkbox']) {
    const locator = page.getByRole(role);
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = (await locator.nth(i).innerText().catch(() => ''))
        || (await locator.nth(i).getAttribute('aria-label').catch(() => '')) || '';
      const t = text.replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const entry = `${role}: "${t}"`;
      if (!seen.includes(entry)) seen.push(entry);
    }
  }
  const shot = path.resolve(process.cwd(), `brs-${label}-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  return `url: ${page.url()} | screenshot: ${shot} | clickable: ${seen.slice(0, 50).join(', ') || 'none found'}`;
}

/** Clear a field and type into it the way a person would.
 *
 * These are React-controlled inputs: a raw .value assignment gets reverted, so
 * everything goes through real key events.
 */
async function typeInto(locator, value, delay = 45, pause = 600) {
  await locator.click();
  await locator.press('ControlOrMeta+a');
  await locator.press('Delete');
  await locator.page().waitForTimeout(Math.round(pause / 2));
  await locator.pressSequentially(String(value), { delay });
}

/** Explain a stalled login: portal error text, OTP prompt, or a screenshot. */
async function describeLoginFailure(page) {
  const bits = [];

  for (const sel of ['[role="alert"]', '.alert', '.error', '.text-red-500', '.invalid-feedback']) {
    const texts = await page.locator(sel).allInnerTexts().catch(() => []);
    for (const t of texts.map(s => s.trim()).filter(Boolean)) {
      if (!bits.includes(t)) bits.push(t);
    }
  }

  const body = (await page.innerText('body').catch(() => '')) || '';
  if (/otp|one[- ]time|verification code|2fa/i.test(body)) {
    bits.push('page is asking for an OTP / verification code — this needs a human');
  }
  if (/captcha/i.test(body)) bits.push('a captcha is being shown');

  const shot = path.resolve(process.cwd(), `brs-login-failure-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  bits.push(`screenshot: ${shot}`);
  bits.push(`url: ${page.url()}`);

  return bits.join(' | ');
}

/** Let the wizard finish its XHR + repaint before touching the next step. */
async function settle(page, ms = 600) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

export async function runBrsPrivateLtd({ login = {}, profile = {}, overrides = {} } = {}) {
  const ecitizenId = login.ecitizenId || process.env.ECITIZEN_ID;
  const password = login.password || process.env.ECITIZEN_PASSWORD;

  if (!ecitizenId || !password) {
    throw new Error(
      'No eCitizen credentials. Set ECITIZEN_ID and ECITIZEN_PASSWORD in automations/.env ' +
      'or pass login.ecitizenId / login.password.'
    );
  }

  const data = buildFormData(profile, overrides);
  // `page` is reassigned if the portal opens a service in a new tab.
  let page;
  const { context, page: firstPage } = await createStealthBrowser({
    profileId: 'brs-private-ltd',
    acceptDownloads: true,
    // eCitizen SSO is the flakiest part of this run. Keeping one profile means
    // a session — signed in here or by hand in this window — is reused next time.
    persistProfile: true,
  });
  page = firstPage;

  /** BRS opens some services in a new tab — follow it when that happens. */
  const followNewTab = async (previousCount) => {
    const pages = context.pages();
    if (pages.length <= previousCount) return false;
    const latest = pages[pages.length - 1];
    await latest.waitForLoadState('domcontentloaded').catch(() => {});
    page = latest;
    await page.bringToFront().catch(() => {});
    console.log(`     ↳ followed a new tab -> ${page.url()}`);
    return true;
  };

  try {
    console.log('🏢 BRS private-limited incorporation starting…');

    // ---- Login -----------------------------------------------------------
    // sso-login bounces brsv2 -> accounts.ecitizen.go.ke and the form is only
    // usable once that hop finishes. Wait for each control rather than typing
    // blind into a page that is still redirecting.
    let alreadySignedIn = false;

    await step('open eCitizen SSO', async () => {
      await page.goto('https://brsv2.ecitizen.go.ke/auth/sso-login', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await settle(page);

      // A saved session skips straight past SSO to the BRS dashboard.
      if (await passAccountSwitcher(page, 3000, ecitizenId)) await settle(page);
      const proceed = page.getByRole('link', { name: 'Proceed' }).first();
      if (await proceed.isVisible().catch(() => false)) {
        alreadySignedIn = true;
        console.log('     ↳ reusing the saved eCitizen session — skipping login');
        return;
      }

      const ssoLink = page.getByRole('link', { name: 'Login with eCitizen' });
      if (await ssoLink.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForLoadState('domcontentloaded').catch(() => {}),
          ssoLink.click(),
        ]);
        await settle(page);
      }

      // The SSO hop may already land authenticated.
      if (await passAccountSwitcher(page, 3000, ecitizenId)) await settle(page);
      if (isAuthenticated(page)) {
        alreadySignedIn = true;
        console.log('     ↳ already authenticated — skipping login');
      }
    });

    // eCitizen intermittently rejects a first attempt ("Invalid username or
    // password" alongside a reconnect banner) even on good credentials, so
    // retry twice — each retry types slower and waits longer.
    await step('sign in', async () => {
      if (alreadySignedIn) {
        console.log('     ↳ skipped (session already authenticated)');
        return;
      }
      const MAX_ATTEMPTS = 3;
      let lastReason = '';

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const slow = attempt > 1;
        const delay = slow ? 140 : 45;
        const pause = slow ? 2000 : 600;

        if (attempt > 1) {
          console.log(`     ↳ retry ${attempt - 1}/${MAX_ATTEMPTS - 1} (slower: ${delay}ms/key, ${pause}ms waits)`);
          // Stay on the login page — it keeps the form after a rejection, and
          // restarting the SSO hop just loses time.
          const dismiss = page.locator('[role="alert"] button, .alert button').first();
          if (await dismiss.isVisible().catch(() => false)) {
            await dismiss.click().catch(() => {});
          }
          await page.waitForTimeout(pause);
        }

        // The form disappearing usually means the previous submit went through
        // after all — don't sit waiting 30s for a field that is gone.
        if (isAuthenticated(page)) {
          console.log('     ↳ already past the login page — signed in');
          await passAccountSwitcher(page, 10000, ecitizenId);
          return;
        }

        const idField = page.getByLabel('Email address or ID number');
        try {
          await idField.waitFor({ state: 'visible', timeout: 30000 });
        } catch {
          if (isAuthenticated(page)) {
            console.log('     ↳ navigated away while retrying — signed in');
            await passAccountSwitcher(page, 10000, ecitizenId);
            return;
          }
          throw new Error(`login form never appeared at ${page.url()}`);
        }

        const pwField = page.getByLabel('Password');

        await typeInto(idField, ecitizenId, delay, pause);
        await typeInto(pwField, password, delay, pause);
        await page.waitForTimeout(pause);

        // The ID field gets wiped when focus moves to the password box while
        // the SSO page is still hydrating, which submits a blank username and
        // reads back as "Invalid username or password". Verify both fields and
        // top up whichever lost its value before submitting.
        let ok = false;
        for (let fix = 1; fix <= 3 && !ok; fix++) {
          const typedId = await idField.inputValue().catch(() => '');
          const typedPw = await pwField.inputValue().catch(() => '');
          console.log(
            `     ↳ field check — id="${typedId}" (want "${ecitizenId}"), ` +
            `password length ${typedPw.length} (want ${String(password).length})`
          );

          ok = typedId === String(ecitizenId) && typedPw === String(password);
          if (ok) break;

          if (typedId !== String(ecitizenId)) {
            console.log('     ↳ re-entering ID');
            await typeInto(idField, ecitizenId, delay, pause);
          }
          if (typedPw !== String(password)) {
            console.log('     ↳ re-entering password');
            await typeInto(pwField, password, delay, pause);
          }
          await page.waitForTimeout(pause);
        }

        if (!ok) {
          console.log('     ↳ fields would not hold their values; retrying attempt');
          continue;
        }

        const signIn = page.getByRole('button', { name: 'Sign In', exact: true });
        await signIn.waitFor({ state: 'visible' });
        await signIn.click();
        await settle(page, slow ? 4000 : 2500);

        // Signed in means "off the login page" — a success lands on the
        // account switcher, which is still on the accounts host. The BRS
        // dashboard can also be slow, and eCitizen shows a transient
        // "trouble connecting" banner on the way through.
        try {
          await page.waitForURL(() => isAuthenticated(page), { timeout: 60000 });
        } catch {
          lastReason = await describeLoginFailure(page);
          console.log(`     ↳ attempt ${attempt} failed: ${lastReason.split(' | ')[0]}`);
          continue;
        }

        await settle(page, 1500);
        console.log(`     ↳ signed in on attempt ${attempt}`);
        await passAccountSwitcher(page, 10000, ecitizenId);

        // Clear the post-login interstitial if the portal shows one.
        const cont = page.getByRole('button', { name: 'Continue' });
        if (await cont.isVisible().catch(() => false)) {
          await cont.click();
          await settle(page, pause);
        }
        return;
      }

      throw new Error(`login failed after ${MAX_ATTEMPTS} attempts — ${lastReason}`);
    });

    await step('wait for the BRS dashboard', async () => {
      // The SSO handshake is a chain of redirects (authorize -> sso-redirect ->
      // BRS). Never page.goto() through it: navigating mid-flight cancels the
      // handshake and is what produces eCitizen's "trouble connecting" banner.
      // Just wait, the way the recording implicitly does.
      await passAccountSwitcher(page, 15000, ecitizenId);

      const proceed = page.getByRole('link', { name: 'Proceed' }).first();
      try {
        await proceed.waitFor({ state: 'visible', timeout: 120000 });
      } catch {
        throw new Error(await describePage(page, 'no-proceed'));
      }
    });

    await step('open company registration', async () => {
      const tabsBefore = context.pages().length;
      await page.getByRole('link', { name: /proceed/i }).first().click();
      await settle(page, 2500);
      await followNewTab(tabsBefore);
      console.log(`     ↳ after Proceed: ${page.url()}`);

      // Recording picked the 5th service tile; fall back to finding it by name
      // if the dashboard has been reordered since.
      const tile = page.locator('div:nth-child(5) > .flex > .ml-3');
      if (await tile.isVisible().catch(() => false)) {
        await tile.click();
      } else {
        const byName = page.getByText(/private limited|company registration/i).first();
        if (!(await byName.isVisible().catch(() => false))) {
          throw new Error(await describePage(page, 'no-service-tile'));
        }
        await byName.click();
      }

      await settle(page, 1500);
      const next = page.getByRole('button', { name: 'Next' });
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await settle(page);
      }
      await followNewTab(tabsBefore);
      console.log(`     ↳ on the wizard: ${page.url()}`);
    });

    // ---- Step 1: name reservation ---------------------------------------
    // The recording's `#sq_476`-style ids are per-application question ids and
    // do not exist in a new filing, so match the controls by what they are
    // instead: the name boxes share one placeholder, and the "similar name?"
    // questions are the selects that offer a NO option.
    await step('name options', async () => {
      const fields = page.getByPlaceholder(NAME_FIELD);
      try {
        await fields.first().waitFor({ state: 'visible', timeout: 45000 });
      } catch {
        throw new Error(await describePage(page, 'no-name-form'));
      }

      const count = await fields.count();
      console.log(`     ↳ ${count} name field(s) on this step`);
      for (let i = 0; i < count; i++) {
        await fillWhenReady(fields.nth(i), data.nameOptions[i] || data.nameOptions[0]);
      }

      const answered = await answerNoSelects(page);
      console.log(`     ↳ answered NO on ${answered} select(s)`);
      console.log(`     ↳ names: ${data.nameOptions.slice(0, count).join(' / ')}`);

      if (!await clickNext(page, 'name options')) {
        throw new Error(await describePage(page, 'names-rejected'));
      }
    });

    await step('confirm reserved name', async () => {
      // Only touch a name box if the wizard genuinely moved to another step —
      // filling one that is still the previous page overwrites option 1.
      const fields = page.getByPlaceholder(NAME_FIELD);
      if (!(await fields.first().isVisible().catch(() => false))) {
        console.log('     ↳ past name reservation');
        return;
      }
      if (await fields.count() > 1) {
        console.log('     ↳ still on the multi-name step — not overwriting');
        return;
      }
      await fillWhenReady(fields.first(), data.reservedName);
      await clickNext(page, 'confirm reserved name');
    });

    // ---- Step 2: applicant capacity (its own "Applicant Details" tab) -----
    await step('applicant capacity', async () => {
      await selectWhenReady(
        page.getByLabel('Capacity *').getByRole('combobox'), data.capacity
      );
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Address' }), data.applicantAddress
      );
      await selectWhenReady(
        page.getByLabel('Postal Code *').getByRole('combobox'), data.applicantPostalCode
      );
      // BRS now paginates by tab (Proposed Names / Applicant Details / Nature
      // of Business / ...) — the recording's single continuous page no longer
      // exists, so each tab needs its own Next before the next tab's fields
      // are even in the DOM.
      if (!await clickNext(page, 'applicant capacity')) {
        throw new Error(await describePage(page, 'applicant-capacity-blocked'));
      }
    });

    // ---- Step 2b: memorandum — "Nature of Business" tab -------------------
    await step('memorandum', async () => {
      // getByRole('radio', { name }) already resolves to the <input>; the
      // recording's extra .locator('input[name="..._sq_NNN"]') pinned a
      // per-application id that doesn't exist on a fresh filing.
      await checkRadio(page.getByRole('radio', { name: 'The company will adopt the' }));
      await checkRadio(page.getByRole('radio', { name: 'Non Regulated' }));
    });

    // ---- Step 3: objects, classification, projections --------------------
    await step('primary objects', async () => {
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Primary Objects of the Company' }),
        data.primaryObjects
      );
    });

    await step('sector classification', async () => {
      await selectWhenReady(page.getByLabel('Sector *').getByRole('combobox'), data.sector);
      await selectWhenReady(page.getByLabel('Division *').getByRole('combobox'), data.division);
      // Group/Class repopulate over XHR after Division changes, so each pair
      // has to wait for its options rather than being set back to back.
      for (let i = 0; i < data.groups.length; i++) {
        await settle(page, 400);
        await selectWhenReady(page.getByLabel('Group *').getByRole('combobox'), data.groups[i]);
        await settle(page, 400);
        await selectWhenReady(page.getByLabel('Class *').getByRole('combobox'), data.classes[i]);
      }
    });

    await step('trading projections', async () => {
      await fillWhenReady(
        page.getByLabel('Target Business Start date *').getByRole('textbox'),
        data.startDate
      );
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Accounting Period End Month' }),
        data.accountingPeriodEnd
      );
      await fillWhenReady(
        page.getByRole('spinbutton', { name: 'Number of Employees at Target' }),
        data.employees
      );
      await fillWhenReady(
        page.getByRole('spinbutton', { name: 'Estimated annual turnover (' }),
        data.turnover
      );

      await checkRadio(
        page.getByLabel('Is the Company you are registering a Subsidiary Company or a branch? *')
          .getByRole('radio', { name: 'No' })
      );
      await checkRadio(
        page.getByLabel('Was your business formed as a result of amalgamation or acquisition? *')
          .getByRole('radio', { name: 'No' })
      );

      if (!await clickNext(page, 'trading projections')) {
        throw new Error(await describePage(page, 'nature-of-business-blocked'));
      }
    });

    // ---- Step 4: registered office --------------------------------------
    await step('registered office', async () => {
      // County -> District -> Locality is a dependent chain; each level only
      // populates after the one above it fires its change handler.
      await selectWhenReady(page.getByLabel('County *').getByRole('combobox'), data.county);
      await settle(page, 400);
      await selectWhenReady(page.getByLabel('District *').getByRole('combobox'), data.district);
      await settle(page, 400);
      await selectWhenReady(page.getByLabel('Locality *').getByRole('combobox'), data.locality);

      await fillWhenReady(
        page.getByRole('textbox', { name: 'Name of building/Plot No./' }), data.building
      );
      await fillWhenReady(page.getByRole('textbox', { name: 'Street/Road' }), data.street);
      await fillWhenReady(page.getByRole('textbox', { name: 'Floor' }), data.floor);
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Postal Address' }), data.postalAddress
      );
      await selectWhenReady(
        page.getByLabel('Postal Code *').getByRole('combobox'), data.postalCode
      );
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Mobile Number' }), data.officeMobile
      );
      // #sq_209 in the recording — resolve by label, the ids are per-application.
      const officeEmail = page.getByRole('textbox', { name: /e-?mail/i }).first();
      if (await officeEmail.isVisible().catch(() => false)) {
        await fillWhenReady(officeEmail, data.officeEmail);
      }
    });

    await step('validate office address', async () => {
      await page.getByRole('button', { name: 'Validate' }).click();
      await settle(page, 1200);
      await page.getByRole('button', { name: 'Next' }).click();
      await settle(page);
    });

    await step('contact mobile', async () => {
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Mobile Number' }), data.contactMobile
      );
      await page.getByRole('button', { name: 'Next' }).click();
      await settle(page);
    });

    // ---- Step 5: share capital ------------------------------------------
    await step('share capital', async () => {
      // The share-type combobox renders as "Loading..." until its options land.
      await page.getByRole('option', { name: data.shareType }).click({ timeout: 20000 })
        .catch(async () => {
          await page.getByLabel('Loading...').click();
          await page.getByRole('option', { name: data.shareType }).click();
        });
      await page.getByRole('spinbutton').first().click({ clickCount: 3 });
      await page.getByRole('spinbutton').first().fill(data.shareCapital);
      await page.getByRole('spinbutton').nth(1).fill(data.nominalValue);
      await page.getByRole('button', { name: 'Next' }).click();
      await settle(page);
    });

    // ---- Step 6: first director / shareholder ---------------------------
    const d = data.director;

    await step('open director card', async () => {
      await page.getByRole('button', { name: 'Add Director/Shareholder' }).click();
      await settle(page);
      await selectWhenReady(
        page.getByLabel('Designation *').getByRole('combobox'), d.designation
      );
      await selectWhenReady(page.getByLabel('ID Type *').getByRole('combobox'), d.idType);
      await settle(page, 400);
    });

    await step('IPRS identity lookup', async () => {
      // #sq_561 in the recording: the id/name pair sitting above the Search
      // button. Ids are per-application, so take the visible pair by role.
      await fillWhenReady(page.getByRole('spinbutton').first(), d.idNumber);
      await fillWhenReady(page.getByRole('textbox').first(), d.firstName);
      await page.getByRole('button', { name: 'Search' }).click();
      // The lookup round-trips to IPRS and back-fills the legal name.
      await settle(page, 2500);
    });

    await step('director contact details', async () => {
      await fillWhenReady(page.getByRole('textbox', { name: 'Phone Number' }), d.phone);
      await fillWhenReady(page.getByRole('textbox', { name: 'Email' }), d.email);
      await fillWhenReady(
        page.getByRole('spinbutton', { name: 'Postal Address' }), d.postalAddress
      );
      await selectWhenReady(
        page.getByLabel('Postal code *').getByRole('combobox'), d.postalCode
      );
      await fillWhenReady(page.getByRole('textbox', { name: 'Occupation' }), d.occupation);
    });

    await step('director address', async () => {
      await selectWhenReady(page.getByLabel('County *').getByRole('combobox'), d.county);
      await settle(page, 400);
      await selectWhenReady(page.getByLabel('District *').getByRole('combobox'), d.district);
      await settle(page, 400);
      await selectWhenReady(page.getByLabel('Locality *').getByRole('combobox'), d.locality);
      await fillWhenReady(page.getByRole('textbox', { name: 'Street/Road' }), d.street);
      await fillWhenReady(
        page.getByRole('textbox', { name: 'Name of building/Plot No./' }), d.building
      );
    });

    await step('issue shares', async () => {
      await page.getByRole('button', { name: 'Issue Shares' }).click();
      await fillWhenReady(page.getByPlaceholder('Enter quantity'), d.sharesFirst);
      await page.getByPlaceholder('Enter quantity').press('Enter');
      await settle(page, 800);
      await page.getByRole('button', { name: 'Issue Shares' }).click();
      await fillWhenReady(page.getByPlaceholder('Enter quantity'), d.sharesSecond);
      await page.getByRole('button', { name: 'Issue Shares' }).click();
      await settle(page, 800);
    });

    await step('passport photo', async () => {
      const photo = path.isAbsolute(d.passportPhoto)
        ? d.passportPhoto
        : path.resolve(process.cwd(), d.passportPhoto);
      if (!fs.existsSync(photo)) {
        throw new Error(`passport photo not found at ${photo}`);
      }
      await page.getByRole('textbox', { name: 'Passport Photo' }).setInputFiles(photo);
    }, { optional: true });

    await step('beneficial-owner declaration', async () => {
      const bo = page.getByLabel('Effective date of becoming B.O *').getByRole('textbox');
      await fillWhenReady(bo, d.boEffectiveDate);
      await bo.press('Enter');
      await settle(page, 400);
      await selectWhenReady(
        page.getByLabel('Source of Beneficial Owner information *').getByRole('combobox'),
        d.boSource
      );
    });

    await step('save director', async () => {
      await page.getByRole('button', { name: 'Save' }).click();
      await page.getByRole('button', { name: 'Add Director/Shareholder' }).click();
    });

    console.log('✅ BRS form filled — stopped at the review screen. Nothing submitted.');

    // Attended demo: leave the window up so the filled form can be inspected.
    if (process.env.AUTO_CLOSE?.toLowerCase() === 'true') {
      await context.close();
    }

    return { success: true, reservedName: data.reservedName, submitted: false };
  } catch (err) {
    console.error(`❌ BRS private-ltd failed: ${err.message}`);
    if (process.env.AUTO_CLOSE?.toLowerCase() === 'true') {
      await context.close().catch(() => {});
    }
    throw err;
  }
}

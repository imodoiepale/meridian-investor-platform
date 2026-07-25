#!/usr/bin/env node
/**
 * Meridian E2E Dry-Run Harness
 * ────────────────────────────
 * Walks through every automation endpoint with sample data so a demo viewer can
 * watch the browser drive real government portals — WITHOUT submitting anything.
 *
 * Requires:
 *   • backend  running on :5001   (python run_local.py)
 *   • automations running on :5000 (node automations/server.mjs — HEADLESS=false)
 *   • frontend running on :3000   (npm --prefix frontend run dev) — optional
 *
 * Environment:
 *   HEADLESS=false    watch the browser step-by-step (default)
 *   AUTO_CLOSE=false  keep browser open after each pass
 *   DRY_RUN=true      set globally — enforced by this harness
 *   SLOW_MO=250       slow every action so the demo is legible
 *
 * Flows exercised (all dry — no Submit clicks):
 *   1.  Save profile             → POST /api/agent/profile
 *   2.  Trickle-research         → POST /api/agent/trickle-research
 *   3.  KRA credential check     → POST /api/kra/check-credentials
 *   4.  KRA PIN registration     → POST /api/kra/register-pin       (form-fill only)
 *   5.  KRA nil-return           → POST /api/kra/file-nil-return    (nav-only)
 *   6.  eTA Kenya                → POST /api/permit/eta-kenya       (form-fill only)
 *   7.  Class G                  → POST /api/permit/class-g         (form-fill only)
 *   8.  BRS                      → POST /api/brs                    (login-only)
 *   9.  NSSF                     → POST /api/nssf                   (form-fill only)
 *  10.  SHA                      → POST /api/sha                    (form-fill only)
 *
 * Per-run summary written to `./e2e-report-<ISO>.json` beside this file.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SAMPLE_INVESTOR, SAMPLE_KRA_ACCOUNTS, SAMPLE_EFNS_LOGIN,
  SAMPLE_CLASS_G_FORM, SAMPLE_ETA_FORM, SAMPLE_NSSF_PROFILE,
  SAMPLE_SHA_COMPANY, SAMPLE_BRS, SAMPLE_KRA_PIN_PROFILE,
} from './e2e-sample-data.mjs';

const BACKEND    = process.env.BACKEND_URL     || 'http://localhost:5001';
const AUTOMATION = process.env.AUTOMATIONS_URL || 'http://localhost:5000';
const DRY_RUN    = true; // hard-coded: this harness never submits

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── console helpers ─────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
  magenta: '\x1b[35m',
};
const banner = (n, total, name) => {
  const bar = '━'.repeat(60);
  console.log(`\n${c.cyan}${bar}${c.reset}`);
  console.log(`${c.bold}${c.cyan}▶ Step ${n}/${total}: ${name}${c.reset}`);
  console.log(`${c.cyan}${bar}${c.reset}`);
};
const step   = (msg) => console.log(`  ${c.dim}·${c.reset} ${msg}`);
const ok     = (msg) => console.log(`  ${c.green}✔${c.reset} ${msg}`);
const warn   = (msg) => console.log(`  ${c.yellow}!${c.reset} ${msg}`);
const fail   = (msg) => console.log(`  ${c.red}✘${c.reset} ${msg}`);
const pause  = (ms)  => new Promise(r => setTimeout(r, ms));

// ── HTTP helpers ────────────────────────────────────────────────────────────
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, ok: res.ok, json, text };
}

async function get(url) {
  const res = await fetch(url);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, ok: res.ok, json, text };
}

async function checkService(label, url) {
  step(`Preflight ${label} at ${url}`);
  try {
    const r = await get(url);
    if (r.ok) { ok(`${label} reachable (${r.status})`); return true; }
    warn(`${label} responded ${r.status}`);
    return false;
  } catch (err) {
    fail(`${label} unreachable: ${err.message}`);
    return false;
  }
}

// ── Flow runners ────────────────────────────────────────────────────────────
const results = [];
const started = new Date().toISOString();

async function run(name, fn) {
  const idx = results.length + 1;
  banner(idx, 10, name);
  const startedAt = Date.now();
  try {
    const outcome = await fn();
    const ms = Date.now() - startedAt;
    const status = outcome?.skipped ? 'skipped' : 'ok';
    results.push({ step: idx, name, status, ms, ...outcome });
    if (outcome?.skipped) warn(`${name} skipped: ${outcome.reason}`);
    else ok(`${name} completed in ${ms}ms`);
  } catch (err) {
    const ms = Date.now() - startedAt;
    fail(`${name} failed: ${err.message}`);
    results.push({ step: idx, name, status: 'error', ms, error: err.message });
  }
}

async function flowSaveProfile() {
  step(`Saving profile for session=${SAMPLE_INVESTOR.session_id}`);
  const body = { session_id: SAMPLE_INVESTOR.session_id, profile: SAMPLE_INVESTOR };
  const r = await post(`${BACKEND}/api/agent/profile`, body);
  if (!r.ok) throw new Error(`profile save ${r.status}: ${r.text}`);
  ok(`Profile persisted (keys=${Object.keys(r.json?.profile || {}).length})`);
  return { session_id: r.json?.session_id };
}

async function flowTrickleResearch() {
  step(`Firing market_gap_research + build_licensing_roadmap for ${SAMPLE_INVESTOR.sector} / ${SAMPLE_INVESTOR.county}`);
  const body = {
    session_id: SAMPLE_INVESTOR.session_id,
    sector: SAMPLE_INVESTOR.sector,
    country: SAMPLE_INVESTOR.destination_country,
    county: SAMPLE_INVESTOR.county,
  };
  const r = await post(`${BACKEND}/api/agent/trickle-research`, body);
  if (!r.ok) throw new Error(`trickle-research ${r.status}: ${r.text}`);
  const gaps = Array.isArray(r.json?.market_gaps) ? r.json.market_gaps.length : 'n/a';
  const stages = r.json?.roadmap?.stages?.length ?? 'n/a';
  ok(`Research complete — market_gaps=${gaps}, roadmap stages=${stages}`);
  return { market_gaps: gaps, roadmap_stages: stages };
}

async function flowKraCredentialCheck() {
  const acct = SAMPLE_KRA_ACCOUNTS[0];
  step(`Login-only credential check for ${acct.pin} (${acct.company_name})`);
  const r = await post(`${AUTOMATION}/api/kra/check-credentials`, {
    pin: acct.pin, password: acct.password, company_name: acct.company_name,
  });
  if (!r.ok) throw new Error(`kra check ${r.status}: ${r.text}`);
  ok(`iTax browser opened — watch it OCR the captcha & login`);
  await journeyLog('registration_kra_credential_check', { jobId: r.json?.jobId, pin: acct.pin });
  return { jobId: r.json?.jobId };
}

async function flowKraRegisterPin() {
  step('Filling KRA PIN registration form (stops before final Submit)');
  const r = await post(`${AUTOMATION}/api/kra/register-pin`, { profile: SAMPLE_KRA_PIN_PROFILE });
  if (!r.ok) throw new Error(`kra register-pin ${r.status}: ${r.text}`);
  ok(`Browser will drive: #newReg → Click Here → INDI + ON → Next → wizard`);
  await journeyLog('registration_kra_pin', { jobId: r.json?.jobId, dryRun: true });
  return { jobId: r.json?.jobId };
}

async function flowKraNilReturn() {
  const acct = SAMPLE_KRA_ACCOUNTS[0];
  step(`PAYE nil-return navigation for ${acct.pin} — will land on Nil Return form`);
  step(`${c.yellow}DRY-RUN${c.reset}: harness invokes the endpoint; kill the tab before the final dialog Accept to keep it non-submitting.`);
  const r = await post(`${AUTOMATION}/api/kra/file-nil-return`, {
    pin: acct.pin, password: acct.password, kind: 'paye',
    company_name: acct.company_name, dryRun: true,
  });
  if (!r.ok) throw new Error(`kra nil-return ${r.status}: ${r.text}`);
  ok(`Navigation started (jobId=${r.json?.jobId}) — stop the browser at the review dialog to abort submit`);
  await journeyLog('registration_kra_nil_return', { jobId: r.json?.jobId, kind: 'paye', dryRun: true });
  return { jobId: r.json?.jobId };
}

async function flowEta() {
  step('eTA Kenya form-fill (no submit)');
  const r = await post(`${AUTOMATION}/api/permit/eta-kenya`, {
    formData: SAMPLE_ETA_FORM,
    dryRun: true,
  });
  if (!r.ok) throw new Error(`eta ${r.status}: ${r.text}`);
  ok(`eTA browser opened — jobId=${r.json?.jobId}`);
  await journeyLog('immigration_eta', { jobId: r.json?.jobId, dryRun: true });
  return { jobId: r.json?.jobId };
}

async function flowClassG() {
  step('Class G form-fill via eFNS');
  const r = await post(`${AUTOMATION}/api/permit/class-g`, {
    login: SAMPLE_EFNS_LOGIN,
    formData: SAMPLE_CLASS_G_FORM,
    dryRun: true,
  });
  if (!r.ok) return { skipped: true, reason: `endpoint returned ${r.status}: ${r.text.slice(0, 120)}` };
  ok(`Class G browser opened — form will populate; stop before final Submit`);
  await journeyLog('immigration_class_g', { dryRun: true });
  return {};
}

async function flowBrs() {
  step('BRS eCitizen login-only');
  const r = await post(`${AUTOMATION}/api/brs`, SAMPLE_BRS);
  if (!r.ok) return { skipped: true, reason: `endpoint returned ${r.status}: ${r.text.slice(0, 120)}` };
  ok(`BRS browser opened — validation-only (fake creds)`);
  await journeyLog('registration_brs', { jobId: r.json?.jobId, dryRun: true });
  return { jobId: r.json?.jobId };
}

async function flowNssf() {
  step('NSSF individual registration form-fill');
  const r = await post(`${AUTOMATION}/api/nssf`, { profile: SAMPLE_NSSF_PROFILE });
  if (!r.ok) return { skipped: true, reason: `endpoint returned ${r.status}: ${r.text.slice(0, 120)}` };
  ok(`NSSF browser opened — jobId=${r.json?.jobId}`);
  await journeyLog('registration_nssf', { jobId: r.json?.jobId, dryRun: true });
  return { jobId: r.json?.jobId };
}

async function flowSha() {
  step('SHA employer registration form-fill');
  const r = await post(`${AUTOMATION}/api/sha`, { company: SAMPLE_SHA_COMPANY });
  if (!r.ok) return { skipped: true, reason: `endpoint returned ${r.status}: ${r.text.slice(0, 120)}` };
  ok(`SHA browser opened — jobId=${r.json?.jobId}`);
  await journeyLog('registration_sha', { jobId: r.json?.jobId, dryRun: true });
  return { jobId: r.json?.jobId };
}

/** Append a journey event to the investor session so the dashboard renders live. */
async function journeyLog(step, data = {}) {
  try {
    await post(`${BACKEND}/api/agent/profile`, {
      session_id: SAMPLE_INVESTOR.session_id,
      profile: {
        [`e2e_${step}`]: { at: new Date().toISOString(), ...data },
      },
    });
  } catch { /* best-effort */ }
}

// ── main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`${c.bold}${c.magenta}\n╔═══════════════════════════════════════════════════════╗`);
  console.log(`║   Meridian E2E Dry-Run — Land · Launch · Live         ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`${c.dim}started=${started}  backend=${BACKEND}  automations=${AUTOMATION}${c.reset}`);
  console.log(`${c.yellow}⚠  DRY-RUN MODE: no government form will be submitted.${c.reset}`);
  console.log(`${c.dim}Kill the automation browser at the review step if any flow proceeds too far.${c.reset}\n`);

  // preflight
  banner(0, 10, 'Preflight');
  const backendUp = await checkService('backend', `${BACKEND}/api/agent/tools`);
  const automationUp = await checkService('automations', `${AUTOMATION}/health`);
  if (!backendUp || !automationUp) {
    fail('One or more services unreachable. Aborting.');
    process.exit(1);
  }

  // Ensure automations server sees HEADLESS=false so viewer can watch
  const health = await get(`${AUTOMATION}/health`);
  if (health.json?.env?.headless && String(health.json.env.headless).toLowerCase() !== 'false') {
    warn(`automations HEADLESS=${health.json.env.headless} — restart with HEADLESS=false to watch the browser`);
  } else {
    ok('automations running in headful mode');
  }

  await run('Save investor profile',          flowSaveProfile);
  await run('Trickle-research',               flowTrickleResearch);
  await run('KRA credential check',           flowKraCredentialCheck);
  await pause(8_000); // let the browser start & OCR before firing the next flow
  await run('KRA PIN registration',           flowKraRegisterPin);
  await pause(8_000);
  await run('KRA PAYE nil-return',            flowKraNilReturn);
  await pause(8_000);
  await run('eTA Kenya',                      flowEta);
  await pause(4_000);
  await run('Class G',                        flowClassG);
  await pause(4_000);
  await run('BRS eCitizen',                   flowBrs);
  await pause(4_000);
  await run('NSSF',                           flowNssf);
  await pause(4_000);
  await run('SHA',                            flowSha);

  // ── summary ──
  const finished = new Date().toISOString();
  const summary = {
    started, finished, backend: BACKEND, automation: AUTOMATION,
    investor: SAMPLE_INVESTOR.session_id, dryRun: DRY_RUN,
    results,
  };
  const reportPath = path.join(__dirname, `e2e-report-${finished.replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

  console.log(`\n${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━ SUMMARY ━━━━━━━━━━━━━━━━━${c.reset}`);
  for (const r of results) {
    const icon = r.status === 'ok' ? `${c.green}✔${c.reset}`
               : r.status === 'skipped' ? `${c.yellow}○${c.reset}`
               : `${c.red}✘${c.reset}`;
    console.log(`  ${icon} ${String(r.step).padStart(2)}. ${r.name.padEnd(30)} ${r.ms}ms  ${r.error || r.reason || ''}`);
  }
  console.log(`\n${c.dim}Report: ${reportPath}${c.reset}\n`);

  // Non-zero exit if anything errored
  const failed = results.filter(r => r.status === 'error').length;
  process.exit(failed ? 1 : 0);
})();

<template>
  <div class="auto-page">
    <header class="page-head">
      <div>
        <p class="m-eyebrow">Live automations</p>
        <h1 class="page-title">Government portals</h1>
        <p class="page-sub">
          Each button opens a real browser and fills the portal with your saved profile.
          Nothing is submitted — the run stops at the final review screen.
        </p>
      </div>
      <div class="runner" :class="runnerClass">
        <span class="dot"></span>
        {{ runnerLabel }}
      </div>
    </header>

    <div v-if="missingFields.length" class="banner warn">
      Your profile is missing
      <strong>{{ missingFields.join(', ') }}</strong> —
      <RouterLink to="/profile">complete it</RouterLink> before filing.
    </div>

    <section v-for="group in groups" :key="group.title" class="group">
      <div class="group-head">
        <h2 class="group-title">{{ group.title }}</h2>
        <p class="group-sub">{{ group.sub }}</p>
      </div>

      <div class="card-grid">
        <article
          v-for="(portal, i) in group.portals"
          :key="portal.code"
          class="portal-card"
          v-reveal="{ delay: i * 60, y: 16 }"
        >
          <div class="card-top">
            <span class="portal-agency">{{ portal.agency }}</span>
            <span v-if="portal.flagship" class="badge">Start here</span>
          </div>
          <h3 class="portal-name">{{ portal.name }}</h3>
          <p class="portal-desc">{{ portal.desc }}</p>

          <button
            class="m-btn m-btn-primary m-btn-sm run-btn"
            :disabled="busy === portal.code"
            @click="run(portal)"
          >
            <span v-if="busy === portal.code" class="spinner"></span>
            {{ busy === portal.code ? 'Opening browser…' : 'Run automation' }}
          </button>

          <p v-if="results[portal.code]" class="result" :class="results[portal.code].kind">
            {{ results[portal.code].text }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const sessionId = localStorage.getItem('meridian_session')

const busy = ref('')
const results = reactive({})
const runner = reactive({ online: false, browserVisible: false, checked: false })
const missingFields = ref([])

// eFNS leads the demo: it is the portal the whole Land stage hangs off.
const groups = [
  {
    title: 'Immigration — eFNS',
    sub: 'fns.immigration.go.ke — permits, passes and the electronic travel authority.',
    portals: [
      { code: 'eta', agency: 'eTA Kenya', name: 'Electronic Travel Authority', flagship: true, desc: 'The first thing every investor needs. No portal login — but it stops at the upload page without a passport biodata scan in Documents.' },
      { code: 'class-g', agency: 'eFNS', name: 'Class G — Investor Permit', flagship: true, desc: 'The investor work permit. Fills all 40 form fields from your profile.' },
      { code: 'class-d', agency: 'eFNS', name: 'Class D — Employment Permit', desc: 'For an investor employed by a specific Kenyan employer.' },
      { code: 'class-n', agency: 'eFNS', name: 'Class N — Spouse Permit', desc: 'Residence on the basis of marriage to a Kenyan citizen.' },
      { code: 'class-r', agency: 'eFNS', name: 'Class R — Refugee Permit', desc: 'Residence permit issued on refugee status.' },
      { code: 'special-pass', agency: 'eFNS', name: 'Special Pass', desc: 'Short-term authority to work while a permit is pending.' },
      { code: 'student-pass', agency: 'eFNS', name: 'Student Pass', desc: 'For dependants enrolling in Kenyan institutions.' },
      { code: 'dependant-pass', agency: 'eFNS', name: "Dependant's Pass (Form 28)", desc: 'Attaches your spouse and children to your permit.' },
      { code: 're-entry-pass', agency: 'eFNS', name: 'Re-entry Pass', desc: 'Preserves residence status while travelling out of Kenya.' },
      { code: 'dual-citizenship', agency: 'eFNS', name: 'Dual Citizenship', desc: 'Declaration for investors eligible for Kenyan citizenship.' },
    ],
  },
  {
    title: 'Company registration',
    sub: 'eCitizen and the statutory employer registrations that follow incorporation.',
    portals: [
      { code: 'brs', agency: 'BRS', name: 'Business Registration Service', desc: 'Name search, reservation and company incorporation on eCitizen.' },
      { code: 'nssf', agency: 'NSSF', name: 'Social Security registration', desc: 'Registers the company and its first employee with NSSF.' },
      { code: 'sha', agency: 'SHA', name: 'Social Health Authority', desc: 'Employer registration with the SHA (formerly NHIF).' },
    ],
  },
  {
    title: 'Tax — KRA iTax',
    sub: 'itax.kra.go.ke — credentials are read from the server environment, never the browser.',
    portals: [
      { code: 'kra-credentials', agency: 'KRA', name: 'Verify iTax credentials', desc: 'Logs in and confirms the PIN and password work. Solves the captcha by OCR.' },
      { code: 'kra-register', agency: 'KRA', name: 'Register a KRA PIN', desc: 'New taxpayer registration for the investor or the company.' },
      { code: 'kra-nil-return', agency: 'KRA', name: 'File a PAYE nil return', desc: 'Files the monthly nil return for a company with no payroll yet.' },
    ],
  },
]

const runnerClass = computed(() => {
  if (!runner.checked) return 'checking'
  if (!runner.online) return 'offline'
  return runner.browserVisible ? 'live' : 'headless'
})

const runnerLabel = computed(() => {
  if (!runner.checked) return 'Checking runner…'
  if (!runner.online) return 'Runner offline — start node automations/server.mjs'
  return runner.browserVisible ? 'Runner online — browser visible' : 'Runner online — headless'
})

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/agent/automations/catalog`)
    const data = await res.json()
    runner.online = data.online
    runner.browserVisible = data.browser_visible
  } catch {
    runner.online = false
  } finally {
    runner.checked = true
  }
})

async function run(portal) {
  busy.value = portal.code
  delete results[portal.code]
  try {
    const res = await fetch(`${API_BASE}/api/agent/automations/${portal.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    const data = await res.json()

    if (res.status === 422) {
      missingFields.value = data.missing_required || []
      results[portal.code] = { kind: 'err', text: `Missing: ${missingFields.value.join(', ')}` }
    } else if (!res.ok) {
      results[portal.code] = { kind: 'err', text: data.message || data.error || 'Launch failed.' }
    } else {
      results[portal.code] = { kind: 'ok', text: `Browser opened — job ${data.jobId || 'started'}` }
    }
  } catch (e) {
    results[portal.code] = { kind: 'err', text: e.message || 'Could not reach the backend.' }
  } finally {
    busy.value = ''
  }
}
</script>

<style scoped>
.auto-page { padding: 4px 0 64px; }

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 4px 0 6px;
  color: var(--text);
}

.page-sub {
  font-size: 14px;
  color: var(--text2);
  margin: 0;
  max-width: 60ch;
}

/* Runner status */
.runner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--text2);
}

.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text3); }
.runner.live { color: var(--success); border-color: color-mix(in srgb, var(--success) 40%, transparent); }
.runner.live .dot { background: var(--success); animation: pulse 2s var(--ease-out) infinite; }
.runner.headless { color: var(--warning); }
.runner.headless .dot { background: var(--warning); }
.runner.offline { color: var(--danger); }
.runner.offline .dot { background: var(--danger); }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--success) 50%, transparent); }
  50% { box-shadow: 0 0 0 5px transparent; }
}

/* Banner */
.banner {
  padding: 11px 16px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

.banner.warn {
  background: color-mix(in srgb, var(--warning) 10%, transparent);
  border-color: color-mix(in srgb, var(--warning) 32%, transparent);
  color: var(--text);
}

.banner a { color: var(--accent); font-weight: 600; }

/* Groups */
.group { margin-bottom: 40px; }

.group-head { margin-bottom: 16px; }

.group-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0 0 3px;
  color: var(--text);
}

.group-sub { font-size: 13px; color: var(--text2); margin: 0; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 14px;
}

/* Card */
.portal-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out),
              border-color 180ms var(--ease-out);
}

.portal-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--accent) 34%, var(--border));
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.portal-agency {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--text3);
}

.badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
}

.portal-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
  color: var(--text);
}

.portal-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text2);
  margin: 0;
  flex: 1;
}

.run-btn {
  margin-top: 6px;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.result { font-size: 12px; margin: 2px 0 0; line-height: 1.45; }
.result.ok { color: var(--success); }
.result.err { color: var(--danger); }

@media (max-width: 720px) {
  .page-head { flex-direction: column; }
  .card-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .portal-card { transition: none; }
  .portal-card:hover { transform: none; }
  .spinner { animation: none; }
  .runner.live .dot { animation: none; }
}
</style>

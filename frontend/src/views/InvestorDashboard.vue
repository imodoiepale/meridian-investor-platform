<template>
  <div class="cc">
    <!-- ══ Heading ══ -->
    <header class="cc-head">
      <div>
        <h2>Market entry command center</h2>
        <p>Track progress, manage requirements, and coordinate with local experts.</p>
      </div>
      <div v-if="profile.sector || profile.county" class="cc-chips">
        <span v-if="profile.sector" class="chip">{{ profile.sector }}</span>
        <span v-if="profile.county" class="chip">{{ profile.county }}</span>
      </div>
    </header>

    <!-- ══ Stage rail ══ -->
    <ol class="rail" aria-label="Market entry stages">
      <li v-for="(s, i) in stages" :key="s.id" :class="s.state">
        <span class="rail-line" v-if="i > 0" aria-hidden="true" />
        <span class="rail-dot">
          <svg v-if="s.state === 'complete'" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="m3.5 8.4 3 3 6-6.8" fill="none" stroke="currentColor" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-else class="rail-num">{{ i + 1 }}</span>
        </span>
        <span class="rail-label">{{ s.label }}</span>
      </li>
    </ol>

    <div v-if="loadError" class="cc-error">
      {{ loadError }}
      <router-link to="/profile">Set up your profile →</router-link>
    </div>

    <!-- ══ Body ══ -->
    <div class="cc-grid">
      <div class="cc-col">
        <!-- Next action -->
        <section class="card next-action" v-reveal="{ y: 14 }">
          <p class="card-kicker">Next action</p>
          <div class="na-body">
            <span class="na-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z"
                      stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M11 2.5v4h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </span>
            <div class="na-text">
              <h3>{{ nextAction.title }}</h3>
              <p>{{ nextAction.description }}</p>
              <p class="na-eta">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 4.6V8l2.2 1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                Estimated time: {{ nextAction.eta }}
              </p>
            </div>
            <router-link :to="nextAction.to" class="m-btn m-btn-primary m-btn-sm">Continue</router-link>
          </div>
        </section>

        <!-- Required documents -->
        <section class="card" v-reveal="{ y: 14, delay: 80 }">
          <div class="card-head">
            <h3>Required documents</h3>
          </div>
          <ul class="doc-list">
            <li v-for="d in documents" :key="d.name">
              <span class="doc-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                  <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z"
                        stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M11 2.5v4h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="doc-meta">
                <strong>{{ d.name }}</strong>
                <small>{{ d.hint }}</small>
              </span>
              <span class="pill" :class="d.status">{{ d.status === 'uploaded' ? 'Uploaded' : 'Pending' }}</span>
            </li>
          </ul>
          <router-link to="/documents" class="card-link">View all documents →</router-link>
        </section>

        <!-- Live automation log -->
        <section v-if="liveLogs.length" class="card" v-reveal="{ y: 14, delay: 120 }">
          <div class="card-head"><h3>Live automation</h3><span class="live-dot" /></div>
          <ul class="log-list">
            <li v-for="l in liveLogs.slice(0, 6)" :key="l.id">
              <code>{{ l.level || 'info' }}</code> {{ l.message }}
            </li>
          </ul>
        </section>
      </div>

      <aside class="cc-col">
        <!-- Experts -->
        <section class="card" v-reveal="{ y: 14, delay: 60 }">
          <div class="card-head">
            <h3>Trusted local experts</h3>
            <router-link to="/experts" class="card-link inline">View all experts →</router-link>
          </div>
          <ul class="expert-list">
            <li v-for="e in experts" :key="e.name">
              <span class="expert-avatar" :style="{ background: e.tint }">{{ e.initials }}</span>
              <span class="expert-meta">
                <strong>{{ e.name }}</strong>
                <small>{{ e.firm }}</small>
              </span>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" stroke-width="1.6"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </li>
          </ul>
        </section>

        <!-- Need help -->
        <section class="card help-card" v-reveal="{ y: 14, delay: 100 }">
          <h3>Need help?</h3>
          <p>Talk to your concierge — they know your file.</p>
          <router-link to="/concierge" class="m-btn m-btn-primary m-btn-sm">Message us</router-link>
        </section>

        <!-- Activity -->
        <section class="card" v-reveal="{ y: 14, delay: 140 }">
          <div class="card-head"><h3>Activity timeline</h3></div>
          <ol class="activity">
            <li v-for="(a, i) in activity" :key="i" :class="a.state">
              <span class="act-dot" />
              <span class="act-meta">
                <strong>{{ a.title }}</strong>
                <small>{{ a.date }}</small>
              </span>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { supabase, supabaseEnabled } from '../lib/supabase.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const loadError = ref('')
const profile = ref({})
const journey = ref([])
const applications = ref([])
const roadmap = ref(null)
const liveLogs = ref([])
let realtimeChan = null

const STAGE_DEFS = [
  { id: 'identity',   label: 'Identity',   match: ['profile_saved', 'identity'] },
  { id: 'immigration', label: 'Immigration', match: ['immigration_'] },
  { id: 'company',    label: 'Company',    match: ['brs_', 'company_'] },
  { id: 'tax',        label: 'Tax',        match: ['kra_', 'tax_'] },
  { id: 'banking',    label: 'Banking',    match: ['bank'] },
  { id: 'hiring',     label: 'Hiring',     match: ['nssf', 'sha', 'hiring'] },
  { id: 'launch',     label: 'Launch',     match: ['launch'] },
]

const completedStages = computed(() => {
  const steps = journey.value.map((e) => String(e.step || ''))
  return new Set(
    STAGE_DEFS.filter((s) => s.match.some((m) => steps.some((step) => step.startsWith(m)))).map((s) => s.id)
  )
})

const stages = computed(() => {
  const done = completedStages.value
  // First stage not yet complete becomes the active one.
  const activeIdx = STAGE_DEFS.findIndex((s) => !done.has(s.id))
  return STAGE_DEFS.map((s, i) => ({
    ...s,
    state: done.has(s.id) ? 'complete' : i === activeIdx ? 'active' : 'upcoming',
  }))
})

const NEXT_ACTIONS = {
  identity: {
    title: 'Complete your investor profile',
    description: 'We use this to personalise every requirement, permit, and licence on your roadmap.',
    eta: '5 minutes',
    to: '/profile',
  },
  immigration: {
    title: 'Start your immigration application',
    description: 'Apply for the permit class that matches your investment through the eFNS portal.',
    eta: '2–4 weeks',
    to: '/concierge',
  },
  company: {
    title: 'Complete company registration',
    description: 'Register your company with the Business Registration Service (eCitizen BRS).',
    eta: '5–8 days',
    to: '/applications',
  },
  tax: {
    title: 'Register for tax',
    description: 'Obtain your KRA PIN and register the tax obligations that apply to your business.',
    eta: '1–3 days',
    to: '/applications',
  },
  banking: {
    title: 'Open a corporate bank account',
    description: 'Your concierge will introduce you to banking partners that onboard foreign investors.',
    eta: '1–2 weeks',
    to: '/experts',
  },
  hiring: {
    title: 'Register as an employer',
    description: 'Enrol with NSSF and SHA so you can legally hire and pay staff.',
    eta: '3–5 days',
    to: '/applications',
  },
  launch: {
    title: 'Review your launch checklist',
    description: 'Everything is in place — confirm the final licences before you start trading.',
    eta: '1 day',
    to: '/invest/roadmap',
  },
}

const nextAction = computed(() => {
  const active = stages.value.find((s) => s.state === 'active')
  return NEXT_ACTIONS[active?.id] || NEXT_ACTIONS.launch
})

const documents = computed(() => {
  const has = (k) => Boolean(profile.value?.[k])
  return [
    { name: 'Passport copy', hint: 'Clear scan of the bio-data page', status: has('passport_no') ? 'uploaded' : 'pending' },
    { name: 'Proof of address', hint: 'Utility bill or bank statement', status: has('postalAddress') || has('origin_city') ? 'uploaded' : 'pending' },
    { name: 'Memorandum of Association', hint: 'Generated once your company name is reserved', status: has('company_name') ? 'uploaded' : 'pending' },
  ]
})

const experts = [
  { name: 'Grace Odhiambo', firm: 'Odhiambo & Co. Advocates', initials: 'GO', tint: 'linear-gradient(135deg,#1D55F5,#0F35A6)' },
  { name: 'Vincent Mwangi', firm: 'Mwangi Tax Partners', initials: 'VM', tint: 'linear-gradient(135deg,#20A565,#0E6B41)' },
  { name: 'James Karuki', firm: 'Karuki Consulting', initials: 'JK', tint: 'linear-gradient(135deg,#7E9FFF,#2B61FF)' },
]

const activity = computed(() => {
  const fromJourney = journey.value.slice(-4).reverse().map((e) => ({
    title: String(e.step || 'Update').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    date: fmtDate(e.at || e.timestamp),
    state: 'done',
  }))
  if (fromJourney.length) return fromJourney
  return [
    { title: 'Identity verification completed', date: '—', state: 'done' },
    { title: 'Immigration assessment approved', date: '—', state: 'done' },
    { title: 'Company registration started', date: '—', state: 'done' },
    { title: 'Tax registration', date: 'Upcoming', state: 'upcoming' },
  ]
})

function fmtDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return String(ts)
  }
}

onMounted(async () => {
  const sessionId = localStorage.getItem('meridian_session')
  if (!sessionId) {
    loadError.value = 'No investor profile found yet.'
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/agent/session/${sessionId}`)
    if (!res.ok) throw new Error('Session not found')
    const data = await res.json()
    profile.value = data.profile || {}
    journey.value = data.journey || []
  } catch (e) {
    loadError.value = e.message || 'Could not load your dashboard.'
  }

  try {
    const res = await fetch(`${API_BASE}/api/agent/applications/${sessionId}`)
    if (res.ok) {
      const data = await res.json()
      applications.value = Array.isArray(data) ? data : data.applications || []
    }
  } catch { /* applications are optional */ }

  const prof = profile.value
  if (prof.sector && prof.county) {
    try {
      const res = await fetch(`${API_BASE}/api/invest/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: prof.sector, county: prof.county, country: 'kenya' }),
      })
      if (res.ok) roadmap.value = await res.json()
    } catch { /* roadmap preview is optional */ }
  }

  if (supabaseEnabled && supabase) {
    realtimeChan = supabase
      .channel('dashboard-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'automation_jobs', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new || payload.old
          if (!row) return
          const idx = applications.value.findIndex((a) => a.id === row.id)
          if (idx >= 0) applications.value.splice(idx, 1, { ...applications.value[idx], ...row })
          else applications.value.unshift(row)
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_logs' },
        (payload) => {
          if (!payload.new) return
          liveLogs.value.unshift(payload.new)
          if (liveLogs.value.length > 20) liveLogs.value.pop()
        })
      .subscribe()
  }
})

onBeforeUnmount(() => {
  if (realtimeChan) supabase?.removeChannel(realtimeChan)
})
</script>

<style scoped>
.cc { max-width: 1180px; }

.cc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}
.cc-head h2 { font-size: 26px; margin-bottom: 6px; }
.cc-head > div > p { color: var(--text2); font-size: 13.5px; }

.cc-chips { display: flex; gap: 8px; flex-shrink: 0; }
.chip {
  padding: 5px 11px; border-radius: 20px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11.5px; font-weight: 600; text-transform: capitalize;
}

/* ── Stage rail ── */
.rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  list-style: none;
  margin-bottom: 26px;
  padding: 22px 10px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.rail li {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 9px;
}
.rail-line {
  position: absolute;
  top: 13px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: var(--border);
}
.rail li.complete .rail-line,
.rail li.active .rail-line { background: var(--blue-500); }

.rail-dot {
  position: relative;
  z-index: 1;
  width: 28px; height: 28px;
  display: grid; place-items: center;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface);
  color: var(--text3);
  font-size: 11px; font-weight: 700;
}
.rail li.complete .rail-dot {
  background: var(--blue-500); border-color: var(--blue-500); color: #fff;
}
.rail li.active .rail-dot {
  border-color: var(--blue-500); color: var(--blue-500);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.rail-label { font-size: 11.5px; color: var(--text2); text-align: center; }
.rail li.complete .rail-label,
.rail li.active .rail-label { color: var(--text); font-weight: 600; }

.cc-error {
  margin-bottom: 20px; padding: 12px 16px;
  border: 1px solid var(--border); border-left: 3px solid var(--warning);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 13px; color: var(--text2);
}
.cc-error a { color: var(--accent); font-weight: 600; text-decoration: none; margin-left: 6px; }

/* ── Grid ── */
.cc-grid {
  display: grid;
  grid-template-columns: 1.75fr 1fr;
  gap: 20px;
  align-items: start;
}
.cc-col { display: grid; gap: 20px; }

.card {
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .2s var(--ease-out), border-color .2s var(--ease-out);
}
.card:hover { box-shadow: var(--shadow-md); }

.card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 14px;
}
.card-head h3, .help-card h3 { font-size: 14.5px; font-weight: 600; }

.card-kicker {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--text3);
  margin-bottom: 12px;
}

.card-link {
  display: inline-block; margin-top: 14px;
  color: var(--accent); font-size: 12.5px; font-weight: 600; text-decoration: none;
}
.card-link.inline { margin-top: 0; }
.card-link:hover { text-decoration: underline; }

/* ── Next action ── */
.na-body { display: flex; align-items: center; gap: 14px; }

.na-icon {
  width: 38px; height: 38px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
}

.na-text { flex: 1; min-width: 0; }
.na-text h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.na-text > p { font-size: 12.5px; color: var(--text2); line-height: 1.55; }

.na-eta {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 8px;
  font-size: 11.5px; color: var(--text3);
}

/* ── Documents ── */
.doc-list { list-style: none; display: grid; gap: 2px; }
.doc-list li {
  display: flex; align-items: center; gap: 11px;
  padding: 11px 0;
  border-top: 1px solid var(--border2);
}
.doc-list li:first-child { border-top: 0; }

.doc-icon {
  width: 30px; height: 30px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 7px;
  background: var(--surface2); color: var(--text2);
}

.doc-meta { flex: 1; min-width: 0; display: grid; }
.doc-meta strong { font-size: 13px; font-weight: 500; }
.doc-meta small { font-size: 11px; color: var(--text3); }

.pill {
  flex-shrink: 0;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.pill.uploaded { background: rgba(32, 165, 101, .12); color: var(--success); }
.pill.pending  { background: var(--surface2); color: var(--text3); }

/* ── Experts ── */
.expert-list { list-style: none; display: grid; gap: 2px; }
.expert-list li {
  display: flex; align-items: center; gap: 11px;
  padding: 11px 0;
  border-top: 1px solid var(--border2);
  color: var(--text3);
  cursor: pointer;
}
.expert-list li:first-child { border-top: 0; }
.expert-list li:hover { color: var(--accent); }

.expert-avatar {
  width: 34px; height: 34px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 50%;
  color: #fff; font-size: 11.5px; font-weight: 700;
}

.expert-meta { flex: 1; min-width: 0; display: grid; }
.expert-meta strong { font-size: 13px; font-weight: 500; color: var(--text); }
.expert-meta small { font-size: 11px; color: var(--text3); }

/* ── Help ── */
.help-card { display: grid; gap: 10px; justify-items: start; }
.help-card p { font-size: 12.5px; color: var(--text2); line-height: 1.55; }

/* ── Activity ── */
.activity { list-style: none; display: grid; gap: 0; }
.activity li {
  position: relative;
  display: flex; align-items: flex-start; gap: 11px;
  padding: 0 0 18px 0;
}
.activity li:last-child { padding-bottom: 0; }
.activity li::before {
  content: '';
  position: absolute;
  left: 4px; top: 14px; bottom: 0;
  width: 1px;
  background: var(--border);
}
.activity li:last-child::before { display: none; }

.act-dot {
  width: 9px; height: 9px; flex-shrink: 0;
  margin-top: 4px;
  border-radius: 50%;
  background: var(--success);
}
.activity li.upcoming .act-dot { background: var(--border); }

.act-meta { display: grid; }
.act-meta strong { font-size: 12.5px; font-weight: 500; }
.act-meta small { font-size: 11px; color: var(--text3); }

/* ── Live log ── */
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  animation: blip 2s ease-in-out infinite;
}
@keyframes blip { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }

.log-list { list-style: none; display: grid; gap: 7px; font-size: 12px; }
.log-list code {
  font-family: var(--font-mono);
  font-size: 10px; text-transform: uppercase;
  color: var(--accent); margin-right: 6px;
}

@media (max-width: 1024px) {
  .cc-grid { grid-template-columns: 1fr; }
  .rail { grid-auto-flow: row; grid-auto-columns: auto; gap: 14px; }
  .rail li { grid-template-columns: 28px 1fr; justify-items: start; align-items: center; }
  .rail-line { display: none; }
}

@media (max-width: 640px) {
  .cc-head { flex-direction: column; }
  .na-body { flex-wrap: wrap; }
  .na-body .m-btn { width: 100%; }
}
</style>

<template>
  <div class="dashboard-page">
    <!-- Translucent header -->
    <header class="dash-header">
      <div class="dash-header-left">
        <span class="dash-brand">◈ MERIDIAN</span>
        <div class="dash-welcome">
          {{ profile.full_name ? `Welcome back, ${profile.full_name}` : 'Investor Dashboard' }}
        </div>
        <div class="dash-chips">
          <span v-if="profile.sector" class="sector-chip">{{ profile.sector }}</span>
          <span v-if="profile.county" class="county-chip">{{ profile.county }}</span>
        </div>
      </div>
      <div class="dash-header-right">
        <router-link to="/profile" class="edit-profile-link">Edit Profile →</router-link>
      </div>
    </header>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>Loading your dashboard…</span>
    </div>

    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <router-link to="/profile" class="error-cta">Set up your profile to get started →</router-link>
    </div>

    <div v-else class="dash-body">
      <!-- Stat cards row -->
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-label">Total Budget</div>
          <div class="stat-value">
            {{ roadmap?.total_budget_usd ? '$' + fmtNum(roadmap.total_budget_usd) : '—' }}
          </div>
          <div class="stat-sub" v-if="roadmap?.total_budget_kes">KES {{ fmtNum(roadmap.total_budget_kes) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Time to Operational</div>
          <div class="stat-value">{{ estimatedWeeks ? estimatedWeeks + ' wks' : '—' }}</div>
          <div class="stat-sub">estimated</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Agencies</div>
          <div class="stat-value">{{ roadmap?.steps?.length ?? '—' }}</div>
          <div class="stat-sub">regulatory steps</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Applications</div>
          <div class="stat-value">{{ applicationCount }}</div>
          <div class="stat-sub">submitted</div>
        </div>
      </div>

      <!-- Main + sidebar layout -->
      <div class="content-layout">
        <!-- Main panel -->
        <div class="main-panel">
          <!-- Tabs -->
          <div class="tab-bar">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Journey tab -->
          <div v-if="activeTab === 'journey'" class="tab-content">
            <div v-if="!journey.length" class="empty-tab">
              <div class="empty-icon">◉</div>
              <p>No journey events yet — start chatting with the concierge.</p>
            </div>
            <div v-else class="journey-list">
              <div v-for="(event, idx) in journey" :key="idx" class="journey-event">
                <div class="je-dot" :class="journeyDotClass(event.step)"></div>
                <div class="je-body">
                  <div class="je-step">{{ prettyKey(event.step) }}</div>
                  <div class="je-time" v-if="event.timestamp">{{ fmtDate(event.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Applications tab -->
          <div v-if="activeTab === 'applications'" class="tab-content">
            <div v-if="!applications.length" class="empty-tab">
              <div class="empty-icon">◉</div>
              <p>No applications yet — use the concierge to start an application.</p>
            </div>
            <div v-else class="apps-list">
              <div v-for="(app, idx) in applications" :key="idx" class="app-row">
                <span class="app-type-badge">{{ app.type || 'application' }}</span>
                <span class="app-status-chip" :class="`status-${app.status}`">{{ app.status }}</span>
                <span class="app-date">{{ app.created_at ? fmtDate(app.created_at) : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Roadmap tab -->
          <div v-if="activeTab === 'roadmap'" class="tab-content">
            <div v-if="!roadmap" class="empty-tab">
              <div class="empty-icon">◉</div>
              <p>No roadmap yet — complete your profile then ask the concierge to build it.</p>
              <router-link to="/concierge" class="empty-cta">Open Concierge →</router-link>
            </div>
            <template v-else>
              <StageTimeline :roadmap="roadmap" :compact="true" />
              <div class="roadmap-full-link">
                <router-link to="/invest/roadmap" class="full-link">Full roadmap →</router-link>
              </div>
            </template>
          </div>
        </div>

        <!-- Quick actions sidebar -->
        <div class="sidebar-panel">
          <h3 class="sidebar-title">Quick Actions</h3>
          <router-link to="/profile" class="qa-card">
            <span class="qa-icon">◈</span>
            <div>
              <div class="qa-label">Edit Profile</div>
              <div class="qa-sub">Update your investor details</div>
            </div>
            <span class="qa-arr">→</span>
          </router-link>
          <router-link to="/concierge" class="qa-card">
            <span class="qa-icon">◉</span>
            <div>
              <div class="qa-label">Open Concierge</div>
              <div class="qa-sub">Chat with your AI advisor</div>
            </div>
            <span class="qa-arr">→</span>
          </router-link>
          <router-link to="/invest/roadmap" class="qa-card">
            <span class="qa-icon">◇</span>
            <div>
              <div class="qa-label">View Full Roadmap</div>
              <div class="qa-sub">Kenya regulatory roadmap</div>
            </div>
            <span class="qa-arr">→</span>
          </router-link>
          <a class="qa-card" href="https://www.google.com/flights?hl=en#flt=/m/05cgv.NBO.*" target="_blank" rel="noopener">
            <span class="qa-icon">✈</span>
            <div>
              <div class="qa-label">Explore Flights</div>
              <div class="qa-sub">Find flights to Nairobi</div>
            </div>
            <span class="qa-arr">→</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StageTimeline from '../components/StageTimeline.vue'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const loading = ref(true)
const loadError = ref('')
const profile = ref({})
const journey = ref([])
const applications = ref([])
const roadmap = ref(null)
const activeTab = ref('journey')

const tabs = [
  { id: 'journey', label: 'Journey' },
  { id: 'applications', label: 'Applications' },
  { id: 'roadmap', label: 'Roadmap' },
]

const estimatedWeeks = computed(() => {
  if (!roadmap.value?.steps?.length) return 0
  const totalDays = roadmap.value.steps.reduce((acc, s) => acc + (parseInt(s.days) || 7), 0)
  return Math.ceil(totalDays / 7)
})

const applicationCount = computed(() => {
  const fromApps = applications.value.length
  const fromJourney = journey.value.filter(e => String(e.step).startsWith('immigration_')).length
  return fromApps || fromJourney || 0
})

function prettyKey(k) {
  return String(k || '').replace(/_/g, ' ')
}

function fmtNum(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function journeyDotClass(step) {
  const s = String(step || '')
  if (s.startsWith('completed')) return 'jd-completed'
  if (s.startsWith('immigration_')) return 'jd-immigration'
  return 'jd-default'
}

onMounted(async () => {
  const sessionId = localStorage.getItem('meridian_session')
  if (!sessionId) {
    router.push('/profile')
    return
  }

  try {
    // Fetch session data
    const sessionRes = await fetch(`${API_BASE}/api/agent/session/${sessionId}`)
    if (!sessionRes.ok) throw new Error('Session not found')
    const sessionData = await sessionRes.json()
    profile.value = sessionData.profile || {}
    journey.value = sessionData.journey || []

    // Fetch applications (may 404)
    try {
      const appsRes = await fetch(`${API_BASE}/api/agent/applications/${sessionId}`)
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        applications.value = Array.isArray(appsData) ? appsData : (appsData.applications || [])
      }
    } catch {
      applications.value = []
    }

    // Fetch roadmap if profile has sector + county
    const prof = profile.value
    if (prof.sector && prof.county) {
      try {
        const rmRes = await fetch(`${API_BASE}/api/invest/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sector: prof.sector, county: prof.county, country: 'kenya' }),
        })
        if (rmRes.ok) {
          roadmap.value = await rmRes.json()
        }
      } catch {
        roadmap.value = null
      }
    }
  } catch (e) {
    loadError.value = e.message || 'Could not load your dashboard. Please set up your profile.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #0b1120;
  color: #e5eaf3;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

/* Header */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  background: rgba(11, 17, 32, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.dash-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-brand {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #34d399, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  flex-shrink: 0;
}

.dash-welcome {
  font-size: 15px;
  font-weight: 600;
  color: #e5eaf3;
}

.dash-chips {
  display: flex;
  gap: 8px;
}

.sector-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  text-transform: capitalize;
}

.county-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.edit-profile-link {
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
  transition: color 150ms;
}

.edit-profile-link:hover { color: #38bdf8; }

/* Loading / error */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 16px;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-cta, .empty-cta {
  color: #38bdf8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.error-cta:hover, .empty-cta:hover { text-decoration: underline; }

/* Body */
.dash-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

/* Stat cards */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.stat-card {
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: msg-in 180ms ease-out both;
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #e5eaf3;
  line-height: 1.1;
}

.stat-sub {
  font-size: 11px;
  color: #475569;
}

/* Content layout */
.content-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  align-items: start;
}

/* Main panel */
.main-panel {
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 16px;
  overflow: hidden;
}

/* Tab bar */
.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  font-family: inherit;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover { color: #e5eaf3; background: rgba(255, 255, 255, 0.03); }
.tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }
.tab-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: -2px; }

/* Tab content */
.tab-content {
  padding: 20px;
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  color: #475569;
  font-size: 14px;
}

.empty-icon {
  font-size: 24px;
  color: #334155;
}

/* Journey list */
.journey-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.journey-event {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
  animation: msg-in 180ms ease-out both;
}

.journey-event:last-child { border-bottom: none; }

.je-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.jd-default { background: #334155; }
.jd-completed { background: #34d399; }
.jd-immigration { background: #38bdf8; }

.je-body { flex: 1; }

.je-step {
  font-size: 13px;
  color: #e5eaf3;
  text-transform: capitalize;
  font-weight: 500;
}

.je-time {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

/* Applications list */
.apps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 10px;
  font-size: 13px;
  animation: msg-in 180ms ease-out both;
}

.app-type-badge {
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  text-transform: capitalize;
}

.app-status-chip {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-pending   { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.status-running   { background: rgba(56, 189, 248, 0.15); color: #38bdf8; animation: status-pulse 1.5s ease-in-out infinite; }
.status-completed { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.status-failed    { background: rgba(239, 68, 68, 0.15); color: #f87171; }

@keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

.app-date {
  margin-left: auto;
  color: #64748b;
  font-size: 11px;
}

/* Roadmap tab */
.roadmap-full-link {
  margin-top: 14px;
  text-align: right;
}

.full-link {
  font-size: 13px;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}

.full-link:hover { text-decoration: underline; }

/* Sidebar */
.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748b;
  margin: 0 0 4px;
}

.qa-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 14px;
  color: #e5eaf3;
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms, border-color 150ms, transform 100ms;
}

.qa-card:hover {
  background: #243348;
  border-color: #38bdf8;
}

.qa-card:active { transform: scale(0.97); }
.qa-card:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.qa-icon {
  font-size: 16px;
  flex-shrink: 0;
  color: #64748b;
}

.qa-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.qa-sub {
  font-size: 11px;
  color: #64748b;
}

.qa-arr {
  margin-left: auto;
  color: #475569;
  font-size: 14px;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .sidebar-title { grid-column: 1 / -1; }
}

@media (max-width: 640px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); }
  .dash-header { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
  .dash-body { padding: 16px 14px 50px; }
  .sidebar-panel { grid-template-columns: 1fr; }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .stat-card, .journey-event, .app-row { animation: none; }
  .loading-spinner { animation: none; }
  .status-running { animation: none; }
  .qa-card { transition: none; }
}

@media (prefers-reduced-transparency: reduce) {
  .dash-header { backdrop-filter: none; background: #0f172a; }
}

@media (prefers-contrast: more) {
  .stat-card, .main-panel, .qa-card { border-color: #94a3b8; }
}
</style>

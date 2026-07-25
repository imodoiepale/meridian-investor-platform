<template>
  <div class="apps">
    <header class="apps-head">
      <div>
        <h2>Applications</h2>
        <p>Every government submission Meridian has run on your behalf.</p>
      </div>
      <router-link to="/concierge" class="m-btn m-btn-primary m-btn-sm">Start an application</router-link>
    </header>

    <div v-if="loading" class="empty">Loading your applications…</div>

    <div v-else-if="!rows.length" class="empty">
      <h3>Nothing submitted yet</h3>
      <p>Ask the concierge to file a permit, registration, or licence and it will appear here.</p>
      <router-link to="/concierge" class="m-btn m-btn-primary m-btn-sm">Open concierge</router-link>
    </div>

    <ul v-else class="app-list">
      <li v-for="job in rows" :key="job.id" class="app-row" v-reveal="{ y: 10 }">
        <span class="status" :class="statusClass(job.status)">{{ job.status || 'queued' }}</span>
        <span class="app-meta">
          <strong>{{ prettify(job.service || job.task || 'Application') }}</strong>
          <small>{{ job.agency || job.portal || '—' }} · {{ fmtDate(job.created_at) }}</small>
        </span>
        <span v-if="job.reference" class="ref">{{ job.reference }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const loading = ref(true)
const rows = ref([])

const prettify = (s) => String(s).replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

function statusClass(s) {
  const v = String(s || '').toLowerCase()
  if (['done', 'complete', 'completed', 'success'].includes(v)) return 'ok'
  if (['failed', 'error'].includes(v)) return 'bad'
  if (['running', 'in_progress'].includes(v)) return 'live'
  return 'idle'
}

function fmtDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return String(ts) }
}

onMounted(async () => {
  const sid = localStorage.getItem('meridian_session')
  if (!sid) { loading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/api/agent/applications/${sid}`)
    if (res.ok) {
      const data = await res.json()
      rows.value = Array.isArray(data) ? data : data.applications || []
    }
  } catch { /* empty state covers it */ } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.apps { max-width: 900px; }

.apps-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; margin-bottom: 22px;
}
.apps-head h2 { font-size: 24px; margin-bottom: 6px; }
.apps-head p { color: var(--text2); font-size: 13.5px; }

.empty {
  display: grid; gap: 10px; justify-items: center;
  padding: 56px 24px; text-align: center;
  border: 1px dashed var(--border); border-radius: var(--radius);
  color: var(--text3); font-size: 13.5px;
}
.empty h3 { font-size: 16px; color: var(--text); }
.empty p { max-width: 380px; line-height: 1.6; }

.app-list {
  list-style: none;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--surface); overflow: hidden;
}
.app-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px;
}
.app-row + .app-row { border-top: 1px solid var(--border2); }

.status {
  flex-shrink: 0;
  min-width: 82px; padding: 4px 10px;
  border-radius: 20px; text-align: center;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em;
}
.status.ok   { background: rgba(32,165,101,.12); color: var(--success); }
.status.bad  { background: rgba(220,38,38,.12); color: var(--danger); }
.status.live { background: var(--accent-soft); color: var(--accent); }
.status.idle { background: var(--surface2); color: var(--text3); }

.app-meta { flex: 1; min-width: 0; display: grid; }
.app-meta strong { font-size: 13.5px; font-weight: 500; }
.app-meta small { font-size: 11.5px; color: var(--text3); }

.ref {
  flex-shrink: 0;
  font-family: var(--font-mono); font-size: 11.5px; color: var(--text2);
}

@media (max-width: 640px) {
  .apps-head { flex-direction: column; }
  .app-row { flex-wrap: wrap; }
}
</style>

<template>
  <div class="dv">
    <header class="dv-head">
      <div>
        <h2>Documents</h2>
        <p>Everything Meridian needs from you, and everything it has generated for you.</p>
      </div>
    </header>

    <section v-for="group in groups" :key="group.title" class="dv-group" v-reveal="{ y: 12 }">
      <div class="dv-group-head">
        <h3>{{ group.title }}</h3>
        <span>{{ group.items.filter(i => i.status === 'uploaded').length }} / {{ group.items.length }}</span>
      </div>

      <ul class="dv-list">
        <li v-for="d in group.items" :key="d.name">
          <span class="dv-icon" :class="d.status" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
              <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z"
                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M11 2.5v4h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="dv-meta">
            <strong>{{ d.name }}</strong>
            <small>{{ d.hint }}</small>
          </span>
          <span class="pill" :class="d.status">{{ d.status === 'uploaded' ? 'Uploaded' : 'Pending' }}</span>
          <button class="dv-action" :disabled="d.status === 'uploaded'">
            {{ d.status === 'uploaded' ? 'View' : 'Upload' }}
          </button>
        </li>
      </ul>
    </section>

    <p class="dv-note">
      Uploads are wired to your investor profile — fill in
      <router-link to="/profile">your profile</router-link> and matching documents mark themselves complete.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const profile = ref({})

const has = (k) => Boolean(profile.value?.[k])

const groups = computed(() => [
  {
    title: 'Identity',
    items: [
      { name: 'Passport copy', hint: 'Clear scan of the bio-data page', status: has('passport_no') ? 'uploaded' : 'pending' },
      { name: 'Passport photo', hint: 'Recent colour photo, white background', status: 'pending' },
      { name: 'Proof of address', hint: 'Utility bill or bank statement', status: has('postalAddress') || has('origin_city') ? 'uploaded' : 'pending' },
    ],
  },
  {
    title: 'Company',
    items: [
      { name: 'Name reservation', hint: 'BRS name search and reservation receipt', status: has('company_name') ? 'uploaded' : 'pending' },
      { name: 'Memorandum of Association', hint: 'Generated once your company name is reserved', status: has('company_name') ? 'uploaded' : 'pending' },
      { name: 'CR12 / certificate of incorporation', hint: 'Issued by BRS after registration', status: 'pending' },
    ],
  },
  {
    title: 'Tax & compliance',
    items: [
      { name: 'KRA PIN certificate', hint: 'Issued via iTax', status: 'pending' },
      { name: 'Tax compliance certificate', hint: 'Required for most tenders and licences', status: 'pending' },
      { name: 'County business permit', hint: 'Single Business Permit for your county', status: 'pending' },
    ],
  },
])

onMounted(async () => {
  const sid = localStorage.getItem('meridian_session')
  if (!sid) return
  try {
    const res = await fetch(`${API_BASE}/api/agent/session/${sid}`)
    if (res.ok) profile.value = (await res.json()).profile || {}
  } catch { /* pending states are the safe default */ }
})
</script>

<style scoped>
.dv { max-width: 860px; }

.dv-head { margin-bottom: 22px; }
.dv-head h2 { font-size: 24px; margin-bottom: 6px; }
.dv-head p { color: var(--text2); font-size: 13.5px; }

.dv-group {
  margin-bottom: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.dv-group-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border2);
}
.dv-group-head h3 { font-size: 14px; font-weight: 600; }
.dv-group-head span { font-size: 11.5px; color: var(--text3); }

.dv-list { list-style: none; }
.dv-list li {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
}
.dv-list li + li { border-top: 1px solid var(--border2); }

.dv-icon {
  width: 30px; height: 30px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 7px;
  background: var(--surface2); color: var(--text2);
}
.dv-icon.uploaded { background: rgba(32,165,101,.12); color: var(--success); }

.dv-meta { flex: 1; min-width: 0; display: grid; }
.dv-meta strong { font-size: 13px; font-weight: 500; }
.dv-meta small { font-size: 11px; color: var(--text3); }

.pill {
  flex-shrink: 0;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.pill.uploaded { background: rgba(32,165,101,.12); color: var(--success); }
.pill.pending  { background: var(--surface2); color: var(--text3); }

.dv-action {
  flex-shrink: 0;
  padding: 6px 13px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text); font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all .16s var(--ease-out);
}
.dv-action:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.dv-action:disabled { color: var(--text3); cursor: default; }

.dv-note { font-size: 12.5px; color: var(--text3); line-height: 1.6; }
.dv-note a { color: var(--accent); font-weight: 500; text-decoration: none; }

@media (max-width: 600px) {
  .dv-list li { flex-wrap: wrap; }
  .dv-meta { flex-basis: 100%; order: -1; }
}
</style>

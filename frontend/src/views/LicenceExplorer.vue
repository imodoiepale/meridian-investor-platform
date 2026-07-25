<template>
  <div class="lx">
    <header class="lx-head">
      <div>
        <h2>Licence explorer</h2>
        <p>Every permit, licence, and certificate you may need — filtered to your industry.</p>
      </div>
      <span v-if="!loading" class="count">{{ filtered.length }} of {{ meta.total || 0 }}</span>
    </header>

    <div class="lx-filters">
      <label class="field">
        <span>Industry</span>
        <select v-model="sector">
          <option value="">All industries</option>
          <option v-for="s in meta.sectors || []" :key="s" :value="s">{{ label(s) }}</option>
        </select>
      </label>

      <label class="field">
        <span>Category</span>
        <select v-model="category">
          <option value="">All categories</option>
          <option v-for="c in meta.categories || []" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <label class="field">
        <span>Level</span>
        <select v-model="level">
          <option value="">All levels</option>
          <option value="National">National</option>
          <option value="County">County</option>
        </select>
      </label>

      <label class="field grow">
        <span>Search</span>
        <input v-model="q" type="search" placeholder="Licence, agency, or who it applies to…" />
      </label>
    </div>

    <p v-if="sector" class="lx-note">
      Showing <strong>{{ universalCount }}</strong> licences every business needs plus
      <strong>{{ filtered.length - universalCount }}</strong> specific to {{ label(sector) }}.
    </p>

    <div v-if="loading" class="lx-empty">Loading catalog…</div>
    <div v-else-if="error" class="lx-empty error">{{ error }}</div>
    <div v-else-if="!filtered.length" class="lx-empty">No licences match those filters.</div>

    <ul v-else class="lx-list">
      <li
        v-for="l in filtered"
        :key="l.id"
        class="lx-row"
        :class="{ open: expanded === l.id }"
        v-reveal="{ y: 10 }"
      >
        <button class="lx-row-head" @click="expanded = expanded === l.id ? '' : l.id">
          <span class="lx-agency" :title="l.agency">{{ l.agency_abbr || '—' }}</span>
          <span class="lx-name">
            <strong>{{ l.name }}</strong>
            <small>{{ l.applies_to }}</small>
          </span>
          <span class="tag" :class="l.universal ? 'universal' : 'specific'">
            {{ l.universal ? 'Every business' : 'Industry' }}
          </span>
          <span class="tag level">{{ l.level }}</span>
          <svg class="chev" viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
            <path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div v-if="expanded === l.id" class="lx-detail">
          <dl>
            <div><dt>Issuing agency</dt><dd>{{ l.agency }}</dd></div>
            <div><dt>Category</dt><dd>{{ l.category }}</dd></div>
            <div><dt>Applies to</dt><dd>{{ l.applies_to || '—' }}</dd></div>
            <div v-if="l.notes"><dt>Notes</dt><dd>{{ l.notes }}</dd></div>
            <div v-if="l.sectors.length"><dt>Industries</dt><dd>{{ l.sectors.map(label).join(', ') }}</dd></div>
          </dl>
          <router-link to="/concierge" class="m-btn m-btn-primary m-btn-sm">
            Ask the concierge about this
          </router-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const loading = ref(true)
const error = ref('')
const licences = ref([])
const meta = ref({})
const expanded = ref('')

const sector = ref('')
const category = ref('')
const level = ref('')
const q = ref('')

const label = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const universalCount = computed(() => filtered.value.filter((l) => l.universal).length)

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return licences.value.filter((l) => {
    if (category.value && l.category !== category.value) return false
    if (level.value && !l.level.toLowerCase().includes(level.value.toLowerCase())) return false
    if (needle) {
      const hay = `${l.name} ${l.agency} ${l.agency_abbr} ${l.applies_to}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const url = new URL(`${API_BASE}/api/licences`)
    if (sector.value) url.searchParams.set('sector', sector.value)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Catalog unavailable (${res.status})`)
    licences.value = (await res.json()).licences || []
  } catch (e) {
    error.value = e.message || 'Could not load the licence catalog.'
    licences.value = []
  } finally {
    loading.value = false
  }
}

watch(sector, load)

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/licences/meta`)
    if (res.ok) meta.value = await res.json()
  } catch { /* filters degrade to search-only */ }

  // Default the industry filter to the investor's own sector when we know it.
  const sid = localStorage.getItem('meridian_session')
  if (sid) {
    try {
      const res = await fetch(`${API_BASE}/api/agent/session/${sid}`)
      if (res.ok) {
        const s = (await res.json())?.profile?.sector
        if (s && (meta.value.sectors || []).includes(s)) sector.value = s
      }
    } catch { /* fall back to all industries */ }
  }

  await load()
})
</script>

<style scoped>
.lx { max-width: 1080px; }

.lx-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; margin-bottom: 22px;
}
.lx-head h2 { font-size: 24px; margin-bottom: 6px; }
.lx-head p { color: var(--text2); font-size: 13.5px; }
.count { font-size: 12px; color: var(--text3); white-space: nowrap; }

.lx-filters {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-bottom: 16px;
}

.field { display: grid; gap: 5px; }
.field.grow { flex: 1; min-width: 220px; }
.field > span {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text3);
}
.field select, .field input {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color .16s var(--ease-out);
}
.field select { min-width: 170px; cursor: pointer; }
.field select:focus, .field input:focus { border-color: var(--accent); }

.lx-note {
  margin-bottom: 14px;
  font-size: 12.5px; color: var(--text2);
}
.lx-note strong { color: var(--text); }

.lx-empty {
  padding: 40px; text-align: center;
  border: 1px dashed var(--border); border-radius: var(--radius);
  color: var(--text3); font-size: 13.5px;
}
.lx-empty.error { color: var(--danger); border-color: var(--danger); }

.lx-list {
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}
.lx-row + .lx-row { border-top: 1px solid var(--border2); }

.lx-row-head {
  width: 100%;
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px;
  background: transparent; border: 0;
  text-align: left; cursor: pointer;
  color: var(--text);
  transition: background .16s var(--ease-out);
}
.lx-row-head:hover { background: var(--bg2); }

.lx-agency {
  width: 62px; flex-shrink: 0;
  padding: 4px 0;
  border-radius: 5px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 10.5px; font-weight: 700; text-align: center;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.lx-name { flex: 1; min-width: 0; display: grid; }
.lx-name strong { font-size: 13.5px; font-weight: 500; }
.lx-name small {
  font-size: 11.5px; color: var(--text3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.tag {
  flex-shrink: 0;
  padding: 3px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 600;
}
.tag.universal { background: rgba(32,165,101,.12); color: var(--success); }
.tag.specific  { background: var(--accent-soft); color: var(--accent); }
.tag.level     { background: var(--surface2); color: var(--text2); }

.chev { flex-shrink: 0; color: var(--text3); transition: transform .2s var(--ease-out); }
.lx-row.open .chev { transform: rotate(180deg); }

.lx-detail {
  padding: 4px 16px 18px 90px;
  border-top: 1px solid var(--border2);
  animation: slideIn .22s var(--ease-out);
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}

.lx-detail dl { display: grid; gap: 9px; margin: 14px 0 16px; }
.lx-detail dl > div { display: grid; grid-template-columns: 130px 1fr; gap: 12px; }
.lx-detail dt {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--text3);
}
.lx-detail dd { font-size: 13px; color: var(--text2); line-height: 1.55; }

@media (max-width: 820px) {
  .lx-row-head { flex-wrap: wrap; }
  .lx-name { flex-basis: 100%; order: -1; }
  .lx-detail { padding-left: 16px; }
  .lx-detail dl > div { grid-template-columns: 1fr; gap: 2px; }
}
</style>

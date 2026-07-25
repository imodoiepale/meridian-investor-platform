<template>
  <div class="dash-shell" :class="{ collapsed }">
    <!-- ── Sidebar ── -->
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="side-head">
        <BrandMark to="/dashboard" on-dark :width="132" />
        <button class="collapse-btn" :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                @click="collapsed = !collapsed">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path :d="collapsed ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'"
                  fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <nav class="side-nav" aria-label="Dashboard">
        <template v-for="group in navGroups" :key="group.title">
          <p class="side-group">{{ group.title }}</p>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="side-link"
            :title="collapsed ? item.label : undefined"
            @click="mobileOpen = false"
          >
            <span class="side-icon" v-html="item.icon" />
            <span class="side-label">{{ item.label }}</span>
            <span v-if="item.badge" class="side-badge">{{ item.badge }}</span>
          </router-link>
        </template>
      </nav>

      <div class="side-foot">
        <div class="side-user">
          <div class="avatar">{{ initials }}</div>
          <div class="side-user-meta">
            <strong>{{ displayName }}</strong>
            <span>{{ isDemo ? 'Demo account' : email }}</span>
          </div>
        </div>
        <button class="side-signout" @click="handleSignOut">Sign out</button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" />

    <!-- ── Content ── -->
    <div class="dash-main">
      <header class="topbar">
        <button class="burger" aria-label="Open menu" @click="mobileOpen = true">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </button>

        <h1 class="topbar-title">{{ pageTitle }}</h1>

        <div class="topbar-right">
          <span v-if="isDemo" class="demo-chip">
            <span class="dot" /> Demo mode
          </span>

          <label class="market-picker">
            <span>Market</span>
            <select v-model="market">
              <option v-for="m in MARKETS" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>

          <button class="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
              <path d="M5.5 8a4.5 4.5 0 1 1 9 0c0 3 1 4.3 1.6 4.9.3.3.1.9-.4.9H4.3c-.5 0-.7-.6-.4-.9C4.5 12.3 5.5 11 5.5 8Z"
                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M8.2 16.2a2 2 0 0 0 3.6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="bell-dot">2</span>
          </button>

          <button class="theme-toggle" :aria-label="isDark ? 'Switch to light' : 'Switch to dark'"
                  @click="toggle">{{ isDark ? '☾' : '☀' }}</button>

          <router-link to="/" class="topbar-home">Back to site</router-link>
        </div>
      </header>

      <div class="dash-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import { useTheme } from '../composables/useTheme.js'
import { getUser, signOut, supabaseEnabled } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const { isDark, toggle } = useTheme()

const MARKETS = ['Kenya', 'Nigeria', 'United Arab Emirates', 'Singapore', 'United Kingdom', 'United States']

const collapsed = ref(localStorage.getItem('meridian-sidebar') === 'collapsed')
const mobileOpen = ref(false)
const email = ref('')
const displayName = ref('Investor')
const market = ref(localStorage.getItem('meridian-market') || 'Kenya')

watch(collapsed, (v) => localStorage.setItem('meridian-sidebar', v ? 'collapsed' : 'expanded'))
watch(market, (v) => localStorage.setItem('meridian-market', v))

const isDemo = computed(() => email.value === 'demo@meridian.app')
const pageTitle = computed(() => route.meta?.title || 'Dashboard')
const initials = computed(() =>
  displayName.value.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'IN'
)

const icon = {
  home:     '<svg viewBox="0 0 20 20" fill="none"><path d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  user:     '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6.5" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M3.8 17c.7-3.2 3.2-4.8 6.2-4.8s5.5 1.6 6.2 4.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  chat:     '<svg viewBox="0 0 20 20" fill="none"><path d="M17 12.2a2 2 0 0 1-2 2H7l-4 3V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  map:      '<svg viewBox="0 0 20 20" fill="none"><path d="m2.5 5 5-2 5 2 5-2v12l-5 2-5-2-5 2V5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.5 3v12M12.5 5v12" stroke="currentColor" stroke-width="1.5"/></svg>',
  doc:      '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5v4h4M7.5 11h5M7.5 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  chart:    '<svg viewBox="0 0 20 20" fill="none"><path d="M3 17h14M6 14V8M10 14V4M14 14v-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  folder:   '<svg viewBox="0 0 20 20" fill="none"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.4l1.6 2H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  users:    '<svg viewBox="0 0 20 20" fill="none"><circle cx="7.6" cy="6.6" r="2.8" stroke="currentColor" stroke-width="1.5"/><path d="M2.4 16.4c.6-2.9 2.7-4.4 5.2-4.4s4.6 1.5 5.2 4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.6 4.2a2.8 2.8 0 0 1 0 5.2M15.2 12.4c1.4.6 2.3 1.9 2.6 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  badge:    '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5 12 5l3.2.3-1.4 2.9 1.4 2.9L12 11.4 10 14l-2-2.6-3.2-.3 1.4-2.9L4.8 5.3 8 5l2-2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 13.5 6 17.5l4-1.6 4 1.6-1.5-4" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
}

const navGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: icon.home },
      { label: 'My profile', to: '/profile', icon: icon.user },
    ],
  },
  {
    title: 'Journey',
    items: [
      { label: 'Roadmap', to: '/invest/roadmap', icon: icon.map },
      { label: 'Licences', to: '/licences', icon: icon.badge },
      { label: 'Applications', to: '/applications', icon: icon.doc },
      { label: 'Documents', to: '/documents', icon: icon.folder },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Concierge', to: '/concierge', icon: icon.chat },
      { label: 'Local experts', to: '/experts', icon: icon.users },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Market insights', to: '/invest/graphs', icon: icon.chart },
    ],
  },
]

async function handleSignOut() {
  await signOut()
  router.push('/')
}

onMounted(async () => {
  if (!supabaseEnabled) return
  const user = await getUser()
  if (!user) return
  email.value = user.email || ''
  displayName.value = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Investor'
})
</script>

<style scoped>
.dash-shell {
  --side-w: 250px;
  display: grid;
  grid-template-columns: var(--side-w) 1fr;
  min-height: 100vh;
  background: var(--bg2);
  transition: grid-template-columns 0.26s var(--ease-out);
}
.dash-shell.collapsed { --side-w: 72px; }

/* ── Sidebar ── */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--navy-900);
  color: rgba(255, 255, 255, 0.72);
  overflow: hidden;
}

.side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 68px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
/* Collapsed: clip the wordmark so only the star glyph remains visible. */
.collapsed .side-head :deep(.brand) { width: 26px; overflow: hidden; }

.collapse-btn {
  width: 26px; height: 26px; flex-shrink: 0;
  display: grid; place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 0; border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: background 0.16s, color 0.16s;
}
.collapse-btn:hover { background: rgba(255, 255, 255, 0.13); color: #fff; }

.side-nav { flex: 1; overflow-y: auto; padding: 16px 12px; }

.side-group {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.32);
  padding: 14px 10px 7px;
}
.collapsed .side-group { opacity: 0; height: 14px; padding: 0; overflow: hidden; }

.side-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.68);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  position: relative;
  transition: background 0.16s var(--ease-out), color 0.16s var(--ease-out);
}
.side-link:hover { background: rgba(255, 255, 255, 0.07); color: #fff; }
.side-link.router-link-active { background: var(--blue-600); color: #fff; }
.side-link.router-link-active::before {
  content: '';
  position: absolute; left: -12px; top: 50%;
  width: 3px; height: 18px; margin-top: -9px;
  background: var(--blue-300);
  border-radius: 0 3px 3px 0;
}

.side-icon { width: 20px; height: 20px; flex-shrink: 0; display: grid; place-items: center; }
.side-icon :deep(svg) { width: 18px; height: 18px; }
.side-label { white-space: nowrap; overflow: hidden; }
.collapsed .side-label, .collapsed .side-badge { display: none; }

.side-badge {
  margin-left: auto;
  font-size: 10px; font-weight: 700;
  padding: 2px 6px; border-radius: 20px;
  background: var(--blue-500); color: #fff;
}

.side-foot {
  padding: 14px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.side-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.avatar {
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
  color: #fff;
  display: grid; place-items: center;
  font-size: 11.5px; font-weight: 700;
}

.side-user-meta { display: grid; min-width: 0; }
.side-user-meta strong { font-size: 13px; color: #fff; font-weight: 600; }
.side-user-meta span {
  font-size: 11px; color: rgba(255, 255, 255, 0.45);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.collapsed .side-user-meta, .collapsed .side-signout { display: none; }

.side-signout {
  width: 100%;
  padding: 7px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.16s, color 0.16s;
}
.side-signout:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

/* ── Main ── */
.dash-main { display: flex; flex-direction: column; min-width: 0; }

.topbar {
  position: sticky; top: 0; z-index: 20;
  height: 68px;
  display: flex; align-items: center; gap: 16px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(14px) saturate(180%);
  border-bottom: 1px solid var(--border);
}
[data-theme="dark"] .topbar { background: rgba(6, 21, 41, 0.84); }

.topbar-title { font-size: 17px; font-weight: 600; flex: 1; }

.topbar-right { display: flex; align-items: center; gap: 14px; }

.demo-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 20px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11.5px; font-weight: 600;
}
.demo-chip .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
  animation: blip 2s ease-in-out infinite;
}
@keyframes blip { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }

.topbar-home {
  font-size: 13px; color: var(--text2); text-decoration: none;
  transition: color 0.16s;
}
.topbar-home:hover { color: var(--accent); }

.market-picker {
  display: flex; flex-direction: column; gap: 1px;
  padding: 4px 10px; border: 1px solid var(--border); border-radius: 7px;
  background: var(--surface);
}
.market-picker span {
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text3);
}
.market-picker select {
  border: 0; background: transparent; color: var(--text);
  font-size: 12.5px; font-weight: 600; cursor: pointer; outline: none;
  padding: 0; margin-left: -2px;
}

.icon-btn {
  position: relative;
  width: 34px; height: 34px; border-radius: 8px;
  display: grid; place-items: center;
  background: transparent; border: 1px solid var(--border);
  color: var(--text2); cursor: pointer;
  transition: border-color 0.16s, color 0.16s;
}
.icon-btn:hover { border-color: var(--accent); color: var(--accent); }

.bell-dot {
  position: absolute; top: -5px; right: -5px;
  min-width: 15px; height: 15px; padding: 0 4px;
  display: grid; place-items: center;
  border-radius: 20px;
  background: var(--danger); color: #fff;
  font-size: 9px; font-weight: 700;
}

.burger {
  display: none;
  width: 34px; height: 34px;
  background: transparent; border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); cursor: pointer;
  place-items: center;
}

.dash-content { flex: 1; padding: 28px; }

.scrim {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(4, 16, 31, 0.5);
  backdrop-filter: blur(2px);
}

@media (max-width: 900px) {
  .dash-shell { grid-template-columns: 1fr; }
  .sidebar {
    position: fixed; z-index: 50;
    width: 250px; left: 0; top: 0;
    transform: translateX(-100%);
    transition: transform 0.26s var(--ease-out);
  }
  .sidebar.open { transform: none; }
  .burger { display: grid; }
  .dash-content { padding: 20px; }
  .topbar { padding: 0 18px; }
}
</style>

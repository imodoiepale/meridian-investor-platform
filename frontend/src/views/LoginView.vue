<template>
  <div class="auth">
    <!-- Left: brand panel -->
    <aside class="auth-aside">
      <img class="aside-bg" :src="asideImg" alt="" aria-hidden="true" />
      <div class="aside-scrim" aria-hidden="true"></div>
      <div class="aside-inner">
        <BrandMark to="/" on-dark :width="150" />
        <div class="aside-copy">
          <p class="aside-eyebrow">Land · Launch · Live</p>
          <h2>Every requirement for entering a new market, in one coordinated platform.</h2>
          <p class="aside-sub">
            100 Kenya licences mapped to your industry, filings driven on the real
            agency portals, and vetted local experts when judgement is needed.
          </p>
        </div>
        <dl class="aside-stats">
          <div v-for="s in stats" :key="s.label">
            <dt>{{ s.value }}</dt>
            <dd>{{ s.label }}</dd>
          </div>
        </dl>
      </div>
    </aside>

    <!-- Right: form panel -->
    <main class="auth-main">
      <div class="auth-card">
        <router-link to="/" class="mobile-brand">
          <BrandMark :width="140" />
        </router-link>

        <div v-if="!supabaseEnabled" class="notice">
          <strong>Auth isn't configured.</strong>
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in
          <code>frontend/.env</code>, or
          <router-link to="/dashboard">continue as a guest</router-link>.
        </div>

        <template v-else-if="sent">
          <div class="sent">
            <span class="sent-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M3 7.5 12 13l9-5.5" stroke="currentColor" stroke-width="1.7"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="3" y="5" width="18" height="14" rx="2.2"
                      stroke="currentColor" stroke-width="1.7"/>
              </svg>
            </span>
            <h1>Check your inbox</h1>
            <p>We sent a sign-in link to <strong>{{ email }}</strong>. Open it on this device to continue.</p>
            <button class="m-btn m-btn-ghost" @click="reset">Use a different method</button>
          </div>
        </template>

        <template v-else>
          <h1>{{ mode === 'signup' ? 'Create your account' : 'Sign in to Meridian' }}</h1>
          <p class="lede">
            {{ mode === 'signup'
              ? 'Build your investor profile and generate a roadmap in minutes.'
              : 'Pick up your roadmap, filings, and documents where you left off.' }}
          </p>

          <!-- Demo access -->
          <div class="demo">
            <div class="demo-head">
              <span class="demo-tag">Demo</span>
              <p>Reviewing Meridian? Use the shared demo account.</p>
            </div>
            <dl class="demo-creds">
              <div><dt>Email</dt><dd>{{ DEMO_EMAIL }}</dd></div>
              <div><dt>Password</dt><dd>{{ DEMO_PASSWORD }}</dd></div>
            </dl>
            <button class="m-btn m-btn-primary m-btn-sm demo-btn" @click="signInAsDemo" :disabled="busy">
              {{ busy && demoBusy ? 'Signing in…' : 'Enter demo workspace' }}
            </button>
          </div>

          <div class="divider"><span>or use your own account</span></div>

          <button class="google" @click="handleGoogle" :disabled="busy">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path fill="#EA4335" d="M12 5.04c1.9 0 3.62.66 4.96 1.94l3.71-3.71C18.4 1.16 15.47 0 12 0 7.4 0 3.4 2.66 1.4 6.5l4.3 3.33C6.66 7.06 9.1 5.04 12 5.04z"/>
              <path fill="#34A853" d="M23.5 12.27c0-.83-.07-1.62-.2-2.4H12v4.55h6.5c-.28 1.51-1.13 2.79-2.4 3.65l3.7 2.87c2.17-2 3.7-4.95 3.7-8.67z"/>
              <path fill="#FBBC05" d="M5.7 14.33A7.5 7.5 0 015.3 12c0-.82.14-1.6.4-2.33L1.4 6.34A12 12 0 000 12c0 1.94.47 3.77 1.4 5.66l4.3-3.33z"/>
              <path fill="#4285F4" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.7-2.87c-1.03.7-2.35 1.11-4.24 1.11-2.9 0-5.35-1.96-6.23-4.68l-4.3 3.33C3.4 21.34 7.4 24 12 24z"/>
            </svg>
            Continue with Google
          </button>

          <div class="tabs" role="tablist">
            <button
              v-for="t in tabs" :key="t.id" role="tab" type="button"
              :class="{ active: activeTab === t.id }"
              :aria-selected="activeTab === t.id"
              @click="activeTab = t.id"
            >{{ t.label }}</button>
          </div>

          <form v-if="activeTab === 'password'" class="form" @submit.prevent="handlePassword">
            <label v-if="mode === 'signup'">
              <span>Full name</span>
              <input v-model="fullName" type="text" autocomplete="name" :disabled="busy" placeholder="Alex Ngugi" />
            </label>
            <label>
              <span>Email address</span>
              <input v-model="email" type="email" autocomplete="email" required :disabled="busy" placeholder="you@company.com" />
            </label>
            <label>
              <span>Password</span>
              <input v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
                     required minlength="6" :disabled="busy" placeholder="••••••••" />
            </label>
            <button class="m-btn m-btn-primary submit" type="submit" :disabled="busy || !email.trim() || !password">
              {{ busy && !demoBusy ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Sign in') }}
            </button>
          </form>

          <form v-else class="form" @submit.prevent="sendMagicLink">
            <label>
              <span>Email address</span>
              <input v-model="email" type="email" autocomplete="email" required :disabled="busy" placeholder="you@company.com" />
            </label>
            <button class="m-btn m-btn-primary submit" type="submit" :disabled="busy || !email.trim()">
              {{ busy ? 'Sending…' : 'Send magic link' }}
            </button>
          </form>

          <p v-if="error" class="error" role="alert">{{ error }}</p>

          <p class="switch">
            {{ mode === 'signup' ? 'Already have an account?' : 'New to Meridian?' }}
            <button type="button" @click="mode = mode === 'signup' ? 'signin' : 'signup'">
              {{ mode === 'signup' ? 'Sign in' : 'Create one' }}
            </button>
          </p>
        </template>

        <p class="back"><router-link to="/">← Back to meridian.global</router-link></p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import {
  supabase, supabaseEnabled,
  signInWithGoogle, signInWithPassword, signUpWithPassword,
} from '../lib/supabase'

const DEMO_EMAIL = 'demo@meridian.app'
const DEMO_PASSWORD = 'MeridianDemo2026!'
// Matches DEMO_SESSION_ID in backend/scripts/seed_demo_user.py so the dashboard
// loads the seeded profile instead of an empty session.
const DEMO_SESSION_ID = 'demo-session'

const asideImg = '/meridian-global-landing/assets/images/hero-global-investors.png'

const stats = [
  { value: '100', label: 'Licences mapped' },
  { value: '30+', label: 'Agencies' },
  { value: '23', label: 'Automated filings' },
]

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const fullName = ref('')
const mode = ref('signin')
const activeTab = ref('password')
const sent = ref(false)
const busy = ref(false)
const demoBusy = ref(false)
const error = ref('')

const tabs = [
  { id: 'password', label: 'Email + password' },
  { id: 'magic', label: 'Magic link' },
]

const nextPath = () => route.query.next || '/dashboard'

async function signInAsDemo() {
  if (!supabase) return
  busy.value = true; demoBusy.value = true; error.value = ''
  try {
    await signInWithPassword(DEMO_EMAIL, DEMO_PASSWORD)
    localStorage.setItem('meridian_session', DEMO_SESSION_ID)
    router.push('/dashboard')
  } catch (e) {
    error.value = `${e?.message || 'Demo sign-in failed.'} Run "python backend/scripts/seed_demo_user.py" to create the demo account.`
  } finally {
    busy.value = false; demoBusy.value = false
  }
}

async function handleGoogle() {
  if (!supabase) return
  busy.value = true; error.value = ''
  try { await signInWithGoogle(nextPath()) }
  catch (e) { error.value = e?.message || 'Google sign-in failed.' }
  finally { busy.value = false }
}

async function handlePassword() {
  if (!supabase) return
  busy.value = true; error.value = ''
  try {
    if (mode.value === 'signup') {
      const data = await signUpWithPassword(email.value.trim(), password.value, fullName.value.trim())
      if (data.session) router.push(nextPath())
      else sent.value = true
    } else {
      await signInWithPassword(email.value.trim(), password.value)
      router.push(nextPath())
    }
  } catch (e) {
    error.value = e?.message || 'Sign-in failed.'
  } finally {
    busy.value = false
  }
}

async function sendMagicLink() {
  if (!supabase) return
  busy.value = true; error.value = ''
  try {
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: { emailRedirectTo: window.location.origin + nextPath() },
    })
    if (err) throw err
    sent.value = true
  } catch (e) {
    error.value = e?.message || 'Unable to send magic link.'
  } finally {
    busy.value = false
  }
}

function reset() { sent.value = false; error.value = '' }
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: var(--bg);
}

/* ---------- Brand panel ---------- */
.auth-aside {
  position: relative;
  overflow: hidden;
  background: var(--navy-900);
  display: flex;
}
.aside-bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  animation: asideZoom 24s var(--ease-out) infinite alternate;
}
@keyframes asideZoom { from { transform: scale(1.08); } to { transform: scale(1); } }

.aside-scrim {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(7,19,33,.72) 0%, rgba(7,19,33,.86) 55%, rgba(7,19,33,.95) 100%),
    radial-gradient(900px 480px at 12% 12%, rgba(29,85,245,.34), transparent 62%);
}

.aside-inner {
  position: relative;
  display: flex; flex-direction: column; justify-content: space-between;
  gap: 44px;
  padding: 52px 56px;
  width: 100%;
  color: #fff;
}

.aside-copy { max-width: 460px; }
.aside-eyebrow {
  font-size: 11px; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase;
  color: var(--blue-200);
  margin-bottom: 18px;
}
.aside-copy h2 {
  font-size: 36px; font-weight: 500;
  line-height: 1.22; letter-spacing: -.02em;
  color: #fff;
  margin-bottom: 18px;
}
.aside-sub {
  font-size: 14.5px; line-height: 1.72;
  color: rgba(255,255,255,.72);
}

.aside-stats {
  display: flex; gap: 44px;
  padding-top: 26px;
  border-top: 1px solid rgba(255,255,255,.14);
}
.aside-stats dt {
  font-family: var(--font-display);
  font-size: 30px; font-weight: 600;
  color: #fff;
}
.aside-stats dd {
  margin-top: 3px;
  font-size: 11.5px; letter-spacing: .04em;
  color: rgba(255,255,255,.6);
}

/* ---------- Form panel ---------- */
.auth-main {
  display: grid; place-items: center;
  padding: 48px 32px;
  overflow-y: auto;
}
.auth-card { width: 100%; max-width: 412px; }

.mobile-brand { display: none; margin-bottom: 26px; }

.auth-card h1 {
  font-size: 28px; font-weight: 500;
  letter-spacing: -.02em;
  margin-bottom: 8px;
}
.lede { font-size: 14px; color: var(--text2); line-height: 1.6; margin-bottom: 24px; }

/* Demo block */
.demo {
  padding: 16px 18px;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--accent-soft);
  margin-bottom: 22px;
}
.demo-head { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.demo-tag {
  padding: 3px 8px; border-radius: 20px;
  background: var(--accent); color: #fff;
  font-size: 10px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
}
.demo-head p { font-size: 12.5px; color: var(--text2); }

.demo-creds { display: grid; gap: 6px; margin-bottom: 13px; }
.demo-creds > div { display: flex; align-items: baseline; gap: 10px; }
.demo-creds dt {
  flex: 0 0 62px;
  font-size: 11px; color: var(--text3);
  text-transform: uppercase; letter-spacing: .05em;
}
.demo-creds dd {
  font-family: var(--font-mono);
  font-size: 12.5px; color: var(--text);
  user-select: all;
}
.demo-btn { width: 100%; }

.divider {
  display: flex; align-items: center; gap: 12px;
  margin: 22px 0;
  font-size: 11.5px; color: var(--text3);
}
.divider::before, .divider::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

.google {
  width: 100%; min-height: 46px;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit; font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: border-color .16s var(--ease-out), transform .16s var(--ease-out), box-shadow .16s var(--ease-out);
}
.google:hover:not(:disabled) {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.google:disabled { opacity: .55; cursor: not-allowed; }

.tabs {
  display: flex; gap: 4px;
  margin: 20px 0 16px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface2);
}
.tabs button {
  flex: 1;
  padding: 8px 10px;
  border: 0; border-radius: 5px;
  background: transparent; color: var(--text2);
  font-family: inherit; font-size: 12.5px; font-weight: 600;
  cursor: pointer;
  transition: background .16s var(--ease-out), color .16s var(--ease-out);
}
.tabs button.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }

.form label { display: block; margin-bottom: 14px; }
.form label span {
  display: block; margin-bottom: 6px;
  font-size: 12px; font-weight: 500; color: var(--text2);
}
.form input {
  width: 100%; min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit; font-size: 14px;
  outline: none;
  transition: border-color .16s var(--ease-out), box-shadow .16s var(--ease-out);
}
.form input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.submit { width: 100%; margin-top: 4px; }

.error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(220,38,38,.08);
  color: #b91c1c;
  font-size: 12.5px; line-height: 1.55;
}

.switch { margin-top: 18px; font-size: 13px; color: var(--text2); }
.switch button {
  border: 0; background: none; padding: 0;
  color: var(--accent); font: inherit; font-weight: 600;
  cursor: pointer;
}
.switch button:hover { text-decoration: underline; }

.back { margin-top: 26px; font-size: 12.5px; }
.back a { color: var(--text3); text-decoration: none; }
.back a:hover { color: var(--accent); }

.notice {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface2);
  font-size: 13px; line-height: 1.65; color: var(--text2);
}
.notice strong { display: block; color: var(--text); margin-bottom: 4px; }
.notice code {
  font-family: var(--font-mono); font-size: 11.5px;
  padding: 1px 5px; border-radius: 4px;
  background: var(--surface); border: 1px solid var(--border);
}
.notice a { color: var(--accent); font-weight: 600; }

.sent { text-align: center; padding: 20px 0; }
.sent-icon {
  display: inline-grid; place-items: center;
  width: 46px; height: 46px;
  border-radius: 50%;
  background: var(--accent-soft); color: var(--accent);
  margin-bottom: 16px;
}
.sent p { font-size: 14px; color: var(--text2); line-height: 1.65; margin: 8px 0 20px; }

@media (max-width: 1040px) {
  .auth { grid-template-columns: 1fr; }
  .auth-aside { display: none; }
  .mobile-brand { display: block; }
}
@media (max-width: 480px) {
  .auth-main { padding: 36px 20px; }
  .auth-card h1 { font-size: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .aside-bg { animation: none; }
  .google, .form input, .tabs button { transition: none; }
}
</style>

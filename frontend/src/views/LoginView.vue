<template>
  <div class="login-shell">
    <div class="card">
      <div class="brand">
        <h1>Meridian</h1>
        <p class="tagline">Land · Launch · Live</p>
      </div>

      <div v-if="!supabaseEnabled" class="notice notice-warn">
        Auth is not configured. Set <code>VITE_SUPABASE_URL</code> and
        <code>VITE_SUPABASE_ANON_KEY</code> in <code>frontend/.env</code>.
        You can still <router-link to="/">continue as guest</router-link>.
      </div>

      <template v-else>
        <h2 v-if="!sent">Sign in to your account</h2>
        <p v-if="!sent" class="sub">We'll email you a magic link — no password to remember.</p>

        <form v-if="!sent" @submit.prevent="sendMagicLink" class="form">
          <label>
            <span>Email address</span>
            <input v-model="email" type="email" required placeholder="you@example.com" :disabled="busy" autofocus />
          </label>
          <button type="submit" :disabled="busy || !email.trim()">
            {{ busy ? 'Sending…' : 'Send magic link' }}
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </form>

        <div v-else class="check-inbox">
          <div class="check-icon">📬</div>
          <h2>Check your inbox</h2>
          <p>We sent a sign-in link to <b>{{ email }}</b>. Open it on this device to continue.</p>
          <button class="ghost" @click="reset">Use a different email</button>
        </div>
      </template>

      <div class="footer">
        <router-link to="/">← Back to home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase, supabaseEnabled } from '../lib/supabase'

const email = ref('')
const sent = ref(false)
const busy = ref(false)
const error = ref('')
const route = useRoute()

async function sendMagicLink() {
  if (!supabase) return
  busy.value = true
  error.value = ''
  try {
    const redirect = window.location.origin + (route.query.next || '/dashboard')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: { emailRedirectTo: redirect },
    })
    if (err) throw err
    sent.value = true
  } catch (e) {
    error.value = e?.message || 'Unable to send magic link. Check your Supabase auth settings.'
  } finally {
    busy.value = false
  }
}

function reset() {
  sent.value = false
  error.value = ''
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(1200px 600px at 20% 10%, rgba(56, 189, 248, 0.18), transparent 60%),
              radial-gradient(1000px 500px at 90% 90%, rgba(52, 211, 153, 0.15), transparent 60%),
              #0b1120;
  color: #e5eaf3;
  padding: 24px;
  font: 100%/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.card {
  width: 100%;
  max-width: 440px;
  padding: 32px 28px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 18px;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.45);
}
.brand h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, #34d399, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tagline { color: #64748b; letter-spacing: 2px; margin: 4px 0 20px; font-size: 12px; }
h2 { margin: 0 0 6px; letter-spacing: -0.01em; }
.sub { margin: 0 0 18px; color: #94a3b8; font-size: 14px; }
.form label { display: block; margin-bottom: 12px; }
.form label span { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1.2px; }
.form input {
  width: 100%;
  padding: 12px 14px;
  min-height: 44px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #e5eaf3;
  font-size: 14px;
  outline: none;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
.form input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15); }
.form button {
  width: 100%;
  margin-top: 6px;
  padding: 12px 20px;
  min-height: 44px;
  background: linear-gradient(90deg, #059669, #0284c7);
  border: 0;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: filter 150ms ease-out, transform 100ms ease-out;
}
.form button:hover:not(:disabled) { filter: brightness(1.1); }
.form button:active:not(:disabled) { transform: scale(0.98); }
.form button:disabled { opacity: 0.5; cursor: not-allowed; }
.error { color: #fca5a5; font-size: 13px; margin-top: 10px; }
.notice {
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 18px;
}
.notice-warn { background: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.35); color: #fde68a; }
.notice code { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.check-inbox { text-align: center; padding: 8px 0 4px; }
.check-icon { font-size: 44px; margin-bottom: 6px; }
.ghost {
  margin-top: 12px;
  padding: 10px 16px;
  background: transparent;
  color: #7dd3fc;
  border: 1px solid #334155;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
}
.ghost:hover { background: rgba(56, 189, 248, 0.08); }
.footer { margin-top: 24px; text-align: center; }
.footer a { color: #64748b; font-size: 13px; text-decoration: none; }
.footer a:hover { color: #38bdf8; }

@media (prefers-reduced-motion: reduce) {
  .form button, .form input { transition: none; }
}
</style>

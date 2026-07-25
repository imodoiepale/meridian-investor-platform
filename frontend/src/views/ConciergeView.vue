<template>
  <div class="concierge">
    <aside class="sidebar">
      <div class="brand">
        <h2>Meridian</h2>
        <p class="tagline">Land · Launch · Live</p>
      </div>

      <div class="panel">
        <h3>Investor Profile</h3>
        <div v-if="Object.keys(profile).length === 0" class="empty">Chat with the agent — it builds your profile as you go.</div>
        <div v-for="(v, k) in profile" :key="k" class="profile-row">
          <span class="pk">{{ prettyKey(k) }}</span><span class="pv">{{ v }}</span>
        </div>
      </div>

      <div class="panel">
        <h3>Journey</h3>
        <div v-if="journey.length === 0" class="empty">No steps yet.</div>
        <div v-for="(j, i) in journey" :key="i" class="journey-step">
          <span class="dot"></span>{{ prettyKey(j.step) }}
        </div>
      </div>

      <div class="panel">
        <h3>Quick Actions</h3>
        <button v-for="qa in quickActions" :key="qa.label" class="qa" @click="send(qa.prompt)" :disabled="loading">
          {{ qa.label }}
        </button>
      </div>
    </aside>

    <main class="chat">
      <header class="chat-header">
        <h1>Investor Concierge</h1>
        <span class="model-badge">Claude · agentic tools</span>
      </header>

      <div class="messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="welcome">
          <h2>Karibu! Where in the world are you investing?</h2>
          <p>I handle your entire landing: flights, eTA & work permits (filed live on the government portal), company registration, licensing budgets, market-gap analysis, hiring, and even your first safari.</p>
        </div>
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
          <div class="bubble">
            <div v-if="m.tools && m.tools.length" class="tool-trace">
              <div v-for="(t, ti) in m.tools" :key="ti" class="tool-chip" :title="t.result_preview">
                ⚙ {{ t.tool }}
              </div>
            </div>
            <div class="text" v-html="format(m.text)"></div>
          </div>
        </div>
        <div v-if="loading" class="msg assistant"><div class="bubble typing">Working — calling tools<span class="dots">…</span></div></div>
      </div>

      <form class="composer" @submit.prevent="send(input)">
        <input v-model="input" :disabled="loading" placeholder="e.g. I'm a US investor with $250k, want an agritech company in Nakuru" />
        <button type="submit" :disabled="loading || !input.trim()">Send</button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import service from '../api/index'

const messages = ref([])
const input = ref('')
const loading = ref(false)
const profile = ref({})
const journey = ref([])
const messagesEl = ref(null)
const sessionId = ref(localStorage.getItem('meridian_session') || null)

const quickActions = [
  { label: '✈ Find flights to Kenya', prompt: 'Find me return flights from JFK to Nairobi departing in two weeks, returning a week later.' },
  { label: '🛂 Immigration proposal', prompt: 'Which immigration class should I apply for? Give me a full proposal with costs and timeline.' },
  { label: '📋 Licensing roadmap + budget', prompt: 'Build my full licensing roadmap and budget for my sector and county.' },
  { label: '📈 Market gaps', prompt: 'Where are the market gaps in my sector and which county should I set up in?' },
  { label: '🧑‍💼 Generate JDs', prompt: 'Generate job descriptions for my first three hires with local salary bands.' },
  { label: '🦁 Book a safari', prompt: 'Show me the national parks with prices — I want to book a weekend trip.' },
]

function prettyKey(k) { return String(k).replace(/_/g, ' ') }

function format(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br>')
}

async function send(text) {
  const message = (text || '').trim()
  if (!message || loading.value) return
  input.value = ''
  messages.value.push({ role: 'user', text: message })
  loading.value = true
  scroll()
  try {
    const res = await service({
      url: '/api/agent/chat', method: 'post',
      data: { message, session_id: sessionId.value, country: 'kenya' }
    })
    const data = res.data || res
    sessionId.value = data.session_id
    localStorage.setItem('meridian_session', data.session_id)
    profile.value = data.profile || {}
    journey.value = data.journey || []
    messages.value.push({ role: 'assistant', text: data.reply || data.error, tools: data.tool_trace || [] })
  } catch (e) {
    messages.value.push({ role: 'assistant', text: 'Backend unreachable — is Flask running on :5001? (' + (e.message || e) + ')' })
  } finally {
    loading.value = false
    scroll()
  }
}

function scroll() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight })
}
</script>

<style scoped>
.concierge { display: flex; height: 100vh; background: #0b1120; color: #e5eaf3; font: 100%/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }

/* Sidebar — heavier material separates structure */
.sidebar { width: 300px; padding: 20px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px) saturate(160%); border-right: 1px solid #1e293b; overflow-y: auto; }
.brand h2 { margin: 0; font-size: 26px; line-height: 1.05; letter-spacing: -0.02em; background: linear-gradient(90deg,#34d399,#38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tagline { color: #64748b; margin: 2px 0 18px; font-size: 13px; letter-spacing: 2px; }
.panel { margin-bottom: 22px; }
.panel h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; }
.empty { color: #475569; font-size: 13px; }
.profile-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed #1e293b; }
.pk { color: #94a3b8; text-transform: capitalize; }
.pv { color: #e5eaf3; max-width: 55%; text-align: right; word-break: break-word; }
.journey-step { font-size: 13px; padding: 4px 0; color: #a7f3d0; text-transform: capitalize; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #34d399; margin-right: 8px; }

/* Quick actions — instant press feedback, specific transitions */
.qa { display: block; width: 100%; text-align: left; margin: 6px 0; padding: 10px 12px; min-height: 40px; background: #1e293b; color: #e5eaf3; border: 1px solid #334155; border-radius: 10px; cursor: pointer; font-size: 13px; transition: background-color 150ms ease-out, border-color 150ms ease-out, transform 100ms ease-out; }
.qa:hover:not(:disabled) { background: #334155; border-color: #38bdf8; }
.qa:active:not(:disabled) { transform: scale(0.97); }
.qa:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.qa:disabled { opacity: .5; cursor: default; }

/* Chat column — translucent chrome, content scrolls underneath */
.chat { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.chat-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: rgba(11, 17, 32, 0.7); backdrop-filter: blur(20px) saturate(180%); border-bottom: 1px solid rgba(30, 41, 59, 0.8); position: sticky; top: 0; z-index: 2; }
.chat-header h1 { font-size: 18px; margin: 0; letter-spacing: -0.01em; font-weight: 650; }
.model-badge { font-size: 12px; color: #7dd3fc; border: 1px solid #164e63; background: rgba(12, 74, 110, 0.35); padding: 4px 10px; border-radius: 20px; }

.messages { flex: 1; overflow-y: auto; padding: 24px 28px; scrollbar-width: thin; scrollbar-color: #334155 transparent; overscroll-behavior: contain; }
.welcome { max-width: 640px; margin: 60px auto; text-align: center; color: #94a3b8; text-wrap: balance; }
.welcome h2 { color: #e5eaf3; font-size: 24px; line-height: 1.15; letter-spacing: -0.02em; }

/* Messages enter with a short ease-out rise — nothing appears from nothing */
.msg { display: flex; margin-bottom: 14px; animation: msg-in 180ms ease-out; }
@keyframes msg-in { from { opacity: 0; transform: translateY(4px) scale(0.98); } to { opacity: 1; transform: none; } }
.msg.user { justify-content: flex-end; }
.bubble { max-width: 72%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.55; }
.msg.user .bubble { background: #2563eb; color: white; border-bottom-right-radius: 5px; }
.msg.assistant .bubble { background: #1e293b; border-bottom-left-radius: 5px; border: 1px solid rgba(51, 65, 85, 0.5); }
.bubble :deep(h4) { margin: 10px 0 4px; font-size: 14px; letter-spacing: -0.01em; }

.tool-trace { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tool-chip { font-size: 11px; background: rgba(12, 74, 110, 0.6); color: #7dd3fc; padding: 3px 9px; border-radius: 12px; cursor: help; border: 1px solid rgba(14, 116, 144, 0.4); }
.typing { color: #94a3b8; font-style: italic; }
.dots { display: inline-block; animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }

/* Composer — floating translucent bar, instant focus + press feedback */
.composer { display: flex; gap: 10px; padding: 14px 28px 18px; background: rgba(11, 17, 32, 0.7); backdrop-filter: blur(20px) saturate(180%); border-top: 1px solid rgba(30, 41, 59, 0.8); }
.composer input { flex: 1; padding: 12px 16px; min-height: 44px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; color: #e5eaf3; font-size: 14px; outline: none; transition: border-color 150ms ease-out, box-shadow 150ms ease-out; }
.composer input::placeholder { color: #64748b; }
.composer input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15); }
.composer button { padding: 12px 24px; min-height: 44px; background: linear-gradient(90deg,#059669,#0284c7); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; transition: transform 100ms ease-out, filter 150ms ease-out; }
.composer button:hover:not(:disabled) { filter: brightness(1.1); }
.composer button:active:not(:disabled) { transform: scale(0.97); }
.composer button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.composer button:disabled { opacity: .5; cursor: not-allowed; }

/* Small screens — sidebar collapses under chat */
@media (max-width: 860px) {
  .concierge { flex-direction: column-reverse; }
  .sidebar { width: auto; max-height: 34vh; border-right: none; border-top: 1px solid #1e293b; }
  .bubble { max-width: 88%; }
}

/* Accessibility — gentler equivalents, never nothing */
@media (prefers-reduced-motion: reduce) {
  .msg { animation: none; }
  .qa, .composer button { transition: none; }
  .dots { animation: none; opacity: 1; }
}
@media (prefers-reduced-transparency: reduce) {
  .sidebar, .chat-header, .composer { backdrop-filter: none; background: #0f172a; }
}
@media (prefers-contrast: more) {
  .bubble, .qa, .composer input { border: 1px solid #94a3b8; }
}
</style>

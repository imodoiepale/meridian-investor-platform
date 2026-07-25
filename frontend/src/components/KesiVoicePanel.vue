<template>
  <Teleport to="body">
    <div class="kesi-overlay" @click.self="$emit('cancel')">
      <div class="kesi-panel">

        <!-- Close -->
        <button class="kesi-close" @click="$emit('cancel')">✕</button>

        <!-- Header -->
        <div class="kesi-header">
          <div class="kesi-avatar" :class="avatarState">
            <div class="avatar-ring r1"></div>
            <div class="avatar-ring r2"></div>
            <div class="avatar-core">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                  fill="currentColor" opacity="0.4"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div class="kesi-id">
            <div class="kesi-name">KESI</div>
            <div class="kesi-role">Kenya Invest AI Advisor · WebRTC</div>
          </div>
          <div class="kesi-status-pill" :class="statusCls">{{ statusText }}</div>
        </div>

        <!-- Live extracted fields — appear as Kesi captures each answer -->
        <div class="fields-strip">
          <div
            v-for="f in fieldSlots"
            :key="f.key"
            class="field-slot"
            :class="{ filled: extracted[f.key] !== undefined && extracted[f.key] !== null && extracted[f.key] !== '' }"
          >
            <div class="field-slot-label">{{ f.label }}</div>
            <div class="field-slot-val">
              <span v-if="extracted[f.key] !== undefined && extracted[f.key] !== null && extracted[f.key] !== ''">
                {{ formatFieldVal(f.key, extracted[f.key]) }}
              </span>
              <span v-else class="field-placeholder">—</span>
            </div>
            <div class="field-slot-tick" v-if="extracted[f.key] !== undefined && extracted[f.key] !== null && extracted[f.key] !== ''">✓</div>
          </div>
        </div>

        <!-- Transcript -->
        <div class="kesi-transcript" ref="transcriptEl">
          <div class="transcript-empty" v-if="!transcript.length && !connecting && !connected">
            <div class="empty-icon">🎙</div>
            <div>Click "Start Session" below to connect to Kesi</div>
          </div>
          <div
            v-for="(msg, i) in transcript"
            :key="i"
            class="msg"
            :class="msg.role"
          >
            <span class="msg-role">{{ msg.role === 'assistant' ? 'Kesi' : 'You' }}</span>
            <span class="msg-text">{{ msg.text }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="kesi-controls">
          <div v-if="!connected && !connecting">
            <button class="btn-start-session" @click="start">
              <span class="btn-dot"></span>
              Start voice session
            </button>
          </div>

          <div v-if="connecting" class="connecting-state">
            <div class="pulse-dots"><span></span><span></span><span></span></div>
            <span>Connecting to Kesi...</span>
          </div>

          <div v-if="connected" class="connected-controls">
            <div class="mic-indicator" :class="{ speaking: avatarState === 'speaking', listening: avatarState === 'listening' }">
              <div class="mic-bar" v-for="i in 5" :key="i" :style="{ animationDelay: i * 0.08 + 's' }"></div>
            </div>
            <button class="btn-end" @click="stop">End conversation</button>
          </div>
        </div>

        <!-- Confirm CTA — only after all 4 answers captured -->
        <Transition name="slide-up">
          <div v-if="allCaptured" class="confirm-section">
            <div class="confirm-label">✅ All answers captured — ready to build your roadmap</div>
            <button class="btn-confirm" @click="confirm">
              Continue to research →
            </button>
          </div>
        </Transition>

        <!-- Error -->
        <div v-if="error" class="kesi-error">⚠ {{ error }}</div>

      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'KesiVoicePanel',
  props: {
    passportData: { type: Object, default: null }
  },
  emits: ['confirm', 'cancel', 'partialUpdate'],

  data() {
    return {
      connected: false,
      connecting: false,
      transcript: [],
      extracted: {
        sector: null,
        capital_usd: null,
        county: null,
        will_reside: null
      },
      error: '',
      statusText: 'Ready',
      avatarState: 'idle',
      pc: null,
      dc: null,
      audioEl: null,
      localStream: null,

      fieldSlots: [
        { key: 'sector', label: 'SECTOR' },
        { key: 'capital_usd', label: 'CAPITAL (USD)' },
        { key: 'county', label: 'COUNTY' },
        { key: 'will_reside', label: 'RELOCATING' }
      ]
    }
  },

  computed: {
    allCaptured() {
      return (
        this.extracted.sector &&
        this.extracted.capital_usd &&
        this.extracted.county &&
        this.extracted.will_reside !== null
      )
    },
    statusCls() {
      if (this.connected) return 'status-live'
      if (this.connecting) return 'status-connecting'
      return 'status-idle'
    }
  },

  beforeUnmount() {
    this.cleanup()
  },

  methods: {
    formatFieldVal(key, val) {
      if (key === 'capital_usd') return 'USD ' + Number(val).toLocaleString()
      if (key === 'will_reside') return val ? 'Yes, relocating' : 'No, remote'
      if (key === 'sector') return String(val).charAt(0).toUpperCase() + String(val).slice(1)
      return val
    },

    async start() {
      this.error = ''
      this.connecting = true
      this.statusText = 'Getting session token...'
      try {
        const tokenRes = await fetch('/api/invest/realtime-token', { method: 'POST' })
        if (!tokenRes.ok) throw new Error('Failed to get realtime token')
        const { client_secret, error } = await tokenRes.json()
        if (error) throw new Error(error)

        this.statusText = 'Connecting WebRTC...'
        this.pc = new RTCPeerConnection()

        this.audioEl = new Audio()
        this.audioEl.autoplay = true
        this.pc.ontrack = e => { this.audioEl.srcObject = e.streams[0] }

        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream))

        this.dc = this.pc.createDataChannel('oai-events')
        this.dc.onmessage = e => this.handleEvent(JSON.parse(e.data))

        const offer = await this.pc.createOffer()
        await this.pc.setLocalDescription(offer)

        const sdpRes = await fetch(
          'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${client_secret}`,
              'Content-Type': 'application/sdp'
            },
            body: offer.sdp
          }
        )
        if (!sdpRes.ok) throw new Error(`SDP failed: ${sdpRes.status}`)

        await this.pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() })

        this.connected = true
        this.connecting = false
        this.avatarState = 'listening'
        this.statusText = 'Live'

        if (this.passportData) this.sendContextMessage()

      } catch (err) {
        this.error = err.message
        this.connecting = false
        this.statusText = 'Failed'
        this.cleanup()
      }
    },

    sendContextMessage() {
      if (!this.dc || this.dc.readyState !== 'open') {
        setTimeout(() => this.sendContextMessage(), 500)
        return
      }
      const name = this.passportData?.full_name || 'the investor'
      const nat = this.passportData?.nationality || 'Unknown'
      this.dc.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message', role: 'user',
          content: [{
            type: 'input_text',
            text: `My name is ${name} and I am ${nat}. Please greet me warmly and ask me 4 quick questions about my Kenya investment plans: (1) which sector, (2) capital range in USD, (3) preferred county, and (4) whether I plan to relocate. After each answer, confirm what you heard. When all 4 are answered, emit a JSON block in this exact format on its own line: {"sector":"...","capital_usd":NUMBER,"county":"...","will_reside":true/false}`
          }]
        }
      }))
      this.dc.send(JSON.stringify({ type: 'response.create' }))
    },

    handleEvent(event) {
      switch (event.type) {
        case 'response.audio_transcript.delta':
          this.avatarState = 'speaking'
          this.updateOrAppend('assistant', event.delta)
          this.tryExtractFromDelta()
          break
        case 'response.audio_transcript.done':
          this.avatarState = 'listening'
          this.tryExtractAnswers()
          break
        case 'conversation.item.input_audio_transcription.completed':
          this.appendMessage('user', event.transcript)
          break
        case 'input_audio_buffer.speech_started':
          this.avatarState = 'listening'
          this.statusText = 'Listening...'
          break
        case 'input_audio_buffer.speech_stopped':
          this.avatarState = 'speaking'
          this.statusText = 'Live'
          break
        case 'error':
          this.error = event.error?.message || 'Realtime error'
          break
      }
    },

    updateOrAppend(role, delta) {
      const last = this.transcript[this.transcript.length - 1]
      if (last && last.role === role && last.partial) {
        last.text += delta
      } else {
        this.transcript.push({ role, text: delta, partial: true })
      }
      this.$nextTick(() => {
        if (this.$refs.transcriptEl) {
          this.$refs.transcriptEl.scrollTop = this.$refs.transcriptEl.scrollHeight
        }
      })
    },

    appendMessage(role, text) {
      const last = this.transcript[this.transcript.length - 1]
      if (last && last.partial) last.partial = false
      this.transcript.push({ role, text, partial: false })
      this.$nextTick(() => {
        if (this.$refs.transcriptEl) {
          this.$refs.transcriptEl.scrollTop = this.$refs.transcriptEl.scrollHeight
        }
      })
    },

    tryExtractFromDelta() {
      // Quick scan for partial JSON during streaming
      const fullText = this.transcript.map(m => m.text).join(' ')
      const m = fullText.match(/\{[^{}]*"sector"[^{}]*\}/)
      if (m) this.parseExtracted(m[0])
    },

    tryExtractAnswers() {
      const fullText = this.transcript.map(m => m.text).join(' ')
      // Try strict JSON block
      const m = fullText.match(/\{[^{}]*"sector"[^{}]*"capital_usd"[^{}]*\}/)
      if (m) this.parseExtracted(m[0])
    },

    parseExtracted(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr)
        let changed = false
        if (parsed.sector && !this.extracted.sector) {
          this.extracted.sector = parsed.sector; changed = true
        }
        if (parsed.capital_usd && !this.extracted.capital_usd) {
          this.extracted.capital_usd = parsed.capital_usd; changed = true
        }
        if (parsed.county && !this.extracted.county) {
          this.extracted.county = parsed.county; changed = true
        }
        if (parsed.will_reside !== undefined && this.extracted.will_reside === null) {
          this.extracted.will_reside = parsed.will_reside; changed = true
        }
        if (changed) this.$emit('partialUpdate', { ...this.extracted })
      } catch {}
    },

    confirm() {
      this.stop()
      this.$emit('confirm', { ...this.extracted })
    },

    stop() {
      this.statusText = 'Ended'
      this.avatarState = 'idle'
      this.connected = false
      this.cleanup()
    },

    cleanup() {
      this.localStream?.getTracks().forEach(t => t.stop())
      this.dc?.close()
      this.pc?.close()
      this.audioEl = null
    }
  }
}
</script>

<style scoped>
/* ── Overlay ── */
.kesi-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(12px) saturate(0.8);
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
}

.kesi-panel {
  width: 560px; max-width: 95vw; max-height: 90vh;
  background: #0a0a0a;
  border: 1px solid rgba(232,80,10,0.3);
  box-shadow: 0 0 60px rgba(232,80,10,0.12), 0 24px 64px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; overflow: hidden;
  position: relative;
}

/* animated top border */
.kesi-panel::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #E8500A, transparent);
  animation: shimmer-line 2.5s linear infinite;
}
@keyframes shimmer-line {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.kesi-close {
  position: absolute; top: 14px; right: 14px;
  background: transparent; border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.5); width: 28px; height: 28px;
  cursor: pointer; font-size: 0.7rem; z-index: 10;
  transition: all 0.15s;
}
.kesi-close:hover { border-color: #E8500A; color: #E8500A; }

/* ── Header ── */
.kesi-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.kesi-avatar {
  position: relative; width: 52px; height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.avatar-ring {
  position: absolute; border-radius: 50%; border: 1px solid rgba(232,80,10,0.4);
  animation: ring-pulse 2s ease-out infinite;
}
.r1 { width: 52px; height: 52px; }
.r2 { width: 52px; height: 52px; animation-delay: 0.6s; }
.kesi-avatar.listening .avatar-ring { border-color: rgba(232,80,10,0.7); animation-duration: 1.2s; }
.kesi-avatar.speaking .avatar-ring { border-color: rgba(255,200,0,0.7); }
.kesi-avatar.done .avatar-ring { border-color: rgba(110,231,183,0.7); }

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.8); opacity: 0; }
}

.avatar-core {
  width: 36px; height: 36px; border-radius: 50%;
  background: #E8500A; color: #fff;
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}

.kesi-id { flex: 1; }
.kesi-name { font-size: 0.95rem; font-weight: 800; color: #fff; letter-spacing: 2px; }
.kesi-role { font-size: 0.62rem; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.5px; }

.kesi-status-pill {
  font-size: 0.6rem; font-weight: 700; letter-spacing: 1.5px;
  padding: 4px 10px; border: 1px solid;
}
.status-idle { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.4); }
.status-connecting { border-color: #f0c040; color: #f0c040; }
.status-live { border-color: #6ee7b7; color: #6ee7b7; animation: blink-border 1.5s infinite; }
@keyframes blink-border {
  50% { border-color: rgba(110,231,183,0.3); }
}

/* ── Fields strip ── */
.fields-strip {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.field-slot {
  padding: 12px 10px; position: relative; background: #0a0a0a;
  transition: background 0.3s;
}
.field-slot.filled { background: rgba(232,80,10,0.06); }
.field-slot-label { font-size: 0.55rem; color: rgba(255,255,255,0.3); letter-spacing: 1px; margin-bottom: 4px; }
.field-slot-val { font-size: 0.72rem; font-weight: 700; color: #fff; min-height: 16px; }
.field-slot.filled .field-slot-val { color: #E8500A; }
.field-placeholder { color: rgba(255,255,255,0.2); }
.field-slot-tick {
  position: absolute; top: 8px; right: 8px;
  font-size: 0.55rem; color: #6ee7b7; font-weight: 700;
  animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pop-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* ── Transcript ── */
.kesi-transcript {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  min-height: 160px; max-height: 240px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.transcript-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; color: rgba(255,255,255,0.25); font-size: 0.75rem;
  padding: 2rem 0; text-align: center;
}
.empty-icon { font-size: 2rem; }

.msg {
  display: flex; gap: 8px; align-items: baseline;
  animation: fade-in-up 0.2s ease both;
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.msg-role {
  font-size: 0.6rem; font-weight: 700; letter-spacing: 1px;
  flex-shrink: 0; padding-top: 1px;
}
.msg.assistant .msg-role { color: #E8500A; }
.msg.user .msg-role { color: rgba(255,255,255,0.4); }
.msg-text { font-size: 0.78rem; line-height: 1.55; color: rgba(255,255,255,0.8); }

/* ── Controls ── */
.kesi-controls {
  padding: 14px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
}

.btn-start-session {
  display: flex; align-items: center; gap: 10px;
  background: #E8500A; color: #fff; border: none;
  padding: 12px 28px; font-family: inherit;
  font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;
  cursor: pointer; transition: background 0.15s;
}
.btn-start-session:hover { background: #c43e09; }
.btn-dot {
  width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.6);
  animation: dot-blink 1s ease infinite;
}
@keyframes dot-blink {
  50% { opacity: 0.2; }
}

.connecting-state {
  display: flex; align-items: center; gap: 12px;
  color: rgba(255,255,255,0.5); font-size: 0.75rem;
}
.pulse-dots { display: flex; gap: 4px; }
.pulse-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #E8500A;
  animation: bounce-dot 1.2s ease infinite;
}
.pulse-dots span:nth-child(2) { animation-delay: 0.2s; }
.pulse-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

.connected-controls {
  display: flex; align-items: center; gap: 20px; width: 100%;
}
.mic-indicator {
  display: flex; align-items: flex-end; gap: 3px; height: 24px; flex: 1;
}
.mic-bar {
  width: 3px; background: rgba(255,255,255,0.2); border-radius: 2px;
  height: 4px; transition: height 0.1s;
}
.mic-indicator.speaking .mic-bar {
  background: #E8500A;
  animation: bar-dance 0.5s ease infinite alternate;
  height: 12px;
}
.mic-indicator.listening .mic-bar {
  background: rgba(110,231,183,0.6);
  animation: bar-dance 0.8s ease infinite alternate;
  height: 8px;
}
.mic-bar:nth-child(1) { animation-delay: 0s; }
.mic-bar:nth-child(2) { animation-delay: 0.08s; }
.mic-bar:nth-child(3) { animation-delay: 0.16s; }
.mic-bar:nth-child(4) { animation-delay: 0.24s; }
.mic-bar:nth-child(5) { animation-delay: 0.32s; }
@keyframes bar-dance {
  from { height: 4px; }
  to { height: 20px; }
}

.btn-end {
  background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.5);
  padding: 8px 16px; font-family: inherit; font-size: 0.72rem; cursor: pointer;
  transition: all 0.15s;
}
.btn-end:hover { border-color: #E8500A; color: #E8500A; }

/* ── Confirm ── */
.confirm-section {
  padding: 14px 20px; background: rgba(232,80,10,0.08);
  border-top: 1px solid rgba(232,80,10,0.2);
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
}
.confirm-label { font-size: 0.72rem; color: #6ee7b7; flex: 1; }
.btn-confirm {
  background: #E8500A; color: #fff; border: none;
  padding: 10px 20px; font-family: inherit; font-size: 0.78rem;
  font-weight: 700; cursor: pointer; transition: background 0.15s;
  white-space: nowrap;
}
.btn-confirm:hover { background: #c43e09; }

.kesi-error {
  padding: 10px 20px; font-size: 0.72rem; color: #ff6b6b;
  border-top: 1px solid rgba(255,107,107,0.2); background: rgba(255,107,107,0.05);
}

/* ── Transition ── */
.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
</style>

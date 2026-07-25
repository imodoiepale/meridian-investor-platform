<template>
  <div class="voice-modal">
    <div class="voice-panel">
      <button class="close-btn" @click="$emit('cancel')">✕</button>

      <div class="voice-avatar" :class="avatarState">
        <div class="avatar-ring"></div>
        <div class="avatar-inner">
          <span class="avatar-icon">🎙</span>
        </div>
      </div>

      <div class="voice-name">Kesi — Kenya Invest AI</div>

      <div class="voice-status">{{ statusText }}</div>

      <!-- Transcript -->
      <div class="transcript" ref="transcriptEl">
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

      <!-- Extracted answers -->
      <div v-if="extracted" class="extracted">
        <div class="extracted-title">✅ Answers captured</div>
        <div class="extracted-grid">
          <div class="ex-item"><span class="ex-lbl">Sector</span><span class="ex-val">{{ extracted.sector }}</span></div>
          <div class="ex-item"><span class="ex-lbl">Capital</span><span class="ex-val">USD {{ Number(extracted.capital_usd).toLocaleString() }}</span></div>
          <div class="ex-item"><span class="ex-lbl">County</span><span class="ex-val">{{ extracted.county }}</span></div>
          <div class="ex-item"><span class="ex-lbl">Relocating</span><span class="ex-val">{{ extracted.will_reside ? 'Yes' : 'No' }}</span></div>
        </div>
        <button class="btn-confirm" @click="confirm">Continue to research →</button>
      </div>

      <div class="voice-controls">
        <button v-if="!connected && !connecting" class="btn-start" @click="start">
          Start voice session
        </button>
        <button v-if="connected" class="btn-stop" @click="stop">
          End conversation
        </button>
        <div v-if="connecting" class="connecting-dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div v-if="error" class="voice-error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VoiceOnboarding',
  props: {
    passportData: { type: Object, default: null }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      connected: false,
      connecting: false,
      transcript: [],
      extracted: null,
      error: '',
      statusText: 'Ready to start voice session',
      avatarState: 'idle',
      pc: null,
      dc: null,
      audioEl: null,
      localStream: null,
    }
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    async start() {
      this.error = ''
      this.connecting = true
      this.statusText = 'Getting session token...'
      try {
        // 1. Get ephemeral token from our backend
        const tokenRes = await fetch('/api/invest/realtime-token', { method: 'POST' })
        if (!tokenRes.ok) throw new Error('Failed to get realtime token')
        const { client_secret, error } = await tokenRes.json()
        if (error) throw new Error(error)

        this.statusText = 'Connecting to OpenAI Realtime...'

        // 2. Create RTCPeerConnection
        this.pc = new RTCPeerConnection()

        // 3. Play remote audio from OpenAI
        this.audioEl = new Audio()
        this.audioEl.autoplay = true
        this.pc.ontrack = e => { this.audioEl.srcObject = e.streams[0] }

        // 4. Add microphone track
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream))

        // 5. Data channel for events
        this.dc = this.pc.createDataChannel('oai-events')
        this.dc.onmessage = e => this.handleEvent(JSON.parse(e.data))

        // 6. SDP offer
        const offer = await this.pc.createOffer()
        await this.pc.setLocalDescription(offer)

        // 7. Send offer to OpenAI Realtime
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
        if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`)

        const answerSdp = await sdpRes.text()
        await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

        this.connected = true
        this.connecting = false
        this.avatarState = 'listening'
        this.statusText = 'Connected — Kesi is speaking...'

        // 8. Send passport context to Kesi
        if (this.passportData) {
          this.sendContextMessage()
        }

      } catch (err) {
        this.error = err.message
        this.connecting = false
        this.statusText = 'Connection failed'
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
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: `My name is ${name} and I am ${nat}. Please start by greeting me and asking about my investment plans.`
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
          break

        case 'response.audio_transcript.done':
          this.avatarState = 'listening'
          this.tryExtractAnswers(event.transcript)
          break

        case 'conversation.item.input_audio_transcription.completed':
          this.appendMessage('user', event.transcript)
          break

        case 'input_audio_buffer.speech_started':
          this.avatarState = 'listening'
          this.statusText = 'Listening...'
          break

        case 'input_audio_buffer.speech_stopped':
          this.statusText = 'Processing...'
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
      // Mark previous partial as done
      const last = this.transcript[this.transcript.length - 1]
      if (last && last.partial) last.partial = false
      this.transcript.push({ role, text, partial: false })
      this.$nextTick(() => {
        if (this.$refs.transcriptEl) {
          this.$refs.transcriptEl.scrollTop = this.$refs.transcriptEl.scrollHeight
        }
      })
    },

    tryExtractAnswers(transcript) {
      if (!transcript) return
      // Scan full transcript text for the JSON block Kesi emits
      const fullText = this.transcript.map(m => m.text).join(' ')
      const jsonMatch = fullText.match(/\{[^{}]*"sector"[^{}]*"capital_usd"[^{}]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.sector && parsed.capital_usd && parsed.county) {
            this.extracted = parsed
            this.avatarState = 'done'
            this.statusText = 'All answers captured!'
          }
        } catch {}
      }
    },

    confirm() {
      this.stop()
      this.$emit('confirm', this.extracted)
    },

    stop() {
      this.statusText = 'Session ended'
      this.avatarState = 'idle'
      this.cleanup()
      this.connected = false
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
/* Meridian white theme */
.voice-modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.voice-panel {
  background: #fff;
  border: 2px solid #000;
  padding: 2rem;
  width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  font-family: 'JetBrains Mono','Space Grotesk',monospace;
  color: #000;
}

.close-btn {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; color: #999;
  font-size: 1rem; cursor: pointer; padding: 0.25rem 0.5rem;
}
.close-btn:hover { color: #000; }

.voice-avatar {
  width: 80px; height: 80px;
  margin: 0 auto 1rem;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}

.avatar-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 2px solid #000;
  opacity: 0.2;
}

.voice-avatar.speaking .avatar-ring {
  animation: ripple 1s ease-out infinite;
  border-color: #E8500A;
  opacity: 0.7;
}
.voice-avatar.listening .avatar-ring {
  animation: ripple 1.5s ease-out infinite;
  border-color: #000;
  opacity: 0.5;
}
.voice-avatar.done .avatar-ring { border-color: #1a7a1a; opacity: 1; }

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.5); opacity: 0; }
}

.avatar-inner {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px solid #000;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  z-index: 1;
}

.voice-name { text-align: center; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
.voice-status { text-align: center; color: #666; font-size: 0.78rem; margin-bottom: 1rem; }

.transcript {
  background: #fafafa;
  border: 1px solid #e5e5e5;
  padding: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 80px;
}

.msg { display: flex; flex-direction: column; gap: 2px; }
.msg.assistant .msg-role { color: #E8500A; }
.msg.user .msg-role { color: #000; }
.msg-role { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.msg-text { font-size: 0.82rem; line-height: 1.4; }

.extracted {
  background: #f5fff5;
  border: 1px solid #1a7a1a;
  padding: 1rem;
  margin-bottom: 1rem;
}
.extracted-title { color: #1a7a1a; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
.extracted-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; }
.ex-item { display: flex; flex-direction: column; gap: 2px; }
.ex-lbl { font-size: 0.68rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
.ex-val { font-size: 0.85rem; font-weight: 700; }
.btn-confirm {
  width: 100%; padding: 0.7rem;
  background: #000; color: #fff;
  border: 2px solid #000; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  text-transform: uppercase; letter-spacing: 0.06em; font-family: inherit;
  transition: background 0.15s;
}
.btn-confirm:hover { background: #1a7a1a; border-color: #1a7a1a; }

.voice-controls { text-align: center; }
.btn-start {
  padding: 0.7rem 2rem;
  background: #000; color: #fff;
  border: 2px solid #000; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: 0.05em;
  transition: background 0.15s;
}
.btn-start:hover { background: #E8500A; border-color: #E8500A; }
.btn-stop {
  padding: 0.7rem 2rem;
  background: #fff; color: #c0392b;
  border: 2px solid #c0392b; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  font-family: inherit;
}

.connecting-dots {
  display: flex; justify-content: center; gap: 6px; padding: 0.75rem;
}
.connecting-dots span {
  width: 8px; height: 8px;
  background: #000;
  border-radius: 50%;
  animation: bounce 0.8s infinite alternate;
}
.connecting-dots span:nth-child(2) { animation-delay: 0.15s; }
.connecting-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }

.voice-error {
  margin-top: 0.75rem;
  background: #fff5f5;
  border: 1px solid #c0392b;
  border-left: 3px solid #c0392b;
  color: #c0392b;
  padding: 0.6rem 0.875rem;
  font-size: 0.78rem;
}
</style>

<template>
  <div class="onboarding-page">

    <!-- Live roadmap builder (replaces loader during research) -->
    <LiveRoadmapBuilder
      :visible="researchLoading"
      :sector-agencies="liveAgencies"
      :complete="researchComplete"
    />

    <!-- Fallback overlay for OCR / simulation -->
    <LoadingOverlay
      :visible="overlayVisible"
      :message="overlayMessage"
      :sub="overlaySub"
      :pct="overlayPct"
      :steps="overlaySteps"
      :activeStep="overlayActiveStep"
    />

    <!-- Cinematic voice modal -->
    <KesiVoicePanel
      v-if="showVoice"
      :passport-data="passportData"
      @confirm="onVoiceConfirm"
      @cancel="showVoice = false"
      @partialUpdate="onVoicePartial"
    />

    <div class="onboarding-body">

      <!-- Step progress bar -->
      <div class="step-track">
        <div
          v-for="(s, i) in stepLabels"
          :key="i"
          class="step-node"
          :class="{
            done: stepNum > i + 1,
            active: stepNum === i + 1,
            pending: stepNum < i + 1
          }"
        >
          <div class="step-circle">
            <span v-if="stepNum > i + 1">✓</span>
            <span v-else>{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
          <div class="step-label">{{ s }}</div>
          <div class="step-line" v-if="i < stepLabels.length - 1"></div>
        </div>
      </div>

      <!-- ── STEP 1: PASSPORT ── -->
      <Transition name="slide-up" mode="out-in">
        <div v-if="step === 1" key="step1" class="step-card">
          <div class="card-header">
            <div class="card-num">01</div>
            <div>
              <h2>Upload your passport or ID</h2>
              <p class="card-sub">AI scans it automatically — name, nationality, expiry extracted instantly</p>
            </div>
          </div>

          <div
            class="upload-zone"
            :class="{
              'drag-over': isDragOver,
              'has-file': passportFile && !passportData,
              'verified': !!passportData
            }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="!passportData && $refs.fileInput.click()"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.pdf"
              @change="handlePassportUpload"
              style="display:none"
            />

            <!-- Empty state -->
            <div v-if="!passportFile && !passportData" class="upload-empty">
              <div class="upload-icon-box">↑</div>
              <div class="upload-title">Drop passport or ID photo</div>
              <div class="upload-hint">JPEG · PNG · PDF · or click to browse</div>
            </div>

            <!-- Scanning state -->
            <div v-else-if="passportFile && !passportData && !passportError" class="upload-scanning">
              <div class="scan-pulse"></div>
              <div class="upload-title">Scanning document...</div>
              <ProgressPulse label="Vision OCR scanning..." />
            </div>

            <!-- Error state -->
            <div v-else-if="passportError" class="upload-error">
              <div class="error-icon">⚠</div>
              <div class="upload-title">Scan failed — continuing manually</div>
              <div class="upload-hint">{{ passportError }}</div>
            </div>

            <!-- Verified state -->
            <div v-else-if="passportData" class="upload-verified">
              <div class="verified-badge">✓ IDENTITY VERIFIED</div>
              <div class="verified-name">{{ passportData.full_name }}</div>
              <div class="verified-meta">
                <span class="meta-pill">{{ passportData.nationality }}</span>
                <span class="meta-pill">{{ passportData.document_type || 'Passport' }}</span>
                <span class="meta-pill" v-if="passportData.expiry_date">Exp: {{ passportData.expiry_date }}</span>
              </div>
              <button class="btn-link" @click.stop="resetPassport">Upload different document</button>
            </div>
          </div>

          <!-- Actions — always visible, grayed before OCR -->
          <div class="step1-actions">
            <button
              class="btn-voice"
              :class="{ 'btn-voice-inactive': !passportData }"
              :disabled="!passportData && !passportError"
              @click="showVoice = true"
            >
              <span class="voice-dot" :class="{ 'voice-dot-inactive': !passportData }"></span>
              {{ passportData ? 'Speak to Kesi (AI advisor)' : 'Scan passport to unlock voice' }}
            </button>
            <button
              class="btn-ghost"
              :disabled="!passportData && !passportError"
              @click="step = 2"
            >
              Fill form manually →
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── STEP 2: 4 QUESTIONS ── -->
      <Transition name="slide-up" mode="out-in">
        <div v-if="step === 2" key="step2" class="step-card">
          <div class="card-header">
            <div class="card-num">02</div>
            <div>
              <h2>Your investment profile</h2>
              <p class="card-sub">4 questions — we handle all the research</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field-block">
              <label class="field-label">SECTOR</label>
              <div class="sector-grid">
                <button
                  v-for="s in sectors"
                  :key="s.value"
                  class="sector-btn"
                  :class="{ selected: form.sector === s.value }"
                  @click="form.sector = s.value"
                >
                  <span class="sector-icon">{{ s.icon }}</span>
                  <span>{{ s.label }}</span>
                </button>
              </div>
            </div>

            <div class="field-block">
              <label class="field-label">INVESTMENT CAPITAL (USD)</label>
              <div class="capital-options">
                <button
                  v-for="c in capitalOptions"
                  :key="c.value"
                  class="capital-btn"
                  :class="{ selected: form.capital_usd == c.value }"
                  @click="form.capital_usd = c.value"
                >{{ c.label }}</button>
              </div>
              <input
                type="number"
                class="field-input"
                v-model="form.capital_usd"
                placeholder="Or enter exact amount e.g. 750000"
                style="margin-top: 8px"
              />
            </div>

            <div class="field-block">
              <label class="field-label">COUNTY</label>
              <select class="field-select" v-model="form.county">
                <option value="">Select county...</option>
                <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="field-block">
              <label class="field-label">WILL YOU RELOCATE TO KENYA?</label>
              <div class="radio-pills">
                <button
                  class="radio-pill"
                  :class="{ selected: form.will_reside === true }"
                  @click="form.will_reside = true"
                >Yes, relocating</button>
                <button
                  class="radio-pill"
                  :class="{ selected: form.will_reside === false }"
                  @click="form.will_reside = false"
                >No, managing remotely</button>
              </div>
            </div>
          </div>

          <div class="step2-footer">
            <button class="btn-ghost" @click="step = 1">← Back</button>
            <button class="btn-voice btn-voice-sm" @click="showVoice = true" title="Re-open Kesi">
              <span class="voice-dot"></span> Kesi
            </button>
            <button
              class="btn-primary"
              @click="runResearch"
              :disabled="!canProceed"
            >
              Build my roadmap →
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── STEP 3: RESULTS ── -->
      <Transition name="slide-up" mode="out-in">
        <div v-if="step === 3 && seedPack" key="step3" class="step-card results-card">
          <div class="card-header">
            <div class="card-num">03</div>
            <div>
              <h2>Your Kenya investment roadmap</h2>
              <p class="card-sub">
                {{ form.sector ? form.sector[0].toUpperCase() + form.sector.slice(1) : '' }} · {{ form.county }} ·
                USD {{ Number(form.capital_usd).toLocaleString() }}
              </p>
            </div>
            <div class="confidence-badge">
              {{ Math.round((seedPack.seed_meta?.confidence_score || 0.85) * 100) }}% confidence
            </div>
          </div>

          <!-- Key metrics -->
          <div class="metrics-strip">
            <div class="metric-tile" v-for="m in metrics" :key="m.label">
              <div class="metric-num" :class="m.cls">{{ m.value }}</div>
              <div class="metric-lbl">{{ m.label }}</div>
            </div>
          </div>

          <!-- Bottleneck alert -->
          <div
            class="alert-card alert-warning"
            v-if="seedPack.bottleneck_forecast?.primary_bottleneck"
          >
            <div class="alert-icon">⚠</div>
            <div>
              <div class="alert-title">Primary bottleneck: {{ seedPack.bottleneck_forecast.primary_bottleneck }}</div>
              <div class="alert-body">{{ seedPack.bottleneck_forecast.primary_cause }}</div>
            </div>
          </div>

          <!-- Required agencies -->
          <div class="agencies-section">
            <div class="section-label">REQUIRED AGENCIES ({{ (seedPack.regulatory_map?.required_agencies || []).length }})</div>
            <div class="agency-chips">
              <span
                class="agency-chip"
                v-for="a in seedPack.regulatory_map?.required_agencies || []"
                :key="a"
              >{{ a }}</span>
            </div>
          </div>

          <!-- Simulation section -->
          <div class="sim-section">
            <div v-if="!simReport && !simLoading">
              <div class="section-label">STEP 04 — MERIDIAN SIMULATION</div>
              <p class="sim-desc">Run 200 agents through 5 Kenya environments to predict exact bottlenecks and dropout risk probability.</p>
              <button class="btn-primary btn-wide" @click="runSimulation">
                Run full simulation →
              </button>
            </div>

            <div v-else-if="simLoading" class="sim-running">
              <div class="section-label">SIMULATION RUNNING</div>
              <ProgressPulse :label="simProgress" />
              <div class="sim-agents">200 agents · 40 rounds · Meridian Kenya v1</div>
            </div>

            <div v-else-if="simReport" class="sim-results">
              <div class="section-label">SIMULATION COMPLETE</div>
              <div class="sim-metrics">
                <div class="sim-metric">
                  <div class="sim-num">{{ Math.round(simReport.abandonment_risk?.probability * 100) }}%</div>
                  <div class="sim-lbl">dropout risk</div>
                </div>
                <div class="sim-metric">
                  <div class="sim-num">Day {{ simReport.abandonment_risk?.trigger_day }}</div>
                  <div class="sim-lbl">trigger point</div>
                </div>
                <div class="sim-metric">
                  <div class="sim-num">{{ simReport.journey_summary?.simulated_days_median || '—' }}</div>
                  <div class="sim-lbl">median days</div>
                </div>
              </div>

              <!-- Bottlenecks -->
              <div class="bottlenecks" v-if="simReport.bottlenecks?.length">
                <div class="section-label" style="margin-top:1.5rem">TOP BOTTLENECKS</div>
                <div
                  class="bottleneck-row"
                  v-for="b in simReport.bottlenecks"
                  :key="b.agency"
                >
                  <div class="bn-agency">{{ b.agency }}</div>
                  <div class="bn-body">
                    <span class="risk-tag">+{{ b.avg_delay_weeks ? b.avg_delay_weeks * 7 : b.avg_delay_days }}d over SLA</span>
                    {{ b.recommendation }}
                  </div>
                </div>
              </div>

              <!-- CTA to roadmap -->
              <div class="roadmap-cta">
                <button class="btn-primary btn-wide btn-orange" @click="goToRoadmap">
                  View full interactive roadmap →
                </button>
                <button class="btn-ghost btn-wide" @click="$router.push('/invest/dashboard')">
                  Open simulation dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div><!-- /onboarding-body -->
  </div><!-- /onboarding-page -->
</template>

<script>
import KesiVoicePanel from '../components/KesiVoicePanel.vue'
import LiveRoadmapBuilder from '../components/LiveRoadmapBuilder.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import ProgressPulse from '../components/ProgressPulse.vue'
import { useTheme } from '../composables/useTheme.js'

const RESEARCH_STEPS = [
  'Checking research cache',
  'Perplexity deep research',
  'Extracting agency fees & SLA benchmarks',
  'Calculating bottleneck forecast',
  'Building seed pack'
]

export default {
  name: 'InvestorOnboarding',
  components: { KesiVoicePanel, LiveRoadmapBuilder, LoadingOverlay, ProgressPulse },
  setup() { const { isDark, toggle } = useTheme(); return { isDark, toggleTheme: toggle } },
  data() {
    return {
      step: 1,
      passportFile: null,
      passportData: null,
      passportError: null,
      isDragOver: false,
      loading: false,
      simLoading: false,
      simProgress: 'initialising...',
      seedPack: null,
      simReport: null,
      showVoice: false,
      sessionId: crypto.randomUUID(),

      // Live roadmap builder state
      researchLoading: false,
      researchComplete: false,
      liveAgencies: [],

      // Overlay state
      overlayVisible: false,
      overlayMessage: '',
      overlaySub: '',
      overlayPct: 0,
      overlaySteps: [],
      overlayActiveStep: 0,
      _overlayTimer: null,

      form: {
        sector: '',
        capital_usd: null,
        county: 'Nairobi',
        will_reside: true
      },

      stepLabels: ['Identity', 'Profile', 'Research', 'Simulate', 'Report'],

      capitalOptions: [
        { label: '$100K–$250K', value: 150000 },
        { label: '$250K–$500K', value: 350000 },
        { label: '$500K–$1M', value: 750000 },
        { label: '$1M–$5M', value: 2500000 },
        { label: '$5M+', value: 6000000 }
      ],

      sectors: [
        { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
        { value: 'fintech', label: 'Fintech', icon: '💳' },
        { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
        { value: 'tourism', label: 'Tourism', icon: '🏨' },
        { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
        { value: 'real_estate', label: 'Real Estate', icon: '🏗️' },
        { value: 'ict', label: 'ICT / Tech', icon: '💻' },
        { value: 'energy', label: 'Energy', icon: '⚡' },
        { value: 'logistics', label: 'Logistics', icon: '🚢' },
        { value: 'retail', label: 'Retail', icon: '🛒' }
      ],

      counties: [
        'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu',
        'Machakos', 'Kajiado', 'Nyeri', 'Meru', 'Kakamega',
        'Kisii', 'Siaya', 'Homa Bay', 'Migori', 'Nyamira',
        'Kericho', 'Nandi', 'Uasin Gishu', 'Trans Nzoia', 'Baringo',
        'Laikipia', 'Samburu', 'Isiolo', 'Marsabit', 'Garissa',
        'Tana River', 'Lamu', 'Taita Taveta', 'Kwale', 'Kilifi',
        "Murang'a", 'Kirinyaga', 'Nyandarua', 'Embu', 'Kitui',
        'Makueni', 'Narok', 'Bomet', 'Bungoma', 'Busia'
      ]
    }
  },

  computed: {
    stepNum() {
      if (this.simReport) return 5
      if (this.seedPack) return 4
      if (this.step === 3) return 3
      return this.step
    },
    canProceed() {
      return this.form.sector && this.form.capital_usd && this.form.county
    },
    metrics() {
      if (!this.seedPack) return []
      const rmap = this.seedPack.regulatory_map || {}
      const fees = this.seedPack.fee_schedule || {}
      const totalKES = Object.values(fees).reduce((s, f) => s + (f.official_fee_kes || 0), 0)
      const risk = this.seedPack.bottleneck_forecast?.abandonment_risk_pct || 0
      return [
        { label: 'Est. days', value: rmap.estimated_total_days || '90+', cls: '' },
        { label: 'Agencies', value: (rmap.required_agencies || []).length || '—', cls: '' },
        {
          label: 'Est. fees',
          value: totalKES ? 'KES ' + Math.round(totalKES / 1000) + 'K' : 'KES 600K+',
          cls: ''
        },
        {
          label: 'Dropout risk',
          value: risk + '%',
          cls: risk > 40 ? 'risk-high' : risk > 20 ? 'risk-med' : 'risk-low'
        }
      ]
    }
  },

  methods: {
    resetPassport() {
      this.passportFile = null
      this.passportData = null
      this.passportError = null
    },

    handleDrop(e) {
      this.isDragOver = false
      const f = e.dataTransfer.files[0]
      if (f) this.processPassportFile(f)
    },

    async handlePassportUpload(e) {
      const f = e.target.files[0]
      if (f) await this.processPassportFile(f)
    },

    async processPassportFile(file) {
      this.passportFile = file
      this.passportError = null
      this.passportData = null

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/invest/read-passport', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.status === 'success') {
          this.passportData = data.data
        } else {
          throw new Error(data.error || 'OCR failed')
        }
      } catch (e) {
        this.passportError = e.message
        this.passportData = { full_name: 'Unknown', nationality: 'Unknown', document_type: 'passport' }
      }
    },

    onVoicePartial(partial) {
      // Live-fill form as Kesi extracts each answer
      if (partial.sector) this.form.sector = partial.sector
      if (partial.capital_usd) this.form.capital_usd = partial.capital_usd
      if (partial.county) this.form.county = partial.county
      if (partial.will_reside !== null && partial.will_reside !== undefined) this.form.will_reside = partial.will_reside
    },

    async onVoiceConfirm(answers) {
      this.showVoice = false
      // Fill form with all confirmed answers
      this.form.sector = answers.sector || this.form.sector
      this.form.capital_usd = answers.capital_usd || this.form.capital_usd
      this.form.county = answers.county || this.form.county
      if (answers.will_reside !== null && answers.will_reside !== undefined) {
        this.form.will_reside = answers.will_reside
      }
      // Show step 2 filled for 1.2s so user sees the form animate in
      this.step = 2
      await new Promise(r => setTimeout(r, 1200))
      // Then auto-proceed to research if all 4 answers captured
      if (this.canProceed) {
        await this.runResearch()
      }
    },

    showOverlay(msg, sub = '', steps = RESEARCH_STEPS) {
      this.overlayMessage = msg
      this.overlaySub = sub
      this.overlaySteps = steps
      this.overlayActiveStep = 0
      this.overlayPct = 2
      this.overlayVisible = true

      // Cycle step messages
      let i = 0
      this._overlayTimer = setInterval(() => {
        i++
        if (i < steps.length) {
          this.overlayActiveStep = i
          this.overlayPct = Math.round((i / steps.length) * 90)
        }
      }, 8000)
    },

    hideOverlay() {
      clearInterval(this._overlayTimer)
      this.overlayPct = 100
      setTimeout(() => { this.overlayVisible = false; this.overlayPct = 0 }, 400)
    },

    async runResearch() {
      this.loading = true
      this.researchLoading = true
      this.researchComplete = false
      this.liveAgencies = []

      try {
        const payload = {
          sector: this.form.sector,
          nationality: this.passportData?.nationality || 'Unknown',
          capital_usd: parseFloat(this.form.capital_usd),
          county: this.form.county,
          will_reside: this.form.will_reside
        }

        const res = await fetch('/api/invest/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) throw new Error(`Research API error: ${res.status}`)
        const data = await res.json()
        this.seedPack = data.seed

        // Feed discovered agencies into live roadmap
        const agencies = data.seed?.regulatory_map?.required_agencies || []
        this.liveAgencies = agencies
        this.researchComplete = true

        // Hold complete state briefly for animation
        await new Promise(r => setTimeout(r, 1200))

        this.step = 3
        this.researchLoading = false

        // Fire-and-forget session save
        this.saveToZep(data.seed)

        // Persist for roadmap view
        sessionStorage.setItem('ki_seed_pack', JSON.stringify(data.seed))
        sessionStorage.setItem('ki_form', JSON.stringify(this.form))

      } catch (e) {
        this.researchLoading = false
        alert('Research failed: ' + e.message)
      } finally {
        this.loading = false
      }
    },

    async runSimulation() {
      this.simLoading = true
      this.simProgress = 'Spawning 200 agents...'

      try {
        const res = await fetch('/api/invest/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seed: this.seedPack,
            agent_count: 200,
            rounds: 40,
            question: 'Where does this investor face highest friction and abandonment risk?'
          })
        })

        const { simulation_id } = await res.json()
        await this.pollSimulation(simulation_id)

        // Persist for dashboard/roadmap
        sessionStorage.setItem('ki_sim_report', JSON.stringify(this.simReport))

      } catch (e) {
        alert('Simulation failed: ' + e.message)
      } finally {
        this.simLoading = false
      }
    },

    async pollSimulation(simId) {
      const statusLabels = {
        queued: 'Queuing agents...',
        running: 'Simulating investor journeys...',
        complete: 'Complete'
      }

      const poll = async () => {
        const res = await fetch(`/api/invest/simulate/${simId}/status`)
        const data = await res.json()

        this.simProgress = statusLabels[data.status] || data.status

        if (data.status === 'complete') {
          this.simReport = data.report
          return
        }
        if (data.status === 'error') throw new Error(data.error)

        await new Promise(r => setTimeout(r, 3000))
        return poll()
      }

      return poll()
    },

    goToRoadmap() {
      sessionStorage.setItem('ki_seed_pack', JSON.stringify(this.seedPack))
      if (this.simReport) sessionStorage.setItem('ki_sim_report', JSON.stringify(this.simReport))
      this.$router.push('/invest/roadmap')
    },

    async saveToZep(seedPack) {
      try {
        await fetch('/api/invest/session/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            user_id: this.passportData?.passport_number || this.sessionId,
            passport: this.passportData,
            form: this.form,
            seed_pack: seedPack
          })
        })
      } catch {}
    }
  }
}
</script>

<style scoped>
/* ── Page shell ── */
.onboarding-page { min-height: 100vh; background: var(--bg); font-family: 'JetBrains Mono', 'Space Grotesk', monospace; color: var(--text); }

/* ── Navbar ── */
.ki-nav { height: 56px; background: #000; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; position: sticky; top: 0; z-index: 100; }
.ki-nav-brand { color: #fff; text-decoration: none; font-weight: 800; font-size: 1rem; letter-spacing: 2px; display: flex; align-items: center; gap: 10px; }
.ki-mark { color: #E8500A; font-size: 1.1rem; }
.ki-sub { font-weight: 400; opacity: 0.4; font-size: 0.82rem; letter-spacing: 1px; }
.ki-nav-links { display: flex; }
.ki-nav-link { color: rgba(255,255,255,0.45); text-decoration: none; font-size: 0.7rem; font-weight: 600; letter-spacing: 1px; padding: 0 16px; height: 56px; display: flex; align-items: center; border-right: 1px solid rgba(255,255,255,0.07); transition: color 0.15s, background 0.15s; }
.ki-nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
.ki-nav-link.router-link-active { color: #fff; border-bottom: 2px solid #E8500A; }

/* ── Body ── */
.onboarding-body { max-width: 780px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; color: var(--text); }

/* ── Step track ── */
.step-track { display: flex; align-items: flex-start; margin-bottom: 2.5rem; }
.step-node { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; }
.step-circle { width: 32px; height: 32px; border: 2px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--text3); background: var(--surface); transition: all 0.3s; flex-shrink: 0; }
.step-node.done .step-circle { background: var(--text); border-color: var(--text); color: var(--bg); }
.step-node.active .step-circle { background: #E8500A; border-color: #E8500A; color: #fff; }
.step-label { font-size: 0.6rem; letter-spacing: 1px; color: var(--text3); margin-top: 6px; text-align: center; text-transform: uppercase; }
.step-node.done .step-label, .step-node.active .step-label { color: var(--text); }
.step-line { position: absolute; top: 15px; left: calc(50% + 16px); right: calc(-50% + 16px); height: 2px; background: var(--border); z-index: 0; }
.step-node.done .step-line { background: var(--text); }

/* ── Step card ── */
.step-card { background: var(--surface); border: 1px solid var(--border); padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.results-card { padding-bottom: 2.5rem; }
.card-header { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
.card-num { font-size: 2rem; font-weight: 800; color: #E8500A; line-height: 1; flex-shrink: 0; }
.card-header h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
.card-sub { font-size: 0.78rem; color: var(--text2); }
.confidence-badge { margin-left: auto; background: var(--surface2); padding: 4px 10px; font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; color: var(--success); white-space: nowrap; }

/* ── Upload zone ── */
.upload-zone { border: 2px dashed var(--border); min-height: 180px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; background: var(--bg2); padding: 2rem; margin-bottom: 1.25rem; }
.upload-zone:hover, .upload-zone.drag-over { border-color: var(--text2); border-style: solid; background: var(--surface2); }
.upload-zone.verified { border-color: var(--success); border-style: solid; background: var(--surface2); cursor: default; }
.upload-zone.has-file { border-color: #E8500A; border-style: solid; }
.upload-empty, .upload-scanning, .upload-verified, .upload-error { text-align: center; width: 100%; }
.upload-icon-box { width: 40px; height: 40px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: var(--text3); font-size: 1.1rem; }
.upload-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; }
.upload-hint { font-size: 0.72rem; color: var(--text3); }
.error-icon { font-size: 1.5rem; color: #E8500A; margin-bottom: 8px; }
.verified-badge { display: inline-block; background: #1a7a1a; color: #fff; font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px; padding: 3px 10px; margin-bottom: 10px; }
.verified-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
.verified-meta { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.meta-pill { background: var(--surface2); color: var(--text2); padding: 3px 10px; font-size: 0.7rem; }
.btn-link { background: none; border: none; color: var(--text3); font-size: 0.72rem; cursor: pointer; text-decoration: underline; font-family: inherit; }
.btn-link:hover { color: var(--text); }
.scan-pulse { width: 48px; height: 48px; border: 3px solid var(--border); border-top-color: #E8500A; border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Step 1 actions ── */
.step1-actions { display: flex; gap: 12px; align-items: center; }
.btn-voice { display: flex; align-items: center; gap: 10px; background: #000; color: #fff; border: none; padding: 12px 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.5px; transition: background 0.15s; flex: 1; justify-content: center; }
.btn-voice:hover:not(:disabled) { background: #E8500A; }
.btn-voice-inactive { background: #1a1a1a; color: rgba(255,255,255,0.4); cursor: default; }
.btn-voice-sm { flex: 0; padding: 10px 14px; font-size: 0.72rem; }
.voice-dot { width: 8px; height: 8px; background: #E8500A; border-radius: 50%; animation: pulse-dot 1.2s ease-in-out infinite; flex-shrink: 0; }
.voice-dot-inactive { background: rgba(255,255,255,0.2); animation: none; }
@keyframes pulse-dot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.6)} }
.btn-ghost { background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 12px 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: border-color 0.15s; }
.btn-ghost:hover:not(:disabled) { border-color: var(--orange); }
.btn-ghost:disabled, .btn-voice:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Form grid ── */
.form-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 1.75rem; }
.field-block {}
.field-label { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px; color: var(--text2); margin-bottom: 8px; }
.field-input { width: 100%; border: 1px solid var(--border); padding: 10px 14px; font-size: 0.88rem; font-family: inherit; outline: none; background: var(--bg2); color: var(--text); transition: border-color 0.15s; box-sizing: border-box; }
.field-input:focus { border-color: var(--orange); background: var(--surface); }
.field-select { width: 100%; border: 1px solid var(--border); padding: 10px 14px; font-size: 0.88rem; font-family: inherit; outline: none; background: var(--bg2); color: var(--text); cursor: pointer; }
.field-select:focus { border-color: var(--orange); }

.sector-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; }
.sector-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 0.78rem; font-family: inherit; cursor: pointer; transition: all 0.15s; text-align: left; }
.sector-btn:hover { border-color: var(--orange); }
.sector-btn.selected { background: var(--orange); color: #fff; border-color: var(--orange); }
.sector-icon { font-size: 1rem; }

.capital-options { display: flex; gap: 6px; flex-wrap: wrap; }
.capital-btn { padding: 7px 14px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 0.75rem; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.capital-btn:hover { border-color: var(--orange); }
.capital-btn.selected { background: var(--orange); color: #fff; border-color: var(--orange); }

.radio-pills { display: flex; gap: 8px; }
.radio-pill { padding: 10px 20px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 0.82rem; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.radio-pill:hover { border-color: var(--orange); }
.radio-pill.selected { background: var(--orange); color: #fff; border-color: var(--orange); }

.step2-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.25rem; border-top: 1px solid var(--border); }
.btn-primary { background: var(--orange); color: #fff; border: none; padding: 12px 24px; font-size: 0.88rem; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.5px; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: var(--orange-h); }
.btn-primary:disabled { background: var(--border); color: var(--text3); cursor: not-allowed; }
.btn-wide { width: 100%; padding: 14px; font-size: 0.9rem; text-align: center; }
.btn-orange { background: #E8500A; }
.btn-orange:hover { background: #c43e09 !important; }

/* ── Results ── */
.metrics-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); margin-bottom: 1.25rem; }
.metric-tile { background: var(--surface); padding: 1.25rem; text-align: center; }
.metric-num { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; color: var(--text); }
.metric-lbl { font-size: 0.65rem; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; }
.risk-high { color: #c0392b; }
.risk-med { color: #E8500A; }
.risk-low { color: #1a7a1a; }

.alert-card { display: flex; gap: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
.alert-warning { background: rgba(232,80,10,0.06); border-left: 3px solid #E8500A; }
.alert-icon { font-size: 1.1rem; color: #E8500A; flex-shrink: 0; padding-top: 1px; }
.alert-title { font-size: 0.82rem; font-weight: 700; margin-bottom: 3px; }
.alert-body { font-size: 0.75rem; color: var(--text2); }

.section-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px; color: var(--text2); margin-bottom: 10px; }
.agency-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.agency-chip { background: var(--surface2); color: var(--text); border: 1px solid var(--border); padding: 5px 12px; font-size: 0.72rem; font-weight: 600; }
.agencies-section { margin-bottom: 1.75rem; }

/* ── Simulation section ── */
.sim-section { padding-top: 1.5rem; border-top: 1px solid var(--border); }
.sim-desc { font-size: 0.82rem; color: var(--text2); margin-bottom: 1.25rem; line-height: 1.6; }
.sim-running { display: flex; flex-direction: column; gap: 10px; }
.sim-agents { font-size: 0.68rem; color: var(--text3); letter-spacing: 0.5px; }
.sim-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); margin-bottom: 1.25rem; }
.sim-metric { background: var(--surface); padding: 1.25rem; text-align: center; }
.sim-num { font-size: 1.4rem; font-weight: 800; margin-bottom: 4px; color: #E8500A; }
.sim-lbl { font-size: 0.65rem; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; }
.bottleneck-row { display: flex; gap: 12px; padding: 0.75rem 0; border-bottom: 1px solid var(--border); }
.bn-agency { font-size: 0.78rem; font-weight: 700; min-width: 110px; color: #E8500A; }
.bn-body { font-size: 0.75rem; color: var(--text2); line-height: 1.5; }
.risk-tag { background: rgba(232,80,10,0.1); color: #E8500A; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; margin-right: 6px; letter-spacing: 0.5px; }
.roadmap-cta { display: flex; flex-direction: column; gap: 10px; margin-top: 1.75rem; }

/* ── Transitions ── */
.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(18px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

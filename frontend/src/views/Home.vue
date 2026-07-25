<template>
  <div class="home-container">
    <!-- ── Navbar ── -->
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-mark">◈</span> MERIDIAN
        <span class="brand-sub">/ Kenya Invest</span>
      </div>
      <div class="nav-links">
        <router-link to="/concierge" class="nav-inner-link">Concierge</router-link>
        <router-link to="/invest" class="nav-inner-link">Onboarding</router-link>
        <router-link to="/invest/roadmap" class="nav-inner-link">Roadmap</router-link>
        <router-link to="/invest/dashboard" class="nav-inner-link">Dashboard</router-link>
        <router-link to="/invest/graphs" class="nav-inner-link">Graphs</router-link>
        <div class="nav-status-dot" :class="backendOk ? 'dot-live' : 'dot-off'" :title="backendOk ? 'Backend online' : 'Backend offline'"></div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">{{ isDark ? '☀' : '◑' }}</button>
      </div>
    </nav>

    <!-- ── Cinematic Hero ── -->
    <section class="hero-wrap" ref="heroWrap" @mousemove="onMouseMove">
      <ParticleCanvas :count="70" color="232,80,10" />
      <div class="hero-grid-bg"></div>

      <!-- Spotlight follow -->
      <div class="spotlight" :style="spotlightStyle"></div>

      <!-- Floating sector tags -->
      <div class="float-tags" aria-hidden="true">
        <span v-for="t in floatTags" :key="t.label" class="float-tag" :style="t.style">{{ t.label }}</span>
      </div>

      <div class="hero-inner">

        <!-- Badge -->
        <div class="hero-badge-row">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            MERIDIAN INTELLIGENCE PLATFORM
          </div>
          <div class="hero-live-ticker">
            <span class="ticker-led"></span>
            LIVE · Kenya Regulatory Data 2026
          </div>
        </div>

        <!-- Main headline -->
        <h1 class="hero-title">
          Know exactly how to<br>
          invest in <span class="hero-accent-kenya">Kenya</span>.
        </h1>

        <!-- Rotating sector line -->
        <div class="hero-sector-line">
          <span class="sector-prefix">Sector intelligence for</span>
          <span class="sector-rotator">
            <span class="sector-word" :key="currentSector" :class="{ 'sector-in': sectorVisible }">{{ sectors[currentSector] }}</span>
          </span>
        </div>

        <!-- Value props -->
        <div class="hero-props">
          <div class="prop-item">
            <span class="prop-icon">◈</span>
            <span>AI deep research on every Kenya agency, fee & SLA</span>
          </div>
          <div class="prop-item">
            <span class="prop-icon">◈</span>
            <span>200-agent simulation predicts where your capital stalls</span>
          </div>
          <div class="prop-item">
            <span class="prop-icon">◈</span>
            <span>Full regulatory roadmap delivered in under 90 seconds</span>
          </div>
        </div>

        <!-- CTAs -->
        <div class="hero-cta-row">
          <button class="cta-primary" @click="$router.push('/invest')">
            <span class="cta-ripple"></span>
            <span class="cta-dot"></span>
            Build my investment roadmap
            <span class="cta-arrow">→</span>
          </button>
          <button class="cta-ghost" @click="$router.push('/invest/roadmap')">
            Explore Kenya roadmap
          </button>
        </div>

        <!-- Animated stat counters -->
        <div class="stat-counters">
          <div class="stat-c" v-for="s in statCounters" :key="s.id">
            <div class="stat-num">
              <span class="stat-displayed">{{ s.displayed }}</span>
              <span class="stat-suffix">{{ s.suffix }}</span>
            </div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

      </div>

      <!-- Agency ticker tape -->
      <div class="agency-ticker">
        <div class="ticker-label">KENYA AGENCIES MAPPED</div>
        <div class="ticker-track">
          <div class="ticker-inner">
            <span class="ticker-item" v-for="(a, i) in tickerAgencies.concat(tickerAgencies)" :key="i">
              <span class="ticker-sep">◈</span> {{ a }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Upload Console + Workflow ── -->
    <section class="console-section">
      <div class="console-grid">

        <!-- Left: workflow -->
        <div class="workflow-panel">
          <div class="wp-header">
            <span class="wp-header-mark">◇</span> WORKFLOW SEQUENCE
          </div>
          <div class="workflow-steps">
            <div
              class="ws-item"
              v-for="s in steps"
              :key="s.num"
            >
              <div class="ws-num">{{ s.num }}</div>
              <div class="ws-body">
                <div class="ws-title">{{ s.title }}</div>
                <div class="ws-desc">{{ s.desc }}</div>
              </div>
              <div class="ws-line" v-if="s.num !== '05'"></div>
            </div>
          </div>

          <!-- Metric cards -->
          <div class="metric-row">
            <div class="metric-c">
              <div class="metric-v">~$3</div>
              <div class="metric-l">avg cost per run</div>
            </div>
            <div class="metric-c">
              <div class="metric-v">10+</div>
              <div class="metric-l">sectors covered</div>
            </div>
            <div class="metric-c">
              <div class="metric-v">47</div>
              <div class="metric-l">agencies mapped</div>
            </div>
          </div>
        </div>

        <!-- Right: upload console -->
        <div class="upload-console">
          <div class="uc-header">
            <div class="uc-title-row">
              <span class="uc-label">01 / IDENTITY SEED</span>
              <span class="uc-meta">JPEG · PNG · PDF</span>
            </div>
          </div>

          <div
            class="drop-zone"
            :class="{ 'dz-hover': isDragOver, 'dz-ready': passportFile }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="$refs.fileInput.click()"
          >
            <input ref="fileInput" type="file" accept="image/*,.pdf" @change="handleFileSelect" style="display:none" />

            <div v-if="!passportFile" class="dz-empty">
              <div class="dz-icon">↑</div>
              <div class="dz-text">Drop passport or ID photo</div>
              <div class="dz-hint">JPEG · PNG · PDF · or click to browse</div>
            </div>

            <div v-else class="dz-filled">
              <div class="dz-check">✓</div>
              <div class="dz-filename">{{ passportFile.name }}</div>
              <div class="dz-hint">Ready — click below to start</div>
            </div>
          </div>

          <!-- Objective input -->
          <div class="uc-divider"><span>SIMULATION FOCUS</span></div>
          <div class="uc-textarea-wrap">
            <div class="uc-label uc-label-sm">&gt;_ 02 / RESEARCH OBJECTIVE</div>
            <textarea
              v-model="objective"
              class="uc-textarea"
              placeholder="// Optional: what to focus on — e.g. Where will a Chinese manufacturing investor face the highest friction in Nairobi?"
              rows="4"
            ></textarea>
            <div class="uc-engine-tag">Engine: Meridian-Kenya-v1</div>
          </div>

          <!-- Roadmap quick-link -->
          <div class="rmap-card" @click="$router.push('/invest/roadmap')">
            <span class="rmap-icon">🗺️</span>
            <div>
              <div class="rmap-title">Kenya Regulatory Roadmap</div>
              <div class="rmap-sub">5-phase interactive — Pre-Reg → County Permits</div>
            </div>
            <span class="rmap-arr">→</span>
          </div>

          <!-- Start button -->
          <button
            class="start-btn"
            @click="startFlow"
            :disabled="!passportFile"
          >
            <span>{{ passportFile ? 'Start investor onboarding' : 'Upload passport to begin' }}</span>
            <span class="start-arr">→</span>
          </button>
        </div>

      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import ParticleCanvas from '../components/ParticleCanvas.vue'
import { useTheme } from '../composables/useTheme.js'
const { isDark, toggle: toggleTheme } = useTheme()

const router = useRouter()
const passportFile = ref(null)
const objective = ref('')
const isDragOver = ref(false)
const backendOk = ref(false)
const heroWrap = ref(null)
const spotlightX = ref(50)
const spotlightY = ref(50)

const spotlightStyle = computed(() => ({
  background: `radial-gradient(600px circle at ${spotlightX.value}px ${spotlightY.value}px, rgba(232,80,10,0.07), transparent 60%)`,
}))

const onMouseMove = (e) => {
  const rect = heroWrap.value?.getBoundingClientRect()
  if (!rect) return
  spotlightX.value = e.clientX - rect.left
  spotlightY.value = e.clientY - rect.top
}

// Rotating sectors
const sectors = ['Manufacturing', 'Fintech', 'Agriculture', 'Real Estate', 'Healthcare', 'ICT / Tech', 'Energy', 'Tourism', 'Logistics']
const currentSector = ref(0)
const sectorVisible = ref(true)
let sectorTimer = null

// Floating background tags
const floatTags = [
  { label: 'BRS Registration',  style: { top: '18%', left: '6%',  animationDelay: '0s',   animationDuration: '7s'  } },
  { label: 'KRA · Tax PIN',     style: { top: '34%', left: '4%',  animationDelay: '1.2s', animationDuration: '9s'  } },
  { label: 'NSSF',              style: { top: '55%', left: '8%',  animationDelay: '2s',   animationDuration: '8s'  } },
  { label: 'County Permit',     style: { top: '72%', left: '5%',  animationDelay: '0.5s', animationDuration: '6s'  } },
  { label: 'KEBS Standards',    style: { top: '20%', right: '7%', animationDelay: '1s',   animationDuration: '8s'  } },
  { label: 'Capital Markets',   style: { top: '40%', right: '5%', animationDelay: '2.5s', animationDuration: '7s'  } },
  { label: 'Work Permit',       style: { top: '62%', right: '6%', animationDelay: '0.8s', animationDuration: '9s'  } },
  { label: 'NHIF',              style: { top: '80%', right: '9%', animationDelay: '1.8s', animationDuration: '6s'  } },
]

// Animated stat counters
const statCounters = reactive([
  { id: 1, target: 47,  displayed: 0, suffix: '',   label: 'Kenya agencies mapped' },
  { id: 2, target: 200, displayed: 0, suffix: '+',  label: 'Agents per simulation' },
  { id: 3, target: 90,  displayed: 0, suffix: 's',  label: 'Roadmap generated in' },
  { id: 4, target: 5,   displayed: 0, suffix: '',   label: 'Step investment journey' },
])

// Agency ticker tape
const tickerAgencies = [
  'Business Registration Service', 'Kenya Revenue Authority', 'NSSF', 'NHIF',
  'Nairobi City County', 'KEBS', 'Capital Markets Authority', 'CBK',
  'National Land Commission', 'NEMA', 'Energy & Petroleum Regulatory Authority',
  'Communications Authority', 'Tourism Regulatory Authority', 'PPB Kenya',
]

const steps = [
  { num: '01', title: 'Voice Profile', desc: 'Kesi (AI advisor) asks 4 questions over WebRTC voice — sector, capital, county, relocation' },
  { num: '02', title: 'Deep Research', desc: 'Perplexity sonar-deep-research pulls Kenya 2026 fee schedules, SLA benchmarks & risk scores' },
  { num: '03', title: 'Live Roadmap Build', desc: 'Watch your regulatory roadmap build in real time — nodes appear as agencies are discovered' },
  { num: '04', title: 'Meridian Simulation', desc: '200 typed agents traverse 5 Kenya environments — exact bottlenecks & dropout risk predicted' },
  { num: '05', title: 'Investor Report', desc: 'Full roadmap: critical path, agency risk scores, cost estimate, platform recommendations' },
]

const animateCounters = () => {
  statCounters.forEach(s => {
    let start = 0
    const duration = 1800
    const step = 16
    const increment = s.target / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= s.target) { s.displayed = s.target; clearInterval(timer) }
      else s.displayed = Math.floor(start)
    }, step)
  })
}

const rotateSector = () => {
  sectorTimer = setInterval(() => {
    sectorVisible.value = false
    setTimeout(() => {
      currentSector.value = (currentSector.value + 1) % sectors.length
      sectorVisible.value = true
    }, 300)
  }, 2600)
}

onMounted(async () => {
  try {
    const r = await fetch('/api/invest/cache/stats')
    backendOk.value = r.ok
  } catch { backendOk.value = false }

  setTimeout(animateCounters, 400)
  sectorVisible.value = true
  rotateSector()
})

onBeforeUnmount(() => { clearInterval(sectorTimer) })

const handleFileSelect = (e) => {
  const f = e.target.files[0]
  if (f) passportFile.value = f
}

const handleDrop = (e) => {
  isDragOver.value = false
  const f = e.dataTransfer.files[0]
  if (f) passportFile.value = f
}

const startFlow = () => {
  if (!passportFile.value) return
  sessionStorage.setItem('ki_passport_file_name', passportFile.value.name)
  sessionStorage.setItem('ki_objective', objective.value)
  router.push('/invest')
}
</script>

<style scoped>
.home-container { min-height: 100vh; background: var(--bg); font-family: 'JetBrains Mono','Space Grotesk',monospace; color: var(--text); }

/* ── Navbar ── */
.navbar { height: 56px; background: rgba(0,0,0,0.92); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); }
.nav-brand { font-weight: 800; letter-spacing: 2px; font-size: 1rem; display: flex; align-items: center; gap: 10px; }
.brand-mark { color: #E8500A; }
.brand-sub { font-weight: 400; opacity: 0.4; font-size: 0.82rem; letter-spacing: 1px; }
.nav-links { display: flex; align-items: center; }
.nav-inner-link { color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.68rem; font-weight: 600; letter-spacing: 1px; padding: 0 16px; height: 56px; display: flex; align-items: center; border-right: 1px solid rgba(255,255,255,0.06); transition: color 0.15s, background 0.15s; }
.nav-inner-link:hover { color: #fff; background: rgba(255,255,255,0.04); }
.nav-inner-link.router-link-active { color: #fff; border-bottom: 2px solid #E8500A; }
.nav-status-dot { width: 7px; height: 7px; border-radius: 50%; margin: 0 20px; }
.dot-live { background: #6ee7b7; box-shadow: 0 0 8px #6ee7b7; animation: led-blink 2s ease infinite; }
.dot-off { background: #555; }
@keyframes led-blink { 50% { opacity: 0.4; } }

/* ── Hero shell ── */
.hero-wrap { position: relative; min-height: 72vh; display: flex; flex-direction: column; justify-content: center; overflow: hidden; background: var(--bg); }

/* Layers */
.hero-grid-bg { position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 52px 52px; mask-image: radial-gradient(ellipse 100% 80% at 50% 50%, black 20%, transparent 75%); }

.spotlight { position: absolute; inset: 0; z-index: 1; pointer-events: none; transition: background 0.1s ease; }

/* Floating tags */
.float-tags { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.float-tag { position: absolute; font-size: 0.6rem; color: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.07); padding: 4px 10px; letter-spacing: 0.5px; animation: float-y var(--dur, 8s) ease-in-out infinite var(--delay, 0s); white-space: nowrap; }
@keyframes float-y { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }

/* Hero content */
.hero-inner { position: relative; z-index: 3; max-width: 900px; margin: 0 auto; padding: 60px 40px 40px; display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; }

/* Badge row */
.hero-badge-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
.hero-badge { display: flex; align-items: center; gap: 8px; background: rgba(232,80,10,0.1); border: 1px solid rgba(232,80,10,0.35); color: #E8500A; font-size: 0.6rem; font-weight: 700; letter-spacing: 2px; padding: 5px 14px; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8500A; animation: led-blink 1.4s ease infinite; flex-shrink: 0; }
.hero-live-ticker { display: flex; align-items: center; gap: 7px; font-size: 0.6rem; color: rgba(255,255,255,0.3); letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; }
.ticker-led { width: 5px; height: 5px; border-radius: 50%; background: #6ee7b7; box-shadow: 0 0 5px #6ee7b7; animation: led-blink 1.8s ease infinite; }

/* Headline */
.hero-title { font-size: clamp(2.4rem, 5.5vw, 5rem); font-weight: 400; line-height: 1.08; letter-spacing: -3px; margin: 0 0 14px; color: var(--text); }
.hero-accent-kenya { background: linear-gradient(135deg, #E8500A 0%, #ff9a5c 40%, #E8500A 100%); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: grad-x 3.5s ease infinite; font-weight: 700; }
@keyframes grad-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

/* Sector rotator */
.hero-sector-line { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; font-size: 1.1rem; color: var(--text3); font-weight: 400; letter-spacing: -0.5px; }
.sector-prefix { }
.sector-rotator { display: inline-flex; align-items: center; min-width: 200px; }
.sector-word { color: var(--text); font-weight: 700; transition: opacity 0.28s ease, transform 0.28s ease; display: inline-block; }
.sector-word:not(.sector-in) { opacity: 0; transform: translateY(6px); }
.sector-in { opacity: 1; transform: translateY(0); }

/* Value props */
.hero-props { display: flex; flex-direction: column; gap: 8px; margin-bottom: 36px; align-items: flex-start; max-width: 500px; }
.prop-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; color: var(--text2); }
.prop-icon { color: #E8500A; flex-shrink: 0; font-size: 0.65rem; margin-top: 3px; }

/* CTAs */
.hero-cta-row { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; }
.cta-primary { position: relative; display: flex; align-items: center; gap: 12px; background: #E8500A; color: #fff; border: none; padding: 15px 32px; font-family: inherit; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; overflow: hidden; transition: background 0.15s, transform 0.12s, box-shadow 0.15s; }
.cta-primary::before { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(255,255,255,0.18) 0%, transparent 55%); pointer-events: none; }
.cta-primary:hover { background: #c43e09; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,80,10,0.35); }
.cta-ripple { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%); animation: ripple-out 2s ease-in-out infinite; pointer-events: none; }
@keyframes ripple-out { 0%,100% { opacity: 0.5; transform: scale(0.85); } 50% { opacity: 0; transform: scale(1.3); } }
.cta-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.7); animation: led-blink 1s infinite; flex-shrink: 0; }
.cta-arrow { font-size: 1.05rem; }
.cta-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border); padding: 15px 26px; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.cta-ghost:hover { border-color: #E8500A; color: #E8500A; background: rgba(232,80,10,0.05); }

/* Animated stat counters */
.stat-counters { display: flex; gap: 0; border: 1px solid var(--border); }
.stat-c { display: flex; flex-direction: column; align-items: center; padding: 16px 28px; border-right: 1px solid var(--border); }
.stat-c:last-child { border-right: none; }
.stat-num { display: flex; align-items: baseline; gap: 2px; line-height: 1; margin-bottom: 6px; }
.stat-displayed { font-size: 2.2rem; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.stat-suffix { font-size: 1.6rem; font-weight: 700; color: #E8500A; }
.stat-label { font-size: 0.6rem; color: var(--text3); letter-spacing: 0.5px; line-height: 1.4; max-width: 110px; text-align: center; }

/* Agency ticker */
.agency-ticker { position: relative; z-index: 3; display: flex; align-items: center; background: var(--surface2); border-top: 1px solid var(--border); height: 40px; overflow: hidden; }
.ticker-label { flex-shrink: 0; font-size: 0.55rem; font-weight: 700; letter-spacing: 2px; color: var(--text3); padding: 0 20px; border-right: 1px solid var(--border); white-space: nowrap; }
.ticker-track { flex: 1; overflow: hidden; }
.ticker-inner { display: flex; align-items: center; gap: 0; white-space: nowrap; animation: ticker-scroll 38s linear infinite; }
.ticker-item { font-size: 0.65rem; color: var(--text2); padding: 0 4px; display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; }
.ticker-sep { color: rgba(232,80,10,0.5); font-size: 0.5rem; }
@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

/* ── Console section ── */
.console-section { background: var(--bg2); color: var(--text); padding: 64px 40px; border-top: 1px solid var(--border); }
.console-grid { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: start; }

/* Workflow panel */
.wp-header { font-size: 0.6rem; font-weight: 700; letter-spacing: 2.5px; color: var(--text3); margin-bottom: 32px; display: flex; align-items: center; gap: 8px; }
.wp-header-mark { color: #E8500A; }
.workflow-steps { display: flex; flex-direction: column; }
.ws-item { display: flex; gap: 16px; align-items: flex-start; position: relative; padding-bottom: 28px; }
.ws-num { font-size: 0.65rem; font-weight: 700; color: var(--text3); min-width: 28px; padding-top: 2px; }
.ws-body { flex: 1; }
.ws-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 5px; color: var(--text); }
.ws-desc { font-size: 0.72rem; color: var(--text2); line-height: 1.6; }
.ws-line { position: absolute; left: 13px; top: 22px; bottom: 0; width: 1px; background: var(--border); }

.metric-row { display: flex; gap: 0; margin-top: 8px; border: 1px solid var(--border); }
.metric-c { flex: 1; padding: 16px 20px; border-right: 1px solid var(--border); }
.metric-c:last-child { border-right: none; }
.metric-v { font-size: 1.7rem; font-weight: 700; line-height: 1; margin-bottom: 4px; color: var(--text); }
.metric-l { font-size: 0.62rem; color: var(--text3); }

/* Upload console (dark) */
.upload-console { background: var(--surface); border: 1px solid var(--border); box-shadow: 0 8px 48px rgba(0,0,0,0.3); }
.uc-header { padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); }
.uc-title-row { display: flex; justify-content: space-between; align-items: center; }
.uc-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 1.5px; color: var(--text2); }
.uc-label-sm { color: var(--text2); margin-bottom: 8px; display: block; font-size: 0.62rem; font-weight: 700; letter-spacing: 1.5px; }
.uc-meta { font-size: 0.58rem; color: var(--text3); }

.drop-zone { margin: 20px; border: 2px dashed var(--border); min-height: 150px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; background: var(--bg2); }
.drop-zone:hover, .dz-hover { border-color: var(--text3); background: var(--surface2); }
.dz-ready { border-color: #E8500A; background: rgba(232,80,10,0.06); }
.dz-empty { text-align: center; padding: 24px; }
.dz-icon { font-size: 1.4rem; color: var(--text3); margin-bottom: 10px; }
.dz-text { font-size: 0.85rem; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.dz-hint { font-size: 0.67rem; color: var(--text3); }
.dz-filled { text-align: center; padding: 24px; }
.dz-check { font-size: 2rem; color: #E8500A; margin-bottom: 8px; }
.dz-filename { font-size: 0.82rem; font-weight: 600; color: var(--text); margin-bottom: 4px; word-break: break-all; }

.uc-divider { display: flex; align-items: center; margin: 0 20px 14px; }
.uc-divider::before, .uc-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.uc-divider span { padding: 0 12px; font-size: 0.58rem; color: var(--text3); letter-spacing: 1.5px; }

.uc-textarea-wrap { padding: 0 20px 14px; position: relative; }
.uc-textarea { width: 100%; border: 1px solid var(--border); background: var(--bg2); padding: 14px; font-family: inherit; font-size: 0.78rem; line-height: 1.65; resize: none; outline: none; color: var(--text); box-sizing: border-box; }
.uc-textarea:focus { border-color: var(--orange); background: var(--bg2); }
.uc-textarea::placeholder { color: var(--text3); }
.uc-engine-tag { font-size: 0.58rem; color: var(--text3); text-align: right; margin-top: 5px; }

.rmap-card { display: flex; align-items: center; gap: 12px; margin: 0 20px 14px; padding: 12px 16px; background: rgba(232,80,10,0.1); border: 1px solid rgba(232,80,10,0.25); color: var(--text); cursor: pointer; transition: all 0.15s; }
.rmap-card:hover { background: #E8500A; border-color: #E8500A; }
.rmap-icon { font-size: 1.1rem; flex-shrink: 0; }
.rmap-title { font-size: 0.75rem; font-weight: 700; margin-bottom: 2px; }
.rmap-sub { font-size: 0.6rem; opacity: 0.6; }
.rmap-arr { margin-left: auto; opacity: 0.6; }

.start-btn { width: calc(100% - 40px); margin: 0 20px 20px; background: #E8500A; color: #fff; border: none; padding: 18px 24px; font-family: inherit; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s, transform 0.12s, box-shadow 0.15s; box-sizing: border-box; position: relative; overflow: hidden; }
.start-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(255,255,255,0.15) 0%, transparent 55%); pointer-events: none; }
.start-btn:not(:disabled):hover { background: #c43e09; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(232,80,10,0.4); }
.start-btn:not(:disabled) { animation: pulse-shadow 2.5s ease infinite; }
.start-btn:disabled { background: var(--border); color: var(--text3); cursor: not-allowed; }
.start-arr { font-size: 1.1rem; }
@keyframes pulse-shadow { 0%,100% { box-shadow: 0 0 0 0 rgba(232,80,10,0.25); } 50% { box-shadow: 0 0 0 8px rgba(232,80,10,0); } }

/* Responsive */
@media (max-width: 960px) {
  .console-grid { grid-template-columns: 1fr; gap: 40px; }
  .hero-inner { padding: 40px 24px 32px; }
  .navbar { padding: 0 20px; }
  .stat-counters { flex-wrap: wrap; }
  .stat-c { min-width: 45%; }
  .float-tags { display: none; }
  .hero-sector-line { flex-wrap: wrap; justify-content: center; }
}
</style>

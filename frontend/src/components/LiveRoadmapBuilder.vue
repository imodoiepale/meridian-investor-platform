<template>
  <div class="lrb-shell" v-if="visible">
    <!-- Top bar -->
    <div class="lrb-topbar">
      <div class="lrb-logo"><span class="lrb-mark">◈</span> MERIDIAN</div>
      <div class="lrb-title">Building your Kenya Investment Roadmap</div>
      <div class="lrb-pct">{{ Math.round(overallPct) }}%</div>
    </div>
    <div class="lrb-progress-rail"><div class="lrb-progress-fill" :style="{ width: overallPct + '%' }"></div></div>

    <div class="lrb-body">

      <!-- LEFT: Research log -->
      <div class="lrb-log-panel">
        <div class="log-header">
          <span class="log-header-dot"></span> RESEARCH ENGINE
        </div>
        <div class="log-entries" ref="logEl">
          <div
            v-for="(entry, i) in logEntries"
            :key="i"
            class="log-entry"
            :class="entry.status"
          >
            <span class="log-icon">
              <span v-if="entry.status === 'done'">✓</span>
              <span v-else-if="entry.status === 'running'" class="spin">⟳</span>
              <span v-else class="dim">○</span>
            </span>
            <div class="log-text">
              <div class="log-label">{{ entry.label }}</div>
              <div class="log-detail" v-if="entry.detail">{{ entry.detail }}</div>
            </div>
            <span class="log-ms" v-if="entry.ms">{{ entry.ms }}ms</span>
          </div>
        </div>

        <!-- Live agency discovery feed -->
        <div class="agency-feed" v-if="discoveredAgencies.length">
          <div class="feed-header">AGENCIES DISCOVERED</div>
          <TransitionGroup name="agency-pop" tag="div" class="feed-list">
            <div
              v-for="(a, i) in discoveredAgencies"
              :key="a"
              class="feed-agency"
              :style="{ animationDelay: i * 0.05 + 's' }"
            >
              <span class="feed-dot"></span>{{ a }}
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- RIGHT: Live SVG roadmap -->
      <div class="lrb-map-panel">
        <div class="map-header">
          <span class="map-header-dot"></span> LIVE ROADMAP — {{ visibleNodes.length }} nodes
        </div>
        <div class="map-canvas-wrap">
          <svg ref="svgEl" class="map-svg" :viewBox="`0 0 ${SVG_W} ${SVG_H}`">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(232,80,10,0.5)"/>
              </marker>
            </defs>

            <!-- Phase column backgrounds -->
            <rect
              v-for="ph in phases"
              :key="'bg-'+ph.id"
              :x="ph.x - COL_W/2 + 4"
              :y="16"
              :width="COL_W - 8"
              :height="SVG_H - 32"
              fill="rgba(255,255,255,0.02)"
              rx="2"
            />

            <!-- Phase labels -->
            <text
              v-for="ph in phases"
              :key="'lbl-'+ph.id"
              :x="ph.x"
              :y="32"
              text-anchor="middle"
              fill="rgba(255,255,255,0.25)"
              font-size="9"
              font-family="JetBrains Mono, monospace"
              letter-spacing="0.5"
            >{{ ph.label }}</text>

            <!-- Connection lines between critical nodes -->
            <path
              v-for="conn in visibleConnections"
              :key="conn.id"
              :d="conn.path"
              stroke="rgba(232,80,10,0.4)"
              stroke-width="1"
              fill="none"
              stroke-dasharray="4,3"
              :class="{ 'line-draw': true }"
            />

            <!-- Nodes -->
            <g
              v-for="(node, i) in visibleNodes"
              :key="node.id"
              class="map-node-group"
              :style="{ animationDelay: i * 0.08 + 's' }"
            >
              <!-- Glow ring for newly added -->
              <circle
                v-if="node.isNew"
                :cx="node.x"
                :cy="node.y"
                :r="18"
                fill="none"
                stroke="#E8500A"
                stroke-width="1"
                opacity="0"
                class="pulse-ring-anim"
              />
              <!-- Node circle -->
              <circle
                :cx="node.x"
                :cy="node.y"
                :r="node.critical ? 12 : 9"
                :fill="node.fill"
                :stroke="node.critical ? '#E8500A' : 'rgba(255,255,255,0.15)'"
                :stroke-width="node.critical ? 2 : 1"
                :filter="node.isNew ? 'url(#glow)' : ''"
                class="node-circle"
              />
              <!-- Node label -->
              <text
                :x="node.x"
                :y="node.y + (node.critical ? 20 : 17)"
                text-anchor="middle"
                :fill="node.critical ? '#E8500A' : 'rgba(255,255,255,0.5)'"
                :font-size="node.critical ? 7.5 : 6.5"
                font-family="JetBrains Mono, monospace"
              >{{ node.short }}</text>
            </g>
          </svg>

          <!-- Phase labels overlay -->
          <div class="phase-labels-row">
            <div v-for="ph in phases" :key="ph.id" class="phase-label-item">
              {{ ph.icon }} {{ ph.shortName }}
            </div>
          </div>
        </div>

        <!-- Completion banner -->
        <Transition name="fade">
          <div v-if="complete" class="complete-banner">
            <span class="complete-icon">✓</span>
            Roadmap ready — {{ visibleNodes.length }} steps across {{ phases.length }} phases
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script>
const SVG_W = 560
const SVG_H = 380
const COL_W = SVG_W / 5

// Static base nodes that appear immediately
const BASE_NODES = [
  { id: 'BRS_SEARCH', short: 'BRS Search', phase: 0, row: 0, critical: true, fill: '#E8500A' },
  { id: 'BRS_RESERVE', short: 'BRS Reserve', phase: 0, row: 1, critical: true, fill: '#E8500A' },
  { id: 'BRS_CR1', short: 'Inc. CR1', phase: 1, row: 0, critical: true, fill: '#E8500A' },
  { id: 'BRS_SEAL', short: 'Company Seal', phase: 1, row: 1, critical: false, fill: 'rgba(255,255,255,0.12)' },
  { id: 'KRA_PIN', short: 'KRA PIN', phase: 2, row: 0, critical: true, fill: '#E8500A' },
  { id: 'KRA_VAT', short: 'VAT Reg.', phase: 2, row: 1, critical: false, fill: 'rgba(255,255,255,0.12)' },
  { id: 'NSSF', short: 'NSSF', phase: 2, row: 2, critical: false, fill: 'rgba(255,255,255,0.12)' },
  { id: 'NHIF', short: 'NHIF', phase: 2, row: 3, critical: false, fill: 'rgba(255,255,255,0.12)' },
  { id: 'COUNTY_BP', short: 'Biz Permit', phase: 4, row: 0, critical: true, fill: '#E8500A' },
  { id: 'COUNTY_FIRE', short: 'Fire Cert', phase: 4, row: 1, critical: false, fill: 'rgba(255,255,255,0.12)' },
]

const LOG_STEPS = [
  { label: 'Checking research cache', detail: 'Querying Qdrant vector store...' },
  { label: 'Perplexity sonar-deep-research', detail: 'Kenya regulatory landscape 2026...' },
  { label: 'Extracting agency fee schedules', detail: 'Parsing official gazette fees...' },
  { label: 'SLA benchmarks', detail: 'Processing time per agency...' },
  { label: 'Risk score calculation', detail: 'Bottleneck probability model...' },
  { label: 'Building sector-specific nodes', detail: 'Injecting Phase 4 agencies...' },
  { label: 'Compiling seed pack', detail: 'Packaging regulatory intelligence...' },
]

export default {
  name: 'LiveRoadmapBuilder',
  props: {
    visible: { type: Boolean, default: false },
    sectorAgencies: { type: Array, default: () => [] },
    complete: { type: Boolean, default: false }
  },

  data() {
    return {
      SVG_W, SVG_H, COL_W,
      visibleNodes: [],
      discoveredAgencies: [],
      logEntries: LOG_STEPS.map(s => ({ ...s, status: 'pending', ms: null })),
      overallPct: 0,
      _timers: [],

      phases: [
        { id: 0, label: 'PRE-REG', shortName: 'Pre-Reg', icon: '📋', x: COL_W * 0.5 },
        { id: 1, label: 'COMPANY', shortName: 'Company', icon: '🏢', x: COL_W * 1.5 },
        { id: 2, label: 'TAX', shortName: 'Tax', icon: '🧾', x: COL_W * 2.5 },
        { id: 3, label: 'SECTOR', shortName: 'Sector', icon: '📜', x: COL_W * 3.5 },
        { id: 4, label: 'COUNTY', shortName: 'County', icon: '🏙️', x: COL_W * 4.5 },
      ]
    }
  },

  computed: {
    visibleConnections() {
      const critical = this.visibleNodes.filter(n => n.critical)
      const conns = []
      for (let i = 0; i < critical.length - 1; i++) {
        const a = critical[i], b = critical[i + 1]
        const mx = (a.x + b.x) / 2
        conns.push({
          id: `${a.id}-${b.id}`,
          path: `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
        })
      }
      return conns
    }
  },

  watch: {
    visible(v) {
      if (v) this.startAnimation()
    },
    sectorAgencies(agencies) {
      this.injectSectorNodes(agencies)
    },
    complete(v) {
      if (v) {
        this.overallPct = 100
        this.finishLogs()
      }
    }
  },

  mounted() {
    if (this.visible) this.startAnimation()
  },

  beforeUnmount() {
    this._timers.forEach(clearTimeout)
  },

  methods: {
    nodeY(row) {
      const top = 55
      const spacing = 62
      return top + row * spacing
    },

    positionedNode(raw) {
      const ph = this.phases[raw.phase]
      return {
        ...raw,
        x: ph.x,
        y: this.nodeY(raw.row),
        isNew: true
      }
    },

    startAnimation() {
      this.visibleNodes = []
      this.discoveredAgencies = []
      this.overallPct = 0
      this.logEntries.forEach(e => { e.status = 'pending'; e.ms = null })
      this._timers.forEach(clearTimeout)
      this._timers = []

      // Stagger base nodes in
      BASE_NODES.forEach((node, i) => {
        const t = setTimeout(() => {
          this.visibleNodes.push(this.positionedNode(node))
          setTimeout(() => {
            const n = this.visibleNodes.find(n => n.id === node.id)
            if (n) n.isNew = false
          }, 800)
        }, 300 + i * 180)
        this._timers.push(t)
      })

      // Progress bar ticking
      const pctStep = 100 / (LOG_STEPS.length * 12)
      const ticker = setInterval(() => {
        if (this.overallPct < 92) this.overallPct += pctStep
      }, 800)
      this._timers.push(ticker)

      // Log step cycling
      LOG_STEPS.forEach((_, idx) => {
        const startT = setTimeout(() => {
          this.logEntries[idx].status = 'running'
          this.$nextTick(() => {
            if (this.$refs.logEl) {
              this.$refs.logEl.scrollTop = this.$refs.logEl.scrollHeight
            }
          })
        }, 400 + idx * 6500)
        this._timers.push(startT)

        const doneT = setTimeout(() => {
          this.logEntries[idx].status = 'done'
          this.logEntries[idx].ms = Math.floor(Math.random() * 3000 + 500)
        }, 400 + idx * 6500 + 5500)
        this._timers.push(doneT)
      })
    },

    injectSectorNodes(agencies) {
      agencies.forEach((name, i) => {
        const t = setTimeout(() => {
          const nodeId = `SECTOR_${i}`
          if (!this.visibleNodes.find(n => n.id === nodeId)) {
            this.visibleNodes.push(this.positionedNode({
              id: nodeId,
              short: name.split(' ')[0],
              phase: 3,
              row: i,
              critical: i === 0,
              fill: i === 0 ? '#E8500A' : 'rgba(232,80,10,0.35)'
            }))
            this.discoveredAgencies.push(name)
            setTimeout(() => {
              const n = this.visibleNodes.find(n => n.id === nodeId)
              if (n) n.isNew = false
            }, 800)
          }
        }, i * 400)
        this._timers.push(t)
      })
    },

    finishLogs() {
      this.logEntries.forEach((e, i) => {
        const t = setTimeout(() => {
          e.status = 'done'
          if (!e.ms) e.ms = Math.floor(Math.random() * 2000 + 300)
        }, i * 60)
        this._timers.push(t)
      })
    }
  }
}
</script>

<style scoped>
/* ── Shell ── */
.lrb-shell {
  position: fixed; inset: 0; z-index: 900;
  background: #070707;
  display: flex; flex-direction: column;
  font-family: 'JetBrains Mono', monospace;
  color: #fff;
}

/* ── Top bar ── */
.lrb-topbar {
  display: flex; align-items: center; gap: 16px;
  padding: 0 24px; height: 52px;
  background: #000; border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.lrb-logo { font-weight: 800; letter-spacing: 2px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; }
.lrb-mark { color: #E8500A; }
.lrb-title { flex: 1; font-size: 0.72rem; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; }
.lrb-pct { font-size: 0.85rem; font-weight: 700; color: #E8500A; }

.lrb-progress-rail {
  height: 2px; background: rgba(255,255,255,0.07); flex-shrink: 0;
}
.lrb-progress-fill {
  height: 100%; background: #E8500A;
  transition: width 0.8s ease;
  box-shadow: 0 0 8px rgba(232,80,10,0.6);
}

/* ── Body ── */
.lrb-body {
  flex: 1; display: grid; grid-template-columns: 320px 1fr;
  overflow: hidden;
}

/* ── Log panel ── */
.lrb-log-panel {
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; overflow: hidden;
  background: #080808;
}
.log-header {
  padding: 12px 16px; font-size: 0.6rem; font-weight: 700;
  letter-spacing: 1.5px; color: rgba(255,255,255,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; gap: 8px;
}
.log-header-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #E8500A;
  animation: dot-blink 1s ease infinite;
}
@keyframes dot-blink { 50% { opacity: 0.3; } }

.log-entries {
  flex: 1; overflow-y: auto; padding: 8px 0;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
}
.log-entry {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 16px; transition: background 0.2s;
}
.log-entry.running { background: rgba(232,80,10,0.06); }
.log-entry.done { }
.log-icon { font-size: 0.75rem; flex-shrink: 0; padding-top: 1px; }
.log-entry.done .log-icon { color: #6ee7b7; }
.log-entry.running .log-icon { color: #E8500A; }
.log-entry.pending .dim { color: rgba(255,255,255,0.2); }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.log-text { flex: 1; }
.log-label { font-size: 0.72rem; color: rgba(255,255,255,0.7); }
.log-entry.pending .log-label { color: rgba(255,255,255,0.25); }
.log-entry.running .log-label { color: #fff; }
.log-detail { font-size: 0.6rem; color: rgba(255,255,255,0.3); margin-top: 2px; }
.log-ms { font-size: 0.6rem; color: rgba(255,255,255,0.25); flex-shrink: 0; padding-top: 2px; }

/* ── Agency feed ── */
.agency-feed {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 10px 16px; max-height: 160px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
}
.feed-header {
  font-size: 0.55rem; font-weight: 700; letter-spacing: 1.5px;
  color: rgba(255,255,255,0.3); margin-bottom: 8px;
}
.feed-list { display: flex; flex-direction: column; gap: 5px; }
.feed-agency {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.68rem; color: rgba(255,255,255,0.6);
  animation: slide-in-left 0.3s ease both;
}
.feed-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #E8500A; flex-shrink: 0;
}
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ── Map panel ── */
.lrb-map-panel {
  display: flex; flex-direction: column; overflow: hidden;
  background: #0a0a0a;
}
.map-header {
  padding: 12px 16px; font-size: 0.6rem; font-weight: 700;
  letter-spacing: 1.5px; color: rgba(255,255,255,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.map-header-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #E8500A;
  animation: dot-blink 1.5s ease infinite 0.3s;
}
.map-canvas-wrap {
  flex: 1; display: flex; flex-direction: column; padding: 16px; overflow: hidden;
}
.map-svg {
  flex: 1; width: 100%; overflow: visible;
}

/* Node animation */
.map-node-group {
  animation: node-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes node-pop {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}
.pulse-ring-anim {
  animation: pulse-ring-out 0.8s ease-out both;
}
@keyframes pulse-ring-out {
  0% { r: 14; opacity: 0.8; }
  100% { r: 28; opacity: 0; }
}
.node-circle { transition: all 0.3s ease; }

/* Phase labels row */
.phase-labels-row {
  display: flex; justify-content: space-around;
  padding: 4px 0;
}
.phase-label-item {
  font-size: 0.58rem; color: rgba(255,255,255,0.25);
  text-align: center; flex: 1;
}

/* Complete banner */
.complete-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; background: rgba(110,231,183,0.08);
  border-top: 1px solid rgba(110,231,183,0.2);
  font-size: 0.72rem; color: #6ee7b7;
  flex-shrink: 0;
}
.complete-icon { font-size: 0.9rem; }

/* Transitions */
.fade-enter-active { transition: opacity 0.4s ease; }
.fade-enter-from { opacity: 0; }

.agency-pop-enter-active { animation: slide-in-left 0.3s ease both; }
.agency-pop-leave-active { transition: opacity 0.2s; }
.agency-pop-leave-to { opacity: 0; }

/* Scrollbars */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
</style>

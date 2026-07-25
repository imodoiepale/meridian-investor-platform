<template>
  <div class="roadmap-page">

    <!-- Navbar -->
    <nav class="ki-nav">
      <router-link to="/" class="ki-nav-brand">
        <span class="ki-mark">◈</span> MERIDIAN
        <span class="ki-sub">/ Kenya Invest</span>
      </router-link>
      <div class="ki-nav-links">
        <router-link to="/invest" class="ki-nav-link">Onboarding</router-link>
        <router-link to="/invest/roadmap" class="ki-nav-link">Roadmap</router-link>
        <router-link to="/invest/dashboard" class="ki-nav-link">Dashboard</router-link>
        <router-link to="/invest/graphs" class="ki-nav-link">Agent Graphs</router-link>
        <button class="theme-toggle" @click="toggleTheme">{{ isDark ? '☀' : '◑' }}</button>
      </div>
    </nav>

    <!-- Loading overlay -->
    <LoadingOverlay
      :visible="loading"
      message="Building your regulatory roadmap"
      sub="Merging research data with simulation risk flags..."
      :pct="loadPct"
      :steps="['Loading research data', 'Fetching phase structure', 'Applying simulation risk flags', 'Rendering roadmap']"
      :activeStep="loadStep"
    />

    <div class="roadmap-body" v-if="!loading && roadmap">

      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-left">
          <div class="summary-title">
            <span class="summary-mark">◈</span>
            Kenya Investment Roadmap
            <span class="summary-sector" v-if="form.sector">— {{ sectorLabel }}</span>
          </div>
          <div class="summary-sub">{{ form.county || 'Kenya' }} · USD {{ Number(form.capital_usd || 0).toLocaleString() }}</div>
        </div>
        <div class="summary-metrics">
          <div class="smv" v-for="m in summaryMetrics" :key="m.label">
            <div class="smv-val" :class="m.cls">{{ m.val }}</div>
            <div class="smv-lbl">{{ m.label }}</div>
          </div>
        </div>
        <div class="summary-actions">
          <button class="btn-outline" @click="$router.push('/invest')">← Edit profile</button>
          <button class="btn-outline" @click="$router.push('/invest/dashboard')" v-if="hasSim">Simulation dashboard →</button>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend-bar">
        <div class="legend-item" v-for="l in legend" :key="l.label">
          <span class="legend-dot" :class="l.cls"></span> {{ l.label }}
        </div>
      </div>

      <!-- Phase columns -->
      <div class="phases-container">
        <!-- Timeline rail -->
        <svg class="timeline-svg" :height="svgHeight" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#ccc"/>
            </marker>
            <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#E8500A"/>
            </marker>
          </defs>
          <g v-for="conn in connections" :key="conn.id">
            <path
              :d="conn.path"
              :stroke="conn.critical ? '#E8500A' : '#ddd'"
              stroke-width="1.5"
              fill="none"
              :marker-end="conn.critical ? 'url(#arrow-orange)' : 'url(#arrow)'"
              :stroke-dasharray="conn.critical ? 'none' : '4,3'"
            />
          </g>
        </svg>

        <div class="phases-row">
          <div
            v-for="phase in roadmap.phases"
            :key="phase.phase"
            class="phase-col"
          >
            <!-- Phase header -->
            <div
              class="phase-header"
              :class="{ collapsed: collapsedPhases.has(phase.phase) }"
              @click="togglePhase(phase.phase)"
            >
              <div class="phase-icon">{{ phase.icon }}</div>
              <div class="phase-meta">
                <div class="phase-name">{{ phase.name }}</div>
                <div class="phase-days">~{{ phase.estimated_days }} days</div>
              </div>
              <div class="phase-num">{{ String(phase.phase).padStart(2, '0') }}</div>
              <div class="phase-chevron">{{ collapsedPhases.has(phase.phase) ? '▶' : '▼' }}</div>
            </div>

            <!-- Nodes -->
            <Transition name="collapse">
              <div v-if="!collapsedPhases.has(phase.phase)" class="phase-nodes">
                <div
                  v-for="node in phase.nodes"
                  :key="node.id"
                  class="roadmap-node"
                  :class="nodeClass(node)"
                  :data-node-id="node.id"
                  @click="openDrawer(node, phase)"
                >
                  <div class="node-top">
                    <div class="node-agency">{{ node.agency_short }}</div>
                    <div class="node-badges">
                      <span class="badge badge-critical" v-if="node.critical_path">★</span>
                      <span class="badge badge-risk" v-if="node.risk">⚠</span>
                    </div>
                  </div>
                  <div class="node-name">{{ node.name }}</div>
                  <div class="node-footer">
                    <span class="node-cost">{{ node.cost_kes ? 'KES ' + node.cost_kes.toLocaleString() : 'Free' }}</span>
                    <span class="node-days">{{ node.timeline_days }}d</span>
                  </div>
                </div>

                <!-- Empty phase 4 if no sector data -->
                <div v-if="phase.phase === 4 && phase.nodes.length === 0" class="phase-empty">
                  <div class="phase-empty-icon">📋</div>
                  <div class="phase-empty-text">Complete onboarding to see your sector-specific licenses</div>
                  <router-link to="/invest" class="btn-sm-link">Start onboarding →</router-link>
                </div>
              </div>
            </Transition>

            <!-- Phase totals -->
            <div class="phase-total" v-if="!collapsedPhases.has(phase.phase) && phase.nodes.length">
              <span>{{ phase.nodes.length }} steps</span>
              <span>KES {{ phaseCost(phase).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state when no data and not loading -->
    <div v-if="!loading && !roadmap" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h2>No roadmap data yet</h2>
      <p>Complete the investor onboarding to generate your personalised Kenya regulatory roadmap.</p>
      <router-link to="/invest" class="btn-primary">Start onboarding →</router-link>
    </div>

    <!-- Node detail drawer -->
    <Transition name="drawer">
      <div v-if="drawer" class="drawer-overlay" @click.self="drawer = null">
        <div class="drawer">
          <div class="drawer-header">
            <div>
              <div class="drawer-phase">{{ drawer.phaseName }}</div>
              <h3 class="drawer-title">{{ drawer.node.name }}</h3>
              <div class="drawer-agency">{{ drawer.node.agency }}</div>
            </div>
            <button class="drawer-close" @click="drawer = null">✕</button>
          </div>

          <!-- Risk alert -->
          <div class="drawer-risk" v-if="drawer.node.risk">
            <div class="risk-label">⚠ SIMULATION RISK FLAG</div>
            <div class="risk-body">{{ drawer.node.risk_detail }}</div>
          </div>

          <!-- Key stats -->
          <div class="drawer-stats">
            <div class="dstat">
              <div class="dstat-val">{{ drawer.node.cost_kes ? 'KES ' + drawer.node.cost_kes.toLocaleString() : 'Free' }}</div>
              <div class="dstat-lbl">Official fee</div>
            </div>
            <div class="dstat">
              <div class="dstat-val">{{ drawer.node.timeline_days }} days</div>
              <div class="dstat-lbl">Processing time</div>
            </div>
            <div class="dstat">
              <div class="dstat-val">{{ drawer.node.critical_path ? 'Yes' : 'No' }}</div>
              <div class="dstat-lbl">Critical path</div>
            </div>
          </div>

          <!-- Documents required -->
          <div class="drawer-section" v-if="drawer.node.documents?.length">
            <div class="drawer-section-title">DOCUMENTS REQUIRED</div>
            <ul class="doc-list">
              <li v-for="(d, i) in drawer.node.documents" :key="i">{{ d }}</li>
            </ul>
          </div>

          <!-- Prerequisites -->
          <div class="drawer-section" v-if="drawer.node.prerequisites?.length">
            <div class="drawer-section-title">PREREQUISITES</div>
            <div class="prereq-chips">
              <span class="prereq-chip" v-for="p in drawer.node.prerequisites" :key="p">{{ p }}</span>
            </div>
          </div>

          <!-- Tip -->
          <div class="drawer-tip" v-if="drawer.node.tip">
            <div class="tip-icon">💡</div>
            <div>{{ drawer.node.tip }}</div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useTheme } from '../composables/useTheme.js'

export default {
  name: 'RoadmapView',
  components: { LoadingOverlay },
  setup() {
    const { isDark, toggle } = useTheme()
    return { isDark, toggleTheme: toggle }
  },

  data() {
    return {
      loading: true,
      loadPct: 0,
      loadStep: 0,
      roadmap: null,
      form: {},
      hasSim: false,
      collapsedPhases: new Set(),
      drawer: null,
      nodePositions: {},
      svgHeight: 0,
      connections: []
    }
  },

  computed: {
    sectorLabel() {
      const map = {
        manufacturing: 'Manufacturing', fintech: 'Fintech', agriculture: 'Agriculture',
        tourism: 'Tourism', healthcare: 'Healthcare', real_estate: 'Real Estate',
        ict: 'ICT / Tech', energy: 'Energy', logistics: 'Logistics', retail: 'Retail'
      }
      return map[this.form.sector] || this.form.sector || ''
    },

    summaryMetrics() {
      if (!this.roadmap) return []
      const s = this.roadmap.summary
      return [
        { val: s.total_days + ' days', label: 'Total timeline', cls: '' },
        { val: 'KES ' + Math.round(s.total_cost_kes / 1000) + 'K', label: 'Total fees', cls: '' },
        { val: (s.agencies_count || 0) + ' agencies', label: 'Agencies', cls: '' },
        {
          val: s.dropout_risk_pct + '%',
          label: 'Dropout risk',
          cls: s.dropout_risk_pct > 40 ? 'val-danger' : s.dropout_risk_pct > 20 ? 'val-warn' : 'val-ok'
        },
        { val: Math.round((s.confidence || 0.85) * 100) + '%', label: 'Confidence', cls: 'val-ok' }
      ]
    },

    legend() {
      return [
        { label: 'Critical path', cls: 'dot-critical' },
        { label: 'Simulation risk', cls: 'dot-risk' },
        { label: 'Standard step', cls: 'dot-std' },
        { label: 'Free / no fee', cls: 'dot-free' }
      ]
    }
  },

  async mounted() {
    await this.loadRoadmap()
  },

  methods: {
    async loadRoadmap() {
      this.loading = true
      this.loadPct = 10
      this.loadStep = 0

      // Pull persisted data from sessionStorage
      let seedPack = null
      let simReport = null

      try {
        const sp = sessionStorage.getItem('ki_seed_pack')
        if (sp) seedPack = JSON.parse(sp)
        this.loadStep = 1; this.loadPct = 35
      } catch {}

      try {
        const sr = sessionStorage.getItem('ki_sim_report')
        if (sr) { simReport = JSON.parse(sr); this.hasSim = true }
        this.loadStep = 2; this.loadPct = 55
      } catch {}

      try {
        const f = sessionStorage.getItem('ki_form')
        if (f) this.form = JSON.parse(f)
      } catch {}

      // If no seed pack, show the generic roadmap via backend with empty payload
      try {
        const res = await fetch('/api/invest/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed_pack: seedPack || {}, sim_report: simReport || {} })
        })
        this.loadStep = 3; this.loadPct = 85

        if (res.ok) {
          this.roadmap = await res.json()
        } else {
          // Fallback to static generic roadmap
          this.roadmap = this.staticFallback()
        }
      } catch {
        this.roadmap = this.staticFallback()
      }

      this.loadPct = 100
      await new Promise(r => setTimeout(r, 300))
      this.loading = false

      // Build SVG connections after render
      await this.$nextTick()
      this.buildConnections()
    },

    staticFallback() {
      return {
        phases: [
          {
            phase: 1, name: 'Pre-Registration', icon: '📋', estimated_days: 5,
            nodes: [
              { id: 'BRS_NAME_SEARCH', name: 'Business Name Search', agency: 'Business Registration Service', agency_short: 'BRS', cost_kes: 150, timeline_days: 1, critical_path: true, documents: ['3 proposed company names', 'Director ID copy'], tip: 'Search 3 alternatives in case your first choice is taken.', prerequisites: [] },
              { id: 'BRS_NAME_RESERVE', name: 'Name Reservation', agency: 'Business Registration Service', agency_short: 'BRS', cost_kes: 2050, timeline_days: 2, critical_path: true, documents: ['Name search result', 'CR1 form'], tip: 'Valid for 30 days — move quickly to incorporation.', prerequisites: ['BRS_NAME_SEARCH'] }
            ]
          },
          {
            phase: 2, name: 'Company Registration', icon: '🏢', estimated_days: 5,
            nodes: [
              { id: 'BRS_CR1', name: 'Certificate of Incorporation', agency: 'Business Registration Service', agency_short: 'BRS', cost_kes: 10950, timeline_days: 3, critical_path: true, documents: ['CR1, CR2, CR8 forms', 'Director passport copies', 'Name reservation cert'], tip: 'Use eCitizen portal for 2× faster processing.', prerequisites: ['BRS_NAME_RESERVE'] },
              { id: 'BRS_SEAL', name: 'Company Seal & Statutory Books', agency: 'Private Vendor', agency_short: 'Vendor', cost_kes: 4000, timeline_days: 2, critical_path: false, documents: ['Certificate of Incorporation'], tip: 'Order online — 1–2 day delivery.', prerequisites: ['BRS_CR1'] }
            ]
          },
          {
            phase: 3, name: 'Tax & Compliance', icon: '🧾', estimated_days: 7,
            nodes: [
              { id: 'KRA_PIN', name: 'Company KRA PIN', agency: 'Kenya Revenue Authority', agency_short: 'KRA', cost_kes: 0, timeline_days: 1, critical_path: true, documents: ['Certificate of Incorporation', 'Director KRA PIN', 'CR12'], tip: 'Apply via iTax — instant if docs are clean.', prerequisites: ['BRS_CR1'] },
              { id: 'KRA_VAT', name: 'VAT Registration', agency: 'Kenya Revenue Authority', agency_short: 'KRA', cost_kes: 0, timeline_days: 3, critical_path: false, documents: ['Company KRA PIN', 'Bank details', 'Premises lease'], tip: 'Required above KES 5M turnover. Claim input VAT from day one.', prerequisites: ['KRA_PIN'] },
              { id: 'NSSF', name: 'NSSF Registration', agency: 'National Social Security Fund', agency_short: 'NSSF', cost_kes: 0, timeline_days: 1, critical_path: false, documents: ['KRA PIN', 'Certificate of Incorporation'], tip: 'Online registration via NSSF self-service.', prerequisites: ['KRA_PIN'] },
              { id: 'NHIF', name: 'NHIF Registration', agency: 'National Hospital Insurance Fund', agency_short: 'NHIF', cost_kes: 0, timeline_days: 1, critical_path: false, documents: ['KRA PIN', 'NSSF registration'], tip: 'Do same day as NSSF.', prerequisites: ['NSSF'] }
            ]
          },
          {
            phase: 4, name: 'Sector Licenses', icon: '📜', estimated_days: 60, dynamic: true,
            nodes: []
          },
          {
            phase: 5, name: 'County Permits', icon: '🏙️', estimated_days: 14,
            nodes: [
              { id: 'COUNTY_BPERMIT', name: 'Single Business Permit', agency: 'County Government', agency_short: 'County', cost_kes: 15000, timeline_days: 7, critical_path: true, documents: ['Certificate of Incorporation', 'KRA PIN', 'Premises lease', 'Fire safety cert'], tip: 'Nairobi fee: KES 5K–50K depending on business type.', prerequisites: ['KRA_PIN'] },
              { id: 'COUNTY_FIRE', name: 'Fire Safety Certificate', agency: 'County Fire Dept', agency_short: 'Fire', cost_kes: 5000, timeline_days: 7, critical_path: false, documents: ['Premises lease', 'Building plans', 'Fire extinguisher receipts'], tip: 'Book inspection 2 weeks early — high backlog.', prerequisites: ['BRS_CR1'] }
            ]
          }
        ],
        summary: {
          total_days: 91, total_cost_kes: 37150, dropout_risk_pct: 0,
          confidence: 0.90, agencies_count: 0,
          critical_path_nodes: ['BRS_NAME_SEARCH', 'BRS_NAME_RESERVE', 'BRS_CR1', 'KRA_PIN', 'COUNTY_BPERMIT']
        }
      }
    },

    togglePhase(phaseNum) {
      const s = new Set(this.collapsedPhases)
      if (s.has(phaseNum)) s.delete(phaseNum)
      else s.add(phaseNum)
      this.collapsedPhases = s
      this.$nextTick(() => this.buildConnections())
    },

    nodeClass(node) {
      return {
        'node-critical': node.critical_path,
        'node-risk': node.risk,
        'node-free': !node.cost_kes
      }
    },

    phaseCost(phase) {
      return phase.nodes.reduce((s, n) => s + (n.cost_kes || 0), 0)
    },

    openDrawer(node, phase) {
      this.drawer = { node, phaseName: phase.name }
    },

    buildConnections() {
      // Build simple horizontal connectors between consecutive critical path nodes
      const criticalIds = this.roadmap?.summary?.critical_path_nodes || []
      const conns = []

      // Find DOM elements for critical nodes across phases
      const positions = {}
      criticalIds.forEach(id => {
        const el = this.$el.querySelector(`[data-node-id="${id}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          const containerRect = this.$el.querySelector('.phases-container')?.getBoundingClientRect()
          if (containerRect) {
            positions[id] = {
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height / 2,
              right: rect.right - containerRect.left,
              left: rect.left - containerRect.left
            }
          }
        }
      })

      // Connect consecutive critical nodes
      for (let i = 0; i < criticalIds.length - 1; i++) {
        const from = positions[criticalIds[i]]
        const to = positions[criticalIds[i + 1]]
        if (from && to) {
          const mx = (from.right + to.left) / 2
          conns.push({
            id: `${criticalIds[i]}-${criticalIds[i + 1]}`,
            path: `M ${from.right} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.left} ${to.y}`,
            critical: true
          })
        }
      }

      const container = this.$el.querySelector('.phases-container')
      this.svgHeight = container ? container.scrollHeight : 600
      this.connections = conns
    }
  }
}
</script>

<style scoped>
/* ── Page ── */
.roadmap-page { min-height: 100vh; background: var(--bg); font-family: 'JetBrains Mono', 'Space Grotesk', monospace; color: var(--text); }

/* ── Navbar ── */
.ki-nav { height: 56px; background: rgba(0,0,0,0.95); border-bottom: 1px solid var(--border); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; position: sticky; top: 0; z-index: 200; backdrop-filter: blur(14px); }
.ki-nav-brand { color: #fff; text-decoration: none; font-weight: 800; font-size: 1rem; letter-spacing: 2px; display: flex; align-items: center; gap: 10px; }
.ki-mark { color: #E8500A; font-size: 1.1rem; }
.ki-sub { font-weight: 400; opacity: 0.4; font-size: 0.82rem; }
.ki-nav-links { display: flex; align-items: center; }
.ki-nav-link { color: rgba(255,255,255,0.45); text-decoration: none; font-size: 0.7rem; font-weight: 600; letter-spacing: 1px; padding: 0 16px; height: 56px; display: flex; align-items: center; border-right: 1px solid rgba(255,255,255,0.07); transition: color 0.15s; }
.ki-nav-link:hover { color: #fff; }
.ki-nav-link.router-link-active { color: #fff; border-bottom: 2px solid #E8500A; }

/* ── Body ── */
.roadmap-body { padding: 0 0 4rem; }

/* ── Summary bar ── */
.summary-bar { background: var(--surface); border-bottom: 1px solid var(--border); color: var(--text); padding: 1.25rem 2rem; display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
.summary-left { flex: 1; min-width: 200px; }
.summary-title { font-size: 0.95rem; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.summary-mark { color: #E8500A; }
.summary-sector { opacity: 0.6; font-weight: 400; }
.summary-sub { font-size: 0.72rem; opacity: 0.5; }
.summary-metrics { display: flex; gap: 0; }
.smv { padding: 0 1.5rem; border-right: 1px solid var(--border); text-align: center; }
.smv:first-child { padding-left: 0; }
.smv-val { font-size: 1.1rem; font-weight: 700; margin-bottom: 2px; }
.smv-lbl { font-size: 0.6rem; opacity: 0.45; letter-spacing: 1px; text-transform: uppercase; }
.val-danger { color: #ff6b6b; }
.val-warn { color: #E8500A; }
.val-ok { color: #6ee7b7; }
.summary-actions { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
.btn-outline { background: transparent; color: var(--text2); border: 1px solid var(--border); padding: 7px 14px; font-size: 0.72rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; letter-spacing: 0.5px; text-decoration: none; display: inline-flex; align-items: center; }
.btn-outline:hover { color: var(--text); border-color: var(--text2); }

/* ── Legend ── */
.legend-bar { display: flex; gap: 1.5rem; padding: 0.75rem 2rem; background: var(--surface2); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.68rem; color: var(--text2); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-critical { background: #E8500A; }
.dot-risk { background: #ffd700; border: 1px solid #E8500A; }
.dot-std { background: var(--text); }
.dot-free { background: var(--border); border: 1px solid var(--text3); }

/* ── Phases ── */
.phases-container { position: relative; overflow-x: auto; padding: 2rem; }
.timeline-svg { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; overflow: visible; z-index: 1; }
.phases-row { display: flex; gap: 16px; min-width: max-content; position: relative; z-index: 2; }
.phase-col { width: 240px; flex-shrink: 0; }

/* ── Phase header ── */
.phase-header { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--orange); color: var(--text); padding: 14px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; transition: background 0.15s; margin-bottom: 10px; }
.phase-header:hover { background: var(--surface2); }
.phase-icon { font-size: 1.2rem; flex-shrink: 0; }
.phase-meta { flex: 1; }
.phase-name { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px; }
.phase-days { font-size: 0.62rem; opacity: 0.5; margin-top: 2px; }
.phase-num { font-size: 1.4rem; font-weight: 800; opacity: 0.15; flex-shrink: 0; }
.phase-chevron { font-size: 0.6rem; opacity: 0.5; flex-shrink: 0; }

/* ── Nodes ── */
.phase-nodes { display: flex; flex-direction: column; gap: 8px; }
.roadmap-node { background: var(--surface); border: 1px solid var(--border); padding: 12px 14px; cursor: pointer; transition: all 0.15s; position: relative; }
.roadmap-node:hover { border-color: var(--orange); box-shadow: 0 4px 16px rgba(0,0,0,0.2); transform: translateY(-1px); }
.node-critical { border-left: 3px solid var(--orange); }
.node-risk { background: rgba(232,80,10,0.04); border-color: rgba(232,80,10,0.3); }
.node-risk.node-critical { border-left: 3px solid var(--orange); }
.node-free { }

.node-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.node-agency { font-size: 0.6rem; font-weight: 700; letter-spacing: 1px; color: #E8500A; text-transform: uppercase; }
.node-badges { display: flex; gap: 3px; }
.badge { font-size: 0.6rem; padding: 1px 5px; font-weight: 700; }
.badge-critical { background: #E8500A; color: #fff; }
.badge-risk { background: #ffd700; color: #000; }

.node-name { font-size: 0.78rem; font-weight: 600; line-height: 1.35; margin-bottom: 10px; color: var(--text); }
.node-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border2); }
.node-cost { font-size: 0.65rem; font-weight: 700; color: var(--text); }
.node-days { font-size: 0.62rem; color: var(--text3); }

/* Phase total row */
.phase-total { display: flex; justify-content: space-between; padding: 8px 14px; background: var(--surface2); border: 1px solid var(--border); font-size: 0.65rem; color: var(--text2); margin-top: 8px; letter-spacing: 0.5px; }

/* Phase empty */
.phase-empty { padding: 2rem 1rem; text-align: center; border: 1px dashed var(--border); }
.phase-empty-icon { font-size: 2rem; margin-bottom: 10px; }
.phase-empty-text { font-size: 0.75rem; color: var(--text2); margin-bottom: 12px; line-height: 1.5; }
.btn-sm-link { font-size: 0.72rem; color: #E8500A; text-decoration: none; font-weight: 700; }

/* ── Drawer ── */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; display: flex; justify-content: flex-end; }
.drawer { width: 420px; max-width: 95vw; height: 100vh; background: var(--surface); overflow-y: auto; padding: 2rem; box-shadow: -4px 0 40px rgba(0,0,0,0.4); border-left: 1px solid var(--border); }
.drawer-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
.drawer-phase { font-size: 0.62rem; font-weight: 700; letter-spacing: 1.5px; color: #E8500A; text-transform: uppercase; margin-bottom: 6px; }
.drawer-title { font-size: 1.05rem; font-weight: 800; margin-bottom: 4px; line-height: 1.3; }
.drawer-agency { font-size: 0.75rem; color: var(--text2); }
.drawer-close { background: none; border: 1px solid var(--border); color: var(--text2); width: 32px; height: 32px; cursor: pointer; font-size: 0.75rem; flex-shrink: 0; transition: border-color 0.15s; }
.drawer-close:hover { border-color: var(--orange); color: var(--orange); }

.drawer-risk { background: rgba(232,80,10,0.06); border-left: 3px solid var(--orange); padding: 0.875rem 1rem; margin-bottom: 1.25rem; }
.risk-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; color: var(--orange); margin-bottom: 4px; }
.risk-body { font-size: 0.78rem; color: var(--text2); line-height: 1.5; }

.drawer-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); margin-bottom: 1.5rem; }
.dstat { background: var(--surface2); padding: 1rem; text-align: center; }
.dstat-val { font-size: 0.95rem; font-weight: 800; margin-bottom: 3px; color: var(--text); }
.dstat-lbl { font-size: 0.6rem; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; }

.drawer-section { margin-bottom: 1.25rem; }
.drawer-section-title { font-size: 0.62rem; font-weight: 700; letter-spacing: 1.5px; color: var(--text3); margin-bottom: 10px; }
.doc-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.doc-list li { font-size: 0.78rem; padding: 7px 12px; background: var(--surface2); border-left: 2px solid var(--border); color: var(--text2); }
.prereq-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.prereq-chip { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 4px 10px; font-size: 0.68rem; font-weight: 600; }

.drawer-tip { display: flex; gap: 10px; padding: 1rem; background: var(--surface2); border-left: 3px solid var(--text3); font-size: 0.78rem; line-height: 1.6; color: var(--text2); }
.tip-icon { flex-shrink: 0; }

/* ── Empty state ── */
.empty-state { max-width: 440px; margin: 6rem auto; text-align: center; padding: 2rem; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text); }
.empty-state p { font-size: 0.85rem; color: var(--text2); margin-bottom: 1.5rem; line-height: 1.6; }
.btn-primary { background: var(--orange); color: #fff; padding: 12px 24px; font-size: 0.88rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.15s; font-family: inherit; }
.btn-primary:hover { background: var(--orange-h); }

/* ── Transitions ── */
.drawer-enter-active, .drawer-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
.collapse-enter-active, .collapse-leave-active { transition: all 0.25s ease; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; max-height: 0; }
.collapse-enter-to, .collapse-leave-from { opacity: 1; max-height: 2000px; }
</style>

<template>
  <div class="ki-page">
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>Simulation Dashboard</h1>
        <p class="page-sub">Meridian — investor journey simulation results</p>
      </div>
      <button class="btn-run" @click="showRunPanel = !showRunPanel">+ New Simulation</button>
    </div>

    <!-- Run panel -->
    <div v-if="showRunPanel" class="run-panel">
      <h3>Configure simulation</h3>
      <div class="run-fields">
        <div class="field">
          <label>Sector</label>
          <select v-model="simConfig.sector">
            <option v-for="s in sectors" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Nationality</label>
          <input v-model="simConfig.nationality" placeholder="e.g. Chinese" />
        </div>
        <div class="field">
          <label>Capital (USD)</label>
          <input type="number" v-model="simConfig.capital_usd" />
        </div>
        <div class="field">
          <label>County</label>
          <select v-model="simConfig.county">
            <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="field">
          <label>Agents</label>
          <input type="number" v-model="simConfig.agent_count" />
        </div>
        <div class="field">
          <label>Rounds</label>
          <input type="number" v-model="simConfig.rounds" />
        </div>
      </div>
      <div class="run-actions">
        <button class="btn-primary" @click="launchSimulation" :disabled="simRunning">
          {{ simRunning ? 'Running...' : 'Launch' }}
        </button>
        <button class="btn-ghost" @click="showRunPanel = false">Cancel</button>
      </div>
      <div v-if="simStatus" class="sim-status-bar">
        <span class="pulse-dot"></span> {{ simStatus }}
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!report && !simRunning" class="empty-state">
      <div class="empty-icon">📡</div>
      <p>No simulation results yet.</p>
      <p class="empty-sub">Click <strong>+ New Simulation</strong> to run your first simulation.</p>
    </div>

    <div v-if="simRunning && !report" class="loading-state">
      <div class="spinner"></div>
      <p>{{ simStatus }}</p>
    </div>

    <!-- Results -->
    <div v-if="report">

      <!-- KPI row -->
      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-val">{{ report.journey_summary?.simulated_days_median || '—' }}</div>
          <div class="kpi-lbl">Median days</div>
        </div>
        <div class="kpi">
          <div class="kpi-val">{{ report.journey_summary?.simulated_days_p90 || '—' }}</div>
          <div class="kpi-lbl">P90 days</div>
        </div>
        <div class="kpi kpi-warn">
          <div class="kpi-val">{{ Math.round((report.abandonment_risk?.probability || 0) * 100) }}%</div>
          <div class="kpi-lbl">Dropout risk</div>
        </div>
        <div class="kpi">
          <div class="kpi-val">KES {{ Math.round((report.journey_summary?.total_cost_kes_estimated || 0) / 1000) }}K</div>
          <div class="kpi-lbl">Est. total cost</div>
        </div>
        <div class="kpi kpi-danger">
          <div class="kpi-val">Day {{ report.abandonment_risk?.trigger_day || '—' }}</div>
          <div class="kpi-lbl">Dropout trigger</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="charts-row">
        <div class="chart-card">
          <h3>Agency bottlenecks — actual vs SLA (days)</h3>
          <div ref="bottleneckChart" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <h3>Abandonment risk</h3>
          <div ref="gaugeChart" class="chart-container gauge-container"></div>
        </div>
      </div>

      <!-- Corruption flags -->
      <div v-if="(report.corruption_flags || []).length" class="chart-card full-width">
        <h3>Corruption / compliance flags</h3>
        <div class="flag-list">
          <div class="flag" v-for="f in report.corruption_flags" :key="f.agency">
            <div class="flag-top">
              <span class="flag-agency">{{ f.agency }}</span>
              <span class="flag-pct" :class="f.frequency_pct > 25 ? 'high' : 'med'">{{ f.frequency_pct }}%</span>
            </div>
            <div class="flag-pattern">{{ f.pattern }}</div>
            <div class="flag-rec">→ {{ f.audit_recommendation }}</div>
            <div class="flag-bar-bg"><div class="flag-bar" :style="{ width: Math.min(f.frequency_pct, 100) + '%' }"></div></div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="(report.platform_recommendations || []).length" class="chart-card full-width">
        <h3>Platform recommendations</h3>
        <div class="rec-list">
          <div class="rec-item" v-for="(r, i) in report.platform_recommendations" :key="i">
            <span class="rec-num">{{ i + 1 }}</span>
            <span>{{ r }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
  </div><!-- /ki-page -->
</template>

<script>
import * as d3 from 'd3'
import { useTheme } from '../composables/useTheme.js'

export default {
  name: 'SimulationDashboard',
  setup() { const { isDark, toggle } = useTheme(); return { isDark, toggleTheme: toggle } },
  data() {
    return {
      showRunPanel: false,
      simRunning: false,
      simStatus: '',
      report: null,
      simConfig: {
        sector: 'fintech',
        nationality: 'Kenyan',
        capital_usd: 500000,
        county: 'Nairobi',
        agent_count: 200,
        rounds: 40
      },
      sectors: [
        { value: 'fintech', label: 'Fintech' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'agriculture', label: 'Agriculture' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'ict', label: 'ICT & Technology' },
        { value: 'real_estate', label: 'Real Estate' },
        { value: 'tourism', label: 'Tourism' },
        { value: 'energy', label: 'Energy' },
        { value: 'logistics', label: 'Logistics' },
      ],
      counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado', 'Nyeri']
    }
  },
  methods: {
    async launchSimulation() {
      this.simRunning = true
      this.report = null
      this.simStatus = 'Fetching research seed...'
      try {
        const researchRes = await fetch('/api/invest/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sector: this.simConfig.sector,
            nationality: this.simConfig.nationality,
            capital_usd: parseFloat(this.simConfig.capital_usd),
            county: this.simConfig.county
          })
        })
        const { seed } = await researchRes.json()
        this.simStatus = 'Launching Meridian simulation...'
        const simRes = await fetch('/api/invest/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seed,
            agent_count: this.simConfig.agent_count,
            rounds: this.simConfig.rounds,
            question: 'Where does this investor face highest friction and abandonment risk?'
          })
        })
        const { simulation_id } = await simRes.json()
        await this.pollUntilDone(simulation_id)
        this.showRunPanel = false
      } catch (e) {
        this.simStatus = 'Error: ' + e.message
      } finally {
        this.simRunning = false
      }
    },

    async pollUntilDone(simId) {
      for (let i = 0; i < 120; i++) {
        const res = await fetch(`/api/invest/simulate/${simId}/status`)
        const data = await res.json()
        this.simStatus = `Simulation ${data.status}...`
        if (data.status === 'complete') {
          this.report = data.report
          await this.$nextTick()
          this.drawBottleneckChart()
          this.drawGauge()
          return
        }
        if (data.status === 'error') {
          this.simStatus = 'Error: ' + (data.error || 'simulation failed')
          return
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    },

    drawBottleneckChart() {
      const bottlenecks = this.report?.bottlenecks
      if (!bottlenecks || !bottlenecks.length) return

      const data = bottlenecks.slice(0, 8).map(b => ({
        agency: b.agency,
        actual: b.avg_delay_days || (b.avg_delay_weeks ? b.avg_delay_weeks * 7 : 0),
        sla: b.sla_days || (b.sla_weeks ? b.sla_weeks * 7 : 0)
      }))

      const el = this.$refs.bottleneckChart
      el.innerHTML = ''

      const margin = { top: 10, right: 20, bottom: 32, left: 100 }
      const W = el.clientWidth || 380
      const H = Math.max(180, data.length * 38 + margin.top + margin.bottom)
      const w = W - margin.left - margin.right
      const h = H - margin.top - margin.bottom

      const svg = d3.select(el).append('svg')
        .attr('width', W).attr('height', H)

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const y = d3.scaleBand().domain(data.map(d => d.agency)).range([0, h]).padding(0.35)
      const maxVal = d3.max(data, d => Math.max(d.actual, d.sla)) || 1
      const x = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, w])

      // Grid lines
      g.append('g').attr('class', 'grid')
        .call(d3.axisBottom(x).ticks(5).tickSize(h).tickFormat(''))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line').attr('stroke', '#e5e5e5').attr('stroke-dasharray', '3,3'))

      // SLA bars (background)
      g.selectAll('.bar-sla').data(data).join('rect')
        .attr('class', 'bar-sla')
        .attr('y', d => y(d.agency))
        .attr('x', 0)
        .attr('height', y.bandwidth())
        .attr('width', d => x(d.sla))
        .attr('fill', '#e5e5e5')
        .attr('rx', 2)

      // Actual bars (foreground)
      g.selectAll('.bar-actual').data(data).join('rect')
        .attr('class', 'bar-actual')
        .attr('y', d => y(d.agency))
        .attr('x', 0)
        .attr('height', y.bandwidth())
        .attr('width', d => x(d.actual))
        .attr('fill', d => d.actual > d.sla ? '#E8500A' : '#000')
        .attr('rx', 2)

      // Value labels
      g.selectAll('.val-label').data(data).join('text')
        .attr('y', d => y(d.agency) + y.bandwidth() / 2 + 4)
        .attr('x', d => x(d.actual) + 5)
        .attr('fill', '#333')
        .attr('font-size', 11)
        .text(d => `${d.actual}d`)

      // Y axis
      g.append('g').call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick text').attr('fill', '#666').attr('font-size', 11))

      // X axis
      g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}d`))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick text').attr('fill', '#666').attr('font-size', 10))

      // Legend
      const legend = svg.append('g').attr('transform', `translate(${margin.left},${H - 14})`)
      legend.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#000').attr('rx', 2)
      legend.append('text').attr('x', 14).attr('y', 9).attr('fill', '#666').attr('font-size', 10).text('Actual')
      legend.append('rect').attr('x', 60).attr('width', 10).attr('height', 10).attr('fill', '#e5e5e5').attr('rx', 2)
      legend.append('text').attr('x', 74).attr('y', 9).attr('fill', '#666').attr('font-size', 10).text('SLA')
    },

    drawGauge() {
      const prob = this.report?.abandonment_risk?.probability || 0
      const pct = Math.min(prob * 100, 100)

      const el = this.$refs.gaugeChart
      el.innerHTML = ''

      const W = el.clientWidth || 280
      const H = 200
      const cx = W / 2, cy = H * 0.78
      const r = Math.min(W, H) * 0.42

      const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)

      const arc = d3.arc().innerRadius(r * 0.68).outerRadius(r).startAngle(-Math.PI / 2)

      // Background arc
      svg.append('path')
        .datum({ endAngle: Math.PI / 2 })
        .attr('d', arc)
        .attr('fill', '#eeeeee')
        .attr('transform', `translate(${cx},${cy})`)

      // Color scale: green → amber → orange
      const color = pct < 20 ? '#1a7a1a' : pct < 40 ? '#E8500A' : '#c0392b'

      // Value arc
      const endAngle = -Math.PI / 2 + (pct / 100) * Math.PI
      svg.append('path')
        .datum({ endAngle })
        .attr('d', arc)
        .attr('fill', color)
        .attr('transform', `translate(${cx},${cy})`)

      // Center value
      svg.append('text')
        .attr('x', cx).attr('y', cy - r * 0.1)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', 32)
        .attr('font-weight', 700)
        .text(`${Math.round(pct)}%`)

      svg.append('text')
        .attr('x', cx).attr('y', cy + 22)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', 12)
        .text('dropout probability')

      // Trigger day label
      const triggerDay = this.report?.abandonment_risk?.trigger_day
      if (triggerDay) {
        svg.append('text')
          .attr('x', cx).attr('y', cy + 40)
          .attr('text-anchor', 'middle')
          .attr('fill', '#999')
          .attr('font-size', 11)
          .text(`Trigger: Day ${triggerDay}`)
      }

      // Min/Max labels
      svg.append('text').attr('x', cx - r).attr('y', cy + 14).attr('fill', '#999').attr('font-size', 10).text('0%')
      svg.append('text').attr('x', cx + r - 16).attr('y', cy + 14).attr('fill', '#999').attr('font-size', 10).text('100%')
    }
  }
}
</script>

<style scoped>
/* ── Page shell ── */
.ki-page { min-height: 100vh; background: var(--bg); font-family: 'JetBrains Mono','Space Grotesk',monospace; color: var(--text); }

/* ── Navbar ── */
.ki-nav { height: 56px; background: rgba(0,0,0,0.95); border-bottom: 1px solid var(--border); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(14px); }
.ki-nav-brand { color: #fff; text-decoration: none; font-weight: 800; font-size: 1rem; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; }
.ki-nav-mark { color: #E8500A; }
.ki-nav-sub { font-weight: 400; opacity: 0.4; font-size: 0.82rem; letter-spacing: 1px; }
.ki-nav-links { display: flex; align-items: center; }
.ki-nav-link { color: rgba(255,255,255,0.45); text-decoration: none; font-size: 0.7rem; font-weight: 600; letter-spacing: 1px; padding: 0 16px; height: 56px; display: flex; align-items: center; border-right: 1px solid rgba(255,255,255,0.07); transition: color 0.15s; }
.ki-nav-link:hover { color: #fff; }
.ki-nav-link.router-link-active { color: #fff; border-bottom: 2px solid #E8500A; }

/* ── Dashboard body ── */
.dashboard { max-width: 1200px; padding: 2.5rem 40px 4rem; margin: 0 auto; font-family: 'JetBrains Mono','Space Grotesk',monospace; color: var(--text); }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
h1 { font-size: 1.3rem; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.page-sub { color: var(--text2); font-size: 0.78rem; margin-top: 0.3rem; }
.btn-run { background: var(--orange); color: #fff; border: none; padding: 0.6rem 1.2rem; cursor: pointer; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px; font-family: inherit; transition: background 0.15s; }
.btn-run:hover { background: var(--orange-h); }

/* ── Run panel ── */
.run-panel { background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem; }
.run-panel h3 { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text2); margin-bottom: 1rem; }
.run-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
.field label { display: block; font-size: 0.65rem; font-weight: 700; color: var(--text3); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 1px; }
.field select, .field input { width: 100%; padding: 0.5rem 0.75rem; background: var(--bg2); border: 1px solid var(--border); color: var(--text); font-size: 0.85rem; font-family: inherit; outline: none; }
.field select:focus, .field input:focus { border-color: var(--orange); }
.run-actions { display: flex; gap: 0.75rem; }
.btn-primary { padding: 0.6rem 1.2rem; background: var(--orange); color: #fff; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 700; font-family: inherit; letter-spacing: 0.5px; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: var(--orange-h); }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-ghost { padding: 0.6rem 1rem; background: transparent; color: var(--text2); border: 1px solid var(--border); cursor: pointer; font-size: 0.8rem; font-family: inherit; transition: border-color 0.15s; }
.btn-ghost:hover { border-color: var(--text2); }
.sim-status-bar { margin-top: 0.75rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.75rem; color: var(--text2); }
.pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--orange); animation: pulse-d 1.2s infinite; flex-shrink: 0; }
@keyframes pulse-d { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.4); } }

/* ── States ── */
.empty-state { text-align: center; padding: 5rem 2rem; color: var(--text3); border: 1px dashed var(--border); }
.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.empty-sub { font-size: 0.78rem; margin-top: 0.5rem; color: var(--text2); }
.loading-state { text-align: center; padding: 4rem; color: var(--text2); }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── KPI cards ── */
.kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: var(--border); margin-bottom: 1.5rem; border: 1px solid var(--border); }
.kpi { background: var(--surface); padding: 1.25rem 1rem; text-align: center; }
.kpi-val { font-size: 1.7rem; font-weight: 800; line-height: 1; color: var(--text); }
.kpi-lbl { font-size: 0.6rem; color: var(--text3); margin-top: 0.35rem; text-transform: uppercase; letter-spacing: 1px; }
.kpi-warn .kpi-val { color: var(--orange); }
.kpi-danger .kpi-val { color: var(--danger); }

/* ── Chart cards ── */
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.chart-card { background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; }
.chart-card h3 { font-size: 0.62rem; color: var(--text3); margin-bottom: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
.full-width { margin-bottom: 1rem; }
.chart-container { width: 100%; min-height: 180px; }
.gauge-container { display: flex; justify-content: center; }

/* ── Flags ── */
.flag-list { display: flex; flex-direction: column; gap: 0.75rem; }
.flag { background: var(--surface2); border: 1px solid var(--border); border-left: 3px solid var(--danger); padding: 1rem; }
.flag-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.flag-agency { font-weight: 700; font-size: 0.85rem; color: var(--text); }
.flag-pct { font-weight: 800; font-size: 0.9rem; }
.flag-pct.high { color: var(--danger); }
.flag-pct.med { color: var(--orange); }
.flag-pattern { font-size: 0.75rem; color: var(--text2); margin-bottom: 0.3rem; }
.flag-rec { font-size: 0.72rem; color: var(--orange); margin-bottom: 0.6rem; }
.flag-bar-bg { height: 3px; background: var(--border); }
.flag-bar { height: 3px; background: var(--danger); transition: width 0.8s ease; }

/* ── Recommendations ── */
.rec-list { display: flex; flex-direction: column; gap: 0.5rem; }
.rec-item { display: flex; gap: 0.75rem; align-items: flex-start; background: var(--surface2); border-left: 3px solid var(--orange); padding: 0.85rem; font-size: 0.8rem; color: var(--text2); }
.rec-num { background: var(--orange); color: #fff; width: 20px; height: 20px; min-width: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; }
</style>

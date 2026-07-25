<template>
  <div class="ki-page">
    <nav class="ki-nav">
      <router-link to="/" class="ki-nav-brand">
        <span class="ki-nav-mark">◈</span> MERIDIAN <span class="ki-nav-sub">/ Kenya Invest</span>
      </router-link>
      <div class="ki-nav-links">
        <router-link to="/invest" class="ki-nav-link">Onboarding</router-link>
        <router-link to="/invest/roadmap" class="ki-nav-link">Roadmap</router-link>
        <router-link to="/invest/dashboard" class="ki-nav-link">Dashboard</router-link>
        <router-link to="/invest/graphs" class="ki-nav-link">Agent Graphs</router-link>
        <button class="theme-toggle" @click="toggleTheme">{{ isDark ? '☀' : '◑' }}</button>
      </div>
    </nav>
  <div class="graphs-page">
    <div class="page-header">
      <div>
        <h1>Meridian Agent Graphs</h1>
        <p class="page-sub">Live agent network — force-directed interaction graph + simulation timeline</p>
      </div>
      <button class="btn-run" @click="loadDemo">Load demo data</button>
    </div>

    <div class="graphs-grid">

      <!-- Force-directed agent network -->
      <div class="graph-card wide">
        <h3>Agent interaction network</h3>
        <p class="graph-sub">Nodes = agents, edges = interactions, color = archetype, size = influence</p>
        <div ref="networkEl" class="graph-container"></div>
        <div class="legend-row">
          <div class="legend-item" v-for="l in archetypeLegend" :key="l.label">
            <span class="legend-dot" :style="{ background: l.color }"></span>{{ l.label }}
          </div>
        </div>
      </div>

      <!-- Stage progress area chart -->
      <div class="graph-card">
        <h3>Journey stage progression over rounds</h3>
        <div ref="areaEl" class="graph-container"></div>
      </div>

      <!-- Abandonment timeline line chart -->
      <div class="graph-card">
        <h3>Cumulative abandonment over time</h3>
        <div ref="lineEl" class="graph-container"></div>
      </div>

    </div>
  </div>
  </div><!-- /ki-page -->
</template>

<script>
import * as d3 from 'd3'

const ARCHETYPE_COLORS = {
  foreign_manufacturer: '#4f7eff',
  diaspora: '#22c55e',
  local_sme: '#f59e0b',
  multinational: '#a855f7',
  default: '#999999'
}

function generateDemoNetwork(agentCount = 80) {
  const archetypes = Object.keys(ARCHETYPE_COLORS).filter(k => k !== 'default')
  const nodes = Array.from({ length: agentCount }, (_, i) => ({
    id: i,
    archetype: archetypes[Math.floor(Math.random() * archetypes.length)],
    stage: Math.floor(Math.random() * 6),
    influence: 0.3 + Math.random() * 0.7,
    abandoned: Math.random() < 0.22
  }))
  const links = []
  for (let i = 0; i < agentCount * 1.2; i++) {
    const src = Math.floor(Math.random() * agentCount)
    const tgt = Math.floor(Math.random() * agentCount)
    if (src !== tgt) links.push({ source: src, target: tgt })
  }
  return { nodes, links }
}

function generateStageData(rounds = 40) {
  const stages = ['Not started', 'Company reg', 'Immigration', 'County permit', 'Sector license', 'Operating']
  return Array.from({ length: rounds }, (_, r) => {
    const total = 200
    const progress = r / (rounds - 1)
    const completed = Math.floor(total * progress * 0.75)
    const abandoned = Math.floor(total * 0.25 * Math.min(progress * 1.4, 1))
    return {
      round: r + 1,
      stages: stages.map((s, i) => ({
        stage: s,
        count: i === 0
          ? Math.max(0, total - completed - abandoned - (i * 10))
          : Math.floor((completed / stages.length) * (1 + (Math.random() - 0.5) * 0.3))
      })),
      abandoned
    }
  })
}

function generateAbandonmentLine(rounds = 40) {
  let total = 0
  return Array.from({ length: rounds }, (_, r) => {
    const rate = 0.8 + Math.random() * 1.2
    total += rate
    return { round: r + 1, cumulative: Math.min(total, 45) }
  })
}

import { useTheme } from '../composables/useTheme.js'

export default {
  name: 'MeridianGraphs',
  setup() { const { isDark, toggle } = useTheme(); return { isDark, toggleTheme: toggle } },
  data() {
    return {
      archetypeLegend: Object.entries(ARCHETYPE_COLORS)
        .filter(([k]) => k !== 'default')
        .map(([label, color]) => ({ label: label.replace(/_/g, ' '), color }))
    }
  },
  mounted() {
    this.loadDemo()
  },
  methods: {
    loadDemo() {
      const network = generateDemoNetwork(80)
      const stageData = generateStageData(40)
      const lineData = generateAbandonmentLine(40)
      this.$nextTick(() => {
        this.drawNetwork(network)
        this.drawAreaChart(stageData)
        this.drawLineChart(lineData)
      })
    },

    drawNetwork({ nodes, links }) {
      const el = this.$refs.networkEl
      d3.select(el).selectAll('*').remove()
      const W = el.clientWidth || 600
      const H = 360

      const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
      const g = svg.append('g')

      // Zoom
      svg.call(d3.zoom().scaleExtent([0.4, 3]).on('zoom', e => g.attr('transform', e.transform)))

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(45).strength(0.3))
        .force('charge', d3.forceManyBody().strength(-60))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(10))

      const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', '#ccc').attr('stroke-width', 1).attr('stroke-opacity', 0.6)

      const node = g.append('g').selectAll('circle').data(nodes).join('circle')
        .attr('r', d => 4 + d.influence * 6)
        .attr('fill', d => d.abandoned ? '#e5e5e5' : (ARCHETYPE_COLORS[d.archetype] || ARCHETYPE_COLORS.default))
        .attr('stroke', d => d.abandoned ? '#c0392b' : 'transparent')
        .attr('stroke-width', 1.5)
        .attr('opacity', d => d.abandoned ? 0.5 : 0.85)
        .call(d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      node.append('title').text(d => `${d.archetype} — Stage ${d.stage}${d.abandoned ? ' (abandoned)' : ''}`)

      sim.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
        node.attr('cx', d => d.x).attr('cy', d => d.y)
      })
    },

    drawAreaChart(data) {
      const el = this.$refs.areaEl
      d3.select(el).selectAll('*').remove()

      const margin = { top: 12, right: 16, bottom: 30, left: 36 }
      const W = el.clientWidth || 340
      const H = 220
      const w = W - margin.left - margin.right
      const h = H - margin.top - margin.bottom

      const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const x = d3.scaleLinear().domain([1, data.length]).range([0, w])
      const abandoned = data.map(d => d.abandoned)
      const maxA = d3.max(abandoned) || 1
      const y = d3.scaleLinear().domain([0, maxA * 1.2]).range([h, 0])

      const area = d3.area()
        .x((d, i) => x(i + 1))
        .y0(h)
        .y1(d => y(d))
        .curve(d3.curveCatmullRom)

      const gradient = svg.append('defs').append('linearGradient')
        .attr('id', 'areaGrad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#000').attr('stop-opacity', 0.15)
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#000').attr('stop-opacity', 0.01)

      g.append('path').datum(abandoned)
        .attr('fill', 'url(#areaGrad)').attr('d', area)

      const line = d3.line().x((d, i) => x(i + 1)).y(d => y(d)).curve(d3.curveCatmullRom)
      g.append('path').datum(abandoned)
        .attr('fill', 'none').attr('stroke', '#000').attr('stroke-width', 2).attr('d', line)

      g.append('g').attr('transform', `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => `R${d}`))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 10))

      g.append('g').call(d3.axisLeft(y).ticks(4))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 10))
    },

    drawLineChart(data) {
      const el = this.$refs.lineEl
      d3.select(el).selectAll('*').remove()

      const margin = { top: 12, right: 16, bottom: 30, left: 40 }
      const W = el.clientWidth || 340
      const H = 220
      const w = W - margin.left - margin.right
      const h = H - margin.top - margin.bottom

      const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const x = d3.scaleLinear().domain(d3.extent(data, d => d.round)).range([0, w])
      const y = d3.scaleLinear().domain([0, d3.max(data, d => d.cumulative) * 1.1]).range([h, 0])

      // Gradient fill
      const grad = svg.append('defs').append('linearGradient')
        .attr('id', 'lineGrad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#E8500A').attr('stop-opacity', 0.2)
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#E8500A').attr('stop-opacity', 0.01)

      const area = d3.area().x(d => x(d.round)).y0(h).y1(d => y(d.cumulative)).curve(d3.curveCatmullRom)
      g.append('path').datum(data).attr('fill', 'url(#lineGrad)').attr('d', area)

      const line = d3.line().x(d => x(d.round)).y(d => y(d.cumulative)).curve(d3.curveCatmullRom)
      g.append('path').datum(data)
        .attr('fill', 'none').attr('stroke', '#E8500A').attr('stroke-width', 2).attr('d', line)

      // Annotation at max
      const maxPoint = data.reduce((a, b) => b.cumulative > a.cumulative ? b : a)
      g.append('circle').attr('cx', x(maxPoint.round)).attr('cy', y(maxPoint.cumulative))
        .attr('r', 4).attr('fill', '#E8500A')
      g.append('text').attr('x', x(maxPoint.round) + 6).attr('y', y(maxPoint.cumulative) - 5)
        .attr('fill', '#E8500A').attr('font-size', 10)
        .text(`${Math.round(maxPoint.cumulative)} agents`)

      g.append('g').attr('transform', `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => `R${d}`))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 10))

      g.append('g').call(d3.axisLeft(y).ticks(4))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', '#666').attr('font-size', 10))
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

/* ── Page body ── */
.graphs-page { max-width: 1200px; padding: 2.5rem 40px 4rem; margin: 0 auto; font-family: 'JetBrains Mono','Space Grotesk',monospace; color: var(--text); }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
h1 { font-size: 1.3rem; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.page-sub { color: var(--text2); font-size: 0.78rem; margin-top: 0.3rem; }
.btn-run { background: var(--orange); color: #fff; border: none; padding: 0.6rem 1.2rem; cursor: pointer; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px; font-family: inherit; transition: background 0.15s; }
.btn-run:hover { background: var(--orange-h); }

/* ── Graph grid ── */
.graphs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.graph-card { background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; }
.graph-card.wide { grid-column: 1 / -1; }
.graph-card h3 { font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); margin-bottom: 0.3rem; }
.graph-sub { font-size: 0.72rem; color: var(--text2); margin-bottom: 1rem; line-height: 1.5; }
.graph-container { width: 100%; min-height: 280px; }

/* D3 axis & text inherit theme — override SVG defaults */
.graph-container :deep(text) { fill: var(--text2) !important; font-family: 'JetBrains Mono', monospace !important; font-size: 10px !important; }
.graph-container :deep(line), .graph-container :deep(path.domain) { stroke: var(--border) !important; }
.graph-container :deep(.tick line) { stroke: var(--border) !important; opacity: 0.5; }

/* ── Legend ── */
.legend-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
.legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; color: var(--text2); }
.legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
</style>

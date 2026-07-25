<template>
  <div class="stage-timeline" :class="{ compact }">
    <!-- Empty state -->
    <div v-if="!roadmap || !roadmap.steps || roadmap.steps.length === 0" class="empty-state">
      No roadmap yet — ask the concierge to build your roadmap.
    </div>

    <template v-else>
      <!-- Steps list -->
      <div class="steps-list">
        <div
          v-for="(step, idx) in roadmap.steps"
          :key="idx"
          class="step-row"
          :style="{ animationDelay: `${idx * 40}ms` }"
        >
          <!-- Left: connector line + status dot -->
          <div class="step-left">
            <div
              class="status-dot"
              :class="stepStatus(idx)"
              :title="stepStatus(idx)"
            ></div>
            <div v-if="idx < roadmap.steps.length - 1" class="connector-line"></div>
          </div>

          <!-- Body -->
          <div class="step-body">
            <div class="step-header" @click="!compact && toggleExpand(idx)">
              <div class="step-meta">
                <span class="phase-badge" :class="`phase-${normalizePhase(step.phase)}`">
                  {{ step.phase || 'national' }}
                </span>
                <span class="step-name">{{ step.step || step.name || step.agency }}</span>
                <span v-if="step.automated" class="auto-badge">⚡ Automatable</span>
              </div>
              <div class="step-right">
                <div class="fee-block">
                  <span v-if="step.fee_kes" class="fee-kes">KES {{ fmtKes(step.fee_kes) }}</span>
                  <span v-if="step.fee_usd" class="fee-usd">${{ fmtUsd(step.fee_usd) }}</span>
                </div>
                <span v-if="step.days" class="days-chip">{{ step.days }}d</span>
                <button v-if="!compact" class="chevron" :class="{ expanded: expandedIdx === idx }" aria-label="Toggle details">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Expanded details (non-compact only) -->
            <div v-if="!compact && expandedIdx === idx" class="step-details">
              <div v-if="step.agency" class="detail-row">
                <span class="detail-label">Agency</span>
                <span class="detail-value">{{ step.agency }}</span>
              </div>
              <div v-if="step.days" class="detail-row">
                <span class="detail-label">Estimated time</span>
                <span class="detail-value">{{ step.days }} days</span>
              </div>
              <div v-if="step.automated !== undefined" class="detail-row">
                <span class="detail-label">Automatable</span>
                <span class="detail-value" :style="{ color: step.automated ? '#34d399' : '#94a3b8' }">
                  {{ step.automated ? '⚡ Yes — can be filed automatically' : 'Manual process required' }}
                </span>
              </div>
              <div v-if="step.portal" class="detail-row">
                <span class="detail-label">Portal</span>
                <a :href="step.portal" target="_blank" rel="noopener" class="portal-link">{{ step.portal }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">Total budget</span>
          <span class="summary-value">
            <span v-if="roadmap.total_budget_kes">KES {{ fmtKes(roadmap.total_budget_kes) }}</span>
            <span v-if="roadmap.total_budget_usd" class="summary-usd">${{ fmtUsd(roadmap.total_budget_usd) }}</span>
          </span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Est. timeline</span>
          <span class="summary-value">{{ totalDays }} days</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Steps</span>
          <span class="summary-value">{{ roadmap.steps.length }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { StageAutomation } from '../lib/stageAutomation.js'

const props = defineProps({
  roadmap: {
    type: Object,
    default: null
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const expandedIdx = ref(null)

// Status logic — treat all as pending/active/completed based on index
// For a fresh roadmap, step 0 is "active", rest are "pending"
const completedIds = ref([])

const automation = computed(() => {
  if (!props.roadmap?.steps) return null
  const steps = props.roadmap.steps.map((s, i) => ({ ...s, id: s.id ?? i }))
  return new StageAutomation(steps)
})

function stepStatus(idx) {
  if (!automation.value) return 'pending'
  const steps = props.roadmap.steps.map((s, i) => ({ ...s, id: s.id ?? i }))
  const auto = new StageAutomation(steps)
  return auto.getStatus(idx, completedIds.value)
}

function toggleExpand(idx) {
  expandedIdx.value = expandedIdx.value === idx ? null : idx
}

function normalizePhase(phase) {
  if (!phase) return 'national'
  return String(phase).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function fmtKes(v) {
  const n = parseInt(v) || 0
  return n.toLocaleString()
}

function fmtUsd(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const totalDays = computed(() => {
  if (!props.roadmap?.steps) return 0
  return props.roadmap.steps.reduce((acc, s) => acc + (parseInt(s.days) || 7), 0)
})
</script>

<style scoped>
.stage-timeline {
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 16px;
  overflow: hidden;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #e5eaf3;
}

.empty-state {
  padding: 32px 24px;
  text-align: center;
  color: #475569;
  font-size: 13px;
  font-style: italic;
}

/* Steps */
.steps-list {
  padding: 16px 20px 8px;
}

.step-row {
  display: flex;
  gap: 14px;
  animation: msg-in 180ms ease-out both;
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

.step-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 200ms ease;
}

.status-dot.pending   { background: #334155; }
.status-dot.completed { background: #34d399; }
.status-dot.active    {
  background: #38bdf8;
  box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5);
  animation: dot-pulse 1.6s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.45); }
  50%       { box-shadow: 0 0 0 6px rgba(56, 189, 248, 0); }
}

.connector-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: rgba(51, 65, 85, 0.6);
  margin: 4px 0;
}

.step-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.step-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.stage-timeline.compact .step-header {
  cursor: default;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.phase-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.phase-national  { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.phase-sector    { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.phase-county    { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
.phase-pre-reg   { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }

.step-name {
  font-size: 13px;
  color: #e5eaf3;
  line-height: 1.4;
  font-weight: 500;
}

.auto-badge {
  font-size: 10px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.25);
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
}

.step-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.fee-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.fee-kes {
  font-size: 11px;
  color: #94a3b8;
}

.fee-usd {
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
}

.days-chip {
  font-size: 11px;
  color: #64748b;
  background: rgba(51, 65, 85, 0.5);
  padding: 2px 7px;
  border-radius: 8px;
  white-space: nowrap;
}

.chevron {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 180ms ease, color 150ms ease;
  border-radius: 4px;
}

.chevron:hover { color: #94a3b8; }
.chevron.expanded { transform: rotate(180deg); color: #38bdf8; }
.chevron:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

/* Expanded details */
.step-details {
  margin-top: 10px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.detail-label {
  color: #64748b;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #cbd5e1;
  word-break: break-word;
}

.portal-link {
  color: #38bdf8;
  text-decoration: none;
  font-size: 12px;
  word-break: break-all;
}

.portal-link:hover { text-decoration: underline; }

/* Compact mode */
.stage-timeline.compact .steps-list {
  padding: 10px 14px 4px;
}

.stage-timeline.compact .step-body {
  padding-bottom: 10px;
}

.stage-timeline.compact .step-name {
  font-size: 12px;
}

/* Summary bar */
.summary-bar {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.5);
  border-top: 1px solid rgba(51, 65, 85, 0.4);
  gap: 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.summary-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.summary-value {
  font-size: 13px;
  font-weight: 600;
  color: #e5eaf3;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-usd {
  color: #38bdf8;
}

.summary-divider {
  width: 1px;
  height: 32px;
  background: rgba(51, 65, 85, 0.5);
  margin: 0 16px;
  flex-shrink: 0;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .step-row { animation: none; }
  .status-dot.active { animation: none; }
  .chevron { transition: none; }
}

@media (prefers-contrast: more) {
  .stage-timeline { border-color: #94a3b8; }
  .step-name { color: #fff; }
}
</style>

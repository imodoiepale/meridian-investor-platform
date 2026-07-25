<template>
  <div class="progress-pulse">
    <div class="pp-header" v-if="label">
      <span class="pp-label">{{ label }}</span>
      <span class="pp-pct" v-if="pct > 0">{{ Math.round(pct) }}%</span>
    </div>
    <div class="pp-track">
      <div
        class="pp-fill"
        :class="{ indeterminate: pct === 0 }"
        :style="pct > 0 ? { width: pct + '%' } : {}"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressPulse',
  props: {
    label: { type: String, default: '' },
    pct: { type: Number, default: 0 }
  }
}
</script>

<style scoped>
.progress-pulse {
  width: 100%;
  font-family: 'JetBrains Mono', 'Space Grotesk', monospace;
}

.pp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.7rem;
  color: #666;
  letter-spacing: 0.5px;
}

.pp-pct { color: #E8500A; font-weight: 700; }

.pp-track {
  height: 3px;
  background: #e5e5e5;
  overflow: hidden;
}

.pp-fill {
  height: 100%;
  background: #000;
  transition: width 0.5s ease;
}

.pp-fill.indeterminate {
  width: 40%;
  background: linear-gradient(90deg, transparent, #E8500A, #000, transparent);
  animation: indeterminate 1.4s ease-in-out infinite;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
</style>

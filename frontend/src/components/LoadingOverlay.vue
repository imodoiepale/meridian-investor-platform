<template>
  <Transition name="overlay">
    <div v-if="visible" class="loading-overlay">
      <div class="overlay-content">
        <div class="spinner-ring">
          <div class="spinner-inner"></div>
          <div class="spinner-mark">◈</div>
        </div>
        <div class="overlay-title">{{ message }}</div>
        <div class="overlay-sub" v-if="sub">{{ sub }}</div>
        <div class="overlay-progress">
          <div class="overlay-bar" :style="{ width: pct + '%' }"></div>
        </div>
        <div class="overlay-steps" v-if="steps.length">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="overlay-step"
            :class="{
              done: i < activeStep,
              active: i === activeStep,
              pending: i > activeStep
            }"
          >
            <span class="step-icon">{{ i < activeStep ? '✓' : i === activeStep ? '▶' : '○' }}</span>
            {{ s }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'LoadingOverlay',
  props: {
    visible: { type: Boolean, default: false },
    message: { type: String, default: 'Processing...' },
    sub: { type: String, default: '' },
    pct: { type: Number, default: 0 },
    steps: { type: Array, default: () => [] },
    activeStep: { type: Number, default: 0 }
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: 'JetBrains Mono', 'Space Grotesk', monospace;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  max-width: 400px;
  width: 100%;
  padding: 0 2rem;
}

/* Spinner */
.spinner-ring {
  width: 72px;
  height: 72px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-inner {
  position: absolute;
  inset: 0;
  border: 2px solid #e5e5e5;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-mark {
  font-size: 1.4rem;
  color: #E8500A;
  animation: pulse-mark 1.6s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse-mark {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* Text */
.overlay-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #000;
  letter-spacing: 0.5px;
  text-align: center;
}

.overlay-sub {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  line-height: 1.5;
}

/* Progress bar */
.overlay-progress {
  width: 100%;
  height: 2px;
  background: #e5e5e5;
  overflow: hidden;
}

.overlay-bar {
  height: 100%;
  background: #E8500A;
  transition: width 0.6s ease;
  min-width: 4%;
}

/* Steps list */
.overlay-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.overlay-step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f0f0f0;
  transition: color 0.3s;
}

.overlay-step.done { color: #1a7a1a; }
.overlay-step.active { color: #000; font-weight: 700; }
.overlay-step.pending { color: #bbb; }

.step-icon {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  font-size: 0.65rem;
}

/* Transition */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.25s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>

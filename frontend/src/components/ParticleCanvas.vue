<template>
  <canvas ref="canvas" class="particle-canvas"></canvas>
</template>

<script>
export default {
  name: 'ParticleCanvas',
  props: {
    count: { type: Number, default: 55 },
    color: { type: String, default: '232,80,10' }
  },
  data() {
    return { particles: [], raf: null, ctx: null }
  },
  mounted() {
    this.init()
    window.addEventListener('resize', this.init)
  },
  beforeUnmount() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.init)
  },
  methods: {
    init() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      this.ctx = canvas.getContext('2d')
      this.particles = Array.from({ length: this.count }, () => this.make(canvas))
      cancelAnimationFrame(this.raf)
      this.loop()
    },
    make(canvas) {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.5 + 0.1
      }
    },
    loop() {
      const canvas = this.$refs.canvas
      if (!canvas || !this.ctx) return
      this.ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of this.particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        this.ctx.fillStyle = `rgba(${this.color},${p.opacity})`
        this.ctx.fill()
      }
      // Draw connections
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x
          const dy = this.particles[i].y - this.particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            this.ctx.beginPath()
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y)
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y)
            this.ctx.strokeStyle = `rgba(${this.color},${0.06 * (1 - dist / 120)})`
            this.ctx.lineWidth = 0.6
            this.ctx.stroke()
          }
        }
      }
      this.raf = requestAnimationFrame(this.loop)
    }
  }
}
</script>

<style scoped>
.particle-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; display: block;
}
</style>

/**
 * v-reveal — fade/slide an element in the first time it scrolls into view.
 *
 *   <div v-reveal>…</div>              default
 *   <div v-reveal="{ delay: 120 }">…   stagger in ms
 *   <div v-reveal="{ y: 40 }">…        travel distance in px
 *
 * Honours prefers-reduced-motion by revealing immediately.
 */
const REDUCED = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

let observer = null
const registry = new WeakMap()

function ensureObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const opts = registry.get(entry.target) || {}
      const delay = opts.delay || 0
      setTimeout(() => entry.target.classList.add('reveal-in'), delay)
      observer.unobserve(entry.target)
      registry.delete(entry.target)
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 })
  return observer
}

export const reveal = {
  mounted(el, binding) {
    const opts = binding.value || {}

    if (REDUCED || typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal', 'reveal-in')
      return
    }

    el.classList.add('reveal')
    if (opts.y != null) el.style.transform = `translateY(${opts.y}px)`

    registry.set(el, opts)
    ensureObserver()?.observe(el)
  },
  unmounted(el) {
    registry.delete(el)
    observer?.unobserve(el)
  },
}

export default reveal

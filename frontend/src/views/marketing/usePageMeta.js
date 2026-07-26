/**
 * usePageMeta — per-page <meta> description and Open Graph tags.
 *
 * The router's afterEach already sets document.title, so this deliberately
 * does not touch it. Everything here is written on mount and removed on
 * unmount, so nothing leaks between routes.
 *
 * Lives under views/marketing/ because meta is currently only needed on the
 * public pages and the shared router/App shell is owned by James. If meta
 * becomes app-wide, this should move to composables/ and be driven from the
 * route definitions instead.
 *
 *   usePageMeta({
 *     description: 'One sentence, under ~160 characters.',
 *     image: '/meridian-global-landing/assets/images/hero-global-investors.png',
 *   })
 */
import { onMounted, onBeforeUnmount } from 'vue'

const SITE_NAME = 'Meridian Global Investor OS'

function upsert(selector, attrs) {
  let el = document.head.querySelector(selector)
  const created = !el
  if (created) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  const previous = {}
  for (const [k, v] of Object.entries(attrs)) {
    previous[k] = el.getAttribute(k)
    el.setAttribute(k, v)
  }
  return { el, created, previous }
}

export function usePageMeta(options = {}) {
  const applied = []

  onMounted(() => {
    const title = document.title || SITE_NAME
    const url = window.location.origin + window.location.pathname
    const image = options.image
      ? window.location.origin + options.image
      : undefined

    const tags = [
      ['meta[name="description"]', { name: 'description', content: options.description }],
      ['meta[property="og:title"]', { property: 'og:title', content: title }],
      ['meta[property="og:description"]', { property: 'og:description', content: options.description }],
      ['meta[property="og:type"]', { property: 'og:type', content: 'website' }],
      ['meta[property="og:url"]', { property: 'og:url', content: url }],
      ['meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME }],
      ['meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' }],
      ['meta[name="twitter:title"]', { name: 'twitter:title', content: title }],
      ['meta[name="twitter:description"]', { name: 'twitter:description', content: options.description }],
    ]

    if (image) {
      tags.push(['meta[property="og:image"]', { property: 'og:image', content: image }])
      tags.push(['meta[name="twitter:image"]', { name: 'twitter:image', content: image }])
      if (options.imageAlt) {
        tags.push(['meta[property="og:image:alt"]', { property: 'og:image:alt', content: options.imageAlt }])
      }
    }

    for (const [selector, attrs] of tags) {
      if (attrs.content == null) continue
      applied.push(upsert(selector, attrs))
    }
  })

  onBeforeUnmount(() => {
    for (const { el, created, previous } of applied) {
      if (created) {
        el.remove()
        continue
      }
      for (const [k, v] of Object.entries(previous)) {
        if (v == null) el.removeAttribute(k)
        else el.setAttribute(k, v)
      }
    }
    applied.length = 0
  })
}

export default usePageMeta

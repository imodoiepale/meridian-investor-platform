<template>
  <div class="mk">
    <section class="mk-hero">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>Help center</p>
        <h1 v-reveal="{ delay: 80 }">How can we help?</h1>
        <div class="search" v-reveal="{ delay: 150 }">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" stroke-width="1.6"/>
            <path d="m12.8 12.8 3.7 3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input
            v-model="q"
            type="search"
            placeholder="Search articles…"
            aria-label="Search help articles"
            aria-describedby="search-status"
          />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="m-container">
        <!-- Search results -->
        <div v-if="query" class="results">
          <p id="search-status" class="results-count" role="status" aria-live="polite">
            {{ matches.length }} result{{ matches.length === 1 ? '' : 's' }} for “{{ query }}”
          </p>

          <ul v-if="matches.length" class="article-list">
            <li v-for="a in matches" :key="a.slug" :id="a.slug">
              <button
                :aria-expanded="isOpen(a.slug)"
                :aria-controls="`panel-${a.slug}`"
                @click="toggle(a.slug)"
              >
                <span class="article-head">
                  <strong v-html="highlight(a.title)"></strong>
                  <span class="topic">{{ a.topic }}</span>
                </span>
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" class="chev">
                  <path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.7"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div :id="`panel-${a.slug}`" class="panel" :class="{ open: isOpen(a.slug) }">
                <div class="panel-inner">
                  <p v-html="highlight(a.body)"></p>
                </div>
              </div>
            </li>
          </ul>

          <p v-else class="no-results">
            Nothing matched that. <router-link to="/concierge">Ask the concierge</router-link> instead.
          </p>
        </div>

        <!-- Topic browse -->
        <div v-else class="topic-grid">
          <article v-for="(t, i) in topics" :key="t.title" v-reveal="{ delay: i * 70, y: 18 }">
            <span class="topic-icon" v-html="t.icon" aria-hidden="true" />
            <h2>{{ t.title }}</h2>
            <p class="topic-blurb">{{ t.blurb }}</p>
            <ul class="disclosure">
              <li v-for="a in articlesFor(t.title)" :key="a.slug" :id="a.slug">
                <button
                  :aria-expanded="isOpen(a.slug)"
                  :aria-controls="`panel-${a.slug}`"
                  @click="toggle(a.slug)"
                >
                  <span>{{ a.title }}</span>
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true" class="chev">
                    <path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div :id="`panel-${a.slug}`" class="panel" :class="{ open: isOpen(a.slug) }">
                  <div class="panel-inner"><p>{{ a.body }}</p></div>
                </div>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section class="section contact">
      <div class="m-container contact-inner" v-reveal>
        <div>
          <h2>Still stuck?</h2>
          <p>Your concierge has your full file — profile, roadmap, and every filing so far.</p>
        </div>
        <div class="contact-actions">
          <router-link to="/concierge" class="m-btn m-btn-primary">Message the concierge</router-link>
          <a href="mailto:hello@meridian.global" class="m-btn m-btn-ghost">Email us</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import usePageMeta from './usePageMeta'

usePageMeta({
  description:
    'Answers on setting up in Kenya with Meridian: how long registration takes, '
    + 'doing it without visiting, what happens to your passport data, and which markets are live.',
})

const q = ref('')
const openSlug = ref('')

const query = computed(() => q.value.trim())

const topics = [
  {
    title: 'Getting started',
    blurb: 'Set up your profile and generate your first roadmap.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5 12 5l3.2.3-1.4 2.9 1.4 2.9L12 11.4 10 14l-2-2.6-3.2-.3 1.4-2.9L4.8 5.3 8 5l2-2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'Licences & permits',
    blurb: 'Understand which of the 100 Kenya licences apply to you.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5v4h4M7.5 11h5M7.5 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  {
    title: 'Applications',
    blurb: 'How automated filings work and what we need from you.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 10.5 7.5 15 17 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'Your data',
    blurb: 'What we hold, who it is shared with, and why.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5 16 5v5c0 3.6-2.4 6.4-6 7.5-3.6-1.1-6-3.9-6-7.5V5l6-2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.5 10 9.3 11.8 12.8 8.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'Billing',
    blurb: 'Plans, government fees, invoices, and refunds.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5" width="15" height="10.5" rx="1.6" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 8.5h15" stroke="currentColor" stroke-width="1.5"/></svg>',
  },
]

const articles = [
  {
    topic: 'Getting started',
    slug: 'what-we-need',
    title: 'What Meridian needs to build your roadmap',
    body: 'Your nationality, sector, target county, and passport details are enough to generate a first roadmap. Everything else can be filled in later.',
  },
  {
    topic: 'Getting started',
    slug: 'how-long-end-to-end',
    title: 'How long does this take, end to end',
    body: 'The steps every business needs run to roughly 31 working days in a typical roadmap: five days pre-registration, five to incorporate, seven for tax and statutory registration, and fourteen for county permits. Sector licences sit on top of that and vary widely by industry — some are issued in a fortnight, others take a couple of months. Steps overlap where the agencies allow it, so your roadmap sequences them rather than simply adding the days together.',
  },
  {
    topic: 'Getting started',
    slug: 'never-been-to-kenya',
    title: 'What if I have never been to Kenya',
    body: 'Most of the process does not require you to be here. Registration, tax, and statutory filings are all done through agency portals, and Meridian drives those on your behalf. A few steps still need you in person — biometric capture for immigration permits is the usual one, and opening a bank account often is too. Your roadmap marks those clearly so you can plan a single trip around them rather than several.',
  },
  {
    topic: 'Getting started',
    slug: 'other-markets',
    title: 'Can I use this for a country other than Kenya',
    body: 'Not yet. Kenya is the only live market — the 100-licence catalogue, the automated filings, and the concierge all cover Kenya and nothing else today. Other markets are on the roadmap rather than in the product, so nothing outside Kenya can be filed through Meridian at the moment. If you are weighing several markets, tell the concierge which ones you are considering; it genuinely affects what we build next.',
  },
  {
    topic: 'Getting started',
    slug: 'choosing-market',
    title: 'Choosing the right market',
    body: 'Compare markets on setup cost, time to operational, and licence burden before you commit.',
  },
  {
    topic: 'Licences & permits',
    slug: 'universal-licences',
    title: 'Why some licences apply to every business',
    body: 'Registration, tax, and county permits are universal. Everything else is tagged to the industries that genuinely need it.',
  },
  {
    topic: 'Licences & permits',
    slug: 'national-vs-county',
    title: 'National vs county licences',
    body: 'National licences are issued once. County licences — like the Single Business Permit — depend on where you physically operate.',
  },
  {
    topic: 'Applications',
    slug: 'automated-filing',
    title: 'How automated filing works',
    body: 'Meridian drives the real agency portal in a browser, fills the form from your profile, and returns the reference number.',
  },
  {
    topic: 'Applications',
    slug: 'rejected-filing',
    title: 'What happens if a filing is rejected',
    body: 'We diagnose the reason, correct the submission, and refile. You are notified at every state change.',
  },
  {
    topic: 'Applications',
    slug: 'missing-fields',
    title: 'Supplying missing form fields',
    body: 'Some agency forms need more than your core profile. The concierge asks for only the missing fields before it submits.',
  },
  {
    topic: 'Your data',
    slug: 'passport-data',
    title: 'Who sees my passport data',
    body: 'Your passport details are held against your profile and used for one thing: completing the agency forms that require them. Incorporation needs notarised passport copies for every director, and immigration permits need the same, so the data goes to the issuing agency for a filing you have approved — not anywhere else. Each filing records which documents it used, so you can see where a copy has gone. If your compliance team needs the specifics in writing before you upload anything, ask the concierge and we will put them in front of you.',
  },
  {
    topic: 'Your data',
    slug: 'export-delete',
    title: 'Exporting or deleting what we hold',
    body: 'Your documents stay exportable after you cancel — anything already filed stays filed, because the agency holds that record, not us. For deletion of the profile itself, ask the concierge.',
  },
  {
    topic: 'Billing',
    slug: 'government-fees',
    title: 'Are government fees included',
    body: 'No — statutory fees are passed through at cost and always shown before submission. A typical Nairobi setup comes to about KES 37,150 in agency and vendor fees; the pricing page breaks that down step by step.',
  },
  {
    topic: 'Billing',
    slug: 'change-cancel',
    title: 'Changing or cancelling your plan',
    body: 'Plans are month-to-month. Anything already filed stays filed, and documents remain exportable.',
  },
]

const articlesFor = (topic) => articles.filter((a) => a.topic === topic)

const isOpen = (slug) => openSlug.value === slug
const toggle = (slug) => { openSlug.value = isOpen(slug) ? '' : slug }

/**
 * Rank: title matches beat topic matches, which beat body-only matches.
 * Within a tier the original authoring order is kept, so the ordering stays
 * stable as you type rather than reshuffling on every keystroke.
 */
const matches = computed(() => {
  const needle = query.value.toLowerCase()
  if (!needle) return []

  return articles
    .map((a, index) => {
      const title = a.title.toLowerCase()
      let rank = -1
      if (title.includes(needle)) rank = title.startsWith(needle) ? 0 : 1
      else if (a.topic.toLowerCase().includes(needle)) rank = 2
      else if (a.body.toLowerCase().includes(needle)) rank = 3
      return { a, rank, index }
    })
    .filter((r) => r.rank !== -1)
    .sort((x, y) => x.rank - y.rank || x.index - y.index)
    .map((r) => r.a)
})

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Escape first, then wrap matches — never interpolate raw input into markup. */
const highlight = (text) => {
  const safe = escapeHtml(text)
  const needle = escapeHtml(query.value)
  if (!needle) return safe
  return safe.replace(new RegExp(`(${escapeRegExp(needle)})`, 'gi'), '<mark>$1</mark>')
}

// Articles are addressable as /help#slug without needing a router entry.
onMounted(() => {
  const hash = window.location.hash.slice(1)
  if (!hash) return
  const target = articles.find((a) => a.slug === hash)
  if (!target) return
  openSlug.value = target.slug
  document.getElementById(target.slug)?.scrollIntoView({ block: 'center' })
})
</script>

<style scoped>
.mk-hero {
  padding: 132px 0 66px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.mk-hero h1 { font-size: 48px; font-weight: 500; margin: 18px 0 26px; }

.search {
  display: flex; align-items: center; gap: 10px;
  max-width: 520px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text3);
  transition: border-color .16s var(--ease-out);
}
.search:focus-within { border-color: var(--accent); }
.search input {
  flex: 1;
  min-height: 50px;
  border: 0; background: transparent; outline: none;
  color: var(--text); font-size: 14.5px;
}

.section { padding: 78px 0; }

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 20px;
  align-items: start;
}
.topic-grid article {
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .22s var(--ease-out), transform .22s var(--ease-out);
}
.topic-grid article:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.topic-icon {
  display: grid; place-items: center;
  width: 38px; height: 38px;
  border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
  margin-bottom: 14px;
}
.topic-icon :deep(svg) { width: 19px; height: 19px; }

.topic-grid h2 { font-size: 16px; font-weight: 600; margin-bottom: 7px; }
.topic-blurb { font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 10px; }

/* ── Disclosure articles ──────────────────────────────────────────── */
.disclosure { list-style: none; display: grid; }
.disclosure li + li { border-top: 1px solid var(--border2); }

.disclosure button {
  width: 100%;
  min-height: 44px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 0;
  background: transparent; border: 0;
  color: var(--text2); font-size: 12.5px; font-weight: 500;
  text-align: left; cursor: pointer;
  transition: color .16s var(--ease-out);
}
.disclosure button:hover { color: var(--accent); }
.disclosure button .chev {
  flex-shrink: 0; color: var(--text3);
  transition: transform .2s var(--ease-out);
}
.disclosure button[aria-expanded='true'] { color: var(--accent); }
.disclosure button[aria-expanded='true'] .chev { transform: rotate(180deg); }

/* Height animation via grid rows — 0fr to 1fr transitions, max-height snaps. */
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .24s var(--ease-out);
}
.panel.open { grid-template-rows: 1fr; }
.panel-inner { overflow: hidden; }
.panel-inner p {
  padding-bottom: 13px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text2);
}

/* ── Results ──────────────────────────────────────────────────────── */
.results-count { font-size: 12.5px; color: var(--text3); margin-bottom: 16px; }
.article-list { list-style: none; display: grid; gap: 12px; max-width: 720px; }
.article-list li {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .22s var(--ease-out);
}
.article-list li:hover { box-shadow: var(--shadow-md); }

.article-list button {
  width: 100%;
  min-height: 44px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 20px;
  background: transparent; border: 0;
  color: var(--text); text-align: left; cursor: pointer;
}
.article-head { display: grid; gap: 7px; justify-items: start; }
.article-list strong { font-size: 14.5px; font-weight: 600; }
.article-list .chev { flex-shrink: 0; color: var(--text3); transition: transform .2s var(--ease-out); }
.article-list button[aria-expanded='true'] .chev { transform: rotate(180deg); }
.article-list .panel-inner p { padding: 0 20px 16px; font-size: 13px; }

:deep(mark) {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
}

.topic {
  display: inline-block;
  padding: 3px 9px; border-radius: 20px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 10.5px; font-weight: 600;
}

.no-results { font-size: 14px; color: var(--text2); }
.no-results a { color: var(--accent); font-weight: 600; text-decoration: none; }
.no-results a:hover { text-decoration: underline; }

.contact { background: var(--bg2); border-top: 1px solid var(--border); }
.contact-inner {
  display: flex; align-items: center; justify-content: space-between;
  gap: 28px; flex-wrap: wrap;
}
.contact h2 { font-size: 30px; margin-bottom: 8px; }
.contact p { font-size: 14.5px; color: var(--text2); }
.contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .mk-hero { padding: 112px 0 56px; }
  .mk-hero h1 { font-size: 38px; }
}

@media (prefers-reduced-motion: reduce) {
  .topic-grid article,
  .article-list li,
  .disclosure button,
  .disclosure button .chev,
  .article-list .chev,
  .search { transition: none; }
  .topic-grid article:hover { transform: none; }
  .panel { transition: none; }
}
</style>

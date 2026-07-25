# Brief — Millicent Morara · Product & marketing

Paste this whole file as your first message to Claude Code, then start work.

---

## The product, in one paragraph

Meridian Global Investor OS helps a foreign investor **Land → Launch → Live** in
Kenya. They tell us their nationality, industry, county, and capital; we return a
coordinated roadmap of every licence they need, then drive the real government
portals to file the applications. Stack: Vue 3 + Vite frontend (`:3000`), Flask
backend (`:5001`), Node/Playwright automations (`:5000`), Supabase for auth.

## Your slice

You own the **public site** — every page a visitor sees before signing in, except the
landing page and the login page. Three pages: About, Pricing, Help. Their job is to
convert a sceptical foreign investor into someone who starts a profile, and to answer
the objection they're actually holding ("is this real, what does it cost, what
happens if it goes wrong?").

The public navbar is deliberately just **About · Pricing · Help**. Everything else
lives behind login. Do not add nav items.

## Files you own

| File | Route |
|---|---|
| `frontend/src/views/marketing/AboutView.vue` | `/about` |
| `frontend/src/views/marketing/PricingView.vue` | `/pricing` |
| `frontend/src/views/marketing/HelpView.vue` | `/help` |
| Any new `frontend/src/views/marketing/*.vue` you create |
| `frontend/public/meridian-global-landing/assets/images/` | *(read-only — use, don't replace)* |

## Files you must not touch

`frontend/src/App.vue`, `frontend/src/router/index.js`,
`frontend/src/layouts/PublicLayout.vue`, `frontend/src/layouts/DashboardLayout.vue`,
`frontend/src/components/SiteFooter.vue`, `frontend/src/components/BrandMark.vue`,
`frontend/src/views/Landing.vue`, `frontend/src/views/LoginView.vue`,
anything under `backend/` or `automations/`.

New page? Write the `.vue` file, then ask James to add the route — the router is
shared and merge-conflicts badly.

## The visual language

`frontend/src/views/Landing.vue` is the reference implementation. Read it before you
write anything. It is an exact replica of an approved design; your pages must feel
like they belong to it.

The static source is `frontend/public/meridian-global-landing/` — `index.html` and
`styles.css` are the approved build. Match its spacing rhythm, type scale, and
restraint.

Pattern to follow on every page:

```
<section class="mk-hero">     ← navy-tinted band, eyebrow + h1 + lede
<section class="section">     ← 78–88px vertical padding
<section class="section cta"> ← closing call to action
```

Copy the hero/section CSS from an existing marketing view rather than inventing new
spacing. Use `.m-container` for width, `.m-eyebrow` for the small caps label above a
heading, `.m-btn m-btn-primary` / `.m-btn-ghost` for buttons.

Available imagery (`/meridian-global-landing/assets/images/`): `hero-global-investors`,
`global-network-earth`, `market-selection-nairobi`, `coordinated-requirements-roadmap`,
`local-expert-handshake`, `market-entry-command-center`,
`meridian-dashboard-command-center`. Reference them by absolute public path, e.g.
`/meridian-global-landing/assets/images/global-network-earth.png`.

**These PNGs are large (~14MB total).** If you add images to a page, add
`loading="lazy"` and `decoding="async"`, and flag it to James if a page gets heavy —
we may need WebP conversion.

## Tasks, in priority order

1. **Pricing — make the numbers defensible.** The plans (Explore $0 / Land $249 /
   Enterprise custom) and the monthly-annual toggle work. What's missing is the thing
   every investor asks: *what do I actually pay the Kenyan government on top of
   this?* Add a section below the plans showing indicative statutory fees for a
   typical setup — name reservation KES 150, name search KES 1,000, incorporation
   KES 10,950, county Single Business Permit varies — with a clear "passed through at
   cost, shown before submission" framing. Do not invent figures; take them from
   `backend/data/kenya_licences.json` and `backend/routes/kenya_invest.py`, and ask
   Timothy for anything you can't source.

2. **Pricing — comparison table.** Below the three cards, a feature-by-feature table
   across the plans. Sticky header row. Collapses to stacked cards under 760px.

3. **Help — make search useful.** Nine articles across four topics currently filter
   on a naive substring match. Improve it: match on title first and rank those above
   body matches, highlight the matched term in results, keep the empty state's link
   to the concierge. Then write the articles that are missing — a visitor's real
   questions are "how long does this take end to end", "what if I've never been to
   Kenya", "who sees my passport data", "can I do this for a country other than
   Kenya" (answer: Kenya is live, others are on the roadmap — don't overclaim).

4. **Help — article pages.** Topic list items are currently unclickable text. Give
   each article a real anchor route (`/help/<slug>`) or an expanding panel — your
   call, but pick one and be consistent. If you go the route path, write the view and
   ask James to wire the router.

5. **About — proof.** The page states principles well but shows no evidence. Add a
   "how it works" strip (3–4 steps with the roadmap and command-center imagery) and,
   if we have them by then, a metrics band. Keep the CCK / Claude Hackathon credit in
   the footer note.

6. **SEO and metadata.** Each route already sets a title via the router's `afterEach`.
   Add per-page `<meta name="description">` and Open Graph tags — ask James how he
   wants meta handled since it touches shared code. Also: every image needs real
   `alt` text, headings must nest properly (one `h1`, then `h2`s), and colour
   contrast must hit WCAG AA. Run Lighthouse; accessibility should be ≥ 95.

## Copy voice

Plain, specific, slightly understated. The audience is a foreign investor deciding
whether to trust software with a legal process in a country they may not have
visited.

- Concrete over abstract: "100 Kenya licences mapped to 30+ agencies", not "comprehensive coverage"
- Never overclaim. Kenya is live; other markets are roadmap. Say so.
- No exclamation marks, no "revolutionary", no "seamless", no emoji in body copy
- Short sentences. British spelling (licence, organisation) — the existing copy uses it, stay consistent

## Premium feel — concretely

- `v-reveal="{ delay: i * 70, y: 18 }"` staggered across any card grid
- Card hover: `translateY(-2px)` + `var(--shadow-md)` over 220ms
- Accordions animate height, never snap
- All of it wrapped in `@media (prefers-reduced-motion: reduce)`

Use the design tokens listed in `docs/team/README.md`. No hardcoded hex. Both light
and dark theme must work.

## Definition of done

- `cd frontend && npm run build` passes
- `/about`, `/pricing`, `/help` correct in light **and** dark theme
- Usable at 375px; every touch target ≥ 44px
- Lighthouse accessibility ≥ 95 on all three
- Every fee or figure on the site traces to something in the repo
- Your row is added to the `team` array in `frontend/src/views/marketing/AboutView.vue`
  *(this file is yours — just add your own entry, leave the others)*

## Conventions

Read `docs/team/README.md` for the branch/PR flow and the full token table. Short
version: branch `feat/millicent-<slug>`, never `git add -A`, never hardcode a colour,
`npm run build` before you push.

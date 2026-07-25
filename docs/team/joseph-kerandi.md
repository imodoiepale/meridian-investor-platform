# Brief — Joseph Kerandi · Investor dashboard

Paste this whole file as your first message to Claude Code, then start work.

---

## The product, in one paragraph

Meridian Global Investor OS helps a foreign investor **Land → Launch → Live** in
Kenya. They tell us their nationality, industry, county, and capital; we return a
coordinated roadmap of every licence they need, then drive the real government
portals to file the applications. Stack: Vue 3 + Vite frontend (`:3000`), Flask
backend (`:5001`), Node/Playwright automations (`:5000`), Supabase for auth and job
state.

## Your slice

You own the **signed-in dashboard** — the first screen an investor sees after login
and the one they return to daily. Its job is to answer three questions in under five
seconds: *where am I, what's the next thing I must do, and is anything stuck?*

Everything behind the login lives inside `DashboardLayout` (persistent sidebar +
topbar). You work inside that frame; you don't modify it.

## Files you own

| File | What it is |
|---|---|
| `frontend/src/views/InvestorDashboard.vue` | `/dashboard` — the main screen |
| `frontend/src/views/ApplicationsView.vue` | `/applications` — filing status list |
| `frontend/src/views/DocumentsView.vue` | `/documents` — document checklist |
| `frontend/src/components/StageTimeline.vue` | Vertical stepper component |
| `frontend/src/lib/stageAutomation.js` | Stage progression logic |
| Any new `frontend/src/components/dashboard/*.vue` you create |

## Files you must not touch

`frontend/src/App.vue`, `frontend/src/router/index.js`,
`frontend/src/layouts/DashboardLayout.vue`, `frontend/src/layouts/PublicLayout.vue`,
`frontend/src/views/Landing.vue`, `frontend/src/views/LoginView.vue`,
`frontend/src/views/LicenceExplorer.vue`, `frontend/src/views/marketing/*`,
anything under `backend/` or `automations/`.

Need a new API field? Ask James. Do not add Flask routes yourself.

## The data you have

Session id lives in `localStorage.getItem('meridian_session')`. Base URL is
`import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'`.

```
GET  /api/agent/session/<sid>       → { profile: {...}, journey: [...] }
GET  /api/agent/applications/<sid>  → [ { id, service, status, reference, created_at } ]
POST /api/invest/roadmap            → { phases: [...], summary: {...} }
     body: { sector, seed_pack?, sim_report? }
GET  /api/licences?sector=<s>       → { count, licences: [...] }
```

`profile` carries `full_name, nationality, passport_no, email, phone, sector,
capital_usd, county, company_name, origin_city, destination_country` — any of them
may be absent, so every widget needs a graceful empty state.

`journey` is an append-only list of events the agent emits as the investor progresses.
The current dashboard derives stage completion by prefix-matching journey step names
against `STAGE_DEFS`.

Realtime: Supabase `postgres_changes` on `automation_jobs` and `job_logs` is already
wired in `InvestorDashboard.vue` and torn down in `onBeforeUnmount`. Follow that
pattern for any new live widget, and always clean up your channel.

## How the dashboard is structured now

`InvestorDashboard.vue` renders: a greeting header with sector/county chips, four
stat cards (budget, weeks to operational, agency count, applications submitted), a
seven-stage progress rail (`identity → immigration → company → tax → banking →
hiring → launch`), a "next action" card keyed off the first incomplete stage, a
document checklist, three local experts, and a recent-activity feed.

The reference design is `frontend/public/meridian-global-landing/assets/images/meridian-dashboard-command-center.png`
and `market-entry-command-center.png`. Match their density and calm — lots of white,
one accent colour, generous line-height. Do not add a second accent colour.

## Tasks, in priority order

1. **Make the stat cards honest.** Several currently show placeholders when data is
   missing. Each card needs three states: loading (skeleton, not a spinner), empty
   ("Complete your profile to see this" with a link to `/profile`), and populated.
   Never render `NaN`, `undefined`, `0` where the truth is "unknown", or a currency
   figure we haven't actually computed.

2. **Make the next-action card do something.** Right now it describes the next step.
   It should have a primary button that routes to where the step is actually
   performed — `/concierge` prefilled with the step, `/documents` for an upload,
   `/licences?sector=…` to review requirements. A next-action with no action is
   decoration.

3. **Applications view: live status.** Status pills exist (ok / bad / live / idle).
   Add: expandable rows showing the job's log lines streamed via the `job_logs`
   realtime channel, a retry button for failed jobs (calls the existing endpoint —
   confirm the path with James), and a relative timestamp ("filed 2 days ago") that
   updates without a page refresh.

4. **Documents view: real uploads.** Status is currently inferred from which profile
   fields are filled, which is a stand-in. Wire the Upload button to Supabase
   Storage, persist the file reference, and switch the pill to "Uploaded" with a
   working View link. Ask James for the bucket name and RLS policy before you start.

5. **Extract the widgets.** `InvestorDashboard.vue` is heading past a comfortable
   size. Pull `StatCard`, `StageRail`, `NextAction`, `ActivityFeed`, and
   `DocumentChecklist` into `frontend/src/components/dashboard/`. Props in, events
   out, no direct `fetch` inside a presentational component — the view owns data
   loading. Do this *after* tasks 1–2 so you're extracting working code, not
   refactoring and fixing at the same time.

6. **Mobile.** Below 900px the sidebar collapses and the grid needs to stack. Test at
   375px. Every touch target ≥ 44px.

## Premium feel — what that means concretely

- Stagger entrance with `v-reveal="{ delay: i * 70, y: 16 }"` across a card grid
- Skeleton shimmer while loading, never a spinner on a card
- Numbers count up on first paint (~600ms, ease-out), once only
- Hover on a card: `translateY(-2px)` + `var(--shadow-md)` over 200ms
- Status changes cross-fade rather than snap
- Every one of the above wrapped in `@media (prefers-reduced-motion: reduce)`

Use the design tokens in `docs/team/README.md`. No hardcoded hex, ever — the
dashboard must work in both light and dark theme, toggled from the topbar.

## Definition of done

- `cd frontend && npm run build` passes
- `/dashboard`, `/applications`, `/documents` all correct in light **and** dark theme
- Every widget has a real loading and empty state; no `NaN`/`undefined` reaches the DOM
- Realtime channels unsubscribed in `onBeforeUnmount`
- Usable at 375px width
- Your row is added to the `team` array in `frontend/src/views/marketing/AboutView.vue`

## Conventions

Read `docs/team/README.md` for the branch/PR flow and the full token table. Short
version: branch `feat/joseph-<slug>`, never `git add -A`, never hardcode a colour,
`npm run build` before you push.

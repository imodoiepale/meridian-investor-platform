# Team briefs

One file per collaborator. Paste the whole file into Claude Code (or your editor's AI
assistant) as your first message — it contains everything needed to work without
breaking anyone else's slice.

| Member | Slice | Brief |
|---|---|---|
| James Epale | Layout, landing, auth, backend harness | *(owner — no brief)* |
| Timothy Kipkoech | Licence catalog + explorer | [`timothy-kipkoech.md`](timothy-kipkoech.md) |
| Joseph Kerandi | Investor dashboard widgets | [`joseph-kerandi.md`](joseph-kerandi.md) |
| Millicent Morara | Marketing pages (About / Pricing / Help) | [`millicent-morara.md`](millicent-morara.md) |

## Ground rules for everyone

**File ownership is disjoint.** Each brief lists the files you own and the files you
must not touch. If you need a change in someone else's file, open an issue or ask in
the group — do not edit it.

**Shared files nobody edits without a heads-up:**
`frontend/src/App.vue`, `frontend/src/router/index.js`,
`frontend/src/layouts/*`, `frontend/src/components/BrandMark.vue`,
`frontend/src/components/SiteFooter.vue`, `backend/app/__init__.py`.

**Branch + PR convention**

```bash
git checkout main && git pull
git checkout -b feat/<yourname>-<short-slug>
# ... work ...
git add <only your files>
git commit -m "feat(<slice>): <what changed and why>"
git push -u origin feat/<yourname>-<short-slug>
gh pr create --base main
```

Never `git add -A`. Never force-push `main`.

**Before you push:** `cd frontend && npm run build` must pass.

## Running the stack

```bash
python run_local.py                 # Flask API  :5001
node automations/server.mjs         # Playwright :5000
cd frontend && npm install && npm run dev   # Vite   :3000
```

Sign in at `/login` with the demo account shown on the page
(`demo@meridian.app`). If it fails, run `python backend/scripts/seed_demo_user.py`.

## Design system — non-negotiable

Never hardcode a colour, font, or radius. Everything comes from the CSS custom
properties declared in `frontend/src/App.vue`:

| Token | Use |
|---|---|
| `--accent` / `--accent-h` / `--accent-soft` | Meridian blue, its hover, its 5% tint |
| `--navy-900` … `--navy-950` | Dark surfaces |
| `--text` / `--text2` / `--text3` | Primary / secondary / tertiary copy |
| `--surface` / `--surface2` / `--bg` / `--bg2` | Panels and page backgrounds |
| `--border` / `--border2` | Hairlines |
| `--success` | Positive state |
| `--radius` (8px) / `--radius-lg` (12px) | Corners |
| `--font` (DM Sans) / `--font-display` (Manrope) / `--font-mono` | Type |
| `--shadow-sm/md/lg`, `--ease-out` | Elevation and easing |

Both light and dark themes must work — check with the toggle in the dashboard topbar.

Reuse the global button classes rather than restyling: `.m-btn`, `.m-btn-primary`,
`.m-btn-ghost`, `.m-btn-sm`, plus `.m-container` and `.m-eyebrow`.

Animations: use the `v-reveal` directive (`v-reveal="{ delay: 120, y: 18 }"`) for
scroll-in, keep transitions at 160–220ms with `var(--ease-out)`, and always guard
with `@media (prefers-reduced-motion: reduce)`.

## Adding yourself to the team roster

Everyone appends their own entry — this is the one shared list you *are* expected to
touch, but only your own row.

In `frontend/src/views/marketing/AboutView.vue`, the `team` array:

```js
{ name: 'Your Name', role: 'Your slice', initials: 'YN' },
```

Add your row in the same PR as your first feature so you show up on `/about`.

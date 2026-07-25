# Brief — Timothy Kipkoech · Licence intelligence

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

You own **licence intelligence** — the 100-licence Kenya catalog, the accuracy of its
sector tagging, and the explorer UI investors browse it through. This is the single
highest-leverage correctness surface in the product: if a licence is mis-tagged, an
investor either misses a legal requirement or wastes weeks on one that never applied
to them.

## Files you own

| File | What it is |
|---|---|
| `backend/data/kenya_licences_raw.json` | The 100 raw rows. Source of truth for names/agencies. |
| `backend/scripts/build_licence_catalog.py` | Tagging logic. Emits the catalog. |
| `backend/data/kenya_licences.json` | **Generated — never hand-edit.** Rebuild with the script. |
| `backend/routes/licences.py` | `/api/licences` API. |
| `frontend/src/views/LicenceExplorer.vue` | The `/licences` page. |

## Files you must not touch

`frontend/src/App.vue`, `frontend/src/router/index.js`, `frontend/src/layouts/*`,
`frontend/src/views/InvestorDashboard.vue`, `frontend/src/views/marketing/*`,
`backend/app/__init__.py`, anything under `automations/`.

`backend/routes/kenya_invest.py` imports `resolve_for_sector` from your module — you
may change that function's *behaviour*, but **do not change its signature**
(`resolve_for_sector(sector, level=None) -> list[dict]`) or the shape of the dicts it
returns, or the roadmap builder breaks.

## How the catalog works today

`build_licence_catalog.py` reads the raw rows and emits, per licence:

```json
{
  "id": "kra-pin-registration",
  "no": 1,
  "name": "KRA PIN Registration",
  "category": "Registration & Tax",
  "agency": "Kenya Revenue Authority",
  "agency_abbr": "KRA",
  "level": "National",
  "applies_to": "Every business and individual",
  "notes": "...",
  "universal": true,
  "sectors": []
}
```

Two tagging rules:

1. **`universal: true`** — every business needs it regardless of industry. Driven by
   `UNIVERSAL_CATEGORIES = {"Registration & Tax", "County", "Labour & Employment"}`.
   These have an empty `sectors` array and always surface.
2. **`sectors: [...]`** — industry-specific. Assigned first from `CATEGORY_SECTORS`
   (category → sectors), then refined by `NAME_OVERRIDES` (substring in the licence
   name → sectors).

The 14 canonical sectors: `agriculture, construction, education, energy,
financial_services, health, hospitality, ict, logistics, manufacturing, media,
mining, professional_services, retail`.

**Current known weakness — this is your first task.** Any non-universal licence that
matches neither a category rule nor a name override is given **all 14 sectors**, on
the principle that over-surfacing is safer than hiding a legal requirement. That is a
correct default but a poor end state: it means some investors see licences that
plainly do not apply to them.

Rebuild after any change:

```bash
python backend/scripts/build_licence_catalog.py
```

Sanity-check the output:

```bash
python -c "
import json,collections
rows=json.load(open('backend/data/kenya_licences.json',encoding='utf-8'))
print('total',len(rows),'universal',sum(r['universal'] for r in rows))
print('all-14 fallback:',sum(1 for r in rows if not r['universal'] and len(r['sectors'])==14))
c=collections.Counter(s for r in rows for s in r['sectors'])
print(sorted(c.items()))"
```

## Tasks, in priority order

1. **Kill the all-14 fallback.** Find every licence still hitting it and give it a
   real `NAME_OVERRIDES` entry. Work from the `applies_to` and `notes` columns in the
   raw JSON — they usually state plainly who the licence is for. Target: zero
   licences with all 14 sectors. Where a licence genuinely is broad (say, a fire
   safety certificate for any premises), consider whether it belongs in
   `UNIVERSAL_CATEGORIES` instead.

2. **Add `typical_fee_kes` and `typical_days`** to each catalog row (nullable — leave
   `null` where you can't source a number; do not guess). Cite the source in `notes`.
   The roadmap builder currently hardcodes `cost_kes: 0, timeline_days: 21` for every
   sector licence — once your fields exist, `backend/routes/kenya_invest.py` can read
   real numbers, and the investor's cost estimate stops being fiction. Coordinate
   with James before that consuming change lands.

3. **Add `portal_url`** — the actual application URL per licence where one exists
   (eCitizen, iTax, agency site). Surface it in the explorer detail panel as an
   external link. This is what turns the catalog from a reference into something
   actionable.

4. **Explorer UX.** Currently filters are industry / category / level / search. Add:
   a result count, a "universal only / industry only" toggle, and deep-linkable
   filters via query params (`/licences?sector=health&level=county`) so an investor
   can share a filtered view. Keep the existing behaviour where the industry filter
   auto-defaults to the signed-in investor's own sector.

5. **A test.** Add `backend/tests/test_licences.py` asserting: catalog has 100 rows;
   every `id` is unique; every sector string is in the canonical 14; universal rows
   have empty `sectors`; `resolve_for_sector('health')` returns the universal set
   plus at least the PPB, KMPDC, and MOH licences.

## API contract (yours to extend, not to break)

```
GET /api/licences?sector=health&level=county&category=...&q=...
    → { count, sector, licences: [...] }
GET /api/licences/meta
    → { total, universal, categories[], sectors[], levels[] }
GET /api/licences/<licence_id>
    → the single row, or 404
```

`resolve_for_sector` is cached via `@lru_cache` on `_catalog()` — restart Flask after
regenerating the JSON or you'll be serving the old catalog and chasing a ghost.

## Definition of done

- `python backend/scripts/build_licence_catalog.py` runs clean, still emits 100 rows
- No licence carries the all-14 fallback
- `cd frontend && npm run build` passes
- `/licences` works in both light and dark theme, filters deep-link, detail panel
  shows fee, duration, and portal link where known
- Your row is added to the `team` array in `frontend/src/views/marketing/AboutView.vue`

## Conventions

Read `docs/team/README.md` for the branch/PR flow and the design tokens. Short
version: branch `feat/timothy-<slug>`, never `git add -A`, never hardcode a colour,
`npm run build` before you push.

# Meridian Global Investor OS — 8-Page Deck

Source document for NotebookLM slide generation. One `##` heading per slide.
Team: Millicent Morara (Lead) · James Epale (CTO) · Austine Owino · Timothy Kipkoech
Claude Community Kenya Impact Lab — Table 26, Huduma / Government Services.
Live demo: https://meridian-investor-platform.vercel.app

---

## Page 1 — The 91-Day Wall

A foreign investor who decides today to open an ICT company in Nairobi will not
be legally operational for **91 days**.

That number is not an estimate. It is the sum of the statutory processing
windows across the **16 mandatory steps** our system maps for that exact
sector-and-county pair:

| Phase | Steps | Statutory days |
|---|---|---|
| Pre-Registration | 2 | 5 |
| Company Registration | 2 | 5 |
| Tax & Statutory Compliance | 4 | 7 |
| Sector-Specific Licences | 6 | 60 |
| County & Operational Permits | 2 | 14 |
| **Total** | **16** | **91** |

Government fees come to **KES 37,150**. That is the cheap part.

The expensive part is that those 16 steps live on **nine different portals**,
each with its own login, its own form vocabulary, and no shared identity. The
investor re-types the same passport number, the same postal address, the same
company name, between eleven and forty times. Every retype is a rejection risk,
and every rejection restarts a statutory clock.

**The market response today is a consultant charging USD 3,000–8,000 to be a
human copy-paste layer.** That is the incumbent we are displacing.

---

## Page 2 — What Meridian Is

Meridian is an operating system for the investor journey, organised in three
stages:

**Land** — Immigration. eTA, and the full eFNS permit family: Class G
(investor), Class D (employment), Class N (spouse), Class R (refugee), Special
Pass, Student Pass, Dependant's Pass, Re-entry Pass, Dual Citizenship.

**Launch** — Formation. Company registration on eCitizen/BRS, KRA PIN on iTax,
NSSF and SHA employer registration.

**Live** — Operation. County permits, sector licences, monthly tax filings.

The investor fills **one profile, once**. From that single profile Meridian
drives every downstream portal.

Three things make it work:

1. **A 100-licence Kenyan catalog**, tagged by sector, agency and level, so the
   roadmap is derived from law rather than guessed by a model.
2. **A Claude tool-use harness with 11 tools**, which turns "I want to start a
   fintech in Mombasa" into a costed, sequenced, agency-by-agency plan.
3. **21 live browser-automation endpoints**, which do not describe the form —
   they open a real Chrome window and fill it.

---

## Page 3 — The Demo: Chrome Actually Opens

This is the part that separates Meridian from a chatbot with a nice roadmap.

The investor clicks **Run automation** on any portal card. What happens next:

1. The Vue frontend POSTs the session ID — and nothing else — to Flask.
2. Flask loads the saved profile and runs `map_profile()`, translating the
   11-field investor profile into the ~40-field shape the target portal expects,
   coercing gender, county and nationality into the portal's internal IDs.
3. Flask injects the portal credentials **from server environment variables**.
   Credentials never touch the browser bundle.
4. Flask POSTs to the Node runner, which launches **real installed Chrome**
   (`channel: 'chrome'`, not bundled Chromium — government portals fingerprint
   the browser build).
5. A visible Chrome window opens on the live government portal, logs in, solves
   the iTax captcha by on-device OCR, and fills every field.
6. **The run stops at the final review screen. Nothing is submitted.**

Three portals, three different shapes of the same trick:

| Portal | What the audience sees |
|---|---|
| **KRA iTax** | Chrome opens itax.kra.go.ke, types the PIN, OCRs the captcha image, lands on the taxpayer dashboard |
| **eFNS Class G** | Chrome opens fns.immigration.go.ke, logs in, walks a 40-field investor-permit form across multiple steps |
| **eTA Kenya** | Chrome opens the travel-authority portal with no login at all, and stops cleanly at the passport-upload gate |

That last one is deliberate. It demonstrates the system reporting an honest
blocker — *"passport biodata scan missing"* — rather than failing silently.

---

## Page 4 — Architecture

Four processes, each doing one job.

**Frontend — Vue 3 + Vite.** Profile wizard, investor dashboard, dual roadmap
views (SVG phase tree and a step-by-step timeline), and the automations
launcher. Deployed static on Vercel.

**Backend — Flask.** The Claude tool-use harness, the licence catalog, the
roadmap builder, and the credential-holding proxy in front of the automation
runner. Deployed as a Vercel Python function.

**Automation runner — Node + Playwright.** 21 endpoints, one per government
service. Runs on the investor's own machine or a Railway worker, because
Playwright needs a real browser and a real display.

**Persistence — Supabase.** Investor sessions, profiles, journey events and
automation job records.

Two decisions worth naming:

The serverless entrypoint deliberately does **not** use the full app factory.
The factory also mounts a simulation stack that spawns subprocesses and writes
to disk; neither survives a read-only serverless filesystem. The deployed API
mounts only the three blueprints the investor journey actually touches.

The vector-DB import is **lazy**. It is reachable from two cache-admin
endpoints only, and pulling the ML stack into every cold start was crashing the
function outright.

---

## Page 5 — Why Claude, Specifically

Meridian is not a wrapper that forwards a question to a model and prints the
answer. Claude is the *orchestrator*, and the deterministic Kenyan data is the
*ground truth*.

**11 tools** in the harness. The interesting ones:

- `build_licensing_roadmap` — deterministic. Reads the 100-licence catalog and
  the county fee schedule. Same input, same output, every time. No hallucinated
  fees.
- `market_gap_research` — genuinely generative. Claude researches the sector in
  the target county and returns gaps with a confidence verdict.
- `check_application_readiness` — the honesty tool. Before any automation fires,
  it compares the profile against the portal's required-field list and returns
  exactly what is missing. This is why the demo never white-screens.
- `apply_immigration` — hands off to the browser runner.

**Prompt caching** on the system prompt and the licence catalog keeps
multi-turn concierge conversations cheap: the 100-licence catalog is a large,
completely static prefix, which is the ideal cache shape.

The division of labour is the point. **A hallucinated licence fee is a legal
problem, not a UX problem.** So fees, sequences and agency names come from
structured data. Claude handles the reasoning, the sequencing rationale, the
sector research, and the conversation.

---

## Page 6 — Revenue Model

Three lines, deliberately staged from lowest-friction to highest-value.

**1. Investor Concierge — USD 499 per journey.**
One-time. Full Land → Launch → Live automation for a single investor: eTA,
investor permit, company registration, KRA PIN, and the sector licence set.
Against a consultant's USD 3,000–8,000, this is a 6–16× price cut for the buyer
while remaining a high-margin product for us.

**2. Compliance Subscription — USD 79 per month.**
Recurring. Once the investor is operational, the obligations do not stop:
monthly PAYE and VAT filings, NSSF and SHA remittances, annual county permit
renewals, work permit renewals. This is the same automation surface, re-run on
a calendar. Recurring revenue from an already-acquired customer.

**3. Enterprise / Agency Licence — USD 12,000 per year.**
Law firms, Big-4 advisory desks, county investment-promotion agencies and
Special Economic Zone operators run Meridian over their own client book. Seat-
based, white-labelled.

**Unit economics per Concierge journey:**

| Line | USD |
|---|---|
| Price | 499 |
| Claude API (cached, ~40 turns) | 4 |
| Browser-runner compute | 3 |
| Supabase + hosting, amortised | 2 |
| Payment processing (3%) | 15 |
| Support / exception handling (0.4 h loaded) | 18 |
| **Total COGS** | **42** |
| **Gross profit** | **457** |
| **Gross margin** | **91.6%** |

The subscription is even cleaner: USD 79 revenue against roughly USD 6 of
monthly COGS, for a **92% gross margin** with no re-acquisition cost.

Margins are high because the marginal unit of work is a browser session, not a
consultant hour. **The cost base does not scale with the customer base.**

---

## Page 7 — Market and Traction

**Market sizing — Kenya first.**

| Layer | Figure |
|---|---|
| Foreign-owned companies registered in Kenya, annually | ~3,000 |
| Work permits and passes issued annually | ~35,000 |
| Registered SMEs facing the same licensing surface | ~1.5 million |
| Serviceable obtainable market, Year 1 (Kenya, 2% of new foreign entrants) | ~USD 1.2 M |
| Total addressable market, East African Community | ~USD 45 M |

The EAC number matters because the architecture already anticipates it. The
roadmap builder reads a **country adapter**. Kenya is one JSON file. Adding
Rwanda, Uganda or Tanzania is a data exercise plus a portal-script set — not a
rewrite.

**Built and working today:**

- 100-licence Kenyan catalog, sector-tagged and queryable
- 11-tool Claude harness with prompt caching
- 21 automation endpoints across eFNS, eTA, BRS, NSSF, SHA and KRA iTax
- 16 one-click portal launchers in the UI
- 5-step profile wizard, investor dashboard, dual roadmap views
- End-to-end dry-run harness passing **10 of 10** portal scripts
- Live public deployment on Vercel

**What is deliberately not done yet:** fee and duration columns are populated
for the critical path but carry placeholders across the long tail of the
100-licence catalog. We would rather show a placeholder than invent a number
that an investor might budget against.

---

## Page 8 — The Ask, and Where This Goes

**Next 90 days.**

Complete the fee and SLA columns across all 100 licences, working from gazette
notices rather than inference. Ship the Compliance Subscription calendar. Sign
three pilot law firms in Nairobi. Add Rwanda as the second country adapter, to
prove the country-adapter thesis holds against a real second dataset.

**What we need.**

Formal API access rather than browser automation. Every script we have written
is a workaround for a missing endpoint. eCitizen, iTax and eFNS each hold the
data; none expose it. **We built robots to type into forms because there was no
other door.** A government partnership converts our most fragile layer into our
most reliable one — and the same partnership makes Meridian an accelerator for
national investment targets rather than a private tool.

**Why this matters beyond the product.**

Kenya competes for foreign direct investment against Rwanda, Egypt, Morocco and
the Gulf. The competition is decided at the margin by friction. An investor
choosing between Nairobi and Kigali is comparing, among other things, how long
it takes to become legal.

Ninety-one days is a number a country can change.

**Meridian makes that number visible, then makes it smaller.**

---

*Live demo — https://meridian-investor-platform.vercel.app*
*Repository — https://github.com/imodoiepale/meridian-investor-platform*
*Built for the Claude Hackathon by Claude Community Kenya*

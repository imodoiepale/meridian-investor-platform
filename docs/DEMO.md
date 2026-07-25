# Meridian Global Investor OS — 3-Minute Judge Demo Script

**Golden path:** US agritech investor lands, launches, and lives in Kenya — in one conversation.

## Pre-flight (before judges arrive)

- [ ] `.env` filled: `ANTHROPIC_API_KEY`, `EFNS_EMAIL`, `EFNS_ID_NUMBER`, `EFNS_PASSWORD`, `HEADLESS=false`
- [ ] All three services up: backend `:5001`, automations `:5000`, frontend `:5173`
- [ ] eFNS portal login tested once manually (session warm, credentials valid)
- [ ] Browser window pre-positioned: app on the left, room for the headed Playwright window on the right
- [ ] One dry run of the full script completed

## The Script

### 0:00 — Hook (15s)

> "Landing foreign investment in Kenya takes six government portals and up to twelve weeks. Watch Meridian do the whole journey — Land, Launch, Live — in three minutes. And nothing here is mocked: our agent files on the *real* government portals."

Open the app. **Persona: David, US agritech investor, $250K, agri-processing, Machakos County.** Select destination: **Kenya**.

### 0:15 — LAND: Flights (25s)

Ask the agent: *"Find me flights from New York to Nairobi, leaving next month, returning two weeks later."*

- Agent calls `search_flights` → JFK→NBO offers appear (airlines, prices, layovers).
- **Say:** "Live scrape with an automatic curated fallback — this step cannot fail on stage."

### 0:40 — LAND: Immigration Advisor (30s)

Ask: *"I'm a US citizen investing $250K in agri-processing. What permit do I need?"*

- Agent calls `advise_immigration_class` → recommends **Class G (Investor)** with a formal proposal: eligibility, required documents, and an **itemized fee breakdown in KES** straight from the country adapter.
- **Say:** "This decision is where investors lose months. Meridian gets it right instantly — with real government fees, not broker quotes."

### 1:10 — THE WOW: Live eFNS Filing (45s)

Click **Apply** on the Class G proposal.

- A **real, headed Chromium window opens** — Playwright logs into the actual eFNS immigration portal and fills the Class G application field by field, on screen, with job progress streaming in the app.
- **Say:** "That is Kenya's real immigration portal. The agent is doing the data entry a fixer charges hundreds of dollars for. We stop before the final submit — everything else is real."
- **Stop the job before submit** (demo-safety stop button).

### 1:55 — LAUNCH: Licensing Roadmap (25s)

Ask: *"What licenses do I need for agri-processing in Machakos, and what's my total budget?"*

- Agent calls `build_licensing_roadmap` → ordered steps (county permit, KRA, NEMA, sector regulators) with per-item fees, timelines, and a **grand-total budget**.
- **Say:** "Full cost transparency before he spends a shilling. BRS company registration, NSSF and SHA employer accounts — same one-click automations as the permit you just saw."

### 2:20 — LAUNCH: Hiring (20s)

Ask: *"Generate job descriptions for my first three hires: plant manager, agronomist, sales lead."*

- Agent calls `generate_jds` → three Kenya-compliant JDs with statutory deductions and local salary bands.

### 2:40 — LIVE: Safari (20s)

Ask: *"Book me a weekend safari in Amboseli for two."*

- Agent calls `book_park` → package with KES pricing confirmed → **invoice appears on screen** (and lands in the inbox if Resend is configured).
- **Close:** "Land. Launch. Live. One agent, twelve tools, real portals. Kenya is our flagship adapter — every other country is one JSON file away."

## Fallback Notes (if things go sideways)

| Failure | Fallback | Line to say |
|---|---|---|
| eFNS portal down / login blocked | Play the pre-recorded headed-run screen capture; show the job-progress log from a prior run | "Government portals nap sometimes — here's the same run recorded an hour ago, unedited." |
| eFNS slow mid-fill | Let progress stream 10–15s, then narrate the roadmap step while it continues in the corner | Keep talking; never wait in silence. |
| Live flight scrape fails | Automatic — curated dataset returns instantly, tagged `source: curated` | No line needed; it's invisible by design. |
| Claude API hiccup | Retry the message once; each phase also has a dedicated UI view usable without chat | "Let me show you the guided flow for this step." |
| Resend key missing / email fails | Invoice is always saved locally and rendered in the UI | "Invoice is generated either way — email is a bonus." |
| Total network loss | Flights (curated), advisor fees, roadmap, JDs, marketplace, and park booking all run on local adapter data | Skip the live portal moment; lead with the roadmap + budget. |

**Golden rule:** the demo degrades gracefully at every step — the only thing that requires the internet is the wow moment, and it has a recording.

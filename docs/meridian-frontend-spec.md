# Meridian — Frontend Design Specification
## Complete UI Guide for Developers

**Version:** 1.0  
**Stack:** Vue.js 3 + Vite · TailwindCSS · D3.js (graph) · Pinia (state)  
**Design language:** MiroFish-inspired — dark navy canvas, bright accent nodes, clean mono typography  
**Reference aesthetic:** roadmap.sh node graph + Meridian dashboard (see screenshots)

---

## Table of Contents

1. [Design System](#1-design-system)
2. [App Shell & Navigation](#2-app-shell--navigation)
3. [Screen 1 — Onboarding Flow](#3-screen-1--onboarding-flow)
4. [Screen 2 — Dashboard](#4-screen-2--dashboard)
5. [Screen 3 — Roadmap (Node Graph)](#5-screen-3--roadmap-node-graph)
6. [Screen 4 — Agency Detail Side Panel](#6-screen-4--agency-detail-side-panel)
7. [Screen 5 — Agency Graph (Dependency View)](#7-screen-5--agency-graph-dependency-view)
8. [Screen 6 — Cost Breakdown Page](#8-screen-6--cost-breakdown-page)
9. [Screen 7 — Document Vault & Expiry Tracker](#9-screen-7--document-vault--expiry-tracker)
10. [Screen 8 — Facilitator View](#10-screen-8--facilitator-view)
11. [Component Library](#11-component-library)
12. [Realistic Compliance Order — The Actual Sequence](#12-realistic-compliance-order--the-actual-sequence)
13. [State Management (Pinia)](#13-state-management-pinia)
14. [Routing](#14-routing)
15. [Animation & Interaction Spec](#15-animation--interaction-spec)

---

## 1. Design System

### 1.1 Colour tokens

```css
:root {
  /* Canvas */
  --bg-canvas:      #0f1117;   /* dark navy — main page background */
  --bg-surface:     #1a1d27;   /* card/panel background */
  --bg-surface-2:   #222535;   /* nested card, hover state */
  --bg-surface-3:   #2a2e42;   /* input background */

  /* Node colours — roadmap.sh inspired */
  --node-yellow:    #f5c842;   /* default node fill */
  --node-yellow-t:  #2a2300;   /* text on yellow node */
  --node-blue:      #3b82f6;   /* info/process node */
  --node-blue-t:    #ffffff;
  --node-green:     #22c55e;   /* complete node */
  --node-green-t:   #052e16;
  --node-red:       #ef4444;   /* blocked/critical node */
  --node-red-t:     #ffffff;
  --node-amber:     #f59e0b;   /* in progress node */
  --node-amber-t:   #1c1000;
  --node-gray:      #374151;   /* queued node */
  --node-gray-t:    #9ca3af;
  --node-purple:    #8b5cf6;   /* special/sector node */
  --node-purple-t:  #ffffff;

  /* Accent */
  --accent:         #3b82f6;   /* primary CTA blue */
  --accent-hover:   #2563eb;
  --accent-soft:    #1e3a5f;   /* soft blue background */

  /* Text */
  --text-primary:   #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary:  #475569;
  --text-link:      #60a5fa;

  /* Borders */
  --border:         #2d3348;
  --border-focus:   #3b82f6;

  /* Status */
  --status-done:    #22c55e;
  --status-prog:    #f59e0b;
  --status-block:   #ef4444;
  --status-queue:   #475569;
  --status-crit:    #ef4444;  /* pulsing red ring on critical nodes */
}
```

### 1.2 Typography

```css
/* Primary: JetBrains Mono for node labels (roadmap.sh feel) */
/* Secondary: Inter for body/UI text */

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.font-mono   { font-family: 'JetBrains Mono', monospace; }
.font-ui     { font-family: 'Inter', sans-serif; }

/* Scale */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 14px;
--text-md:   16px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;
```

### 1.3 Spacing & radius

```css
--radius-sm:  4px;
--radius-md:  8px;
--radius-lg:  12px;
--radius-xl:  16px;
--radius-pill: 999px;

/* 4px base grid */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
```

### 1.4 Node anatomy (roadmap.sh style)

Every node in the roadmap graph follows this structure:

```
┌─────────────────────────────┐
│  ● STATUS DOT               │  ← 8px circle, colour = status
│                             │
│  NODE LABEL                 │  ← JetBrains Mono 13px bold
│  subtitle / step number     │  ← Inter 11px secondary
│                             │
│  KES XX,XXX  · Day X        │  ← cost + timeline badge
└─────────────────────────────┘
     │
     └──── connector line (1px, --border colour)
```

Node sizes:
- **Primary node** (phase header): 180px × 52px, yellow fill
- **Secondary node** (agency step): 160px × 44px, varies by status
- **Micro node** (sub-step): 140px × 36px, gray fill

---

## 2. App Shell & Navigation

### 2.1 Layout

```
┌──────────────────────────────────────────────────────┐
│ TOPBAR (48px)                                        │
│ [M] Meridian     [investor pill]    [notifications]  │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  SIDEBAR   │         MAIN CONTENT AREA               │
│  (200px)   │                                         │
│            │                                         │
│            │                                         │
└────────────┴─────────────────────────────────────────┘
```

### 2.2 Topbar spec

```
height: 48px
background: --bg-surface
border-bottom: 1px solid --border
padding: 0 24px

Left:   Logo "Meridian" — Inter 18px, "M" in --accent blue, "eridian" in --text-primary
Center: Page title (changes per route)
Right:  Investor pill (avatar + name + country flag) + bell icon (notification count badge)
```

### 2.3 Sidebar spec

```
width: 200px (collapsible to 56px on mobile)
background: --bg-surface
border-right: 1px solid --border
padding-top: 16px

Nav sections:
  OVERVIEW
    • Dashboard          (blue dot)
    • My journey         (gray dot)
    • Agency graph       (purple dot)
    • Roadmap            (amber dot)   ← THE MAIN ROADMAP.SH VIEW

  COMPLIANCE
    • Applications       (blue dot)
    • Documents          (green dot)
    • Expiry tracker     (red dot)
    • Payments           (gray dot)

  SUPPORT
    • Facilitator        (purple dot)
    • Bank account       (blue dot)
    • Ask Meridian       (gray dot)   ← AI chat

  BOTTOM (pinned)
    • Compliance score: 87/100 (green dot, pulsing)
    • Settings
```

Active state: `background: --bg-surface-2; border-left: 2px solid --accent; color: --text-primary`

---

## 3. Screen 1 — Onboarding Flow

The onboarding is a fullscreen wizard (no sidebar) with a dark canvas background.

### 3.1 Step progression

```
Step 1: Upload passport/ID
Step 2: 4 questions (sector, capital, county, residency)
Step 3: Research in progress (animated)
Step 4: Simulation running (animated)
Step 5: Roadmap reveal
```

### 3.2 Step 1 — Identity upload

```
Layout: centered card, 520px wide, on --bg-canvas

Card contains:
  Logo top-left
  
  Heading: "Start your investment journey"  (Inter 24px, --text-primary)
  Subtext: "Upload your passport or national ID. We'll read it automatically."

  Upload zone (dashed border, --border, 200px tall):
    Drag/drop area
    Click to upload
    Supported: JPG, PNG, PDF

  On upload → MiMo-V2-Omni reads image:
    Show extracted fields in a confirmation card:
    ┌─────────────────────────────┐
    │ ✓ Identity verified         │
    │                             │
    │ Name:        Chen Wei       │
    │ Nationality: Chinese        │
    │ Passport:    G12345678      │
    │ Expires:     2031-04-12     │
    └─────────────────────────────┘
    
    [Continue →] button (--accent fill, full width)
```

### 3.3 Step 2 — 4 questions

```
One question per screen (progress dots at top: ● ○ ○ ○)

Q1: "What sector?"
    Large card grid (3 columns):
    [Manufacturing] [Fintech] [Agriculture] [Tourism]
    [Healthcare]    [ICT]     [Real Estate] [Energy]
    [Education]     [Mining]  [Logistics]   [Other →]

Q2: "How much are you investing?"
    Currency input with USD/KES toggle
    Range slider: $10K ──────●────── $10M+
    AI note below: "Investments above $100K require KenInvest certificate"

Q3: "Which county?"
    Searchable dropdown (all 47 counties)
    Map thumbnail highlights selected county

Q4: "Will you relocate to Kenya?"
    Two large cards: [Yes, relocating] [No, managing remotely]
    Note: relocating triggers work permit flow BEFORE company registration
```

### 3.4 Step 3 — Research animation

```
Full screen dark canvas

Center:
  Meridian logo (large, 40px)
  "Building your compliance roadmap..." (Inter 16px, --text-secondary)
  
  Animated checklist (items appear one by one with 400ms stagger):
    ✓ Checking KRA fee schedules...        [green, appears first]
    ✓ Verifying Immigration SLAs...        [green]
    ↻ Researching NEMA requirements...     [spinning amber]
    ↻ Checking Nairobi County portal...    [spinning amber]
    ○ Analysing corruption risk data...    [gray, pending]
    ○ Running MiroFish simulation...       [gray, pending]

  Progress bar: 0% → 100% over ~8 seconds (or real API time)
  Source counter: "Querying 47 government sources..."
```

### 3.5 Step 5 — Roadmap reveal

```
Animated: roadmap nodes fly in from top, connecting lines draw themselves

Summary card appears first:
  ┌──────────────────────────────────────────────────────┐
  │  Your Kenya investment roadmap is ready              │
  │  Electronics Manufacturing · Nairobi · USD 2,000,000 │
  │                                                      │
  │  Agencies: 12     Days: ~90     Total fees: KES 655K │
  │  Critical: Immigration + NEMA                        │
  │                                                      │
  │  [View roadmap →]   [Download PDF]                   │
  └──────────────────────────────────────────────────────┘
```

---

## 4. Screen 2 — Dashboard

Matches the screenshot but with dark theme + MiroFish styling.

### 4.1 Stat cards row (4 cards)

```
Grid: 4 columns, gap 12px

Card 1: Current day
  Large number: "Day 23" in --accent blue, 32px
  Sub: "of ~90 estimated"
  Tag: "25% complete" in green

Card 2: Applications
  Large: "8 / 12"
  Sub: "applications submitted"
  Tag: "2 need action" in amber

Card 3: Total fees
  Large: "KES 655K" in --status-block red (it's large, draw attention)
  Sub: "total estimated fees"
  Sub2: "KES 220K paid so far" in --text-secondary

Card 4: Abandonment risk
  Large: "28%" in --status-prog amber
  Sub: "abandonment risk"
  Tag: "trigger: NEMA delay" in red small text
```

Card style:
```css
background: --bg-surface;
border: 1px solid --border;
border-radius: --radius-lg;
padding: 16px 20px;
```

### 4.2 Progress section

```
Section heading: "Overall journey progress"
Day counter + percentage right-aligned

Progress bar:
  background: --bg-surface-3
  fill: --accent blue
  height: 8px, border-radius: 4px
  animated fill on mount

Phase chips (4 columns):
  [Registration — Done · Days 1-5]    ← green bg
  [Immigration — Week 4 of 8]         ← amber bg
  [Licensing — In progress]           ← amber bg
  [Operations — Not started]          ← gray bg

Each chip: 12px font, bold phase name, normal sub-text
```

### 4.3 Two-column section

**Left: Agency status**
```
List of agencies with status pills:
  Agency name (left) + status pill (right)
  
  Status pill variants:
  [Complete]        green bg #052e16, green text #22c55e
  [Week 4/8]        amber bg, amber text
  [Action needed]   red bg, red text
  [Queued]          gray bg, gray text
  [Inspection Day X] blue bg, blue text

Clicking any agency row → opens side panel (see Screen 4)
```

**Right: Next actions**
```
Alert cards (stacked):
  Amber alert: title + description + deadline
  Red alert: title + description (critical)
  
  Action buttons row: [Upload document] [Pay fee]
  
  Buttons use --accent-soft background with --accent text
```

### 4.4 Expiry tracker

```
List rows: document name | progress bar | days remaining

Progress bar width = (days_remaining / ttl_days) × 100%
Colours:
  < 7 days:  --status-block red
  < 30 days: --status-prog amber
  < 90 days: --accent blue
  > 90 days: --status-done green
  no expiry: full green bar
```

---

## 5. Screen 3 — Roadmap (Node Graph)

This is the hero screen. Styled exactly like roadmap.sh — vertical flow of connected nodes on dark canvas. Click any node → side panel slides in from the right.

### 5.1 Layout

```
Full width, scroll vertically
No sidebar padding on this page (edge-to-edge canvas feel)
Background: --bg-canvas (dark navy)

Top controls bar (sticky):
  [Your investor type] [Kenya ▾] [Filter: All / Critical / Pending / Done]
  Right: [Download PDF] [Share]

Cost summary strip (below controls, sticky):
  Total: KES 655,950  |  Paid: KES 220,000  |  Remaining: KES 435,950
  Animate numbers counting up on page load
```

### 5.2 Phase headers

Each phase is a wide yellow node spanning the full column width:

```
┌─────────────────────────────────────────────────────┐
│  PHASE 1 — PREPARATION & IDENTITY (Days 1-14)       │
│  Do this BEFORE registering your company            │
└─────────────────────────────────────────────────────┘
Background: --node-yellow
Text: --node-yellow-t (dark)
Font: JetBrains Mono 14px bold
Width: 560px centered
```

### 5.3 Node layout rules (REALISTIC ORDER)

**CRITICAL: The realistic sequence for a foreign investor:**

```
PHASE 0 — PRE-ARRIVAL (Before you land)
  ├── Police clearance certificate (home country)
  ├── Medical examination (home country)
  └── Gather: bank statements, business plan, passport copies

PHASE 1 — PREPARATION (Days 1-7, can do from abroad)
  ├── KenInvest pre-registration (online)
  ├── Name reservation at BRS (online, KES 100)
  └── Appoint a local director / representative

PHASE 2 — COMPANY REGISTRATION (Days 8-14)
  ├── BRS — Company registration (CR1, MOA, AOA) KES 10,950
  │    └── depends on: name reservation done
  ├── KRA — Company PIN (free, same day)
  │    └── depends on: BRS certificate
  └── KRA — VAT registration (free, if turnover >5M)
       └── depends on: company PIN

PHASE 3 — IMMIGRATION (Days 14-70, LONGEST STEP)
  ⚠ NOTE: Apply for work permit BEFORE setting up operations
  ├── Class G Work Permit application (USD 2,000/yr)
  │    └── depends on: company registered, KRA PIN, investment proof
  │    └── timeline: 8-14 weeks realistic (4 weeks official)
  ├── Dependent passes (simultaneous, USD 1,000/yr each)
  └── Alien card (after permit approved)

PHASE 4 — LOCATION & PREMISES (Days 15-35, parallel with immigration)
  ├── Nairobi County — Single Business Permit (KES 50,000)
  │    └── depends on: company registered, physical address confirmed
  ├── Fire Safety Certificate (KES 5,000)
  │    └── depends on: physical premises
  └── Public Health License (if food/healthcare) (KES 3,000)

PHASE 5 — ENVIRONMENT & STANDARDS (Days 20-120, parallel)
  ├── NEMA — EIA License (KES 100,000) ← CRITICAL, 90-180 days
  │    └── depends on: premises confirmed
  ├── WRA — Water use permit (KES 5,000)
  │    └── depends on: NEMA EIA started
  └── KEBS — Diamond Mark (KES 15,000) ← 60 days
       └── depends on: factory address confirmed, NEMA started

PHASE 6 — WORKPLACE SETUP (Days 60-75)
  ├── DOSHS — Workplace registration (KES 2,000)
  │    └── depends on: premises + work permit
  ├── NSSF — Employer registration (free)
  │    └── depends on: company registration
  └── SHIF — Employer registration (free)
       └── depends on: company registration

PHASE 7 — TRADE & IMPORTS (Days 65-80)
  ├── KenTrade — Single window registration (KES 3,000)
  │    └── depends on: company PIN, import intent
  ├── KRA Customs — Import Declaration registration (KES 5,000)
  │    └── depends on: KRA PIN
  └── NCA — Contractor registration if constructing (KES 20,000)

PHASE 8 — BANKING & IP (Days 5-90, mostly parallel)
  ├── Corporate bank account (free to open)
  │    └── can start Day 5 with company + KRA PIN
  ├── USD / forex account (free)
  └── KIPI — Trademark application (KES 5,000, 18 months background)

PHASE 9 — OPERATIONAL (Day 90+)
  └── FULLY OPERATIONAL
```

### 5.4 Node visual spec

```
Node default state:
  background: --bg-surface-2
  border: 1px solid --border
  border-radius: --radius-md
  padding: 10px 14px
  font-family: JetBrains Mono
  font-size: 13px
  cursor: pointer
  transition: all 200ms ease

Node — COMPLETE:
  border-left: 3px solid --status-done
  background: rgba(34, 197, 94, 0.08)
  Node dot (8px circle): --status-done

Node — IN PROGRESS:
  border-left: 3px solid --status-prog
  background: rgba(245, 158, 11, 0.08)
  Node dot: --status-prog (pulsing animation)

Node — BLOCKED:
  border-left: 3px solid --status-block
  border: 2px dashed --status-block
  background: rgba(239, 68, 68, 0.08)
  Node dot: --status-block

Node — CRITICAL PATH:
  border: 2px solid --status-crit
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2)
  animation: pulse 2s ease-in-out infinite

Node — QUEUED:
  border-left: 3px solid --node-gray
  background: --bg-surface
  opacity: 0.7

Node hover state:
  border-color: --accent
  background: --accent-soft
  transform: translateX(2px)
  cursor: pointer
```

Node anatomy in HTML:
```html
<div class="rm-node rm-node--inprogress" @click="openPanel(agency)">
  <div class="rm-node__header">
    <span class="rm-node__dot"></span>
    <span class="rm-node__step">Step 2.1</span>
  </div>
  <div class="rm-node__title">BRS — Company Registration</div>
  <div class="rm-node__meta">
    <span class="rm-node__fee">KES 10,950</span>
    <span class="rm-node__time">Days 8-11 · 3 days</span>
  </div>
  <div class="rm-node__deps" v-if="hasDependencies">
    <span>Requires: Name reservation</span>
  </div>
</div>
```

### 5.5 Connecting lines

```
Use SVG lines drawn between nodes
Connector style:
  stroke: --border (#2d3348)
  stroke-width: 1.5
  stroke-dasharray: none (solid for dependencies)
  stroke-dasharray: 4 4 (dashed for optional/parallel paths)

CRITICAL PATH connections:
  stroke: rgba(239, 68, 68, 0.5)
  stroke-width: 2

Arrow heads on all connectors (small triangle, --text-tertiary fill)
```

### 5.6 Cost chips on nodes

Every node must show:
```
┌─────────────────────────────┐
│ BRS — Company Registration  │
│ KES 10,950 · Days 8-11      │
│ ──────────────────────────  │
│ Status: Complete ✓          │
└─────────────────────────────┘
```

Phase total displayed at bottom of each phase section:
```
Phase 2 total: KES 10,950  (Days 8-14)
```

Running total displayed in sticky banner at top.

### 5.7 Phase cost summary strip

Sticky at top of roadmap page:
```
┌──────────────────────────────────────────────────────────┐
│ Total: KES 655,950  │  Paid: KES 220K  │  Rem: KES 435K │
│ ████████░░░░░░░░░░░░  33% paid                           │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Screen 4 — Agency Detail Side Panel

Opens when any node is clicked. Slides in from right, 420px wide.

### 6.1 Panel structure

```
┌──────────────────────────────────────────────────┐
│ [×]  BRS — Business Registration Service         │
│      Step 2.1 · Phase 2 — Registration           │
├──────────────────────────────────────────────────┤
│                                                  │
│  STATUS CHIP: [Complete ✓] / [In progress] etc   │
│                                                  │
│  ──── WHAT THIS IS ────                          │
│  The Business Registration Service handles all   │
│  company formations in Kenya. You need to         │
│  complete this before operating legally.         │
│                                                  │
│  ──── COST BREAKDOWN ────                        │
│  Name reservation:     KES 100                   │
│  Company registration: KES 10,950                │
│  Official paybill:     206206                    │
│  ────────────────────────────                    │
│  Total this step:      KES 11,050                │
│                                                  │
│  ──── TIMELINE ────                              │
│  Official SLA:    3 days                         │
│  Realistic:       5 days (median)                │
│  Worst case:      10 days (portal issues)        │
│                                                  │
│  ──── REQUIRED BEFORE THIS STEP ────             │
│  ✓ Name reservation done                         │
│  ✓ Passport + KenInvest pre-registration         │
│                                                  │
│  ──── DOCUMENTS MERIDIAN GENERATES ────          │
│  ✓ CR1 form (auto-filled)                        │
│  ✓ Memorandum of Association                     │
│  ✓ Articles of Association                       │
│  ✓ Board Resolution (first directors)            │
│  ✓ Share allocation document                     │
│                                                  │
│  ──── WHAT TO EXPECT ────                        │
│  Low corruption risk (0.12). Mostly online.      │
│  Portal sometimes slow Friday afternoons.        │
│  Submit early in week for fastest processing.    │
│                                                  │
│  ──── YOUR FACILITATOR ACTION ────               │
│  Jane Wambui will pre-check your documents       │
│  before submission to avoid rejection.           │
│                                                  │
│  ──── CONTACT ────                               │
│  Sheria House, Nairobi CBD                       │
│  E: brs@registrar.go.ke                          │
│  Portal: ecitizen.go.ke/brs                      │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Start this step →]   [Download docs]           │
└──────────────────────────────────────────────────┘
```

### 6.2 Panel design tokens

```css
.side-panel {
  width: 420px;
  background: --bg-surface;
  border-left: 1px solid --border;
  position: fixed;
  right: 0; top: 48px; bottom: 0;
  overflow-y: auto;
  padding: 24px;
  animation: slideIn 200ms ease;
  z-index: 100;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

/* Section separators inside panel */
.panel-section {
  border-top: 1px solid --border;
  padding-top: 16px;
  margin-top: 16px;
}

.panel-section-title {
  font-family: JetBrains Mono;
  font-size: 11px;
  color: --text-tertiary;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
```

---

## 7. Screen 5 — Agency Graph (Dependency View)

Accessible from sidebar "Agency graph" link. Shows the full 49-agency dependency graph.

### 7.1 Layout

```
Full canvas, no scrolling (zoom + pan enabled)
D3.js force-directed graph OR manual positioned SVG

Node colours by GROUP:
  Registration:   --node-yellow (roadmap.sh style)
  Immigration:    --node-red (critical)
  Environment:    --node-red (critical)
  County:         --node-blue
  Tax:            --node-blue
  Labour:         --node-gray
  Sector:         --node-purple
  Banking:        --node-green (optional but important)
  Complete:       --node-green
```

### 7.2 Filter controls

```
Top bar:
  [All] [Critical Path] [Completed] [Pending] [Blocked]
  [Sector: All ▾]
  
  Search: [         ] filter nodes by name

Right controls:
  [Zoom in] [Zoom out] [Reset] [Fullscreen]
```

### 7.3 Edge types

```
Dependency (must-do-before): solid line, --border colour
Critical path: red dashed animated line
Optional/parallel: dotted line, --text-tertiary
```

### 7.4 Click behaviour

Same as Roadmap — any node click opens the side panel.

---

## 8. Screen 6 — Cost Breakdown Page

Full breakdown of all fees, paid/unpaid, totals by phase.

### 8.1 Top summary

```
3 big numbers:
  Total estimated:  KES 655,950
  Paid to date:     KES 220,000  (green)
  Remaining:        KES 435,950  (amber)

Large horizontal progress bar (paid vs remaining)
```

### 8.2 Cost table by phase

```
Accordion — each phase expands to show line items:

▼ Phase 2 — Company Registration
  Name reservation (BRS)         KES 100        [Paid ✓]
  Company registration (BRS)     KES 10,950     [Paid ✓]
  ─────────────────────────────────────────────────────
  Phase 2 subtotal:              KES 11,050

▼ Phase 3 — Immigration
  Class G work permit            KES 220,000    [Pending]
  Dependent pass × 2             KES 220,000    [Pending]
  ─────────────────────────────────────────────────────
  Phase 3 subtotal:              KES 440,000

▼ Phase 4 — County
  Single Business Permit         KES 50,000     [Pending ⚠ Due Friday]
  Fire certificate               KES 5,000      [Pending]
  ─────────────────────────────────────────────────────
  Phase 4 subtotal:              KES 55,000

... etc for all phases
```

### 8.3 Payment action

Each pending fee row has a [Pay now] button that:
1. Shows the official Paybill number
2. Pre-fills M-Pesa reference
3. Tracks receipt upload

---

## 9. Screen 7 — Document Vault & Expiry Tracker

### 9.1 Two-tab layout

```
[Document Vault]  [Expiry Tracker]
```

**Vault tab:**
```
Upload zone at top

Document list:
  Category headers (Registration, Immigration, Tax, County...)
  
  Each document:
  ┌──────────────────────────────────────────────┐
  │ 📄 Certificate of Incorporation              │
  │    BRS · Issued 12 Jan 2026 · No expiry      │
  │    [Download] [Share link]                   │
  └──────────────────────────────────────────────┘
```

**Expiry Tracker tab:**

```
Section: 🚨 CRITICAL (red) — under 7 days
Section: ⚠️ WARNING (amber) — under 30 days
Section: ✅ CURRENT (green) — 30-90 days
Section: 📅 UPCOMING — 90+ days

Each item:
  Document name + issuing agency
  Expiry date
  Days remaining (bold, colour-coded)
  Progress bar (red/amber/green)
  [Renew] or [Auto-renew] button
```

---

## 10. Screen 8 — Facilitator View

For the assigned human facilitator to manage investor cases.

### 10.1 Layout

```
Header: "Facilitator — Jane Wambui" + [12 active clients]

3-column stats: [Urgent: 3] [On track: 7] [Awaiting client: 2]

Client list:
  Each client = card with:
  - Name + company + sector
  - Current stage
  - Days since last contact
  - Urgent action (if any)
  - [Message] [Update status] buttons

Urgent section first (red border left), then on-track (amber), then waiting (gray)
```

---

## 11. Component Library

### StatusPill component
```vue
<StatusPill status="complete" />      <!-- green -->
<StatusPill status="inprogress" text="Week 4/8" />  <!-- amber -->
<StatusPill status="blocked" />       <!-- red -->
<StatusPill status="queued" />        <!-- gray -->
<StatusPill status="critical" />      <!-- red pulse -->
```

### AgencyNode component
```vue
<AgencyNode
  :agency="agency"
  :step="'2.1'"
  :status="'inprogress'"
  :fee="10950"
  :days="'Days 8-11'"
  :critical="false"
  @click="openPanel"
/>
```

### CostChip component
```vue
<CostChip :amount="10950" :currency="'KES'" :status="'paid'" />
<CostChip :amount="50000" :currency="'KES'" :status="'pending'" :due="'Friday'" />
```

### PhaseHeader component
```vue
<PhaseHeader
  :number="2"
  :title="'Company Registration'"
  :subtitle="'Days 8–14'"
  :total="11050"
  :status="'complete'"
/>
```

### SidePanel component
```vue
<SidePanel :agency="selectedAgency" @close="closePanel" />
```

### ProgressBar component
```vue
<ProgressBar :value="25" :total="100" :label="'Day 23 of 90'" />
```

---

## 12. Realistic Compliance Order — The Actual Sequence

**This is the true order based on Kenyan law, not the official marketing order.**

### For a FOREIGN investor (Chinese/Indian/European etc):

```
Week -4 to 0 (BEFORE ARRIVING):
  1. Police clearance from home country (required for work permit)
  2. Medical examination from accredited doctor (required for work permit)
  3. Notarise passport copies (home country)
  4. Prepare investment proof: bank statements showing capital
  5. Draft business plan

Day 1-3 (Can do from abroad online):
  6. KenInvest — pre-register investor profile (online)
  7. BRS — reserve company name (online, KES 100, instant)
  8. Appoint local representative / director if not yet in Kenya

Day 4-7 (Company foundation):
  9.  BRS — company registration: CR1, MOA, AOA (KES 10,950, 3-5 days)
  10. KRA — company PIN (free, same day online)
  11. KRA — VAT registration (free, if applicable)
  12. eCitizen — portal account setup

Day 8-60 (IMMIGRATION — Start IMMEDIATELY, this is your longest wait):
  ⚠️ START THIS AS EARLY AS POSSIBLE. It takes 8-14 weeks regardless.
  13. Class G work permit application — Form 17 (USD 2,000/yr)
      Required docs: company cert, KRA PIN, investment proof, passport,
      passport photos, medical cert, police clearance, employer letter
  14. Dependent pass applications (simultaneous, USD 1,000/yr each)
  15. Short-stay visa if needed while permit processes

Day 10-30 (Location setup — run parallel with immigration):
  16. Secure physical premises (lease agreement)
  17. Nairobi County — Single Business Permit (KES 50,000)
      Required: company cert, KRA PIN, physical address
  18. Fire Safety Certificate — book inspection (KES 5,000)

Day 15-120 (Environment — CRITICAL, start early):
  ⚠️ NEMA can block factory opening if not done. 90-180 days realistic.
  19. NEMA — Environmental Impact Assessment license (KES 100,000+)
      Required: premises confirmed, factory plans
  20. WRA — Water use permit (KES 5,000, depends on NEMA)
  21. DOSHS — Workplace registration (KES 2,000, once premises ready)

Day 20-80 (Standards — parallel):
  22. KEBS — Diamond Mark application (KES 15,000 + inspection)
      Required: factory address, initial products defined
  23. KEBS — Product testing (varies by product)

Day 60-75 (Labour — once permit nearing approval):
  24. NSSF — Employer registration (free)
  25. SHIF — Employer registration (free)
  26. Employment contracts for all staff

Day 65-80 (Trade):
  27. KenTrade — Single window registration (KES 3,000)
  28. KRA Customs — Import Declaration (for electronics components)
  29. NCA — Contractor registration if constructing factory

Day 5-20 (Banking — start early, can run in parallel):
  30. Corporate bank account (Standard Chartered recommended for forex)
  31. USD account for international transfers
  32. Set up M-Pesa business account (Paybill/Till)

Background (18 months):
  33. KIPI — Trademark application (KES 5,000)

Day ~90: FULLY OPERATIONAL ✓
```

### Important dependency rules to enforce in UI:

```
RULE 1: Work permit application REQUIRES company registration + KRA PIN
RULE 2: County SBP REQUIRES physical address (lease) to be confirmed
RULE 3: NEMA EIA REQUIRES premises to be confirmed
RULE 4: KEBS inspection REQUIRES factory address + NEMA started
RULE 5: DOSHS workplace reg REQUIRES premises + work permit (or equivalent)
RULE 6: NSSF/SHIF can start as soon as company is registered
RULE 7: Bank account can start Day 4 with company cert + KRA PIN
RULE 8: KIPI trademark can start Day 1 (runs in background)
RULE 9: NCA only needed if constructing, not if leasing existing space
RULE 10: KenTrade only needed if importing goods
```

---

## 13. State Management (Pinia)

```typescript
// stores/investor.ts
export const useInvestorStore = defineStore('investor', {
  state: () => ({
    profile: {
      name: '',
      nationality: '',
      passportNumber: '',
      sector: '',
      capitalUsd: 0,
      county: '',
      willReside: false,
    },
    roadmap: {
      phases: [],          // Array of Phase objects
      currentDay: 0,
      totalDays: 90,
      totalFeesKES: 0,
      paidFeesKES: 0,
      criticalPath: [],    // Array of agency codes
      abandonmentRisk: 0,
    },
    agencies: {},          // Map of agencyCode → AgencyStatus
    documents: [],         // Array of Document objects
    selectedAgency: null,  // Currently open side panel
    facilitator: null,
  }),
  
  getters: {
    completedAgencies: (state) => 
      Object.values(state.agencies).filter(a => a.status === 'complete'),
    pendingActions: (state) =>
      Object.values(state.agencies).filter(a => a.requiresAction),
    remainingFeesKES: (state) =>
      state.roadmap.totalFeesKES - state.roadmap.paidFeesKES,
    expiringDocuments: (state) =>
      state.documents.filter(d => d.daysToExpiry < 90).sort((a,b) => a.daysToExpiry - b.daysToExpiry),
  }
})
```

---

## 14. Routing

```typescript
// router/index.ts
const routes = [
  { path: '/',            component: LandingPage },
  { path: '/onboarding',  component: OnboardingWizard },
  { path: '/dashboard',   component: Dashboard },
  { path: '/roadmap',     component: RoadmapGraph },   // ← THE BIG ONE
  { path: '/graph',       component: AgencyGraph },
  { path: '/costs',       component: CostBreakdown },
  { path: '/documents',   component: DocumentVault },
  { path: '/expiry',      component: ExpiryTracker },
  { path: '/facilitator', component: FacilitatorView },
  { path: '/bank',        component: BankAccount },
  { path: '/ask',         component: AskMeridian },
]
```

---

## 15. Animation & Interaction Spec

### 15.1 Roadmap node entrance

```css
/* Nodes animate in staggered on page load */
.rm-node {
  animation: nodeIn 300ms ease both;
}
.rm-node:nth-child(1) { animation-delay: 0ms; }
.rm-node:nth-child(2) { animation-delay: 80ms; }
.rm-node:nth-child(3) { animation-delay: 160ms; }
/* etc... */

@keyframes nodeIn {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 15.2 Connecting lines draw animation

```javascript
// SVG path length animation
const path = document.querySelector('.connector-line');
const length = path.getTotalLength();
path.style.strokeDasharray = length;
path.style.strokeDashoffset = length;
path.style.animation = 'drawLine 600ms ease forwards';
path.style.animationDelay = `${nodeIndex * 100}ms`;

// CSS:
@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}
```

### 15.3 Critical path pulse

```css
@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.1); }
}

.rm-node--critical {
  animation: criticalPulse 2s ease-in-out infinite;
}
```

### 15.4 Side panel transitions

```css
.side-panel-enter-active { animation: slideIn 220ms cubic-bezier(0.16, 1, 0.3, 1); }
.side-panel-leave-active  { animation: slideOut 180ms ease-in; }

@keyframes slideIn  { from { transform: translateX(100%); } }
@keyframes slideOut { to   { transform: translateX(100%); } }
```

### 15.5 Number count-up animation

```javascript
// For stat cards and cost summary
function animateCount(el, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
```

---

## Key Design Decisions

1. **Dark theme throughout** — matches MiroFish's aesthetic, easier to read the node graph
2. **JetBrains Mono for nodes** — gives the roadmap.sh technical feel
3. **Yellow phase headers** — direct reference to roadmap.sh's yellow primary nodes
4. **Click-to-open side panel** — no page navigation, keeps context on roadmap
5. **Cost on every node** — investor always knows what each step costs
6. **Realistic order enforced** — locked/greyed nodes until dependencies met
7. **Critical path always highlighted** — Immigration + NEMA always visually prominent
8. **Sticky cost summary** — total/paid/remaining always visible while scrolling
9. **Dependency warnings** — if you try to start step N before step N-1, show alert
10. **Parallel tracks visible** — banking and KIPI shown as side-tracks that run simultaneously

---

*Meridian Frontend Spec v1.0 — March 2026*
*For implementation questions: refer to Windsurf implementation plan*

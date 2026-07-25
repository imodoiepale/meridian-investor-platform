# Meridian Global Investor OS — Problem Statements & Global Feasibility

## 1. The Macro Problem: Investor Onboarding Is Broken

Foreign direct investment into Africa exceeds **$50B annually** (UNCTAD), and Kenya alone targets billions in new FDI — yet the *operational* act of landing that capital is hostile:

| Friction | Reality on the ground |
|---|---|
| **Fragmented portals** | An investor touches 6+ disconnected government systems — eTA, eFNS (immigration), eCitizen/BRS (company), KRA, NSSF, SHA, county licensing — each with its own account, queue, and captcha |
| **Opaque fees** | Permit and license fees are scattered across gazette notices and county PDFs; broker quotes for the same Class G permit vary by 3–5x |
| **Weeks of paperwork** | A typical investor spends **6–12 weeks** from arrival to fully-registered, licensed, compliant employer status |
| **Middleman dependency** | Most investors pay "fixers" a premium simply to navigate portals — a trust-and-cost tax with zero accountability |
| **No unified journey** | Nobody owns Land → Launch → Live. Immigration doesn't talk to business registration; nobody tells you NEMA exists until you're fined |

Every week of onboarding friction is deferred payroll, deferred tax revenue, and — often — capital that quietly picks a different country.

## 2. Problem Statements — One Per Module

| # | Module | Problem statement |
|---|---|---|
| P1 | **Flights** | Investors plan multi-leg relocation trips with no link between travel dates and downstream deadlines (eTA validity, permit appointments). Flight logistics live outside the investment journey. |
| P2 | **eTA** | Kenya's eTA is mandatory for nearly all visitors, yet the form is repetitive, error-prone, and duplicates data the investor has already provided elsewhere. |
| P3 | **Immigration-class advisor** | Choosing among Class B/D/G/R/N/Special Pass is the single highest-stakes early decision; a wrong class means rejection, lost fees, and months of delay. There is no official decision-support tool. |
| P4 | **Automated eFNS filing** | Even with the right class chosen, the eFNS portal demands dozens of fields and document uploads per application; agents charge hundreds of dollars for pure data entry. |
| P5 | **Business registration (BRS)** | eCitizen BRS name search + registration is a multi-session slog; foreign directors routinely stall on formatting and document requirements. |
| P6 | **Licensing roadmap** | No single source answers "what licenses does an agri-processor in Machakos need, from which agencies, in what order, at what total cost?" Investors discover requirements via fines. |
| P7 | **Market-gap research** | Sector opportunity data exists but is fragmented across reports; investors default to saturated ideas instead of validated gaps. |
| P8 | **NSSF registration** | Employer registration requires captcha-gated portal sessions; SMEs delay it, accruing statutory penalties. |
| P9 | **SHA registration** | The new Social Health Authority regime is poorly understood; employer onboarding is manual and undocumented. |
| P10 | **JD / hiring generator** | First hires need Kenya-compliant contracts and JDs (statutory deductions, labor law); foreign founders copy foreign templates that don't comply. |
| P11 | **Agent marketplace** | When humans *are* needed (notarization, court filings), there is no vetted, price-transparent directory — only referrals and risk. |
| P12 | **Park booking concierge** | The "Live" layer — quality of life — is what retains investors, yet KWS park booking is its own fragmented flow with no unified pricing or invoicing. |

## 3. Why This Scales Globally: The Country-Adapter Model

Meridian's core contains **zero Kenya-specific logic**. Every jurisdiction is expressed as two pluggable artifacts:

```
countries/<iso>.json          +          automations/scripts/<iso>/*
(the KNOWLEDGE adapter)                  (the EXECUTION adapters)
─ agencies & portals                     ─ Playwright scripts per portal
─ permit/visa classes + eligibility      ─ shared helpers: login, form-fill,
─ itemized government fees                 uploads, captcha, job progress
─ licenses by industry × region
─ statutory employer registrations
```

- **The agent is universal.** The Claude harness and its 12 tools read *only* from the adapter. `advise_immigration_class` for Kenya reasons over Class B/D/G/R/N; point it at a Rwanda adapter and it reasons over Rwanda's visa classes with no code change.
- **Automation is a plugin surface.** Each portal script conforms to one contract (start job → stream progress → stop). Adding a country's portals is writing scripts, not re-architecting.
- **Kenya is the proof, fully populated.** Flagship adapter ships with real permit classes and fees, industry × county licensing data, and **live automations against five real government portals** (eTA, eFNS, BRS, NSSF, SHA). This is the hardest possible first country — captchas, stealth requirements, multi-step uploads — and it works.
- **The economics compound.** ~190 countries all share the same pattern: an immigration regime, a company registry, statutory employer registrations, and regional licensing. Each new adapter is data entry plus scripts — marginal cost falls with every country, while the agent, memory, UI, and marketplace are reused wholesale.

**Feasibility verdict:** the problem is universal, the friction is quantifiable, the solution is adapter-shaped, and the flagship adapter is not a mock — it files real forms on real portals. Kenya today; any country tomorrow, one JSON file and a scripts folder at a time.

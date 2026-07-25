# Changelog

All notable changes to the MiroFish × Kenya Invest project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2025-01-27

### Added

#### Phase 0: Project Setup
- Cloned MiroFish repository as base
- Installed npm and frontend dependencies
- Created `kenya-invest-integration` branch

#### Phase 1: Environment Configuration
- Created `.env` with all API key placeholders and configuration
- Configured LLM endpoints (MiMo-V2-Pro, MiMo-V2-Omni)
- Configured Perplexity, Zep, and OpenAI fallback settings
- Set up Qdrant vector DB connection params and cache TTLs

#### Phase 2: Docker Services
- Added Qdrant vector database service to `docker-compose.yml`
- Configured persistent volume `qdrant_storage`
- Exposed ports 6333/6334 for Qdrant API

#### Phase 3: Vector Database Layer
- Created `backend/vector_db/qdrant_client.py`
- Implemented `KenyaInvestVectorDB` class with:
  - Automatic collection initialization (fee_schedules, sla_benchmarks, regulations, risk_scores)
  - OpenAI text-embedding-3-small integration
  - TTL-based cache staleness detection
  - Search, store, and invalidate operations
  - Cache statistics endpoint

#### Phase 4: Research Agent
- Created `backend/research_agent/researcher.py`
- Implemented `InvestmentResearchAgent` with:
  - Cache-first research strategy (vector DB → Perplexity)
  - Perplexity sonar-deep-research integration
  - MiMo-V2-Pro seed pack synthesis
  - MiMo-V2-Omni passport/ID OCR reading
  - GPT-4o-mini fallback for API failures
  - Structured seed pack JSON generation

#### Phase 5: Typed Kenya Agents
- Created `backend/agents/kenya_agents.py`
- Implemented simulation agent types:
  - `InvestorAgent` with emotional state, abandonment risk tracking
  - `GovernmentOfficerAgent` with workload and corruption parameters
  - `FacilitatorAgent` with expertise and relationship scores
  - `BankOfficerAgent` with AML threshold
  - `MarketPeerAgent` with influence modeling
- Added EACC/TI-based agency risk profiles for 9 agencies

#### Phase 6: API Endpoints
- Created `backend/routes/kenya_invest.py`
- Implemented Flask Blueprint with endpoints:
  - `POST /api/invest/research` — trigger research, return seed pack
  - `POST /api/invest/read-passport` — OCR passport/ID image
  - `POST /api/invest/simulate` — start async simulation
  - `GET /api/invest/simulate/<id>/status` — poll simulation progress
  - `GET /api/invest/simulate/<id>/report` — get simulation report
  - `GET /api/invest/cache/stats` — vector DB statistics
  - `POST /api/invest/cache/invalidate` — force-expire cache entries

#### Phase 7: Route Registration
- Registered Kenya Invest blueprint in `backend/app/__init__.py`
- Created `backend/requirements_kenya_invest.txt` with dependencies

#### Phase 8: Frontend UI
- Created `frontend/src/views/InvestorOnboarding.vue`
- Implemented 3-step onboarding flow:
  - Step 1: Passport/ID upload with OCR
  - Step 2: Investment details (sector, capital, county, relocation)
  - Step 3: Roadmap results with simulation option
- Added responsive styling with CSS custom properties

#### Phase 9: Cron Scripts
- Created `scripts/refresh_research_cache.py`
- Configured 9 priority sector/county/nationality combinations
- Automated weekly cache refresh logic

#### Phase 10: Testing
- Created `tests/test_full_system.py`
- Comprehensive test suite covering:
  - Qdrant connectivity
  - Research API functionality
  - Cache hit verification
  - Simulation lifecycle

### Notes
- Python 3.14 installed; `camel-oasis` requires 3.10-3.12 (optional OASIS integration)
- Core Kenya Invest functionality works independently
- API keys must be added to `.env` before running

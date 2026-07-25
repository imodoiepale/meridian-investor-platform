"""Claude-powered research agent: same interface as researcher.py, Claude everywhere.

- research(): Claude + server-side web_search tool (replaces Perplexity deep research),
  Qdrant cache-first (best-effort), synthesis by the same Claude call (replaces MiMo-V2-Pro).
- read_passport(): Claude vision (replaces MiMo-V2-Omni).
"""
import base64
import json
import os
import re
from datetime import datetime

import anthropic

MODEL = os.environ.get("AGENT_MODEL", "claude-sonnet-4-6")

SEED_SCHEMA_HINT = """Return ONLY a JSON object with keys:
meta {generated_at, sector, county, nationality, capital_usd},
investor_profile {nationality, capital_usd, sector, county},
regulatory_map [ {step, agency, requirement, portal} ],
fees [ {item, agency, amount_kes, amount_usd} ],
slas [ {process, agency, official_days, realistic_days} ],
risk_scores {corruption_risk, delay_risk, abandonment_risk, notes},
bottleneck_forecast [ {stage, likelihood, mitigation} ],
sim_config {agents, ticks, scenario},
conclusion {verdict, go_no_go, rationale, total_setup_cost_usd, time_to_operational_weeks, top_3_actions}"""


class ClaudeResearchAgent:
    def __init__(self):
        self.client = anthropic.Anthropic()

    def research(self, sector, nationality, capital_usd, county):
        cached = self._cache_lookup(sector, county, nationality)
        if cached:
            return cached

        prompt = (
            f"Deep-research investing in Kenya: a {nationality} investor with USD {capital_usd:,.0f} "
            f"starting a {sector} business in {county} County. Find current official fees "
            f"(BRS, immigration Class G, county single business permit, NEMA, KEBS, sector regulator), "
            f"processing times, regulations, and risk/delay hotspots. Prefer .go.ke sources. "
            f"Then synthesise your findings. {SEED_SCHEMA_HINT}"
        )
        try:
            response = self.client.messages.create(
                model=MODEL, max_tokens=8000,
                tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
                messages=[{"role": "user", "content": prompt}])
            text = "".join(b.text for b in response.content if getattr(b, "type", "") == "text")
            seed = self._extract_json(text)
        except Exception as e:
            seed = self._fallback_seed(sector, nationality, capital_usd, county, error=str(e))

        seed.setdefault("meta", {}).update({
            "generated_at": datetime.now().isoformat(), "sector": sector,
            "county": county, "nationality": nationality, "capital_usd": capital_usd,
            "engine": "claude-web-search"})
        self._cache_store(seed, sector, county, nationality)
        return seed

    def read_passport(self, image_path):
        with open(image_path, "rb") as f:
            data = base64.standard_b64encode(f.read()).decode()
        media_type = "image/png" if image_path.lower().endswith(".png") else "image/jpeg"
        response = self.client.messages.create(
            model=MODEL, max_tokens=1024,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}},
                {"type": "text", "text": "Extract passport fields. Return ONLY JSON: {surname, given_names, passport_no, nationality, date_of_birth, sex, date_of_expiry, country_code}"}]}])
        text = "".join(b.text for b in response.content if getattr(b, "type", "") == "text")
        return self._extract_json(text)

    def _extract_json(self, text):
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        return {"raw": text}

    def _cache_lookup(self, sector, county, nationality):
        try:
            from backend.vector_db.qdrant_client import vector_db
            hits = vector_db.search(query=f"seed pack {sector} {county} {nationality}",
                                    collection="regulations", sector=sector,
                                    county=county, nationality=nationality)
            if hits and isinstance(hits, list) and hits[0].get("data", {}).get("meta"):
                return hits[0]["data"]
        except Exception:
            pass
        return None

    def _cache_store(self, seed, sector, county, nationality):
        try:
            from backend.vector_db.qdrant_client import vector_db
            vector_db.store(data=seed, collection="regulations", sector=sector,
                            county=county, nationality=nationality)
        except Exception:
            pass

    def _fallback_seed(self, sector, nationality, capital_usd, county, error=""):
        from backend.agent.tools import load_country, execute_tool
        country = load_country("kenya")
        roadmap = execute_tool("build_licensing_roadmap",
                               {"sector": sector, "county": county}, "research-fallback")
        return {
            "meta": {"engine": "curated-fallback", "error": error},
            "investor_profile": {"nationality": nationality, "capital_usd": capital_usd,
                                 "sector": sector, "county": county},
            "regulatory_map": [{"step": s["step"], "agency": s.get("agency", ""),
                                "requirement": s["step"], "portal": ""} for s in roadmap["steps"]],
            "fees": [{"item": s["step"], "agency": s.get("agency", ""),
                      "amount_kes": s.get("fee_kes", 0),
                      "amount_usd": round(s.get("fee_kes", 0) / country["fx_usd_kes"], 2)} for s in roadmap["steps"]],
            "slas": [{"process": s["step"], "agency": s.get("agency", ""),
                      "official_days": s.get("days", ""), "realistic_days": s.get("days", "")} for s in roadmap["steps"]],
            "risk_scores": {"corruption_risk": "medium", "delay_risk": "medium",
                            "abandonment_risk": "low", "notes": country["market_gaps"].get(sector.lower(), "")},
            "bottleneck_forecast": [{"stage": "sector licensing", "likelihood": "medium",
                                     "mitigation": "Engage a licensed agent from the marketplace"}],
            "sim_config": {"agents": 25, "ticks": 100, "scenario": f"{sector}-{county}"},
            "conclusion": {
                "verdict": f"{sector.title()} in {county} is viable for a {nationality} investor with USD {capital_usd:,.0f}.",
                "go_no_go": "GO" if capital_usd >= roadmap["total_budget_usd"] * 3 else "GO_WITH_CAUTION",
                "rationale": country["market_gaps"].get(sector.lower(), "Curated market data unavailable for this sector."),
                "total_setup_cost_usd": roadmap["total_budget_usd"],
                "time_to_operational_weeks": 12,
                "top_3_actions": ["Secure immigration status (Class G recommended for founders)",
                                   "Register the company via BRS and obtain KRA PIN",
                                   "Begin sector licensing in parallel with county permits"]
            }
        }


research_agent = ClaudeResearchAgent()

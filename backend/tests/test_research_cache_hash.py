"""Cache-key stability: same inputs must hash to same key so sharing works across users."""
from backend.research_agent.claude_researcher import ClaudeResearchAgent


def test_hash_stable_across_calls():
    a = ClaudeResearchAgent._hash_key("seed_pack", {"sector": "agritech", "county": "Nairobi", "nationality": "US"})
    b = ClaudeResearchAgent._hash_key("seed_pack", {"county": "Nairobi", "nationality": "US", "sector": "agritech"})
    assert a == b, "hash should be order-independent (sorted keys)"


def test_hash_differs_by_kind():
    a = ClaudeResearchAgent._hash_key("seed_pack", {"sector": "agritech"})
    b = ClaudeResearchAgent._hash_key("market_gap", {"sector": "agritech"})
    assert a != b

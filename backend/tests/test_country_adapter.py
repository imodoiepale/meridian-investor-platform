"""Smoke tests for the Kenya country adapter."""
from backend.agent.tools import load_country


def test_kenya_adapter_loads():
    k = load_country("kenya")
    assert k["iso2"] == "KE"
    assert k["currency"] == "KES"
    assert "immigration_classes" in k
    assert len(k["immigration_classes"]) >= 5


def test_kra_wired_in_business_setup():
    setup = load_country("kenya")["business_setup"]
    assert "kra_pin" in setup
    assert setup["kra_pin"]["automation_endpoint"] == "/api/kra/register-pin"
    assert "kra_nil_return" in setup
    assert setup["kra_nil_return"]["automation_endpoint"] == "/api/kra/file-nil-return"


def test_immigration_classes_have_endpoints():
    for cls in load_country("kenya")["immigration_classes"]:
        assert cls.get("automation_endpoint", "").startswith("/api/permit/"), cls["class"]

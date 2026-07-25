"""Verify the Claude tool-use schemas are well-formed and cover key capabilities."""
from backend.agent.tools import TOOLS


def _by_name(name):
    return next((t for t in TOOLS if t["name"] == name), None)


def test_tools_have_required_keys():
    for t in TOOLS:
        assert "name" in t and "description" in t and "input_schema" in t
        assert t["input_schema"]["type"] == "object"


def test_kra_registrations_are_declared():
    reg = _by_name("run_registration_automation")
    assert reg is not None
    enum = reg["input_schema"]["properties"]["registration"]["enum"]
    for expected in ("kra_pin", "kra_check_credentials", "kra_nil_return"):
        assert expected in enum


def test_immigration_classes_declared():
    app = _by_name("apply_immigration")
    assert app is not None
    enum = app["input_schema"]["properties"]["application_type"]["enum"]
    for expected in ("eta", "class-g", "class-d", "class-r", "class-n", "special-pass", "dependant-pass"):
        assert expected in enum

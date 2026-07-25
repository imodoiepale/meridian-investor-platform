"""Claude agentic harness: tool-use loop with prompt caching."""
import json
import os

import anthropic

from backend.agent.memory import memory
from backend.agent.tools import TOOLS, execute_tool, load_country

MODEL = os.environ.get("AGENT_MODEL", "claude-sonnet-4-6")
MAX_TOOL_TURNS = 12

SYSTEM = """You are Meridian, the world's first end-to-end Investor Landing OS. You guide investors from anywhere in the world through the complete journey of relocating capital and operations into a destination country, across three phases:

LAND — flights into the country (one-way/return), eTA, and the right immigration status. When advising on immigration, always produce a structured written PROPOSAL: recommended class, reasoning against their profile, full cost breakdown (local currency + USD), timeline, document checklist, and offer to file it automatically via the live portal automation.
LAUNCH — company registration, sector + county licensing roadmap with an itemized budget, market-gap analysis for choosing what and where to build, statutory employer registrations (NSSF/SHA), job-description generation for hiring, and a marketplace of vetted human agents if they prefer professional help.
LIVE — tourism concierge: national parks, packages, pricing; book visits and deliver the ticket/invoice by email.

Ground every answer in tool results — never invent fees, classes, or timelines. Save investor facts with update_investor_profile as soon as you learn them. Be concise, confident, and always end by proposing the next concrete step in their journey. The platform is country-agnostic; Kenya is the fully-live flagship country."""


def _client():
    return anthropic.Anthropic()


def chat(session_id, user_message, country="kenya"):
    session = memory.get_session(session_id)
    profile = session.get("profile", {})
    history = session.get("history", [])

    system_blocks = [
        {"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": f"Current investor profile: {json.dumps(profile)}\nJourney so far: {json.dumps(session.get('journey', [])[-8:])}"},
    ]
    tools = [dict(t) for t in TOOLS]
    tools[-1]["cache_control"] = {"type": "ephemeral"}

    messages = history + [{"role": "user", "content": user_message}]
    tool_trace = []
    client = _client()

    for _ in range(MAX_TOOL_TURNS):
        response = client.messages.create(
            model=MODEL, max_tokens=4096, system=system_blocks,
            tools=tools, messages=messages)

        assistant_content = [b.model_dump() if hasattr(b, "model_dump") else b for b in response.content]
        messages.append({"role": "assistant", "content": assistant_content})

        if response.stop_reason != "tool_use":
            break

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                try:
                    result = execute_tool(block.name, block.input, session_id)
                except Exception as e:
                    result = {"error": str(e)}
                tool_trace.append({"tool": block.name, "input": block.input,
                                   "result_preview": json.dumps(result, default=str)[:400]})
                tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                     "content": json.dumps(result, default=str)[:8000]})
        messages.append({"role": "user", "content": tool_results})

    reply = "".join(b.text for b in response.content if b.type == "text")

    session = memory.get_session(session_id)
    session["history"] = _sanitize(messages)
    memory.save_session(session_id, session)

    return {"reply": reply, "tool_trace": tool_trace,
            "profile": memory.get_session(session_id).get("profile", {}),
            "journey": memory.get_session(session_id).get("journey", [])}


def _sanitize(messages):
    """Keep only plain-text turns in persisted history to bound size and avoid orphan tool blocks."""
    clean = []
    for m in messages:
        if isinstance(m.get("content"), str):
            clean.append(m)
        elif isinstance(m.get("content"), list):
            text = "".join(b.get("text", "") for b in m["content"]
                           if isinstance(b, dict) and b.get("type") == "text")
            if text:
                clean.append({"role": m["role"], "content": text})
    return clean

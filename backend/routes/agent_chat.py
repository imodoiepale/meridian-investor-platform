from flask import Blueprint, request, jsonify
import uuid

agent_bp = Blueprint('agent_chat', __name__, url_prefix='/api/agent')


@agent_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({"error": "message required"}), 400
    session_id = data.get('session_id') or str(uuid.uuid4())
    country = data.get('country', 'kenya')

    from backend.agent.orchestrator import chat as agent_chat_fn
    try:
        result = agent_chat_fn(session_id, message, country=country)
        return jsonify({"session_id": session_id, **result})
    except Exception as e:
        return jsonify({"error": str(e), "session_id": session_id}), 500


@agent_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    from backend.agent.memory import memory
    return jsonify(memory.get_session(session_id))


@agent_bp.route('/tools', methods=['GET'])
def list_tools():
    from backend.agent.tools import TOOLS
    return jsonify({"tools": [{"name": t["name"], "description": t["description"]} for t in TOOLS]})


@agent_bp.route('/profile', methods=['POST'])
def save_profile():
    """Save investor profile fields directly (from ProfileWizard)."""
    data = request.json or {}
    session_id = data.get('session_id') or str(uuid.uuid4())
    # Accept either flat fields or {"profile": {...}} — flatten in either case.
    fields = data.get('profile') if isinstance(data.get('profile'), dict) else {
        k: v for k, v in data.items() if k != 'session_id'
    }
    from backend.agent.memory import memory
    profile = memory.update_profile(session_id, fields)
    memory.log_journey(session_id, {"step": "profile_updated", "fields": list(fields.keys())})
    return jsonify({"session_id": session_id, "profile": profile, "saved": True})


@agent_bp.route('/trickle-research', methods=['POST'])
def trickle_research():
    """Fire market_gap_research + build_licensing_roadmap with minimal profile (sector + country)."""
    data = request.json or {}
    session_id = data.get('session_id') or str(uuid.uuid4())
    sector = data.get('sector', '')
    country = data.get('country', 'kenya')
    county = data.get('county', 'Nairobi')

    if not sector:
        return jsonify({"error": "sector required"}), 400

    from backend.agent.tools import execute_tool
    gap = execute_tool("market_gap_research", {"sector": sector, "country": country}, session_id)
    roadmap = execute_tool("build_licensing_roadmap", {"sector": sector, "county": county, "country": country}, session_id)
    return jsonify({"session_id": session_id, "market_gaps": gap, "roadmap": roadmap})


@agent_bp.route('/applications/<session_id>', methods=['GET'])
def get_applications(session_id):
    """Return automation jobs for this session from Supabase (if enabled), else empty list."""
    from backend.agent.memory import memory
    session = memory.get_session(session_id)
    # Extract automation jobs from journey events
    jobs = [j for j in session.get("journey", [])
            if j.get("step", "").startswith(("immigration_", "registration_", "park_"))]
    return jsonify({"session_id": session_id, "applications": jobs})

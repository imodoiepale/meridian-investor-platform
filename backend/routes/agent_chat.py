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


ATTENDED_PORTALS = {
    # code:            (automations path,                 mapper key, needs eFNS login)
    'eta':             ('/api/permit/eta-kenya',           'eta',          False),
    'class-g':         ('/api/permit/class-g',             'class-g',      True),
    'class-d':         ('/api/permit/class-d',             'class-d',      True),
    'class-n':         ('/api/permit/class-n',             'class-n',      True),
    'class-r':         ('/api/permit/class-r',             'class-r',      True),
    'special-pass':    ('/api/permit/special-pass',        'special-pass', True),
    'student-pass':    ('/api/permit/student-pass',        'class-g',      True),
    'dependant-pass':  ('/api/permit/dependant-pass',      'dependant-pass', True),
    'dual-citizenship': ('/api/permit/dual-citizenship',   'class-g',      True),
    're-entry-pass':   ('/api/permit/re-entry-pass',       'class-g',      True),
}

REGISTRATION_PORTALS = {
    'brs':  '/api/brs',
    'nssf': '/api/nssf',
    'sha':  '/api/sha',
}

KRA_PORTALS = {
    'kra-credentials': '/api/kra/check-credentials',
    'kra-register':    '/api/kra/register-pin',
    'kra-nil-return':  '/api/kra/file-nil-return',
}


@agent_bp.route('/automations/catalog', methods=['GET'])
def automations_catalog():
    """Which portals the launcher can drive, and whether the runner is reachable."""
    import requests
    from backend.agent.tools import AUTOMATIONS_URL
    try:
        health = requests.get(f"{AUTOMATIONS_URL}/health", timeout=3).json()
        online, headless = True, str(health.get('env', {}).get('headless', '')).lower()
    except Exception:
        online, headless = False, 'unknown'
    return jsonify({
        "online": online,
        "browser_visible": headless == 'false',
        "automations_url": AUTOMATIONS_URL,
        "immigration": sorted(ATTENDED_PORTALS),
        "registration": sorted(REGISTRATION_PORTALS),
        "tax": sorted(KRA_PORTALS),
    })


@agent_bp.route('/automations/<portal>', methods=['POST'])
def run_automation(portal):
    """Launch one portal automation with the session profile already mapped in.

    Credentials stay on the automations service (its own .env) — the browser
    only ever sends a session_id.
    """
    import requests
    from backend.agent.memory import memory
    from backend.agent.field_map import map_profile
    from backend.agent.tools import AUTOMATIONS_URL

    data = request.json or {}
    session_id = data.get('session_id') or str(uuid.uuid4())
    profile = memory.get_session(session_id).get('profile', {})
    overrides = data.get('overrides') or {}

    if portal in ATTENDED_PORTALS:
        path, mapper_key, needs_login = ATTENDED_PORTALS[portal]
        mapped = map_profile(mapper_key, profile, overrides)
        if mapped['missing_required']:
            return jsonify({
                "error": "profile_incomplete",
                "missing_required": mapped['missing_required'],
                "message": "Complete these profile fields before filing.",
            }), 422
        payload = {"formData": mapped['formData']}
        if needs_login:
            payload['login'] = _efns_login()
            if not payload['login']:
                return jsonify({
                    "error": "efns_credentials_missing",
                    "message": "Set EFNS_EMAIL, EFNS_ID_NUMBER and EFNS_PASSWORD in automations/.env.",
                }), 503
    elif portal in REGISTRATION_PORTALS:
        path = REGISTRATION_PORTALS[portal]
        payload = {"profile": profile, **overrides}
    elif portal in KRA_PORTALS:
        path = KRA_PORTALS[portal]
        payload = {"profile": profile, "company_name": profile.get('company_name', ''), **overrides}
    else:
        return jsonify({"error": f"unknown portal '{portal}'"}), 404

    try:
        res = requests.post(f"{AUTOMATIONS_URL}{path}", json=payload, timeout=30)
        body = res.json()
    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "automations_offline",
            "message": f"Automations service unreachable at {AUTOMATIONS_URL}. Start it: node automations/server.mjs",
        }), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    if res.ok and body.get('success'):
        memory.log_journey(session_id, {"step": f"automation_{portal}", "job_id": body.get('jobId')})

    return jsonify({"session_id": session_id, "portal": portal, **body}), res.status_code


def _efns_login():
    import os
    email = os.environ.get('EFNS_EMAIL')
    id_number = os.environ.get('EFNS_ID_NUMBER')
    password = os.environ.get('EFNS_PASSWORD')
    if not (email and id_number and password):
        return None
    return {"email": email, "idNumber": id_number, "password": password}


@agent_bp.route('/applications/<session_id>', methods=['GET'])
def get_applications(session_id):
    """Return automation jobs for this session from Supabase (if enabled), else empty list."""
    from backend.agent.memory import memory
    session = memory.get_session(session_id)
    # Extract automation jobs from journey events
    jobs = [j for j in session.get("journey", [])
            if j.get("step", "").startswith(("immigration_", "registration_", "park_"))]
    return jsonify({"session_id": session_id, "applications": jobs})

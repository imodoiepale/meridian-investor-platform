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

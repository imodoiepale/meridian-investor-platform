"""Vercel serverless entrypoint — the demo-facing slice of the Flask backend.

Deliberately not backend.app.create_app(): that factory also mounts the MiroFish
simulation stack, which spawns subprocesses and writes to disk. Neither works on
a read-only serverless filesystem, and neither is used by the investor journey.

Requires MEMORY_BACKEND=supabase in production for the same reason — the default
JSON store writes to backend/data/.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

from backend.routes.agent_chat import agent_bp
from backend.routes.licences import licences_bp
from backend.routes.kenya_invest import ki_bp

app.register_blueprint(agent_bp)
app.register_blueprint(licences_bp)
app.register_blueprint(ki_bp)


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "memory_backend": os.environ.get("MEMORY_BACKEND", "json"),
        "anthropic_configured": bool(os.environ.get("ANTHROPIC_API_KEY")),
    })

"""Investor memory. Lightweight JSON store now; Graphiti drops in behind the same interface.

Graphiti seam: implement GraphitiMemoryStore(MemoryStore) using graphiti-core with a
FalkorDB/Neo4j driver — add_episode() on every profile update and chat turn, then
search() to hydrate context. Swap via MEMORY_BACKEND=graphiti env var. No caller changes.
"""
import json
import os
import threading

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_STORE_PATH = os.path.join(_DATA_DIR, "investor_profiles.json")
_lock = threading.Lock()


class MemoryStore:
    def __init__(self):
        os.makedirs(_DATA_DIR, exist_ok=True)
        if not os.path.exists(_STORE_PATH):
            self._write({})

    def _read(self):
        try:
            with open(_STORE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _write(self, data):
        with open(_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def get_session(self, session_id):
        with _lock:
            data = self._read()
            return data.get(session_id, {"profile": {}, "history": [], "journey": []})

    def save_session(self, session_id, session):
        with _lock:
            data = self._read()
            # keep history bounded
            session["history"] = session.get("history", [])[-40:]
            data[session_id] = session
            self._write(data)

    def update_profile(self, session_id, fields):
        with _lock:
            data = self._read()
            session = data.get(session_id, {"profile": {}, "history": [], "journey": []})
            session["profile"].update({k: v for k, v in fields.items() if v is not None})
            data[session_id] = session
            self._write(data)
            return session["profile"]

    def log_journey(self, session_id, event):
        with _lock:
            data = self._read()
            session = data.get(session_id, {"profile": {}, "history": [], "journey": []})
            session["journey"].append(event)
            data[session_id] = session
            self._write(data)


def get_store():
    if os.environ.get("MEMORY_BACKEND") == "graphiti":
        raise NotImplementedError("GraphitiMemoryStore: see module docstring for the drop-in seam")
    return MemoryStore()


memory = get_store()

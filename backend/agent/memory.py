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


class SupabaseMemoryStore:
    """Reads/writes investor_sessions table in Supabase. Same interface as MemoryStore."""

    def get_session(self, session_id):
        from backend.data.supabase_client import get_client
        db = get_client()
        if not db:
            return {"profile": {}, "history": [], "journey": []}
        try:
            res = db.table("investor_sessions").select("*").eq("session_id", session_id).execute()
            if res.data:
                row = res.data[0]
                return {"profile": row.get("profile", {}), "history": [], "journey": row.get("journey", [])}
        except Exception:
            pass
        return {"profile": {}, "history": [], "journey": []}

    def save_session(self, session_id, session):
        from backend.data.supabase_client import get_client
        db = get_client()
        if not db:
            return
        try:
            db.table("investor_sessions").upsert({
                "session_id": session_id,
                "profile": session.get("profile", {}),
                "journey": session.get("journey", []),
            }, on_conflict="session_id").execute()
        except Exception:
            pass

    def update_profile(self, session_id, fields):
        session = self.get_session(session_id)
        session["profile"].update({k: v for k, v in fields.items() if v is not None})
        self.save_session(session_id, session)
        return session["profile"]

    def log_journey(self, session_id, event):
        session = self.get_session(session_id)
        session["journey"].append(event)
        self.save_session(session_id, session)


def get_store():
    backend = os.environ.get("MEMORY_BACKEND", "json")
    if backend == "graphiti":
        raise NotImplementedError("GraphitiMemoryStore: see module docstring for the drop-in seam")
    if backend == "supabase":
        return SupabaseMemoryStore()
    return MemoryStore()


memory = get_store()

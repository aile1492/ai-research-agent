import uuid
from typing import Optional


# In-memory session storage
sessions: dict[str, dict] = {}


def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create a new one."""
    if session_id and session_id in sessions:
        return session_id

    new_id = str(uuid.uuid4())
    sessions[new_id] = {
        "history": [],  # past research results
    }
    return new_id


def get_session(session_id: str) -> Optional[dict]:
    return sessions.get(session_id)


def clear_session(session_id: str) -> None:
    sessions.pop(session_id, None)

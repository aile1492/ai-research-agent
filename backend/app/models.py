from pydantic import BaseModel
from typing import Optional


class ResearchRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    provider: Optional[str] = "groq"    # "groq" (free default) or "anthropic"
    api_key: Optional[str] = None       # User's own Anthropic API key


class ResearchResponse(BaseModel):
    session_id: str
    report: str
    sources: list[dict]

from pydantic import BaseModel
from typing import Optional


class ResearchRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


class ResearchResponse(BaseModel):
    session_id: str
    report: str
    sources: list[dict]

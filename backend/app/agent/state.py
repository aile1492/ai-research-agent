"""LangGraph state schema for the Research Agent."""

from typing import TypedDict, Annotated
from operator import add
import asyncio


class SubQuestion(TypedDict):
    question: str
    status: str  # "pending" | "searching" | "reading" | "done"


class SearchResult(TypedDict):
    title: str
    url: str
    snippet: str


class Source(TypedDict):
    title: str
    url: str
    content: str


class ResearchState(TypedDict):
    query: str                                  # Original user query
    sub_questions: list[SubQuestion]            # Decomposed sub-questions
    current_step: str                           # UI: "planning"|"searching"|"reading"|"analyzing"|"writing"
    current_sub_q_index: int                    # Which sub-question we're processing
    search_results: list[SearchResult]          # Current search results
    gathered_info: Annotated[list[str], add]    # Accumulated research findings (appended by reducer)
    sources: Annotated[list[dict], add]         # Collected sources (appended by reducer)
    enough_info: bool                           # Analyzer's verdict
    iteration_count: int                        # Guard against infinite loops (max 3)
    report: str                                 # Final markdown report
    error: str                                  # Error message if any
    _queue: asyncio.Queue                       # SSE event queue (not serialized)

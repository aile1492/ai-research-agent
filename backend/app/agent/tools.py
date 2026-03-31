"""Tools for the Research Agent: web search and page reading."""

import httpx
from app.config import TAVILY_API_KEY


async def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web using Tavily API.

    Returns list of {title, url, content/snippet}.
    Falls back to DuckDuckGo if Tavily key is missing.
    """
    if TAVILY_API_KEY:
        return await _tavily_search(query, max_results)
    else:
        return await _ddg_search(query, max_results)


async def _tavily_search(query: str, max_results: int) -> list[dict]:
    """Tavily API search."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "max_results": max_results,
                "include_answer": False,
            },
        )
        response.raise_for_status()
        data = response.json()

        results = []
        for r in data.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", "")[:300],
            })
        return results


async def _ddg_search(query: str, max_results: int) -> list[dict]:
    """DuckDuckGo fallback search (no API key needed)."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")[:300],
                }
                for r in raw
            ]
    except Exception:
        return []


async def read_page(url: str, max_chars: int = 4000) -> str:
    """Read a web page and return clean markdown via Jina Reader API.

    Jina Reader converts any URL to clean, LLM-friendly markdown.
    Free, no API key needed. Just prefix with r.jina.ai/
    """
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                f"https://r.jina.ai/{url}",
                headers={
                    "Accept": "text/markdown",
                    "X-Return-Format": "markdown",
                },
            )
            if response.status_code == 200:
                text = response.text[:max_chars]
                return text
            else:
                return f"[Failed to read page: HTTP {response.status_code}]"
    except Exception as e:
        return f"[Error reading page: {str(e)}]"

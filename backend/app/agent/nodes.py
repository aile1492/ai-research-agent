"""Node implementations for the Research Agent graph."""

import json
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import ANTHROPIC_API_KEY
from app.agent.tools import web_search, read_page
from app.agent.prompts import PLANNER_PROMPT, ANALYZER_PROMPT, WRITER_PROMPT


def get_llm(streaming: bool = False) -> ChatAnthropic:
    return ChatAnthropic(
        model="claude-sonnet-4-20250514",
        anthropic_api_key=ANTHROPIC_API_KEY,
        streaming=streaming,
        max_tokens=4096,
        temperature=0.3,
    )


async def planner_node(state: dict) -> dict:
    """Decompose the query into 3-5 sub-questions."""
    queue = state.get("_queue")

    if queue:
        await queue.put({
            "type": "step_start",
            "step": "planning",
            "message": "Analyzing your question and creating a research plan...",
        })

    llm = get_llm()
    response = await llm.ainvoke([
        SystemMessage(content=PLANNER_PROMPT),
        HumanMessage(content=f"Research query: {state['query']}"),
    ])

    # Parse the JSON array of sub-questions
    try:
        raw = response.content.strip()
        # Handle markdown code blocks
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        questions = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        # Fallback: use the query itself
        questions = [state["query"]]

    sub_questions = [
        {"question": q, "status": "pending"}
        for q in questions[:5]  # max 5
    ]

    if queue:
        await queue.put({
            "type": "step_data",
            "step": "planning",
            "data": {"sub_questions": [sq["question"] for sq in sub_questions]},
        })

    return {
        "sub_questions": sub_questions,
        "current_step": "planning",
        "current_sub_q_index": 0,
        "iteration_count": 0,
    }


async def searcher_node(state: dict) -> dict:
    """Search the web for the current sub-question."""
    queue = state.get("_queue")
    idx = state["current_sub_q_index"]
    sub_q = state["sub_questions"][idx]

    if queue:
        await queue.put({
            "type": "step_start",
            "step": "searching",
            "message": f"Searching: {sub_q['question']}",
            "index": idx,
        })

    results = await web_search(sub_q["question"], max_results=5)

    if queue:
        await queue.put({
            "type": "step_data",
            "step": "searching",
            "data": {
                "results": [
                    {"title": r["title"], "url": r["url"], "snippet": r["snippet"][:100]}
                    for r in results
                ],
                "count": len(results),
            },
        })

    # Update sub-question status
    sub_questions = state["sub_questions"].copy()
    sub_questions[idx] = {**sub_questions[idx], "status": "searching"}

    return {
        "search_results": results,
        "sub_questions": sub_questions,
        "current_step": "searching",
    }


async def reader_node(state: dict) -> dict:
    """Read the top 2-3 URLs from search results."""
    queue = state.get("_queue")
    results = state.get("search_results", [])
    idx = state["current_sub_q_index"]
    sub_q = state["sub_questions"][idx]

    urls_to_read = results[:3]  # top 3 results
    new_info = []
    new_sources = []

    for r in urls_to_read:
        url = r["url"]
        title = r["title"]

        if queue:
            await queue.put({
                "type": "step_start",
                "step": "reading",
                "message": f"Reading: {title}",
                "url": url,
            })

        content = await read_page(url)

        if content and not content.startswith("[Failed") and not content.startswith("[Error"):
            new_info.append(
                f"### Source: {title}\nURL: {url}\nSub-question: {sub_q['question']}\n\n{content}\n"
            )
            new_sources.append({"title": title, "url": url, "content": content[:200]})

            if queue:
                await queue.put({
                    "type": "step_data",
                    "step": "reading",
                    "data": {"url": url, "title": title, "content_preview": content[:150]},
                })

    # Update sub-question status
    sub_questions = state["sub_questions"].copy()
    sub_questions[idx] = {**sub_questions[idx], "status": "done"}

    return {
        "gathered_info": new_info,       # appended by Annotated reducer
        "sources": new_sources,          # appended by Annotated reducer
        "sub_questions": sub_questions,
        "current_step": "reading",
    }


async def analyzer_node(state: dict) -> dict:
    """Evaluate if we have enough information to write the report."""
    queue = state.get("_queue")

    if queue:
        await queue.put({
            "type": "step_start",
            "step": "analyzing",
            "message": "Evaluating gathered information...",
        })

    llm = get_llm()

    # Summarize gathered info for the prompt
    info_summary = "\n---\n".join(state.get("gathered_info", []))[:6000]
    sub_q_list = [sq["question"] for sq in state.get("sub_questions", [])]

    prompt = ANALYZER_PROMPT.format(
        gathered_info=info_summary,
        query=state["query"],
        sub_questions=json.dumps(sub_q_list),
    )

    response = await llm.ainvoke([
        HumanMessage(content=prompt),
    ])

    # Parse analyzer response
    try:
        raw = response.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        analysis = json.loads(raw)
        enough = analysis.get("enough_info", False)
        gaps = analysis.get("gaps", [])
    except (json.JSONDecodeError, IndexError):
        enough = True  # fallback: proceed to writing
        gaps = []

    iteration = state.get("iteration_count", 0) + 1

    if queue:
        await queue.put({
            "type": "step_data",
            "step": "analyzing",
            "data": {
                "enough_info": enough,
                "gaps": gaps,
                "iteration": iteration,
            },
        })

    return {
        "enough_info": enough,
        "iteration_count": iteration,
        "current_step": "analyzing",
    }


async def writer_node(state: dict) -> dict:
    """Write the final research report using gathered information."""
    queue = state.get("_queue")

    if queue:
        await queue.put({
            "type": "step_start",
            "step": "writing",
            "message": "Writing research report...",
        })

    llm = get_llm(streaming=True)

    info_text = "\n---\n".join(state.get("gathered_info", []))[:8000]
    sources_text = "\n".join(
        f"- [{s['title']}]({s['url']})" for s in state.get("sources", [])
    )

    prompt = WRITER_PROMPT.format(
        query=state["query"],
        gathered_info=info_text,
        sources=sources_text,
    )

    full_report = ""
    async for chunk in llm.astream([HumanMessage(content=prompt)]):
        token = chunk.content
        if token:
            full_report += token
            if queue:
                await queue.put({
                    "type": "chunk",
                    "content": token,
                })

    # Send done event with final report + sources
    if queue:
        await queue.put({
            "type": "done",
            "data": {
                "report": full_report,
                "sources": state.get("sources", []),
                "session_id": state.get("_session_id", ""),
            },
        })

    return {
        "report": full_report,
        "current_step": "done",
    }

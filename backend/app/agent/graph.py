"""LangGraph graph definition for the Research Agent.

Graph flow:
  START → planner → searcher → reader → analyzer → [conditional]
                                                      ├─ enough_info=True → writer → END
                                                      ├─ more sub-questions → searcher (loop)
                                                      └─ iteration>=3 → writer → END (safety)
"""

import asyncio
from langgraph.graph import StateGraph, START, END
from app.agent.state import ResearchState
from app.agent.nodes import (
    planner_node,
    searcher_node,
    reader_node,
    analyzer_node,
    writer_node,
)


def should_continue(state: dict) -> str:
    """Conditional edge after analyzer: decide next step."""
    # Safety limit: max 3 iterations
    if state.get("iteration_count", 0) >= 3:
        return "writer"

    # If analyzer says enough info, go to writer
    if state.get("enough_info", False):
        return "writer"

    # If there are more sub-questions to process
    idx = state.get("current_sub_q_index", 0)
    sub_questions = state.get("sub_questions", [])

    if idx + 1 < len(sub_questions):
        return "next_question"

    # All questions processed but not enough info → writer anyway
    return "writer"


def advance_to_next_question(state: dict) -> dict:
    """Move to the next sub-question."""
    return {
        "current_sub_q_index": state.get("current_sub_q_index", 0) + 1,
    }


def build_graph() -> StateGraph:
    """Build the research agent graph."""
    graph = StateGraph(ResearchState)

    # Add nodes
    graph.add_node("planner", planner_node)
    graph.add_node("searcher", searcher_node)
    graph.add_node("reader", reader_node)
    graph.add_node("analyzer", analyzer_node)
    graph.add_node("next_question", advance_to_next_question)
    graph.add_node("writer", writer_node)

    # Add edges
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "searcher")
    graph.add_edge("searcher", "reader")
    graph.add_edge("reader", "analyzer")

    # Conditional edge after analyzer
    graph.add_conditional_edges(
        "analyzer",
        should_continue,
        {
            "writer": "writer",
            "next_question": "next_question",
        },
    )

    # After advancing to next question, go back to searcher
    graph.add_edge("next_question", "searcher")

    # Writer is the final node
    graph.add_edge("writer", END)

    return graph


# Compile the graph once at module level
research_graph = build_graph().compile()


async def run_research_graph(query: str, session_id: str, queue: asyncio.Queue) -> dict:
    """Execute the research graph with SSE event streaming.

    Args:
        query: User's research question
        session_id: Session identifier
        queue: asyncio.Queue for pushing SSE events to the client
    """
    initial_state = {
        "query": query,
        "sub_questions": [],
        "current_step": "planning",
        "current_sub_q_index": 0,
        "search_results": [],
        "gathered_info": [],
        "sources": [],
        "enough_info": False,
        "iteration_count": 0,
        "report": "",
        "error": "",
        "_queue": queue,
        "_session_id": session_id,
    }

    # Run the graph
    final_state = await research_graph.ainvoke(initial_state)
    return final_state


# CLI test mode
if __name__ == "__main__":
    import sys

    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Compare React and Vue in 2026"

    async def test():
        queue = asyncio.Queue()

        async def print_events():
            while True:
                event = await queue.get()
                if event is None:
                    break
                print(f"[{event.get('type', '?')}] {event.get('step', '')} - {event.get('message', event.get('content', '')[:80])}")

        printer = asyncio.create_task(print_events())

        result = await run_research_graph(query, "test-session", queue)
        await queue.put(None)
        await printer

        print("\n\n=== FINAL REPORT ===\n")
        print(result.get("report", "No report generated"))

    asyncio.run(test())

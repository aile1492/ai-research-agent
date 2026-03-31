# AI Research Agent

> Autonomous research agent that plans, searches the web, reads sources, analyzes information, and writes comprehensive reports — all in real-time.

**[Live Demo](https://ai-research-agent-nine-ashy.vercel.app)** | **[GitHub](https://github.com/aile1492/ai-research-agent)**

---

## How It Works

```
User Query: "Compare React and Vue in 2026"
     |
[Planner] Decompose into 3-5 sub-questions
     |
[Searcher] Web search for each sub-question (Tavily API)
     |
[Reader] Read top URLs and extract content (Jina Reader)
     |
[Analyzer] "Do we have enough info?" — Yes/No
     |--- No → Loop back to Searcher (max 3 iterations)
     |--- Yes ↓
[Writer] Generate markdown report with citations (streaming)
```

The agent's thinking process is visualized in real-time through a step-by-step timeline UI.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS | Research dashboard UI |
| **Backend** | Python, FastAPI, Uvicorn | API server, SSE streaming |
| **AI Orchestration** | LangGraph + LangChain | Agent graph (core) |
| **LLM** | Claude Sonnet 4 (Anthropic API) | Planning, analysis, writing |
| **Web Search** | Tavily API | Real-time web search |
| **Page Reading** | Jina Reader API | URL → clean markdown |
| **Deployment** | Vercel (FE) + Render (BE) | Live demo |

---

## Architecture

### LangGraph Agent Flow

The agent uses the **Plan-and-Execute** pattern with LangGraph's `StateGraph`:

- **State**: `ResearchState` (TypedDict) — query, sub-questions, gathered info, sources, report
- **Nodes**: 5 specialized nodes (planner, searcher, reader, analyzer, writer)
- **Edges**: Conditional routing from analyzer — write if enough info, search more if not, safety limit at 3 iterations
- **Streaming**: Each node pushes events to an `asyncio.Queue`, drained as SSE by FastAPI

### SSE Event Protocol

```json
{"type": "step_start", "step": "planning", "message": "Analyzing your question..."}
{"type": "step_data",  "step": "planning", "data": {"sub_questions": [...]}}
{"type": "step_start", "step": "searching", "message": "Searching: React 2026"}
{"type": "chunk",      "content": "# Research Report\n\n## 1. "}
{"type": "done",       "data": {"report": "...", "sources": [...]}}
```

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI + SSE endpoint
│   │   ├── config.py            # Environment variables
│   │   ├── models.py            # Pydantic schemas
│   │   ├── session.py           # Session management
│   │   └── agent/
│   │       ├── state.py         # LangGraph state schema
│   │       ├── graph.py         # Graph definition (nodes + edges)
│   │       ├── nodes.py         # 5 node implementations
│   │       ├── tools.py         # web_search, read_page
│   │       └── prompts.py       # System prompts
│   ├── requirements.txt
│   └── render.yaml
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   ├── components/
│   │   │   ├── ResearchWindow   # Main layout
│   │   │   ├── QueryInput       # Research question input
│   │   │   ├── StepTimeline     # Agent steps visualization
│   │   │   └── ReportView       # Markdown report rendering
│   │   ├── hooks/useResearch    # State management hook
│   │   └── lib/                 # API client, types
│   └── package.json
└── README.md
```

---

## Key Engineering Decisions

### 1. Plan-and-Execute over ReAct

ReAct agents decide actions step-by-step, making the process unpredictable and hard to visualize. Plan-and-Execute creates a visible plan upfront, then executes it — perfect for a timeline UI that shows the agent's progress.

### 2. SSE with asyncio.Queue

Each LangGraph node pushes events to a shared `asyncio.Queue`. The FastAPI endpoint drains this queue as Server-Sent Events. This decouples the graph execution from the HTTP response, allowing real-time streaming of each step's progress.

### 3. Tavily + Jina Reader Combination

- **Tavily**: Structured search results (title, URL, snippet) optimized for AI agents
- **Jina Reader**: Converts any URL to clean markdown without parsing HTML — just prepend `r.jina.ai/` to any URL

### 4. Safety Mechanisms

- **Iteration limit**: Max 3 search-analyze loops to prevent infinite cycles
- **Retry with backoff**: Progressive retry (5s, 10s, 15s) for API overload errors (429/529)
- **DuckDuckGo fallback**: If Tavily fails, falls back to DuckDuckGo search

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Create .env
echo "ANTHROPIC_API_KEY=your-key" > .env
echo "TAVILY_API_KEY=your-key" >> .env
echo "ALLOWED_ORIGINS=http://localhost:3000" >> .env

uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
npm run dev
```

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Backend | Render (Free) | Root: `backend/`, Python runtime |
| Frontend | Vercel | Root: `frontend/`, Next.js preset |
| Monitoring | UptimeRobot | Pings `/health` every 5 min |

---

Built by [@aile1492](https://github.com/aile1492)

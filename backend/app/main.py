import json
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import ALLOWED_ORIGINS
from app.models import ResearchRequest
from app.session import get_or_create_session
from app.agent.graph import run_research_graph

app = FastAPI(title="AI Research Agent")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Research Agent"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest):
    session_id = get_or_create_session(request.session_id)

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def run():
            try:
                await run_research_graph(request.query, session_id, queue)
            except Exception as e:
                await queue.put({"type": "error", "content": str(e)})
            finally:
                await queue.put(None)  # sentinel to signal completion

        task = asyncio.create_task(run())

        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

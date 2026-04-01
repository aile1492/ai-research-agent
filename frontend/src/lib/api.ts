import type { SSEEvent, LLMSettings } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function wakeServer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(30000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function startResearch(
  query: string,
  sessionId: string | null,
  onEvent: (event: SSEEvent) => void,
  llmSettings?: LLMSettings,
): Promise<void> {
  const body: Record<string, unknown> = { query, session_id: sessionId };

  if (llmSettings) {
    body.provider = llmSettings.provider;
    if (llmSettings.apiKey) {
      body.api_key = llmSettings.apiKey;
    }
  }

  const response = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Network error" }));
    onEvent({ type: "error", content: error.detail || "Failed to start research" });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onEvent({ type: "error", content: "No response stream" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data: SSEEvent = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }
}

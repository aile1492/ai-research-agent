"use client";

import { useState, useCallback } from "react";
import { startResearch } from "@/lib/api";
import type { SSEEvent, AgentStep, Source, StepName } from "@/lib/types";

export type ResearchStatus = "idle" | "running" | "done" | "error";

export function useResearch() {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "step_start": {
        setSteps((prev) => {
          // Mark previous active steps as done
          const updated = prev.map((s) =>
            s.status === "active" && s.step !== event.step
              ? { ...s, status: "done" as const, endTime: Date.now() }
              : s
          );

          // Check if we already have an active step with same name (for repeated searches)
          const existingActive = updated.find(
            (s) => s.step === event.step && s.status === "active"
          );
          if (existingActive) {
            // Add as child/sub-step
            return updated.map((s) =>
              s === existingActive
                ? {
                    ...s,
                    message: event.message,
                    children: [
                      ...(s.children || []),
                      {
                        step: event.step,
                        message: event.message,
                        status: "active" as const,
                        startTime: Date.now(),
                      },
                    ],
                  }
                : s
            );
          }

          return [
            ...updated,
            {
              step: event.step,
              message: event.message,
              status: "active" as const,
              startTime: Date.now(),
            },
          ];
        });
        break;
      }

      case "step_data": {
        setSteps((prev) =>
          prev.map((s) =>
            s.step === event.step && s.status === "active"
              ? { ...s, data: { ...s.data, ...event.data } }
              : s
          )
        );
        break;
      }

      case "chunk": {
        setReport((prev) => prev + event.content);
        break;
      }

      case "done": {
        setSteps((prev) =>
          prev.map((s) =>
            s.status === "active"
              ? { ...s, status: "done" as const, endTime: Date.now() }
              : s
          )
        );
        if (event.data.sources) setSources(event.data.sources);
        if (event.data.session_id) setSessionId(event.data.session_id);
        setStatus("done");
        break;
      }

      case "error": {
        setError(event.content);
        setStatus("error");
        break;
      }
    }
  }, []);

  const research = useCallback(
    async (query: string) => {
      // Reset state
      setSteps([]);
      setReport("");
      setSources([]);
      setError(null);
      setStatus("running");

      try {
        await startResearch(query, sessionId, handleEvent);
      } catch {
        setError("Failed to connect to the server.");
        setStatus("error");
      }
    },
    [sessionId, handleEvent]
  );

  const reset = useCallback(() => {
    setSteps([]);
    setReport("");
    setSources([]);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    steps,
    report,
    sources,
    status,
    error,
    research,
    reset,
  };
}

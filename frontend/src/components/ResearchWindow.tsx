"use client";

import { useEffect, useState } from "react";
import { wakeServer } from "@/lib/api";
import { useResearch } from "@/hooks/useResearch";
import QueryInput from "./QueryInput";
import StepTimeline from "./StepTimeline";
import ReportView from "./ReportView";

export default function ResearchWindow() {
  const { steps, report, sources, status, error, research, reset } = useResearch();
  const [serverStatus, setServerStatus] = useState<"waking" | "ready" | "error">("waking");

  // Wake up server on mount
  useEffect(() => {
    wakeServer().then((ok) => setServerStatus(ok ? "ready" : "error"));
  }, []);

  const isRunning = status === "running";
  const isDone = status === "done";
  const showResults = isRunning || isDone || status === "error";

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Research Agent
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by Claude + LangGraph
          </p>
        </div>
        {showResults && (
          <button
            onClick={reset}
            disabled={isRunning}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            New Research
          </button>
        )}
      </header>

      {/* Server status banner */}
      {serverStatus === "waking" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-xs">
          <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shrink-0" />
          Starting server... First visit may take up to 30 seconds.
        </div>
      )}
      {serverStatus === "error" && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          Cannot connect to server. Please try again later.
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {!showResults ? (
          /* Empty state: centered query input */
          <div className="flex items-center justify-center h-full px-4">
            <QueryInput
              onSubmit={research}
              disabled={isRunning || serverStatus === "waking"}
            />
          </div>
        ) : (
          /* Results: side-by-side layout */
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left panel: Steps Timeline */}
            <div className="lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              {/* Compact query input when results are shown */}
              <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <QueryInput
                  onSubmit={research}
                  disabled={isRunning || serverStatus === "waking"}
                />
              </div>
              <StepTimeline steps={steps} />
            </div>

            {/* Right panel: Report */}
            <div className="flex-1 p-4 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <ReportView
                report={report}
                sources={sources}
                isStreaming={isRunning}
              />
              {isRunning && !report && (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Researching...</p>
                    <p className="text-xs mt-1">The agent is gathering information</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

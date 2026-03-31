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

  // Calculate elapsed time for researching state
  const elapsedDisplay = (() => {
    if (!isRunning || steps.length === 0) return null;
    const firstStart = steps[0]?.startTime;
    if (!firstStart) return null;
    const secs = Math.round((Date.now() - firstStart) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  })();

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Research Agent
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Claude + LangGraph
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && elapsedDisplay && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums hidden sm:block">
              {elapsedDisplay}
            </span>
          )}
          {showResults && (
            <button
              onClick={reset}
              disabled={isRunning}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              New Research
            </button>
          )}
        </div>
      </header>

      {/* Server status banner */}
      {serverStatus === "waking" && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-xs">
          <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shrink-0" />
          Starting server... First visit may take up to 30 seconds.
        </div>
      )}
      {serverStatus === "error" && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Cannot connect to server. Please try again later.
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {!showResults ? (
          /* Empty state: centered query input */
          <div className="flex items-center justify-center h-full px-4">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <QueryInput
                onSubmit={research}
                disabled={isRunning || serverStatus === "waking"}
              />
            </div>
          </div>
        ) : (
          /* Results: side-by-side layout */
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left panel: Steps Timeline */}
            <div className="lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-3 sm:p-4 overflow-y-auto custom-scrollbar max-h-[30vh] lg:max-h-none">
              {/* Compact query input when results are shown */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <QueryInput
                  onSubmit={research}
                  disabled={isRunning || serverStatus === "waking"}
                  compact
                />
              </div>
              <StepTimeline steps={steps} />
            </div>

            {/* Right panel: Report */}
            <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Something went wrong</p>
                    <p className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">{error}</p>
                  </div>
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
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
                      <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Researching...</p>
                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">The agent is gathering information</p>
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

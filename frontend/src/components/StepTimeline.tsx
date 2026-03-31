"use client";

import type { AgentStep, StepName } from "@/lib/types";

const STEP_ICONS: Record<StepName, string> = {
  planning: "🧠",
  searching: "🔍",
  reading: "📖",
  analyzing: "🔬",
  writing: "✍️",
};

const STEP_LABELS: Record<StepName, string> = {
  planning: "Planning",
  searching: "Web Search",
  reading: "Reading Sources",
  analyzing: "Analyzing",
  writing: "Writing Report",
};

function formatDuration(start: number, end?: number): string {
  const ms = (end || Date.now()) - start;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

interface StepTimelineProps {
  steps: AgentStep[];
}

export default function StepTimeline({ steps }: StepTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Agent Steps
      </h3>
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 transition-all duration-300 ${
            step.status === "active" ? "opacity-100" : "opacity-80"
          }`}
        >
          {/* Status indicator */}
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${
                step.status === "active"
                  ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              {step.status === "active" ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs">{STEP_ICONS[step.step]}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-px h-full min-h-[16px] mt-1 transition-colors ${
                step.status === "done" ? "bg-green-200 dark:bg-green-800/40" : "bg-gray-200 dark:bg-gray-700"
              }`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {STEP_LABELS[step.step]}
              </span>
              {step.endTime ? (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {formatDuration(step.startTime, step.endTime)}
                </span>
              ) : null}
              {step.status === "active" ? (
                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium animate-pulse">
                  In progress
                </span>
              ) : null}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {step.message}
            </p>

            {/* Step-specific data display */}
            {step.data && step.step === "planning" && step.data.sub_questions ? (
              <div className="mt-2 space-y-1">
                {(step.data.sub_questions as string[]).map((q: string, j: number) => (
                  <div
                    key={j}
                    className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-gray-700/50"
                  >
                    <span className="text-blue-500 dark:text-blue-400 font-medium mr-1.5">{j + 1}.</span>
                    {q}
                  </div>
                ))}
              </div>
            ) : null}

            {step.data && step.step === "searching" && step.data.count ? (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Found {String(step.data.count)} results
              </div>
            ) : null}

            {step.data && step.step === "reading" && step.data.title ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate">{String(step.data.title)}</span>
              </div>
            ) : null}

            {step.data && step.step === "analyzing" && step.data.enough_info !== undefined ? (
              <div className={`text-xs mt-1.5 flex items-center gap-1 ${
                step.data.enough_info
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}>
                {step.data.enough_info ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sufficient information gathered
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Need more information...
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

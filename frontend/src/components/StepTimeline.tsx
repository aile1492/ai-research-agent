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
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">
        Agent Steps
      </h3>
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Status indicator */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                step.status === "active"
                  ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400"
                  : "bg-green-100 dark:bg-green-900/40"
              }`}
            >
              {step.status === "active" ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{STEP_ICONS[step.step]}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {STEP_LABELS[step.step]}
              </span>
              {step.endTime && (
                <span className="text-xs text-gray-400">
                  {formatDuration(step.startTime, step.endTime)}
                </span>
              )}
              {step.status === "active" && (
                <span className="text-xs text-blue-500 animate-pulse">In progress...</span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {step.message}
            </p>

            {/* Step-specific data display */}
            {step.data && step.step === "planning" && step.data.sub_questions ? (
              <div className="mt-1.5 space-y-1">
                {(step.data.sub_questions as string[]).map((q: string, j: number) => (
                  <div
                    key={j}
                    className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded"
                  >
                    {j + 1}. {q}
                  </div>
                ))}
              </div>
            ) : null}

            {step.data && step.step === "searching" && step.data.count ? (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Found {String(step.data.count)} results
              </div>
            ) : null}

            {step.data && step.step === "analyzing" && step.data.enough_info !== undefined ? (
              <div className={`text-xs mt-1 ${step.data.enough_info ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                {step.data.enough_info ? "Sufficient information gathered" : "Need more information..."}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

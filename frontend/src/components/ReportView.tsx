"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/types";

interface ReportViewProps {
  report: string;
  sources: Source[];
  isStreaming: boolean;
}

export default function ReportView({ report, sources, isStreaming }: ReportViewProps) {
  if (!report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          Research Report
        </h3>
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Copy
          </button>
        )}
      </div>

      {/* Markdown content */}
      <div className="flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:text-gray-700 dark:prose-p:text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
        )}
      </div>

      {/* Sources */}
      {!isStreaming && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Sources ({sources.length})
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] shrink-0">
                  {i + 1}
                </span>
                <span className="truncate">{source.title || source.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

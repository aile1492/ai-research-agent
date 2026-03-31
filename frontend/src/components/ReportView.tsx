"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Source } from "@/lib/types";

interface ReportViewProps {
  report: string;
  sources: Source[];
  isStreaming: boolean;
}

export default function ReportView({ report, sources, isStreaming }: ReportViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [report]);

  if (!report) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            Research Report
          </h3>
        </div>
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              copied
                ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {/* Markdown content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <article className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:text-gray-800 dark:prose-headings:text-gray-100
          prose-headings:font-semibold
          prose-h1:text-xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h1:mb-4 dark:prose-h1:border-gray-700
          prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
          prose-h3:text-base prose-h3:mt-4
          prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-800 dark:prose-strong:text-gray-100
          prose-li:text-gray-700 dark:prose-li:text-gray-300
          prose-blockquote:border-blue-300 dark:prose-blockquote:border-blue-700 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:rounded-r-lg prose-blockquote:py-0.5
          prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-transparent prose-pre:p-0
          prose-table:text-sm
          prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:px-3 prose-th:py-2
          prose-td:px-3 prose-td:py-2
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {report}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-0.5 rounded-sm" />
          )}
        </article>
      </div>

      {/* Sources */}
      {!isStreaming && sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Sources ({sources.length})
          </h4>
          <div className="grid gap-2 max-h-48 overflow-y-auto custom-scrollbar">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {source.title || source.url}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
                    {new URL(source.url).hostname}
                  </span>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

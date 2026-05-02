import { useState, type ReactNode } from "react";
import { Bot, Settings, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GoldMindCopilotLayoutProps = {
  /** Shown under the "GoldMind Copilot" title in the header. */
  headerSubtitle: string;
  /** Left column: chat bubble, chips, input (built by parent). */
  leftColumn: ReactNode;
  /** Shown under "Smart Insights & Actions" on the right. */
  insightsPanelSubtitle: string;
  /** Right column: insight cards (built by parent). */
  rightColumn: ReactNode;
  className?: string;
  /** Optional: hide the “View all” control (admin uses real cards only). */
  showViewAllLink?: boolean;
};

/**
 * Shared shell: same structure as the public landing Copilot (header + 2 columns).
 * Used by `GoldMindCopilotSection` (marketing) and `AiInsightsSection` (admin, dynamic copy).
 */
export default function GoldMindCopilotLayout({
  headerSubtitle,
  leftColumn,
  insightsPanelSubtitle,
  rightColumn,
  className,
  showViewAllLink = true,
}: GoldMindCopilotLayoutProps) {
  const [autoActions, setAutoActions] = useState(true);

  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-violet-200/90 bg-white p-4 shadow-[0_20px_50px_-24px_rgba(91,33,182,0.35)] sm:p-6 lg:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-violet-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-md shadow-violet-300/40">
            <Bot className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-violet-800 sm:text-xl">GoldMind Copilot</h3>
              <Sparkles className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">{headerSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            AI Online
          </span>

          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1.5">
            <span className="text-xs font-medium text-zinc-600">Auto Actions</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoActions}
              onClick={() => setAutoActions((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
                autoActions ? "bg-emerald-500" : "bg-zinc-300",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  autoActions ? "translate-x-5" : "translate-x-0",
                )}
              />
              <span className="sr-only">Toggle auto actions</span>
            </button>
            <span className={cn("text-[10px] font-bold uppercase", autoActions ? "text-emerald-600" : "text-zinc-400")}>
              {autoActions ? "On" : "Off"}
            </span>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-violet-50 hover:text-violet-700"
            aria-label="Copilot settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col lg:col-span-4">{leftColumn}</div>

        <div className="lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-zinc-900 sm:text-lg">Smart Insights &amp; Actions</h4>
                <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{insightsPanelSubtitle}</p>
            </div>
            {showViewAllLink ? (
              <button
                type="button"
                className="inline-flex items-center gap-0.5 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {rightColumn}
        </div>
      </div>
    </div>
  );
}

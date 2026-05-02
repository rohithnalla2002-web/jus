import { useState } from "react";
import {
  Bot,
  Sparkles,
  Settings,
  Megaphone,
  Flame,
  Phone,
  Users,
  Send,
  MoreVertical,
  WandSparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InsightCard = {
  key: string;
  icon: typeof Flame;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeClass: string;
  title: string;
  body: string;
  confidence: number;
  primaryLabel: string;
  primaryClass: string;
  secondaryLabel: string;
};

const insightCards: InsightCard[] = [
  {
    key: "trending",
    icon: Flame,
    iconBg: "bg-red-50",
    iconColor: "text-[#FF4D4D]",
    badge: "High Priority",
    badgeClass: "bg-red-50 text-red-700 ring-red-200/80",
    title: "Trending Alert",
    body: "Necklace sets are moving 3× faster than last week. Consider a front-window promotion.",
    confidence: 94,
    primaryLabel: "Promote Now",
    primaryClass: "bg-violet-600 hover:bg-violet-700 text-white",
    secondaryLabel: "Snooze",
  },
  {
    key: "followups",
    icon: Phone,
    iconBg: "bg-orange-50",
    iconColor: "text-[#FFA500]",
    badge: "Attention",
    badgeClass: "bg-orange-50 text-orange-800 ring-orange-200/80",
    title: "Follow-ups Pending",
    body: "12 high-value customers have open estimates from the last 7 days.",
    confidence: 88,
    primaryLabel: "Call All",
    primaryClass: "bg-[#FFA500] hover:bg-orange-500 text-white",
    secondaryLabel: "Remind Staff",
  },
  {
    key: "staff",
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-[#00A86B]",
    badge: "Normal",
    badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    title: "Staff Recommendation",
    body: "Counter B is busiest 4–7 PM. Suggest an extra sales associate on Fridays.",
    confidence: 81,
    primaryLabel: "Assign Now",
    primaryClass: "bg-[#00A86B] hover:bg-emerald-600 text-white",
    secondaryLabel: "Dismiss",
  },
];

const quickChips = ["Show best sellers", "Customers not visited", "Low stock items"];

export default function GoldMindCopilotSection() {
  const [autoActions, setAutoActions] = useState(true);

  return (
    <div className="rounded-[1.25rem] border border-violet-200/90 bg-white p-4 shadow-[0_20px_50px_-24px_rgba(91,33,182,0.35)] sm:p-6 lg:p-8">
      {/* Header */}
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
            <p className="mt-0.5 text-sm text-zinc-500">Your AI assistant to grow your business</p>
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
        {/* Chat column */}
        <div className="flex flex-col lg:col-span-4">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <Bot className="h-4 w-4 text-violet-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800">
                <p>
                  Good morning, admin! 👋 Necklace sets are trending fast today.{" "}
                  <span className="font-semibold text-zinc-900">9 items sold</span> in the last 2 hours. Would you like
                  me to notify your team or highlight them on the display?
                </p>
                <p className="mt-3 text-xs font-medium text-zinc-400">10:30 AM</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  Notify Staff
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800 transition hover:bg-violet-50"
                >
                  <WandSparkles className="h-3.5 w-3.5 text-violet-600" />
                  Promote Display
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickChips.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-violet-200/90 bg-white px-3 py-1.5 text-left text-[11px] font-medium text-violet-900 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            <input
              type="text"
              placeholder="Ask anything..."
              readOnly
              className="min-h-[44px] flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              aria-label="Ask Copilot"
            />
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Insights column */}
        <div className="lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-zinc-900 sm:text-lg">Smart Insights &amp; Actions</h4>
                <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">AI-powered recommendations for you</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {insightCards.map((card) => (
              <article
                key={card.key}
                className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      card.iconBg,
                    )}
                  >
                    <card.icon className={cn("h-5 w-5", card.iconColor)} strokeWidth={2} />
                  </div>
                  <div className="flex flex-1 items-center justify-center px-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        card.badgeClass,
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="-mr-1 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <h5 className="mt-3 text-sm font-bold text-zinc-900">{card.title}</h5>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{card.body}</p>
                <p className="mt-2 text-xs font-semibold text-[#00A86B]">AI Confidence: {card.confidence}%</p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition",
                      card.primaryClass,
                    )}
                  >
                    {card.primaryLabel}
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    {card.secondaryLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

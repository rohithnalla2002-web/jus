import {
  Bot,
  Megaphone,
  Flame,
  Phone,
  Users,
  Send,
  MoreVertical,
  WandSparkles,
} from "lucide-react";
import GoldMindCopilotLayout from "@/components/layout/GoldMindCopilotLayout";
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

/** Landing-page marketing demo (static copy). Admin uses the same shell via `AiInsightsSection`. */
export default function GoldMindCopilotSection() {
  const leftColumn = (
    <>
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
          <Bot className="h-4 w-4 text-violet-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800">
            <p>
              Good morning, admin! 👋 Necklace sets are trending fast today.{" "}
              <span className="font-semibold text-zinc-900">9 items sold</span> in the last 2 hours. Would you like me to
              notify your team or highlight them on the display?
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
    </>
  );

  const rightColumn = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {insightCards.map((card) => (
        <article
          key={card.key}
          className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", card.iconBg)}>
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
  );

  return (
    <GoldMindCopilotLayout
      headerSubtitle="Your AI assistant to grow your business"
      insightsPanelSubtitle="AI-powered recommendations for you"
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}

import { Fragment, useCallback, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, BrainCircuit, Megaphone, MoreVertical, Send, Sparkles, WandSparkles } from "lucide-react";
import GoldMindCopilotLayout from "@/components/layout/GoldMindCopilotLayout";
import { useLocation } from "react-router-dom";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import {
  buildReachOutMessage,
  buildReachOutMessageGroup,
  escapeRegex,
  mailtoHref,
  mailtoHrefMany,
  resolvePersonContact,
  whatsappHref,
} from "@/lib/aiReachOutUtils";
import { GOLDMIND_APP_NAME } from "@/lib/company";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GmailLogoMark, WhatsAppLogoMark } from "@/components/layout/AiReachOutBrandIcons";

const reachPanel = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.02 },
  },
} as const;

const reachItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 32 },
  },
} as const;

/** Reach-out dialog action buttons: size + icon; hover overrides default outline accent. */
const reachActionBtn =
  "h-11 w-auto shrink-0 justify-start gap-3 px-4 text-base font-normal shadow-sm transition-colors [&_svg]:h-6 [&_svg]:w-6";
const reachEmailBtn =
  `${reachActionBtn} border-sky-200 bg-white/95 text-zinc-800 hover:border-sky-400/70 hover:bg-sky-100/90 hover:text-sky-950`;
const reachWhatsAppBtn =
  `${reachActionBtn} border-emerald-200 bg-white/95 text-zinc-800 hover:border-emerald-400/70 hover:bg-emerald-100/90 hover:text-emerald-950`;
const reachActionBtnMuted =
  `${reachActionBtn} border-dashed border-zinc-300 bg-zinc-50/90 text-zinc-600 opacity-85 hover:opacity-100 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900`;

const AI_INSIGHT_ENABLED_PATHS = [
  "/dashboard",
  "/inventory",
  "/sales",
  "/karigar",
  "/customers",
  "/employees",
  "/accounting",
  "/reports",
] as const;

/** Routes where KPI stat cards are rendered in the page body - insert `<AiInsightsSection />` after that row, not in AppLayout. */
export const AI_INSIGHT_AFTER_KPI_PATHS = ["/dashboard"] as const;

export function aiInsightRenderedInPageBody(pathname: string) {
  return (AI_INSIGHT_AFTER_KPI_PATHS as readonly string[]).includes(pathname);
}

const ROUTE_COPILOT_COPY: Record<
  (typeof AI_INSIGHT_ENABLED_PATHS)[number],
  { headerSubtitle: string; insightsSubtitle: string; chips: string[] }
> = {
  "/dashboard": {
    headerSubtitle: "Operational pulse for your showroom and sales floor",
    insightsSubtitle: "Suggestions grounded in today's orders, stock, and alerts",
    chips: ["Today's sales pulse", "Open notifications", "Staff focus"],
  },
  "/inventory": {
    headerSubtitle: "Stock levels, SKUs, and reorder signals",
    insightsSubtitle: "Inventory and margin signals for this workspace",
    chips: ["Low-stock SKUs", "Top sellers", "Reorder review"],
  },
  "/sales": {
    headerSubtitle: "Pipeline, billing, and delivery momentum",
    insightsSubtitle: "Sales and collections aligned to this screen",
    chips: ["Ready to deliver", "Pipeline value", "Collection calls"],
  },
  "/karigar": {
    headerSubtitle: "Job board, deadlines, and karigar capacity",
    insightsSubtitle: "Workshop flow and QC reminders",
    chips: ["Overdue jobs", "Active karigars", "Reassign work"],
  },
  "/customers": {
    headerSubtitle: "CRM, loyalty, and win-back targets",
    insightsSubtitle: "Customer touchpoints for this screen",
    chips: ["VIP list", "Low visits", "Follow-up queue"],
  },
  "/employees": {
    headerSubtitle: "Roster, leave, and counter coverage",
    insightsSubtitle: "People and capacity for this workspace",
    chips: ["On leave today", "Top performers", "Shift balance"],
  },
  "/accounting": {
    headerSubtitle: "Cashflow, billing, and receivables",
    insightsSubtitle: "Finance signals tied to open orders",
    chips: ["Invoice reminders", "Ready orders", "Week-end liquidity"],
  },
  "/reports": {
    headerSubtitle: "Executive snapshot and risk flags",
    insightsSubtitle: "Cross-module highlights for reporting",
    chips: ["Stock risk", "Active orders", "Key accounts"],
  },
};

type AiInsight = {
  title: string;
  narrative: string;
  /** Person names that appear in `narrative` as exact substrings - clickable for reach-out. */
  mentionNames: string[];
};

function uniqueMentionOrder(narrative: string, mentionNames: string[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of mentionNames) {
    const n = raw.trim();
    if (!n || seen.has(n)) continue;
    if (!narrative.includes(n)) continue;
    seen.add(n);
    ordered.push(n);
  }
  return ordered.sort((a, b) => b.length - a.length);
}

const mentionBtnOnLightCard =
  "font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 transition-colors hover:text-violet-900 hover:decoration-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2";

function InsightNarrativeWithMentions({
  narrative,
  mentionNames,
  onPick,
  mentionButtonClassName,
}: {
  narrative: string;
  mentionNames: string[];
  onPick: (name: string) => void;
  mentionButtonClassName?: string;
}) {
  const pieces = useMemo(() => {
    const unique = uniqueMentionOrder(narrative, mentionNames);
    if (!unique.length) return [{ type: "text" as const, value: narrative }];
    const re = new RegExp(`(${unique.map(escapeRegex).join("|")})`, "g");
    const out: Array<{ type: "text" | "name"; value: string }> = [];
    let last = 0;
    let m: RegExpExecArray | null;
    const copy = narrative;
    while ((m = re.exec(copy)) !== null) {
      if (m.index > last) out.push({ type: "text", value: copy.slice(last, m.index) });
      out.push({ type: "name", value: m[1] });
      last = m.index + m[1].length;
    }
    if (last < copy.length) out.push({ type: "text", value: copy.slice(last) });
    return out;
  }, [narrative, mentionNames]);

  return (
    <>
      {pieces.map((piece, i) =>
        piece.type === "text" ? (
          <Fragment key={`t-${i}`}>{piece.value}</Fragment>
        ) : (
          <button
            key={`n-${i}-${piece.value}`}
            type="button"
            onClick={() => onPick(piece.value)}
            className={cn(
              "cursor-pointer border-0 bg-transparent p-0 font-medium text-primary underline decoration-primary/35 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              mentionButtonClassName,
            )}
          >
            {piece.value}
          </button>
        ),
      )}
    </>
  );
}

type ReachPersonResolved = { name: string; email: string; phone: string };

type ReachSingleState = {
  mode: "single";
  recipientName: string;
  insightTitle: string;
  narrative: string;
  email: string;
  phone: string;
};

type ReachBulkState = {
  mode: "bulk";
  insightTitle: string;
  narrative: string;
  names: string[];
  people: ReachPersonResolved[];
};

type ReachState = ReachSingleState | ReachBulkState;

/** Route-aware AI insight strip (GoldMind AI). */
export default function AiInsightsSection() {
  const location = useLocation();
  const {
    inventory,
    salesOrders,
    karigarBoard,
    customerList,
    employeeList,
    unreadNotifications,
  } = useAppDemo();

  const activeBasePath = location.pathname;
  const enabled = (AI_INSIGHT_ENABLED_PATHS as readonly string[]).includes(activeBasePath);

  const [reachOpen, setReachOpen] = useState(false);
  const [reach, setReach] = useState<ReachState | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  const openReachOut = useCallback(
    (recipientName: string, insightTitle: string, narrative: string) => {
      const resolved = resolvePersonContact(recipientName, customerList, employeeList);
      const email = resolved?.email ?? "";
      const phone = resolved?.phone ?? "";
      setReach({
        mode: "single",
        recipientName,
        insightTitle,
        narrative,
        email,
        phone,
      });
      setMessageDraft(buildReachOutMessage(recipientName, insightTitle, narrative));
      setReachOpen(true);
    },
    [customerList, employeeList],
  );

  const openReachBulk = useCallback(
    (insight: AiInsight) => {
      const names = [...new Set(insight.mentionNames.map((n) => n.trim()).filter(Boolean))];
      if (names.length === 0) {
        toast({
          title: "No people on this card",
          description: "This suggestion does not list anyone to message together.",
        });
        return;
      }
      const people: ReachPersonResolved[] = names.map((name) => {
        const r = resolvePersonContact(name, customerList, employeeList);
        return { name, email: r?.email ?? "", phone: r?.phone ?? "" };
      });
      setReach({
        mode: "bulk",
        insightTitle: insight.title,
        narrative: insight.narrative,
        names,
        people,
      });
      setMessageDraft(buildReachOutMessageGroup(names, insight.title, insight.narrative));
      setReachOpen(true);
    },
    [customerList, employeeList],
  );

  const handleOpenChange = (open: boolean) => {
    setReachOpen(open);
    if (!open) {
      setReach(null);
      setMessageDraft("");
    }
  };

  const mailSubject = useMemo(() => (reach ? `${GOLDMIND_APP_NAME} - ${reach.insightTitle}` : ""), [reach]);

  const mailLink = useMemo(() => {
    if (!reach) return null;
    if (reach.mode === "single") {
      return reach.email ? mailtoHref(reach.email, mailSubject, messageDraft) : null;
    }
    const emails = reach.people.map((p) => p.email).filter(Boolean);
    return mailtoHrefMany(emails, mailSubject, messageDraft);
  }, [reach, mailSubject, messageDraft]);

  const waLink = useMemo(() => {
    if (!reach || reach.mode === "bulk") return null;
    return reach.phone ? whatsappHref(reach.phone, messageDraft) : null;
  }, [reach, messageDraft]);

  const aiInsights = useMemo<AiInsight[]>(() => {
    const lowStockItems = inventory.filter((item) => item.stock <= 3);
    const lowStockCount = lowStockItems.length;
    const topSellerCount = inventory.filter((item) => item.highSelling).length;
    const activeOrders = salesOrders.filter((order) => order.status !== "delivered").length;
    const readyOrders = salesOrders.filter((order) => order.status === "ready").length;
    const overdueJobs = [...karigarBoard.assigned, ...karigarBoard.inProgress].filter((job) => {
      const parsed = Date.parse(job.deadline);
      if (Number.isNaN(parsed)) return false;
      return parsed < Date.now();
    }).length;
    const pipelineRupees = salesOrders
      .filter((order) => order.status !== "delivered")
      .reduce((sum, order) => sum + parseCurrency(order.total), 0);
    const karigarInFlight = karigarBoard.assigned.length + karigarBoard.inProgress.length;
    const leaveEmployees = employeeList.filter((employee) => employee.status === "on-leave").length;
    const lowVisitCustomers = customerList.filter((customer) => customer.visits <= 2).length;
    const topCustomerNames = customerList.slice(0, 3).map((customer) => customer.name);
    const topEmployeeNames = employeeList.slice(0, 3).map((employee) => employee.name);
    const activeKarigarNames = [...karigarBoard.assigned, ...karigarBoard.inProgress]
      .map((job) => job.karigar)
      .filter((name, index, array) => Boolean(name) && array.indexOf(name) === index)
      .slice(0, 3);
    const lowStockNames = lowStockItems.slice(0, 3).map((item) => item.name);

    const namesText = (names: string[], fallback: string) => (names.length ? names.join(", ") : fallback);

    const vipPick = customerList.slice(0, 3);
    const vipMentionNames = vipPick.map((c) => c.name).filter(Boolean);
    const vipNarrative =
      vipPick.length >= 3
        ? `${vipPick[0].name}, ${vipPick[1].name}, and ${vipPick[2].name} are your top-value profiles. Call these 3 customers first today - even 1 successful revisit can unlock a high-ticket sale.`
        : vipPick.length === 2
          ? `${vipPick[0].name} and ${vipPick[1].name} are priority profiles. Call them first today - even 1 successful revisit can unlock a high-ticket sale.`
          : vipPick.length === 1
            ? `${vipPick[0].name} is a top-value profile. Reach out today to unlock follow-up opportunities.`
            : "Add customers to your CRM to get AI VIP targeting suggestions.";

    const winBackPick = customerList.filter((customer) => customer.visits <= 2).slice(0, 2);
    const winBackMentionNames = winBackPick.map((c) => c.name).filter(Boolean);
    const winBackNarrative = `${lowVisitCustomers} low-visit customers need action now. Start with ${namesText(
      winBackMentionNames,
      "your lowest-engagement customers",
    )}, then clear ${unreadNotifications} pending follow-up alerts to recover missed opportunities.`;

    const routeInsights: Record<string, AiInsight[]> = {
      "/dashboard": [
        {
          title: "AI Suggestion for You",
          narrative: `Gold necklace sets are moving fast today - ${Math.max(
            2,
            Math.min(9, readyOrders + 2),
          )} sold in a short window. Ask ${namesText(
            topEmployeeNames.slice(0, 2),
            "your top sales team",
          )} to keep them on front display and push matching earrings as upsell.`,
          mentionNames: topEmployeeNames.slice(0, 2).filter(Boolean),
        },
        {
          title: "Collection Follow-up Alert",
          narrative: `${namesText(
            topCustomerNames.slice(0, 2),
            "priority customers",
          )} have pending follow-ups; ${unreadNotifications} alerts are still open. Close these first to speed up collections.`,
          mentionNames: topCustomerNames.slice(0, 2).filter(Boolean),
        },
      ],
      "/inventory": [
        {
          title: "Reorder Alert",
          narrative:
            lowStockCount > 0
              ? `${lowStockCount} items are running low. ${lowStockItems
                  .slice(0, 2)
                  .map((item) => `${item.name} has only ${item.stock} pieces left`)
                  .join(". ")}. ${namesText(
                  topEmployeeNames.slice(0, 1),
                  "Inventory lead",
                )} should raise purchase requests today.`
              : `Inventory is stable. ${namesText(
                  topEmployeeNames.slice(0, 2),
                  "Store team",
                )} should still review reorder points for Gold and Bridal categories.`,
          mentionNames:
            lowStockCount > 0
              ? topEmployeeNames.slice(0, 1).filter(Boolean)
              : topEmployeeNames.slice(0, 2).filter(Boolean),
        },
        {
          title: "AI Profit Tip",
          narrative: `${topSellerCount} items are marked top seller, including ${namesText(
            lowStockNames.slice(0, 2),
            "your fastest movers",
          )}. Bundle one vendor PO to improve margin and refill speed.`,
          mentionNames: [],
        },
      ],
      "/sales": [
        {
          title: "Near-Close Opportunities",
          narrative: `${readyOrders} orders are ready for delivery. Ask ${namesText(
            topEmployeeNames.slice(0, 2),
            "sales executives",
          )} to call ${namesText(topCustomerNames.slice(0, 2), "priority buyers")} before noon for same-day closure.`,
          mentionNames: [...topEmployeeNames.slice(0, 2), ...topCustomerNames.slice(0, 2)].filter(Boolean),
        },
        {
          title: "Revenue in Pipeline",
          narrative: `Open pipeline is ${formatCurrency(
            pipelineRupees,
          )} across ${activeOrders} active orders. Start with ${namesText(
            topCustomerNames.slice(0, 2),
            "oldest pending customers",
          )} to avoid receivable aging.`,
          mentionNames: topCustomerNames.slice(0, 2).filter(Boolean),
        },
      ],
      "/karigar": [
        {
          title: "AI Job Alert",
          narrative: `${karigarInFlight} jobs are active with ${namesText(
            activeKarigarNames,
            "your karigar team",
          )}. Reassign 1 high-priority job today to protect delivery dates.`,
          mentionNames: activeKarigarNames.filter(Boolean),
        },
        {
          title: "Quality Watch",
          narrative:
            overdueJobs > 0
              ? `${overdueJobs} jobs are overdue. Ask ${namesText(
                  activeKarigarNames.slice(0, 2),
                  "senior karigars",
                )} to run final quality checks before dispatch.`
              : `No overdue jobs currently. Keep QC ownership with ${namesText(
                  activeKarigarNames.slice(0, 2),
                  "senior karigars",
                )} on premium custom pieces.`,
          mentionNames: activeKarigarNames.slice(0, 2).filter(Boolean),
        },
      ],
      "/customers": [
        {
          title: "VIP Retention Opportunity",
          narrative: vipNarrative,
          mentionNames: vipMentionNames,
        },
        {
          title: "Customer Win-Back Alert",
          narrative: winBackNarrative,
          mentionNames: winBackMentionNames,
        },
      ],
      "/employees": [
        {
          title: "Team Capacity Alert",
          narrative: `${leaveEmployees} team members are on leave out of ${employeeList.length}. Rebalance shifts for ${namesText(
            topEmployeeNames.slice(0, 2),
            "counter leads",
          )} to avoid peak-hour delays.`,
          mentionNames: topEmployeeNames.slice(0, 2).filter(Boolean),
        },
        {
          title: "Performance Suggestion",
          narrative: `${employeeList.length - leaveEmployees} employees are active now. Track daily sales-to-attendance ratio for ${namesText(
            topEmployeeNames,
            "active staff",
          )} to identify incentive-ready performers.`,
          mentionNames: topEmployeeNames.filter(Boolean),
        },
      ],
      "/accounting": [
        {
          title: "Cashflow Alert",
          narrative: `${formatCurrency(
            pipelineRupees,
          )} is blocked in non-delivered orders. Send invoice reminders to ${namesText(
            topCustomerNames.slice(0, 2),
            "top pending customers",
          )} first today.`,
          mentionNames: topCustomerNames.slice(0, 2).filter(Boolean),
        },
        {
          title: "Collection Priority",
          narrative: `${readyOrders} orders are ready to bill. Let ${namesText(
            topEmployeeNames.slice(0, 2),
            "billing team",
          )} close dispatch + reminders now to improve week-end liquidity.`,
          mentionNames: topEmployeeNames.slice(0, 2).filter(Boolean),
        },
      ],
      "/reports": [
        {
          title: "Executive Focus",
          narrative: `${inventory.length + salesOrders.length + customerList.length} records analyzed. Highlight ${lowStockCount} low-stock risks and ${activeOrders} active orders, with focus on ${namesText(
            topCustomerNames.slice(0, 2),
            "key customers",
          )}.`,
          mentionNames: topCustomerNames.slice(0, 2).filter(Boolean),
        },
        {
          title: "Risk Snapshot",
          narrative: `${lowStockCount} inventory risk flags and ${activeOrders} active orders detected. Assign daily review ownership to ${namesText(
            topEmployeeNames.slice(0, 2),
            "operations leads",
          )} for faster closure.`,
          mentionNames: topEmployeeNames.slice(0, 2).filter(Boolean),
        },
      ],
    };

    return routeInsights[activeBasePath] ?? routeInsights["/dashboard"];
  }, [activeBasePath, customerList, employeeList, inventory, karigarBoard, salesOrders, unreadNotifications]);

  const copilotMeta =
    ROUTE_COPILOT_COPY[activeBasePath as keyof typeof ROUTE_COPILOT_COPY] ?? ROUTE_COPILOT_COPY["/dashboard"];

  const copilotLeft = useMemo(() => {
    const timeLabel = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const lowStockItems = inventory.filter((item) => item.stock <= 3);
    const lowStockCount = lowStockItems.length;
    const readyOrders = salesOrders.filter((order) => order.status === "ready").length;
    const activeOrders = salesOrders.filter((order) => order.status !== "delivered").length;
    const overdueJobs = [...karigarBoard.assigned, ...karigarBoard.inProgress].filter((job) => {
      const parsed = Date.parse(job.deadline);
      if (Number.isNaN(parsed)) return false;
      return parsed < Date.now();
    }).length;
    const karigarInFlight = karigarBoard.assigned.length + karigarBoard.inProgress.length;
    const leaveEmployees = employeeList.filter((employee) => employee.status === "on-leave").length;
    const lowVisitCustomers = customerList.filter((customer) => customer.visits <= 2).length;
    const pipelineRupees = salesOrders
      .filter((order) => order.status !== "delivered")
      .reduce((sum, order) => sum + parseCurrency(order.total), 0);

    let bubble: ReactNode;
    switch (activeBasePath) {
      case "/inventory":
        bubble =
          lowStockCount > 0 ? (
            <p>
              <span className="font-semibold text-zinc-900">{lowStockCount} SKUs</span> are at or below low stock. Review
              cards on the right for reorder and margin hints.
            </p>
          ) : (
            <p>
              Stock levels look balanced. Use insights to prioritise top sellers and your next purchase bundle.
            </p>
          );
        break;
      case "/sales":
        bubble = (
          <p>
            <span className="font-semibold text-zinc-900">{readyOrders}</span> orders ready to deliver. Open pipeline:{" "}
            <span className="font-semibold text-zinc-900">{formatCurrency(pipelineRupees)}</span> across{" "}
            <span className="font-semibold text-zinc-900">{activeOrders}</span> active orders.
          </p>
        );
        break;
      case "/karigar":
        bubble = (
          <p>
            <span className="font-semibold text-zinc-900">{karigarInFlight}</span> jobs in motion.
            {overdueJobs > 0 ? (
              <>
                {" "}
                <span className="font-semibold text-red-700">{overdueJobs} overdue</span> - prioritise QC and dispatch.
              </>
            ) : (
              <> No overdue jobs right now. KeepQC tight on premium custom.</>
            )}
          </p>
        );
        break;
      case "/customers":
        bubble = (
          <p>
            <span className="font-semibold text-zinc-900">{lowVisitCustomers}</span> customers are low-visit. VIP and
            win-back cards on the right name who to contact first.
          </p>
        );
        break;
      case "/employees":
        bubble = (
          <p>
            <span className="font-semibold text-zinc-900">{leaveEmployees}</span> on leave out of{" "}
            <span className="font-semibold text-zinc-900">{employeeList.length}</span>. Balance counter coverage using the
            suggestions.
          </p>
        );
        break;
      case "/accounting":
        bubble = (
          <p>
            <span className="font-semibold text-zinc-900">{formatCurrency(pipelineRupees)}</span> tied up in non-delivered
            orders. <span className="font-semibold text-zinc-900">{readyOrders}</span> ready to bill - close cash gaps first.
          </p>
        );
        break;
      case "/reports":
        bubble = (
          <p>
            Cross-check <span className="font-semibold text-zinc-900">{lowStockCount}</span> stock risks and{" "}
            <span className="font-semibold text-zinc-900">{activeOrders}</span> active orders in your narrative for
            leadership.
          </p>
        );
        break;
      case "/dashboard":
      default:
        bubble = (
          <p>
            Live snapshot: <span className="font-semibold text-zinc-900">{readyOrders}</span> orders ready,{" "}
            <span className="font-semibold text-zinc-900">{unreadNotifications}</span> open alerts,{" "}
            <span className="font-semibold text-zinc-900">{activeOrders}</span> active orders in pipeline.
          </p>
        );
    }

    return (
      <>
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Bot className="h-4 w-4 text-violet-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl rounded-tl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800">
              {bubble}
              <p className="mt-3 text-xs font-medium text-zinc-400">{timeLabel}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                onClick={() =>
                  toast({
                    title: "Team ping",
                    description: "Use Notifications and Staff views to broadcast urgent tasks.",
                  })
                }
              >
                <Megaphone className="h-3.5 w-3.5" />
                Ping team
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800 transition hover:bg-violet-50"
                onClick={() =>
                  toast({
                    title: "Next best action",
                    description: "Follow the priority card on the right for this screen.",
                  })
                }
              >
                <WandSparkles className="h-3.5 w-3.5 text-violet-600" />
                Next best action
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {copilotMeta.chips.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-violet-200/90 bg-white px-3 py-1.5 text-left text-[11px] font-medium text-violet-900 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80"
              onClick={() =>
                toast({
                  title: label,
                  description: "Explore this area using the tools on this page.",
                })
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-6">
          <input
            type="text"
            placeholder="Ask Copilot (demo)"
            readOnly
            className="min-h-[44px] flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            aria-label="Ask Copilot"
          />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700"
            aria-label="Send message"
            onClick={() => toast({ title: "Copilot", description: "Full chat is coming soon. Use insight cards to act now." })}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }, [activeBasePath, copilotMeta.chips, customerList, employeeList, inventory, karigarBoard, salesOrders, unreadNotifications]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        key={location.pathname}
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="relative mb-5"
        aria-label="GoldMind Copilot suggestions"
      >
        <GoldMindCopilotLayout
          headerSubtitle={copilotMeta.headerSubtitle}
          insightsPanelSubtitle={copilotMeta.insightsSubtitle}
          showViewAllLink={false}
          leftColumn={copilotLeft}
          rightColumn={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {aiInsights.map((insight, index) => {
                const accent =
                  index === 0
                    ? { badge: "Priority", badgeClass: "bg-red-50 text-red-700 ring-red-200/80" }
                    : { badge: "Insight", badgeClass: "bg-amber-50 text-amber-900 ring-amber-200/80" };
                const confidence = 82 + index * 5;
                return (
                  <motion.article
                    key={insight.title}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
                        <BrainCircuit className="h-5 w-5 text-violet-600" strokeWidth={2} />
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                          accent.badgeClass,
                        )}
                      >
                        {accent.badge}
                      </span>
                      <button
                        type="button"
                        className="-mr-1 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <h5 className="mt-3 text-sm font-bold text-zinc-900">{insight.title}</h5>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-[13px] sm:leading-relaxed">
                      <InsightNarrativeWithMentions
                        narrative={insight.narrative}
                        mentionNames={insight.mentionNames}
                        onPick={(name) => openReachOut(name, insight.title, insight.narrative)}
                        mentionButtonClassName={mentionBtnOnLightCard}
                      />
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700">AI confidence: {confidence}%</p>
                    {insight.mentionNames.length > 0 ? (
                      <div className="mt-3 flex shrink-0 items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          AI Connects
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openReachBulk(insight)}
                            title="AI Connects - email everyone named in this suggestion"
                            className="rounded-lg border border-violet-200 bg-violet-50 p-1.5 text-left transition-colors hover:border-violet-300 hover:bg-violet-100"
                            aria-label="AI Connects: open send dialog for everyone on this card"
                          >
                            <GmailLogoMark className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReachBulk(insight)}
                            title="AI Connects - WhatsApp everyone named in this suggestion"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                            aria-label="AI Connects: open send dialog for everyone on this card"
                          >
                            <WhatsAppLogoMark className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </motion.article>
                );
              })}
            </div>
          }
        />
      </motion.div>

      <Dialog open={reachOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "max-w-[min(100vw-1.25rem,42rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-2xl",
            "[&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:bg-black/25 [&>button]:text-white [&>button]:opacity-90 [&>button]:ring-1 [&>button]:ring-white/30 [&>button]:hover:bg-black/40 [&>button]:hover:opacity-100",
          )}
        >
          <AnimatePresence mode="wait">
            {reach ? (
              <motion.div
                key={
                  reach.mode === "single"
                    ? `s-${reach.recipientName}-${reach.insightTitle}`
                    : `b-${reach.names.join("|")}-${reach.insightTitle}`
                }
                initial={{ opacity: 0, scale: 0.94, y: 22 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="relative overflow-hidden rounded-2xl shadow-[0_28px_70px_-18px_rgba(99,102,241,0.45)] ring-1 ring-white/50"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-sky-400 via-violet-500 to-teal-400"
                  aria-hidden
                />
                <motion.div
                  className="pointer-events-none absolute -right-24 -top-28 h-60 w-60 rounded-full bg-sky-200/50 blur-3xl"
                  animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.12, 1] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-fuchsia-300/45 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.05, 1, 1.05] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  aria-hidden
                />
                <motion.div
                  className="pointer-events-none absolute bottom-6 right-8 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl"
                  animate={{ opacity: [0.35, 0.55, 0.35] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  aria-hidden
                />

                <div className="relative m-[1px] overflow-hidden rounded-[15px] bg-gradient-to-br from-sky-50/95 via-violet-50/92 to-emerald-50/95 backdrop-blur-xl">
                  <motion.div
                    variants={reachPanel}
                    initial="hidden"
                    animate="show"
                    className="relative grid gap-3 px-4 pb-4 pt-4 sm:gap-3 sm:px-5 sm:pb-4 sm:pt-4"
                  >
                    <motion.div variants={reachItem} className="flex items-start gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30">
                        <Sparkles className="h-4 w-4" aria-hidden />
                      </div>
                      <DialogHeader className="space-y-0.5 text-left">
                        <DialogTitle className="bg-gradient-to-r from-violet-800 via-fuchsia-700 to-teal-700 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                          AI Connects
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-snug text-zinc-600">
                          {reach.mode === "bulk"
                            ? "Message everyone named in this suggestion. Email can include all saved addresses; WhatsApp opens one chat per person with the same text."
                            : "Edit the note if you like, then send by email or WhatsApp. Names match Customers and Employees."}
                        </DialogDescription>
                      </DialogHeader>
                    </motion.div>

                    <motion.div
                      variants={reachItem}
                      className="rounded-lg border border-violet-200/60 bg-white/75 px-3 py-2 shadow-inner shadow-violet-100/40"
                    >
                      {reach.mode === "single" ? (
                        <>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-700/90">Recipient</p>
                          <p className="mt-0.5 text-sm font-semibold text-zinc-900">{reach.recipientName}</p>
                          {!reach.email && !reach.phone ? (
                            <p className="mt-1 text-[11px] leading-snug text-violet-800/90">
                              No email or phone on file - you can still edit and copy the message below.
                            </p>
                          ) : null}
                          {reach.email ? (
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">
                              <span className="font-medium text-zinc-500">Email</span> {reach.email}
                            </p>
                          ) : null}
                          {reach.phone ? (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              <span className="font-medium text-zinc-500">Phone</span> {reach.phone}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-700/90">Recipients</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {reach.names.map((name) => (
                              <span
                                key={name}
                                className="rounded-full border border-violet-200/80 bg-violet-50/90 px-2 py-0.5 text-[11px] font-medium text-violet-950"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                            {reach.people.filter((p) => p.email).length} with email ·{" "}
                            {reach.people.filter((p) => p.phone).length} with phone (of {reach.people.length})
                          </p>
                        </>
                      )}
                    </motion.div>

                    <motion.div variants={reachItem} className="space-y-1">
                      <label htmlFor="ai-reach-message" className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                        Your message
                      </label>
                      <Textarea
                        id="ai-reach-message"
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        rows={11}
                        className="min-h-[240px] resize-y border-violet-200/70 bg-white/90 text-sm leading-relaxed shadow-sm transition-shadow focus-visible:border-violet-400 focus-visible:shadow-md focus-visible:ring-violet-400/30"
                      />
                    </motion.div>

                    <motion.div variants={reachItem} className="flex flex-col items-stretch gap-3">
                      {reach.mode === "bulk" ? (
                        <>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {mailLink ? (
                              <Button variant="outline" className={reachEmailBtn} asChild>
                                <a href={mailLink} title="One email to all addresses" className="no-underline">
                                  <GmailLogoMark className="h-6 w-6 shrink-0" />
                                  <span className="whitespace-nowrap">Email all</span>
                                </a>
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className={reachActionBtnMuted}
                                onClick={() =>
                                  toast({
                                    title: "No emails on file",
                                    description:
                                      "None of these people have a saved email in Customers or Employees. Add emails to use Email all.",
                                  })
                                }
                              >
                                <GmailLogoMark className="h-6 w-6 shrink-0 grayscale" />
                                <span className="whitespace-nowrap">Email all unavailable</span>
                              </Button>
                            )}
                          </div>
                          <div>
                            <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-emerald-800/90">
                              WhatsApp (same message, each person)
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {reach.people.map((p) => {
                                const href = p.phone ? whatsappHref(p.phone, messageDraft) : null;
                                if (href) {
                                  return (
                                    <Button key={p.name} variant="outline" className={reachWhatsAppBtn} asChild>
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`WhatsApp ${p.name}`}
                                        className="no-underline"
                                      >
                                        <WhatsAppLogoMark className="h-6 w-6 shrink-0" />
                                        <span className="max-w-[9rem] truncate whitespace-nowrap">{p.name}</span>
                                      </a>
                                    </Button>
                                  );
                                }
                                return (
                                  <Button
                                    key={p.name}
                                    type="button"
                                    variant="outline"
                                    className={`${reachActionBtnMuted} max-w-[10rem]`}
                                    onClick={() =>
                                      toast({
                                        title: "No phone for this person",
                                        description: `Add a mobile number for ${p.name} in Customers or Employees to enable WhatsApp.`,
                                      })
                                    }
                                  >
                                    <WhatsAppLogoMark className="h-6 w-6 shrink-0 grayscale" />
                                    <span className="truncate">{p.name}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {mailLink ? (
                            <Button variant="outline" className={reachEmailBtn} asChild>
                              <a href={mailLink} title="Opens your default mail app" className="no-underline">
                                <GmailLogoMark className="h-6 w-6 shrink-0" />
                                <span className="whitespace-nowrap">Email</span>
                              </a>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className={reachActionBtnMuted}
                              onClick={() =>
                                toast({
                                  title: "No email on file",
                                  description: `Add an email for ${reach.recipientName} in Customers or Employees to enable mail.`,
                                })
                              }
                            >
                              <GmailLogoMark className="h-6 w-6 shrink-0 grayscale" />
                              <span className="whitespace-nowrap">Email unavailable</span>
                            </Button>
                          )}

                          {waLink ? (
                            <Button variant="outline" className={reachWhatsAppBtn} asChild>
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Opens WhatsApp (wa.me) in a new tab"
                                className="no-underline"
                              >
                                <WhatsAppLogoMark className="h-6 w-6 shrink-0" />
                                <span className="whitespace-nowrap">WhatsApp</span>
                              </a>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className={reachActionBtnMuted}
                              onClick={() =>
                                toast({
                                  title: "No phone on file",
                                  description: `Add a mobile number for ${reach.recipientName} in Customers or Employees to enable WhatsApp.`,
                                })
                              }
                            >
                              <WhatsAppLogoMark className="h-6 w-6 shrink-0 grayscale" />
                              <span className="whitespace-nowrap">WhatsApp unavailable</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>

                    <motion.p variants={reachItem} className="-mt-0.5 text-center text-[11px] leading-snug text-zinc-500">
                      {reach.mode === "bulk" ? (
                        <>
                          <span className="font-medium">Email all</span> uses one{" "}
                          <code className="rounded bg-white/60 px-1 py-0.5 text-[10px]">mailto</code> with every address
                          we have. WhatsApp uses{" "}
                          <code className="rounded bg-white/60 px-1 py-0.5 text-[10px]">wa.me</code> per person.
                        </>
                      ) : (
                        <>
                          Email uses <code className="rounded bg-white/60 px-1 py-0.5 text-[10px]">mailto</code>.
                          WhatsApp uses the official{" "}
                          <code className="rounded bg-white/60 px-1 py-0.5 text-[10px]">wa.me</code> link.
                        </>
                      )}
                    </motion.p>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

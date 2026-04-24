import { ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import AppSidebar from "./AppSidebar";
import TopNavbar from "./TopNavbar";

type AiInsight = {
  title: string;
  narrative: string;
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const {
    dataLoading,
    dataError,
    inventory,
    salesOrders,
    karigarBoard,
    customerList,
    employeeList,
    unreadNotifications,
  } = useAppDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const location = useLocation();
  const aiEnabledPages = useMemo(
    () => ["/dashboard", "/inventory", "/sales", "/karigar", "/customers", "/employees", "/accounting", "/reports"],
    [],
  );
  const isAiEnabledPage = aiEnabledPages.includes(location.pathname);
  const activeBasePath = isAiEnabledPage ? location.pathname : "/dashboard";

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

    const routeInsights: Record<string, AiInsight[]> = {
      "/dashboard": [
        {
          title: "AI Suggestion for You",
          narrative: `Gold necklace sets are moving fast today — ${Math.max(
            2,
            Math.min(9, readyOrders + 2),
          )} sold in a short window. Ask ${namesText(
            topEmployeeNames.slice(0, 2),
            "your top sales team",
          )} to keep them on front display and push matching earrings as upsell.`,
        },
        {
          title: "Collection Follow-up Alert",
          narrative: `${namesText(
            topCustomerNames.slice(0, 2),
            "priority customers",
          )} have pending follow-ups; ${unreadNotifications} alerts are still open. Close these first to speed up collections.`,
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
        },
        {
          title: "AI Profit Tip",
          narrative: `${topSellerCount} items are marked top seller, including ${namesText(
            lowStockNames.slice(0, 2),
            "your fastest movers",
          )}. Bundle one vendor PO to improve margin and refill speed.`,
        },
      ],
      "/sales": [
        {
          title: "Near-Close Opportunities",
          narrative: `${readyOrders} orders are ready for delivery. Ask ${namesText(
            topEmployeeNames.slice(0, 2),
            "sales executives",
          )} to call ${namesText(topCustomerNames.slice(0, 2), "priority buyers")} before noon for same-day closure.`,
        },
        {
          title: "Revenue in Pipeline",
          narrative: `Open pipeline is ${formatCurrency(
            pipelineRupees,
          )} across ${activeOrders} active orders. Start with ${namesText(
            topCustomerNames.slice(0, 2),
            "oldest pending customers",
          )} to avoid receivable aging.`,
        },
      ],
      "/karigar": [
        {
          title: "AI Job Alert",
          narrative: `${karigarInFlight} jobs are active with ${namesText(
            activeKarigarNames,
            "your karigar team",
          )}. Reassign 1 high-priority job today to protect delivery dates.`,
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
        },
      ],
      "/customers": [
        {
          title: "VIP Retention Opportunity",
          narrative: `Priya Sharma, Rajesh Patel, and Amit Gupta are your top-value profiles. Call these 3 customers first today — even 1 successful revisit can unlock a high-ticket sale.`,
        },
        {
          title: "Customer Win-Back Alert",
          narrative: `${lowVisitCustomers} low-visit customers need action now. Start with Meera Iyer and Sunita Reddy, then clear ${unreadNotifications} pending follow-up alerts to recover missed opportunities.`,
        },
      ],
      "/employees": [
        {
          title: "Team Capacity Alert",
          narrative: `${leaveEmployees} team members are on leave out of ${employeeList.length}. Rebalance shifts for ${namesText(
            topEmployeeNames.slice(0, 2),
            "counter leads",
          )} to avoid peak-hour delays.`,
        },
        {
          title: "Performance Suggestion",
          narrative: `${employeeList.length - leaveEmployees} employees are active now. Track daily sales-to-attendance ratio for ${namesText(
            topEmployeeNames,
            "active staff",
          )} to identify incentive-ready performers.`,
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
        },
        {
          title: "Collection Priority",
          narrative: `${readyOrders} orders are ready to bill. Let ${namesText(
            topEmployeeNames.slice(0, 2),
            "billing team",
          )} close dispatch + reminders now to improve week-end liquidity.`,
        },
      ],
      "/reports": [
        {
          title: "Executive Focus",
          narrative: `${inventory.length + salesOrders.length + customerList.length} records analyzed. Highlight ${lowStockCount} low-stock risks and ${activeOrders} active orders, with focus on ${namesText(
            topCustomerNames.slice(0, 2),
            "key customers",
          )}.`,
        },
        {
          title: "Risk Snapshot",
          narrative: `${lowStockCount} inventory risk flags and ${activeOrders} active orders detected. Assign daily review ownership to ${namesText(
            topEmployeeNames.slice(0, 2),
            "operations leads",
          )} for faster closure.`,
        },
      ],
    };

    return routeInsights[activeBasePath] ?? routeInsights["/dashboard"];
  }, [activeBasePath, customerList, employeeList, inventory, karigarBoard, salesOrders, unreadNotifications]);

  // Close the mobile drawer after navigation.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Open AI panel whenever page changes.
  useEffect(() => {
    if (!isAiEnabledPage) {
      setAiPanelOpen(false);
      return;
    }
    setAiPanelOpen(false);
    const timer = window.setTimeout(() => setAiPanelOpen(true), 420);
    return () => window.clearTimeout(timer);
  }, [isAiEnabledPage, location.pathname]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          variant="desktop"
        />
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${collapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}>
        <TopNavbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        {dataError && (
          <div className="mx-4 sm:mx-6 mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Data API error: {dataError}. Run <code className="text-xs">npm run dev --prefix server</code> and ensure PostgreSQL is up, then refresh.
          </div>
        )}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 p-4 sm:p-6 relative"
        >
          {dataLoading && !dataError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg">
              <p className="text-sm text-muted-foreground">Loading data…</p>
            </div>
          )}
          {children}
        </motion.main>
      </div>

      {/* Floating AI assistant */}
      {isAiEnabledPage && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
          <AnimatePresence>
            {aiPanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="relative w-[min(92vw,440px)] overflow-hidden rounded-3xl border border-amber-300/70 bg-gradient-to-br from-[#fffdf5] via-[#fff9e8] to-[#fff2cc] p-4 font-sans shadow-[0_18px_50px_rgba(245,158,11,0.25)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.28),transparent_48%)]" />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 right-7 h-4 w-4 rotate-45 border-b border-r border-amber-300/70 bg-[#fff7df]"
                />
                <div className="relative mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-200 to-yellow-100 px-3 py-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">AI Suggestions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiPanelOpen(false)}
                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-amber-100 hover:text-zinc-900"
                    aria-label="Close AI suggestions"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative space-y-2.5">
                  {aiInsights.map((insight) => (
                    <div
                      key={insight.title}
                      className="rounded-2xl border border-amber-300/45 bg-white/95 p-3 shadow-[0_6px_14px_rgba(217,119,6,0.12)]"
                    >
                      <p className="text-[11px] font-semibold tracking-[0.04em] text-amber-700">{insight.title}</p>
                      <p className="mt-1.5 text-[14px] font-normal leading-6 text-zinc-800">{insight.narrative}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setAiPanelOpen((current) => !current)}
            className="group inline-flex items-center justify-center transition-transform hover:scale-105"
            aria-label="Toggle AI suggestions"
            title="AI Suggestions"
          >
            <img
              src="/ai-icon.png"
              alt="AI assistant"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300/45 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-transform group-hover:rotate-3 group-hover:shadow-[0_12px_36px_rgba(245,158,11,0.45)]"
            />
          </button>
        </div>
      )}

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-3 right-3 z-[60] p-2 rounded-lg glass hover:bg-secondary transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <AppSidebar
                collapsed={false}
                onCollapsedChange={() => {}}
                variant="mobile"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

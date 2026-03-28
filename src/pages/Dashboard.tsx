import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatShortDate, parseCurrency } from "@/lib/demo";
import { ShoppingBag, Package, Truck, CreditCard, ArrowUpRight } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";

const activityIcons: Record<string, typeof ShoppingBag> = {
  sale: ShoppingBag,
  inventory: Package,
  delivery: Truck,
  karigar: Package,
  payment: CreditCard,
};

type DashboardRange = "day" | "week" | "month" | "year" | "custom";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const parseISODate = (value: string) => new Date(`${value}T00:00:00`);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const clampNonNegative = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

const Dashboard = () => {
  const { recentActivities, globalSearch, inventory, salesOrders } = useAppDemo();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [range, setRange] = useState<DashboardRange>("month");
  const [customFrom, setCustomFrom] = useState(() => isoDate(addDays(new Date(), -10)));
  const [customTo, setCustomTo] = useState(() => isoDate(new Date()));

  const {
    dateStart,
    dateEnd,
    prevStart,
    prevEnd,
    prevPrevStart,
    prevPrevEnd,
    periodDays,
  } = useMemo(() => {
    const today = startOfDay(new Date());
    let start = today;
    let end = today;
    let days = 1;

    if (range === "day") {
      start = today;
      end = endOfDay(today);
      days = 1;
    } else if (range === "week") {
      start = addDays(today, -6);
      end = endOfDay(today);
      days = 7;
    } else if (range === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      days = Math.round((endOfDay(end).getTime() - startOfDay(start).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    } else if (range === "year") {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      days = Math.round((endOfDay(end).getTime() - startOfDay(start).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    } else if (range === "custom") {
      const from = customFrom ? parseISODate(customFrom) : addDays(today, -6);
      const to = customTo ? parseISODate(customTo) : today;
      start = startOfDay(from <= to ? from : to);
      end = endOfDay(from <= to ? to : from);
      days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    }

    const safeDays = Math.max(1, days);
    const prevStartDate = addDays(start, -safeDays);
    const prevEndDate = addDays(end, -safeDays);

    const prevPrevStartDate = addDays(start, -2 * safeDays);
    const prevPrevEndDate = addDays(end, -2 * safeDays);

    return {
      dateStart: startOfDay(start),
      dateEnd: endOfDay(end),
      prevStart: prevStartDate,
      prevEnd: prevEndDate,
      prevPrevStart: prevPrevStartDate,
      prevPrevEnd: prevPrevEndDate,
      periodDays: safeDays,
    };
  }, [range, customFrom, customTo]);

  const periodOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      if (!order.date) return false;
      const d = parseISODate(order.date);
      if (Number.isNaN(d.getTime())) return false;
      return d >= dateStart && d <= dateEnd;
    });
  }, [salesOrders, dateStart, dateEnd]);

  const prevPeriodOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      if (!order.date) return false;
      const d = parseISODate(order.date);
      if (Number.isNaN(d.getTime())) return false;
      return d >= prevStart && d <= prevEnd;
    });
  }, [salesOrders, prevStart, prevEnd]);

  const prevPrevPeriodOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      if (!order.date) return false;
      const d = parseISODate(order.date);
      if (Number.isNaN(d.getTime())) return false;
      return d >= prevPrevStart && d <= prevPrevEnd;
    });
  }, [salesOrders, prevPrevStart, prevPrevEnd]);

  const currSalesRevenue = useMemo(
    () => periodOrders.reduce((sum, order) => sum + parseCurrency(order.total), 0),
    [periodOrders],
  );
  const prevSalesRevenue = useMemo(
    () => prevPeriodOrders.reduce((sum, order) => sum + parseCurrency(order.total), 0),
    [prevPeriodOrders],
  );
  const prevPrevSalesRevenue = useMemo(
    () => prevPrevPeriodOrders.reduce((sum, order) => sum + parseCurrency(order.total), 0),
    [prevPrevPeriodOrders],
  );

  const currPendingCount = useMemo(
    () => periodOrders.filter((order) => order.status !== "delivered").length,
    [periodOrders],
  );
  const prevPendingCount = useMemo(
    () => prevPeriodOrders.filter((order) => order.status !== "delivered").length,
    [prevPeriodOrders],
  );
  const prevPrevPendingCount = useMemo(
    () => prevPrevPeriodOrders.filter((order) => order.status !== "delivered").length,
    [prevPrevPeriodOrders],
  );

  const inventoryValue = useMemo(
    () => inventory.reduce((sum, item) => sum + parseCurrency(item.price) * item.stock, 0),
    [inventory],
  );

  const salesLabel = useMemo(() => {
    if (range === "day") return "Today's Sales Revenue";
    if (range === "week") return "This Week Sales Revenue";
    if (range === "month") return "This Month Sales Revenue";
    if (range === "year") return "This Year Sales Revenue";
    return "Sales Revenue (Custom)";
  }, [range]);

  const statCards = useMemo(() => {
    const closeStocksValue = clampNonNegative(inventoryValue - currSalesRevenue);
    const openStocksValue = clampNonNegative(inventoryValue - prevSalesRevenue);

    const prevOpenStocksValue = clampNonNegative(inventoryValue - prevPrevSalesRevenue);

    const openStocksChange = prevOpenStocksValue === 0 ? 0 : ((openStocksValue - prevOpenStocksValue) / prevOpenStocksValue) * 100;
    const closeStocksChange = openStocksValue === 0 ? 0 : ((closeStocksValue - openStocksValue) / openStocksValue) * 100;

    const salesChange = prevSalesRevenue === 0 ? 0 : ((currSalesRevenue - prevSalesRevenue) / prevSalesRevenue) * 100;
    const pendingChange = prevPendingCount === 0 ? 0 : ((currPendingCount - prevPendingCount) / prevPendingCount) * 100;

    return [
      {
        label: "Open Stocks",
        value: formatCurrency(openStocksValue),
        change: formatPercent(openStocksChange),
        positive: openStocksChange >= 0,
        icon: "Package",
      },
      {
        label: "Close Stocks",
        value: formatCurrency(closeStocksValue),
        change: formatPercent(closeStocksChange),
        positive: closeStocksChange >= 0,
        icon: "Package",
      },
      {
        label: salesLabel,
        value: formatCurrency(currSalesRevenue),
        change: formatPercent(salesChange),
        positive: salesChange >= 0,
        icon: "TrendingUp",
      },
      {
        label: "Pending Orders",
        value: String(currPendingCount),
        change: formatPercent(pendingChange),
        // Lower pending orders is "good" (green), higher is "bad" (red).
        positive: pendingChange <= 0,
        icon: "Clock",
      },
    ];
  }, [
    inventoryValue,
    currSalesRevenue,
    prevSalesRevenue,
    prevPrevSalesRevenue,
    currPendingCount,
    prevSalesRevenue,
    prevPendingCount,
    prevPrevPendingCount,
    salesLabel,
  ]);

  const filteredActivities = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    return recentActivities.filter((activity) => {
      if (activity.date) {
        const d = parseISODate(activity.date);
        if (!Number.isNaN(d.getTime()) && (d < dateStart || d > dateEnd)) {
          return false;
        }
      }

      if (!query) return true;

      return (
        activity.action.toLowerCase().includes(query) ||
        activity.detail.toLowerCase().includes(query)
      );
    });
  }, [recentActivities, globalSearch, dateStart, dateEnd]);

  const visibleActivities = showAllActivities ? filteredActivities : filteredActivities.slice(0, 4);

  const topProductsForPeriod = useMemo(() => {
    const map = new Map<string, { sales: number; revenue: number }>();

    for (const order of periodOrders) {
      const total = parseCurrency(order.total);
      const parts = order.items
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length === 0) continue;

      const perPartRevenue = total / parts.length;

      for (const part of parts) {
        const current = map.get(part) ?? { sales: 0, revenue: 0 };
        map.set(part, { sales: current.sales + 1, revenue: current.revenue + perPartRevenue });
      }
    }

    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        sales: v.sales,
        revenueValue: v.revenue,
        revenue: formatCurrency(v.revenue),
      }))
      .sort((a, b) => b.revenueValue - a.revenueValue)
      .slice(0, 5);
  }, [periodOrders]);

  const chartData = useMemo(() => {
    const ordersWithDate = periodOrders
      .map((o) => {
        if (!o.date) return null;
        const d = parseISODate(o.date);
        if (Number.isNaN(d.getTime())) return null;
        return { ...o, dateObj: d };
      })
      .filter((v): v is typeof v => Boolean(v));

    const daysDiff = Math.round((dateEnd.getTime() - dateStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    const buckets: Array<{ label: string; start: Date; end: Date }> = [];

    if (range === "day") {
      buckets.push({ label: "Today", start: dateStart, end: dateEnd });
    } else if (range === "year") {
      const year = dateStart.getFullYear();
      for (let m = 0; m < 12; m += 1) {
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 0);
        buckets.push({ label: start.toLocaleString("en-US", { month: "short" }), start, end: endOfDay(end) });
      }
    } else {
      if (daysDiff <= 45) {
        for (let i = 0; i < daysDiff; i += 1) {
          const start = addDays(dateStart, i);
          buckets.push({ label: formatShortDate(start), start, end: endOfDay(start) });
        }
      } else {
        const bucketCount = Math.ceil(daysDiff / 7);
        for (let i = 0; i < bucketCount; i += 1) {
          const start = addDays(dateStart, i * 7);
          const end = addDays(start, 6);
          const cappedEnd = end > dateEnd ? dateEnd : end;
          buckets.push({ label: formatShortDate(start), start, end: endOfDay(cappedEnd) });
        }
      }
    }

    const data = buckets.map((b) => ({
      label: b.label,
      sales: 0,
      orders: 0,
    }));

    for (const order of ordersWithDate) {
      const idx = buckets.findIndex((b) => order.dateObj >= b.start && order.dateObj <= b.end);
      if (idx === -1) continue;
      data[idx].sales += parseCurrency(order.total);
      data[idx].orders += 1;
    }

    return data;
  }, [periodOrders, dateStart, dateEnd, range]);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your business overview." />

      {/* Dashboard filter */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-foreground">Filter dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              {range === "day" && "Today"}
              {range === "week" && "Last 7 Days"}
              {range === "month" && "This Month"}
              {range === "year" && "This Year"}
              {range === "custom" && "Custom Range"}
              {" · "}
              {formatShortDate(dateStart)} - {formatShortDate(dateEnd)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month", "year", "custom"] as DashboardRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  range === r
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {r === "day" && "Day"}
                {r === "week" && "Week"}
                {r === "month" && "Month"}
                {r === "year" && "Year"}
                {r === "custom" && "Custom"}
              </button>
            ))}
          </div>
        </div>

        {range === "custom" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-foreground">Recent Activity</h3>
            <button
              type="button"
              onClick={() => setShowAllActivities((current) => !current)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              {showAllActivities ? "Show less" : "View all"} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {visibleActivities.map((activity, i) => {
              const Icon = activityIcons[activity.type] || ShoppingBag;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </motion.div>
              );
            })}

            {visibleActivities.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No activity matches your current search.
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="font-serif font-semibold text-foreground mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProductsForPeriod.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">{product.revenue}</span>
              </motion.div>
            ))}
            {topProductsForPeriod.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No sales in this period.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Orders Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="font-serif font-semibold text-foreground mb-4">
            {range === "day" && "Today's Orders"}
            {range === "week" && "Orders (Last 7 Days)"}
            {range === "month" && "Orders (This Month)"}
            {range === "year" && "Orders (This Year)"}
            {range === "custom" && "Orders (Custom)"}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 85%)" />
              <XAxis dataKey="label" stroke="hsl(40, 10%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(40, 10%, 50%)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "hsl(40, 15%, 100%)", border: "1px solid hsl(40, 15%, 85%)", borderRadius: 8, color: "hsl(40, 10%, 10%)" }}
              />
              <Bar dataKey="orders" fill="hsl(43, 72%, 52%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="font-serif font-semibold text-foreground mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 72%, 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 72%, 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 85%)" />
              <XAxis dataKey="label" stroke="hsl(40, 10%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(40, 10%, 50%)" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip
                contentStyle={{ background: "hsl(40, 15%, 100%)", border: "1px solid hsl(40, 15%, 85%)", borderRadius: 8, color: "hsl(40, 10%, 10%)" }}
                formatter={(value: number) => [formatCurrency(value), "Sales"]}
              />
              <Area type="monotone" dataKey="sales" stroke="hsl(43, 72%, 52%)" fill="url(#goldGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

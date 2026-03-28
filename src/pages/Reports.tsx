import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatCurrency, parseCurrency, downloadTextFile } from "@/lib/demo";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type CategoryFilter = "all" | "gold" | "silver" | "platinum" | "diamond";
type DateRangeFilter = "day" | "week" | "month" | "year" | "custom";

const categoryColorMap: Record<string, string> = {
  Gold: "hsl(43, 72%, 52%)",
  Diamond: "hsl(217, 91%, 60%)",
  Silver: "hsl(0, 0%, 70%)",
  Platinum: "hsl(200, 30%, 60%)",
};

const Reports = () => {
  const navigate = useNavigate();
  const { salesOrders } = useAppDemo();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("month");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const exportReports = () => {
    const csv = [
      "Order ID,Date,Customer,Items,Status,Total",
      ...filteredOrders.map((order) =>
        [order.id, order.date, order.customer, order.items, order.status, parseCurrency(order.total)].join(","),
      ),
      "",
      `Revenue,${revenue}`,
      `Expenditure,${expenditure}`,
      `Profit,${profit}`,
      `Total Orders,${filteredOrders.length}`,
    ].join("\n");

    downloadTextFile("reports-export.csv", csv, "text/csv;charset=utf-8");
    toast({ title: "Reports exported", description: "Filtered report has been downloaded as CSV." });
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date(0);
    let end = new Date(8640000000000000);

    if (dateRange === "day") {
      start = current;
      end = new Date(current);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "week") {
      start = new Date(current);
      start.setDate(start.getDate() - 6);
      end = new Date(current);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateRange === "custom") {
      start = customFromDate ? new Date(`${customFromDate}T00:00:00`) : new Date(0);
      end = customToDate ? new Date(`${customToDate}T23:59:59`) : new Date(8640000000000000);
    }

    return salesOrders
      .filter((order) => {
        const itemText = order.items.toLowerCase();
        const categoryMatch =
          categoryFilter === "all" ||
          (categoryFilter === "gold" && itemText.includes("gold")) ||
          (categoryFilter === "silver" && itemText.includes("silver")) ||
          (categoryFilter === "platinum" && itemText.includes("platinum")) ||
          (categoryFilter === "diamond" && itemText.includes("diamond"));

        const orderTime = new Date(`${order.date}T00:00:00`).getTime();
        const dateMatch = orderTime >= start.getTime() && orderTime <= end.getTime();

        return categoryMatch && dateMatch;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [salesOrders, categoryFilter, dateRange, customFromDate, customToDate]);

  const revenue = useMemo(() => filteredOrders.reduce((sum, order) => sum + parseCurrency(order.total), 0), [filteredOrders]);
  const expenditure = useMemo(() => Math.round(revenue * 0.68), [revenue]);
  const profit = revenue - expenditure;

  const monthSeries = useMemo(() => {
    const map = new Map<string, { month: string; sales: number; orders: number }>();
    filteredOrders.forEach((order) => {
      const d = new Date(`${order.date}T00:00:00`);
      const key = d.toLocaleString("en-US", { month: "short" });
      const prev = map.get(key) ?? { month: key, sales: 0, orders: 0 };
      prev.sales += parseCurrency(order.total);
      prev.orders += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).slice(-6);
  }, [filteredOrders]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = { Gold: 0, Diamond: 0, Silver: 0, Platinum: 0 };
    filteredOrders.forEach((order) => {
      const txt = order.items.toLowerCase();
      if (txt.includes("gold")) counts.Gold += 1;
      if (txt.includes("diamond")) counts.Diamond += 1;
      if (txt.includes("silver")) counts.Silver += 1;
      if (txt.includes("platinum")) counts.Platinum += 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: categoryColorMap[name] ?? "hsl(var(--muted))",
    }));
  }, [filteredOrders]);

  const chartData = monthSeries.length > 0 ? monthSeries : [{ month: "No Data", sales: 0, orders: 0 }];

  const kpiCards = [
    { label: "Revenue", value: formatCurrency(revenue) },
    { label: "Expenditure", value: formatCurrency(expenditure) },
    { label: "Profit", value: formatCurrency(profit) },
    { label: "Total Orders", value: String(filteredOrders.length) },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business intelligence and insights"
        action={
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={exportReports} className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple">
            <Download className="w-4 h-4" /> Export All
          </motion.button>
        }
      />

      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: "all", label: "All" },
              { id: "gold", label: "Gold" },
              { id: "silver", label: "Silver" },
              { id: "platinum", label: "Platinum" },
              { id: "diamond", label: "Diamond" },
            ] as const).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === category.id
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
              { id: "year", label: "Year" },
              { id: "custom", label: "Custom" },
            ] as const).map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  dateRange === range.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <input
              type="date"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
            <input
              type="date"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold font-serif text-foreground mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <h3 className="font-serif font-semibold text-foreground mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="goldGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 72%, 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 72%, 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(Number(v) / 100000).toFixed(1)}L`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value), "Sales"]} />
              <Area type="monotone" dataKey="sales" stroke="hsl(43, 72%, 52%)" fill="url(#goldGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5">
          <h3 className="font-serif font-semibold text-foreground mb-4">Sales by Category</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
        <h3 className="font-serif font-semibold text-foreground mb-4">Order History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order ID", "Date", "Customer", "Items", "Status", "Total"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-primary">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{order.date}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{order.customer}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{order.items}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{order.status.replace("-", " ")}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Reports;

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { fetchAccountingMonthly } from "@/lib/api";
import { Download, FileText, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/demo";
import { downloadAccountingReportHtml } from "@/lib/accountingReportHtml";
import { toast } from "@/hooks/use-toast";

type AccountingTab = "revenue" | "ledger" | "gst";
type PeriodFilter = "all" | "last3" | "last6" | "custom";

type BaseRow = { month: string; income: number; expense: number; profit: number };

const Accounting = () => {
  const [baseRows, setBaseRows] = useState<BaseRow[]>([]);
  const [accountingError, setAccountingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AccountingTab>("revenue");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customFromMonth, setCustomFromMonth] = useState("Jan");
  const [customToMonth, setCustomToMonth] = useState("Jun");

  useEffect(() => {
    fetchAccountingMonthly()
      .then((d) => {
        const rows: BaseRow[] = d.income.map((inc, i) => ({
          month: inc.month,
          income: inc.amount,
          expense: d.expenses[i]?.amount ?? 0,
          profit: inc.amount - (d.expenses[i]?.amount ?? 0),
        }));
        setBaseRows(rows);
        if (rows.length) {
          setCustomFromMonth(rows[0].month);
          setCustomToMonth(rows[rows.length - 1].month);
        }
        setAccountingError(null);
      })
      .catch(() => setAccountingError("Could not load accounting data from the server."));
  }, []);

  const monthIndex = useMemo(
    () => Object.fromEntries(baseRows.map((row, idx) => [row.month, idx])),
    [baseRows],
  );

  const filteredRows = useMemo(() => {
    if (!baseRows.length) return [];
    if (period === "all") return baseRows;
    if (period === "last3") return baseRows.slice(-3);
    if (period === "last6") return baseRows.slice(-6);
    const from = monthIndex[customFromMonth] ?? 0;
    const to = monthIndex[customToMonth] ?? baseRows.length - 1;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    return baseRows.slice(start, end + 1);
  }, [baseRows, period, customFromMonth, customToMonth, monthIndex]);

  const totalIncome = filteredRows.reduce((s, v) => s + v.income, 0);
  const totalExpense = filteredRows.reduce((s, v) => s + v.expense, 0);
  const totalProfit = totalIncome - totalExpense;

  const gstRows = useMemo(
    () => [
      {
        type: "Gold Jewellery",
        rate: "3%",
        taxableValue: Math.round(totalIncome * 0.52),
        cgst: Math.round(totalIncome * 0.52 * 0.015),
        sgst: Math.round(totalIncome * 0.52 * 0.015),
      },
      {
        type: "Diamond Jewellery",
        rate: "3%",
        taxableValue: Math.round(totalIncome * 0.34),
        cgst: Math.round(totalIncome * 0.34 * 0.015),
        sgst: Math.round(totalIncome * 0.34 * 0.015),
      },
      {
        type: "Making Charges",
        rate: "5%",
        taxableValue: Math.round(totalIncome * 0.14),
        cgst: Math.round(totalIncome * 0.14 * 0.025),
        sgst: Math.round(totalIncome * 0.14 * 0.025),
      },
    ].map((row) => ({ ...row, totalTax: row.cgst + row.sgst })),
    [totalIncome],
  );

  const ledgerRows = useMemo(
    () =>
      filteredRows.flatMap((row) => [
        {
          date: `${row.month} 05`,
          voucherNo: `SAL-${row.month.toUpperCase()}-01`,
          account: "Sales A/c",
          debit: 0,
          credit: row.income,
          note: `${row.month} retail and custom orders`,
        },
        {
          date: `${row.month} 20`,
          voucherNo: `EXP-${row.month.toUpperCase()}-11`,
          account: "Operating Expenses A/c",
          debit: row.expense,
          credit: 0,
          note: `${row.month} payroll, rent, and utilities`,
        },
      ]),
    [filteredRows],
  );

  const profitRows = useMemo(
    () =>
      filteredRows.map((row) => ({
        month: row.month,
        income: formatCurrency(row.income),
        expense: formatCurrency(row.expense),
        profit: formatCurrency(row.profit),
      })),
    [filteredRows],
  );

  const filterLabel = period === "custom" ? `Custom (${customFromMonth}-${customToMonth})` : period;

  const handleExport = () => {
    downloadAccountingReportHtml({
      tab: activeTab,
      title: `Accounting-${activeTab}-report`,
      subtitle: "Professional export-ready finance report",
      filtersLabel: filterLabel,
      revenueRows: filteredRows,
      ledgerRows,
      gstRows,
    });
    toast({
      title: "Report exported",
      description: "Stylish print-ready HTML downloaded. Open and Print -> Save as PDF.",
    });
  };

  if (accountingError) {
    return (
      <AppLayout>
        <PageHeader title="Accounting & GST" subtitle="Revenue Analysis, General Ledger and GST Details" />
        <div className="glass rounded-xl p-6 text-muted-foreground">{accountingError}</div>
      </AppLayout>
    );
  }

  if (!baseRows.length) {
    return (
      <AppLayout>
        <PageHeader title="Accounting & GST" subtitle="Loading finance data…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading accounting data…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Accounting & GST"
        subtitle="Revenue Analysis, General Ledger and GST Details"
        action={
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple">
            <Download className="w-4 h-4" /> Export Professional Report
          </motion.button>
        }
      />

      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "revenue", label: "Revenue Analysis" },
              { id: "ledger", label: "General Ledger" },
              { id: "gst", label: "GST Details" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AccountingTab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All" },
              { id: "last3", label: "Last 3M" },
              { id: "last6", label: "Last 6M" },
              { id: "custom", label: "Custom" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPeriod(f.id as PeriodFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  period === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <select
              value={customFromMonth}
              onChange={(e) => setCustomFromMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              {baseRows.map((row) => (
                <option key={`from-${row.month}`} value={row.month}>
                  From: {row.month}
                </option>
              ))}
            </select>
            <select
              value={customToMonth}
              onChange={(e) => setCustomToMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              {baseRows.map((row) => (
                <option key={`to-${row.month}`} value={row.month}>
                  To: {row.month}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Income", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-success" },
            { label: "Total Expenses", value: formatCurrency(totalExpense), icon: TrendingDown, color: "text-destructive" },
          { label: "Net Profit", value: formatCurrency(totalProfit), icon: IndianRupee, color: "text-primary" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold font-serif text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {activeTab === "revenue" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5 mb-6">
          <h3 className="font-serif font-semibold text-foreground mb-4">Revenue Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value)]} />
              <Legend />
              <Bar dataKey="income" fill="hsl(262, 83%, 52%)" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Expense" />
              <Bar dataKey="profit" fill="hsl(142, 65%, 40%)" radius={[4, 4, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {activeTab === "ledger" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-foreground">General Ledger</h3>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {ledgerRows.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Voucher", "Account", "Debit", "Credit", "Narration"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row) => (
                  <tr key={`${row.voucherNo}-${row.account}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">{row.date}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.voucherNo}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.account}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(row.debit)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(row.credit)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "gst" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
          <h3 className="font-serif font-semibold text-foreground mb-4">GST Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Type", "Rate", "Taxable Value", "CGST", "SGST", "Total GST"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gstRows.map((row) => (
                  <tr key={row.type} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">{row.type}</td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{row.rate}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(row.taxableValue)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(row.cgst)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(row.sgst)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(row.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Monthly Snapshot</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {profitRows.map((row) => (
                <div key={row.month} className="rounded-xl bg-card/80 border border-border/60 p-3">
                  <p className="text-sm font-medium text-foreground">{row.month}</p>
                  <p className="text-xs text-muted-foreground mt-2">Income: {row.income}</p>
                  <p className="text-xs text-muted-foreground">Expense: {row.expense}</p>
                  <p className="text-xs text-primary font-medium mt-1">Profit: {row.profit}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
};

export default Accounting;

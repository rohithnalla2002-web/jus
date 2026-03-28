import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAppDemo } from "@/context/AppDemoContext";
import { downloadTextFile, formatCurrency, parseCurrency } from "@/lib/demo";
import { fetchEmployeeDetail, recordSalaryPayment, type Employee, type SalaryPayment } from "@/lib/api";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type EmployeeTab = "salary-history" | "payslips" | "pay-salary" | "work-history";

function formatMonthPeriodLabel(period: string) {
  try {
    const d = new Date(`${period}-01T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return period;
  }
}

export default function EmployeeDetails() {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const {
    updateEmployeeSalary,
    toggleEmployeeStatus,
    recentActivities,
    karigarBoard,
    salesOrders,
    dataLoading,
    refreshData,
  } = useAppDemo();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [salaryInput, setSalaryInput] = useState("");
  const [activeTab, setActiveTab] = useState<EmployeeTab>("salary-history");
  const [payAmountInput, setPayAmountInput] = useState("");
  const [payMonthInput, setPayMonthInput] = useState(() => new Date().toISOString().slice(0, 7));
  const [payMethodInput, setPayMethodInput] = useState("Bank Transfer");

  const load = useCallback(async () => {
    const id = Number(employeeId);
    if (!Number.isFinite(id)) {
      setEmployee(null);
      setPayments([]);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    try {
      const data = await fetchEmployeeDetail(id);
      setEmployee(data.employee);
      setPayments(data.payments);
    } catch {
      setEmployee(null);
      setPayments([]);
    } finally {
      setDetailLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const payslips = useMemo(
    () =>
      payments.map((p) => ({
        id: String(p.id),
        month: formatMonthPeriodLabel(p.monthPeriod),
        gross: p.amountRupees,
        deductions: Math.round(p.amountRupees * 0.08),
        net: Math.round(p.amountRupees * 0.92),
        paymentMethod: p.paymentMethod,
      })),
    [payments],
  );

  const workHistory = useMemo(() => {
    if (!employee) return [];
    const lowerName = employee.name.toLowerCase();
    return recentActivities
      .filter((activity) => activity.detail.toLowerCase().includes(lowerName) || activity.action.toLowerCase().includes("employee"))
      .slice(0, 8);
  }, [recentActivities, employee]);

  const karigarWorkItems = useMemo(() => {
    if (!employee || employee.role !== "Karigar") return [];
    const allJobs = [...karigarBoard.assigned, ...karigarBoard.inProgress, ...karigarBoard.completed];
    const myJobs = allJobs.filter((job) => job.karigar.toLowerCase() === employee.name.toLowerCase());
    return myJobs.map((job) => {
      const byCustomer = salesOrders.find((order) => order.customer.toLowerCase() === job.customerName.toLowerCase());
      const matchingOrder =
        salesOrders.find(
          (order) =>
            order.customer.toLowerCase() === job.customerName.toLowerCase() &&
            order.items.toLowerCase().includes(job.title.toLowerCase().split(" ")[0]),
        ) ?? byCustomer;

      return {
        id: job.id,
        itemMade: job.title,
        client: job.customerName,
        price:
          job.price && job.price !== "₹0" ? job.price : (matchingOrder?.total ?? "N/A"),
        itemDetails: `${job.material} · Size: ${job.size} · ${job.instructions}`,
        status: karigarBoard.completed.some((j) => j.id === job.id)
          ? "completed"
          : karigarBoard.inProgress.some((j) => j.id === job.id)
            ? "in-progress"
            : "assigned",
      };
    });
  }, [karigarBoard, salesOrders, employee]);

  const salesmanWorkItems = useMemo(() => {
    if (!employee || employee.role !== "Salesman") return [];
    const name = employee.name.toLowerCase();
    return recentActivities
      .filter(
        (a) =>
          a.type === "sale" &&
          (a.detail.toLowerCase().includes(name) || a.action.toLowerCase().includes(name)),
      )
      .slice(0, 12)
      .map((a) => ({
        id: String(a.id),
        action: a.action,
        detail: a.detail,
        time: a.time,
      }));
  }, [recentActivities, employee]);

  if (dataLoading) {
    return (
      <AppLayout>
        <PageHeader title="Employee Details" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading employee…</div>
      </AppLayout>
    );
  }

  if (detailLoading && !employee) {
    return (
      <AppLayout>
        <PageHeader title="Employee Details" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading employee…</div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <PageHeader title="Employee Details" subtitle="Employee not found" />
        <div className="glass rounded-xl p-6 text-muted-foreground">
          Employee not found. Please return to Employees page.
        </div>
      </AppLayout>
    );
  }

  const handleSalaryUpdate = async () => {
    if (!parseCurrency(salaryInput)) {
      toast({ title: "Invalid salary", description: "Please enter a valid salary amount." });
      return;
    }

    const ok = await updateEmployeeSalary(employee.id, salaryInput);
    if (!ok) {
      toast({ title: "Update failed", description: "Could not update salary." });
      return;
    }

    setSalaryInput("");
    await load();
    toast({ title: "Salary updated", description: `${employee.name}'s salary has been updated.` });
  };

  const downloadPayslip = (payslip: (typeof payslips)[number]) => {
    const content = [
      `Payslip - ${employee.name}`,
      `Month: ${payslip.month}`,
      `Role: ${employee.role}`,
      `Department: ${employee.department}`,
      `Payment method: ${payslip.paymentMethod}`,
      `Gross Salary: ${formatCurrency(payslip.gross)}`,
      `Deductions: ${formatCurrency(payslip.deductions)}`,
      `Net Pay: ${formatCurrency(payslip.net)}`,
    ].join("\n");

    downloadTextFile(
      `${employee.name.toLowerCase().replace(/\s+/g, "-")}-${payslip.month.replace(/\s+/g, "-").toLowerCase()}-payslip.txt`,
      content,
    );
    toast({ title: "Payslip downloaded", description: `${employee.name} ${payslip.month} payslip downloaded.` });
  };

  const handlePaySalary = async () => {
    const parsed = parseCurrency(payAmountInput || employee.salary);
    if (!parsed) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount." });
      return;
    }

    try {
      await recordSalaryPayment(employee.id, {
        amount: payAmountInput.trim() || String(parsed),
        monthPeriod: payMonthInput,
        paymentMethod: payMethodInput,
      });
      setPayAmountInput("");
      await load();
      await refreshData();
      toast({
        title: "Salary paid",
        description: `${employee.name} salary paid for ${payMonthInput} via ${payMethodInput}.`,
      });
    } catch {
      toast({ title: "Payment failed", description: "Could not record salary payment." });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Employee Details"
        subtitle={employee.name}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate("/employees")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Employees
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 lg:col-span-1">
          <h3 className="font-serif font-semibold text-foreground mb-4">Personal & Employment Details</h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-4 h-4 text-muted-foreground" /> {employee.role} · {employee.department}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Joined: {employee.joinDate}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" /> {employee.phone}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" /> {employee.email}
            </p>
            <p className="flex items-start gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /> {employee.address}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-5 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[
              { id: "salary-history", label: "Salary History" },
              { id: "payslips", label: "Payslips" },
              { id: "pay-salary", label: "Pay Salary" },
              { id: "work-history", label: "Work History" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as EmployeeTab)}
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

          {activeTab === "salary-history" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-xs text-muted-foreground mb-1">Current Monthly Salary (contract)</p>
                <p className="text-xl font-bold text-primary flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> {employee.salary}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Recorded payments</p>
              {payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No salary payments recorded yet. Use Pay Salary to add one.
                </div>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border/60 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatMonthPeriodLabel(p.monthPeriod)}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid · {p.paymentMethod}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{p.amount}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "payslips" && (
            <div className="space-y-3">
              {payslips.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No payslips yet. Payments appear here after you record them under Pay Salary.
                </div>
              ) : (
                payslips.map((payslip) => (
                  <div key={payslip.id} className="rounded-xl border border-border/60 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{payslip.month}</p>
                      <button
                        type="button"
                        onClick={() => downloadPayslip(payslip)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground"
                      >
                        Download
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gross: {formatCurrency(payslip.gross)} · Deductions: {formatCurrency(payslip.deductions)} · Net:{" "}
                      {formatCurrency(payslip.net)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "pay-salary" && (
            <div className="space-y-4">
              <input
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
                placeholder={`Amount (default ${employee.salary})`}
              />
              <input
                type="month"
                value={payMonthInput}
                onChange={(e) => setPayMonthInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
              />
              <select
                value={payMethodInput}
                onChange={(e) => setPayMethodInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>UPI</option>
                <option>Cheque</option>
              </select>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePaySalary}
                  className="flex-1 px-4 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-medium btn-ripple"
                >
                  Pay Salary
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await toggleEmployeeStatus(employee.id);
                      await load();
                      toast({ title: "Status updated", description: `${employee.name}'s status has been updated.` });
                    } catch {
                      toast({ title: "Update failed", description: "Could not change employee status." });
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  Mark as {employee.status === "active" ? "On Leave" : "Active"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "work-history" && (
            <div className="space-y-3">
              {employee.role === "Karigar" &&
                (karigarWorkItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    No karigar jobs assigned to this name in the database.
                  </div>
                ) : (
                  karigarWorkItems.map((job) => (
                    <div key={job.id} className="rounded-xl border border-border/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{job.itemMade}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Client: {job.client}</p>
                      <p className="text-xs text-muted-foreground mt-1">Price: {job.price}</p>
                      <p className="text-xs text-muted-foreground mt-1">Item Details: {job.itemDetails}</p>
                    </div>
                  ))
                ))}

              {employee.role === "Salesman" &&
                (salesmanWorkItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    No sale activities mention this person. Orders are not linked to sales reps in the database; only activity log
                    entries that reference this name are shown here.
                  </div>
                ) : (
                  salesmanWorkItems.map((work) => (
                    <div key={work.id} className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{work.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{work.detail}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{work.time}</p>
                    </div>
                  ))
                ))}

              {employee.role === "Admin" &&
                (workHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    No admin activity records found yet.
                  </div>
                ) : (
                  workHistory.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/60 px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  ))
                ))}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Manual Salary Revision</p>
                <div className="flex gap-3">
                  <input
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
                    placeholder="Enter new salary (e.g. 50000)"
                  />
                  <button
                    type="button"
                    onClick={handleSalaryUpdate}
                    className="px-4 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-medium btn-ripple"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}

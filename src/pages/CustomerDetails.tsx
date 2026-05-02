import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatShortDate } from "@/lib/demo";
import { karigarJobBelongsToCustomer, orderBelongsToCustomer } from "@/lib/customerPhoneLookup";
import type { KarigarBoard, KarigarJob } from "@/lib/api";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, CalendarDays, User, Hammer } from "lucide-react";

type KarigarJobWithStage = KarigarJob & { workflowStage: "assigned" | "inProgress" | "completed" };

function flattenKarigarBoard(board: KarigarBoard): KarigarJobWithStage[] {
  return [
    ...board.assigned.map((j) => ({ ...j, workflowStage: "assigned" as const })),
    ...board.inProgress.map((j) => ({ ...j, workflowStage: "inProgress" as const })),
    ...board.completed.map((j) => ({ ...j, workflowStage: "completed" as const })),
  ];
}

function karigarWorkflowLabel(stage: KarigarJobWithStage["workflowStage"]) {
  switch (stage) {
    case "assigned":
      return "Assigned";
    case "inProgress":
      return "In production";
    case "completed":
      return "Completed";
    default:
      return stage;
  }
}

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const { customerList, salesOrders, karigarBoard, dataLoading } = useAppDemo();

  const customer = useMemo(() => {
    if (!customerId) return null;
    const id = Number(customerId);
    return customerList.find((c) => c.id === id) ?? null;
  }, [customerList, customerId]);

  const customerOrders = useMemo(() => {
    if (!customer) return [];
    return salesOrders
      .filter((order) => orderBelongsToCustomer(order, customer))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [salesOrders, customer]);

  const customerKarigarJobs = useMemo(() => {
    if (!customer) return [];
    return flattenKarigarBoard(karigarBoard)
      .filter((job) => karigarJobBelongsToCustomer(job, customer))
      .sort((a, b) => b.id - a.id);
  }, [karigarBoard, customer]);

  const stats = useMemo(() => {
    const totalOrders = customerOrders.length;
    const deliveredOrders = customerOrders.filter((o) => o.status === "delivered").length;
    const pendingOrders = customerOrders.filter((o) => o.status !== "delivered").length;
    const karigarTotal = customerKarigarJobs.length;
    const karigarActive = customerKarigarJobs.filter((j) => j.workflowStage !== "completed").length;
    return { totalOrders, deliveredOrders, pendingOrders, karigarTotal, karigarActive };
  }, [customerOrders, customerKarigarJobs]);

  if (dataLoading) {
    return (
      <AppLayout>
        <PageHeader title="Customer Details" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading customer…</div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <PageHeader title="Customer Details" subtitle="Customer not found" />
        <div className="glass rounded-xl p-6 text-muted-foreground">
          Customer not found. Please return to Customers page.
        </div>
      </AppLayout>
    );
  }

  const historyEmpty = customerOrders.length === 0 && customerKarigarJobs.length === 0;

  return (
    <AppLayout>
      <PageHeader
        title="Customer Details"
        subtitle={customer.name}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate("/customers")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customers
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 lg:col-span-2">
          <h3 className="font-serif font-semibold text-foreground mb-4">Personal Details</h3>
          <div className="space-y-3">
            <p className="text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> {customer.name}
            </p>
            <p className="text-sm text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" /> {customer.phone}
            </p>
            <p className="text-sm text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> {customer.email}
            </p>
            <p className="text-sm text-foreground flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /> {customer.address ?? "Address not available"}
            </p>
            <p className="text-sm text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" /> Last Visit: {customer.lastVisit}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-xl p-5">
          <h3 className="font-serif font-semibold text-foreground mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Purchased</span>
              <span className="font-semibold text-primary">{customer.totalPurchases}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Visits</span>
              <span className="font-medium text-foreground">{customer.visits}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Direct purchases</span>
              <span className="font-medium text-foreground">{stats.totalOrders}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivered</span>
              <span className="font-medium text-foreground">{stats.deliveredOrders}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Orders in progress</span>
              <span className="font-medium text-foreground">{stats.pendingOrders}</span>
            </p>
            <p className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Karigar jobs</span>
              <span className="font-medium text-foreground">{stats.karigarTotal}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Karigar active</span>
              <span className="font-medium text-foreground">{stats.karigarActive}</span>
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-serif font-semibold text-foreground">Activity history</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Direct buys (counter / orders) and custom work assigned to karigars. Purchases are listed first by date; karigar jobs follow by
            recency.
          </p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-violet-800 dark:text-violet-200">
              <ShoppingBag className="w-3 h-3" /> Direct purchase
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-violet-800 dark:text-violet-200">
              <Hammer className="w-3 h-3" /> Karigar / custom
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Type", "Reference", "Date / due", "Details", "Status", "Amount"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((order) => (
                <tr
                  key={`order-${order.id}`}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer bg-violet-500/[0.03]"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-900 dark:text-violet-100">
                      <ShoppingBag className="w-3 h-3 shrink-0" /> Purchase
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-primary align-top">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground align-top">{formatShortDate(order.date)}</td>
                  <td className="px-4 py-3 text-sm text-foreground align-top max-w-[min(28rem,50vw)]">
                    <span className="line-clamp-2">{order.items}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize align-top whitespace-nowrap">
                    {order.status.replace(/-/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground align-top whitespace-nowrap">{order.total}</td>
                </tr>
              ))}

              {customerKarigarJobs.map((job) => (
                <tr
                  key={`karigar-${job.id}`}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer bg-violet-500/[0.04]"
                  onClick={() => navigate(`/karigar/jobs/${job.id}`)}
                >
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-900 dark:text-violet-100">
                      <Hammer className="w-3 h-3 shrink-0" /> Karigar
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-primary align-top font-mono">Job #{job.id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground align-top">{job.deadline.trim() || "—"}</td>
                  <td className="px-4 py-3 text-sm text-foreground align-top max-w-[min(28rem,50vw)]">
                    <p className="font-medium text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Karigar: {job.karigar}
                      {job.material ? ` · ${job.material}` : ""}
                      {job.size ? ` · Size: ${job.size}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm align-top whitespace-nowrap">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                      {karigarWorkflowLabel(job.workflowStage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground align-top whitespace-nowrap">
                    {job.price && job.price !== "₹0" ? job.price : "—"}
                  </td>
                </tr>
              ))}

              {historyEmpty && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No purchases or karigar jobs linked to this customer yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayout>
  );
}

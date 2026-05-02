import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatCurrency, formatShortDate, parseCurrency } from "@/lib/demo";
import { downloadInvoiceHtml } from "@/lib/invoiceHtml";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ArrowLeft, ArrowRight, FileText, Loader2, User, Phone, Mail, MapPin, Package, History } from "lucide-react";
import { fetchOrderById, normalizeOrderFromApi, type Customer, type Order } from "@/lib/api";
import { labelForPaymentMode } from "@/lib/paymentMode";
import { normCustomerKey, normalizePhoneDigits, orderBelongsToCustomer, phonesMatch } from "@/lib/customerPhoneLookup";

const orderStatusLabels: Record<string, string> = {
  ordered: "Ordered",
  "in-production": "In Production",
  ready: "Ready",
  delivered: "Delivered",
};

function displayStr(value: string | undefined | null) {
  const t = String(value ?? "").trim();
  return t.length > 0 ? t : "—";
}

type BillToCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  /** Matched row in customers table (CRM totals / visits). */
  linked: Customer | null;
};

/** Merge order contact snapshot with customers list (normalized name or phone match). */
function resolveOrderCustomer(order: Order, customerList: Customer[]): BillToCustomer {
  const nameTrim = order.customer.trim();
  const snapPhone = String(order.customerPhone ?? "").trim();
  const snapEmail = String(order.customerEmail ?? "").trim();
  const snapAddr = String(order.customerAddress ?? "").trim();

  const key = normCustomerKey(order.customer);
  const byName = customerList.find((c) => normCustomerKey(c.name) === key);
  const byPhone =
    normalizePhoneDigits(snapPhone).length >= 10
      ? customerList.find((c) => phonesMatch(snapPhone, c.phone))
      : undefined;

  const linked = byName ?? byPhone ?? null;

  return {
    name: nameTrim || linked?.name || order.customer,
    phone: snapPhone || linked?.phone || "",
    email: snapEmail || linked?.email || "",
    address: snapAddr || linked?.address || "",
    linked,
  };
}

export default function OrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { pending: advancingOrder, runExclusive } = useSubmitLock();

  const { salesOrders, advanceOrder, customerList, inventory, dataLoading } = useAppDemo();

  const orderFromList = useMemo(() => {
    if (!orderId) return null;
    return salesOrders.find((o) => o.id === orderId) ?? null;
  }, [salesOrders, orderId]);

  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setRemoteOrder(null);
      setRemoteLoaded(true);
      return;
    }
    let cancelled = false;
    setRemoteLoaded(false);
    setRemoteOrder(null);
    fetchOrderById(orderId)
      .then((raw) => {
        if (!cancelled) setRemoteOrder(normalizeOrderFromApi(raw as Order & Record<string, unknown>));
      })
      .catch(() => {
        if (!cancelled) setRemoteOrder(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const order = remoteOrder ?? orderFromList;

  const customer = useMemo(() => {
    if (!order) return null;
    return resolveOrderCustomer(order, customerList);
  }, [customerList, order]);

  const gstRate = 0.03;
  const invoicePreview = useMemo(() => {
    if (!order) {
      return {
        invoiceItems: [] as { name: string; weight: string | null; amount: number }[],
        subtotalRounded: 0,
        gstRounded: 0,
        orderTotalValue: 0,
      };
    }
    const orderTotalValue = parseCurrency(order.total);
    const subtotalValue = orderTotalValue / (1 + gstRate);
    const subtotalRounded = Math.round(subtotalValue);
    const gstRounded = orderTotalValue - subtotalRounded;

    const itemNames = order.items
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const count = Math.max(1, itemNames.length);
    const base = Math.floor(subtotalRounded / count);
    const remainder = subtotalRounded - base * count;

    const invoiceItems = itemNames.map((name, idx) => {
      const lower = name.toLowerCase();
      const keyword = lower.split(/\s+/)[0];
      const matched = inventory.find((inv) => {
        const invLower = inv.name.toLowerCase();
        return invLower.includes(keyword) || lower.includes(inv.category.toLowerCase());
      });

      const lineAmount = idx < remainder ? base + 1 : base;

      return {
        name,
        weight: matched?.weight ?? null,
        amount: lineAmount,
      };
    });

    return { invoiceItems, subtotalRounded, gstRounded, orderTotalValue };
  }, [order, inventory]);

  const customerOrders = useMemo(() => {
    if (!order) return [];
    const identity = { name: order.customer, phone: order.customerPhone ?? "" };
    const matching = salesOrders.filter((o) => orderBelongsToCustomer(o, identity));
    const ids = new Set(matching.map((o) => o.id));
    const list = ids.has(order.id) ? matching : [...matching, order];
    return list.sort((a, b) => {
      const ta = Date.parse(a.date);
      const tb = Date.parse(b.date);
      const safeA = Number.isFinite(ta) ? ta : 0;
      const safeB = Number.isFinite(tb) ? tb : 0;
      return safeB - safeA;
    });
  }, [salesOrders, order]);

  /** Purchases / visits / last visit from actual orders (same normalized name), not only the CRM row. */
  const orderHistoryStats = useMemo(() => {
    if (customerOrders.length === 0) {
      return { totalPurchases: "—", visits: "—", lastVisit: "—" };
    }
    const totalRupees = customerOrders.reduce((sum, o) => sum + parseCurrency(o.total), 0);
    let maxTs = -Infinity;
    let maxDateRaw = "";
    for (const o of customerOrders) {
      const t = Date.parse(o.date);
      if (Number.isFinite(t) && t > maxTs) {
        maxTs = t;
        maxDateRaw = o.date;
      }
    }
    const lastVisit =
      maxTs > -Infinity ? formatShortDate(maxDateRaw.slice(0, 10)) : "—";
    return {
      totalPurchases: formatCurrency(totalRupees),
      visits: String(customerOrders.length),
      lastVisit,
    };
  }, [customerOrders]);

  const downloadInvoice = (id: string) => {
    const o = salesOrders.find((item) => item.id === id) ?? (order?.id === id ? order : null);
    if (!o) return;

    const bill = resolveOrderCustomer(o, customerList);

    downloadInvoiceHtml({
      filename: o.id.toLowerCase(),
      order: o,
      customer: { name: bill.name, phone: bill.phone, email: bill.email, address: bill.address },
      inventory,
      paymentMethod: labelForPaymentMode(o.paymentMode),
    });

    toast({ title: "Invoice downloaded", description: `${o.id} invoice has been downloaded (HTML).` });
  };

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const id = order.id;
    await runExclusive(async () => {
      try {
        const next = await advanceOrder(id);

        if (!next) {
          toast({ title: "Order already completed", description: "This order is already in the delivered stage." });
          return;
        }

        toast({ title: "Order advanced", description: `${id} moved to ${orderStatusLabels[next] ?? next}.` });
        try {
          const fresh = await fetchOrderById(id);
          setRemoteOrder(normalizeOrderFromApi(fresh as Order & Record<string, unknown>));
        } catch {
          /* list refresh already updated context */
        }
      } catch {
        toast({ title: "Update failed", description: "Could not advance order. Is the API server running?" });
      }
    });
  };

  if (dataLoading) {
    return (
      <AppLayout>
        <PageHeader title="Order Details" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading order…</div>
      </AppLayout>
    );
  }

  if (!orderId) {
    return (
      <AppLayout>
        <PageHeader title="Order Details" subtitle="Missing id" />
        <div className="glass rounded-xl p-6 text-muted-foreground">No order id in the URL.</div>
      </AppLayout>
    );
  }

  const waitingRemote = !remoteLoaded && !orderFromList;
  if (waitingRemote) {
    return (
      <AppLayout>
        <PageHeader title="Order Details" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading order…</div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <PageHeader title="Order Details" subtitle="Order not found" />
        <div className="glass rounded-xl p-6 text-muted-foreground">
          We couldn’t find that order id. Please go back to the Sales page.
        </div>
      </AppLayout>
    );
  }

  const { invoiceItems, subtotalRounded, gstRounded, orderTotalValue } = invoicePreview;

  /** Distinct “sales ledger” shell: same content, warmer frame + document accents vs generic glass pages. */
  const orderShellClass =
    "rounded-2xl border border-primary/20 dark:border-primary/30 bg-gradient-to-b from-primary/[0.07] via-transparent to-muted/40 dark:from-primary/[0.12] dark:via-transparent dark:to-transparent p-4 sm:p-5 space-y-4 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.08)]";

  const docCardClass =
    "relative overflow-hidden rounded-xl border border-primary/15 dark:border-primary/25 bg-card/95 backdrop-blur-xl shadow-md ring-1 ring-primary/10";

  const sideCardClass =
    "rounded-xl border border-violet-900/10 dark:border-violet-100/10 bg-card/75 backdrop-blur-xl shadow-sm ring-1 ring-primary/5";

  return (
    <AppLayout>
      <PageHeader
        title="Order Details"
        subtitle={order.id}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate("/sales")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/25 bg-primary/5 text-foreground text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sales
          </motion.button>
        }
      />

      <div className={orderShellClass}>
        {/* Invoice-style preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`${docCardClass} p-5 pl-6 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-violet-600 dark:before:to-violet-500`}
        >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-[220px]">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bill To</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{displayStr(customer?.name ?? order.customer)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{displayStr(customer?.phone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{displayStr(customer?.email)}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-foreground">{displayStr(customer?.address)}</span>
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order Info</p>
            <div className="mt-3 space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Date: </span>
                <span className="text-sm font-medium text-foreground">{formatShortDate(order.date)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Gold Rate: </span>
                <span className="text-sm font-medium text-foreground">₹7,245/g</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Payment: </span>
                <span className="text-sm font-medium text-foreground">{labelForPaymentMode(order.paymentMode)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-border/60 bg-secondary/20">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-primary/[0.06]">
                {["Description", "Weight", "Amount"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                      h === "Amount" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.name} className="border-b border-border/50">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.weight ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col items-end text-right gap-2">
          <div className="flex w-full justify-end gap-6 text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-medium">{formatCurrency(subtotalRounded)}</span>
          </div>
          <div className="flex w-full justify-end gap-6 text-sm text-muted-foreground">
            <span>GST (3%)</span>
            <span className="text-foreground font-medium">{formatCurrency(gstRounded)}</span>
          </div>
          <div className="pt-3 w-full border-t border-primary/15 flex justify-end gap-6">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(orderTotalValue)}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`${sideCardClass} p-5`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-foreground mb-1">Order Summary</h3>
              <p className="text-xs text-muted-foreground">Placed on {formatShortDate(order.date)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-secondary/90 to-secondary/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Customer</span>
                <span className="text-sm font-medium text-foreground">{order.customer}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Items</span>
                <span className="text-sm font-medium text-foreground text-right">{order.items}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-semibold text-foreground">{order.total}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => downloadInvoice(order.id)}
                className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Download Invoice
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleAdvanceStatus()}
                disabled={order.status === "delivered" || advancingOrder}
                className="flex-1 rounded-xl gold-gradient px-4 py-3 text-sm font-medium text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {advancingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    Advance order <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className={`${sideCardClass} p-5`}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-foreground">Customer History</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Total purchases, visits, and last visit are calculated from every order that uses this same customer name.
                {!customer?.linked && " This name is not linked to a saved customer profile under Customers — contact fields above come from the order."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-secondary/90 to-secondary/50 p-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-semibold text-foreground">{displayStr(customer?.name ?? order.customer)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Total Purchases</span>
              <span className="text-sm font-medium text-foreground">{orderHistoryStats.totalPurchases}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Visits</span>
              <span className="text-sm font-medium text-foreground">{orderHistoryStats.visits}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Last Visit</span>
              <span className="text-sm font-medium text-foreground">{orderHistoryStats.lastVisit}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm font-medium text-foreground">{displayStr(customer?.phone)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{displayStr(customer?.email)}</span>
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Address</span>
              <span className="text-sm font-medium text-foreground text-right">{displayStr(customer?.address)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {customerOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders found for this customer.</div>
            ) : (
              customerOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="w-full text-left rounded-xl border border-border/50 bg-card/50 hover:border-primary/25 hover:bg-primary/[0.06] transition-colors px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatShortDate(o.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{o.total}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </AppLayout>
  );
}


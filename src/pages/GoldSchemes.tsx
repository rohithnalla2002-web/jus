import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, Plus, Gift, Loader2, X, CheckCircle2, Ban, ChevronRight, Info } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAppDemo } from "@/context/AppDemoContext";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatCurrency, parseCurrency } from "@/lib/demo";

type BenefitType = "one_month_free" | "bonus_rupees" | "making_discount_pct";

type GoldSchemeRow = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  monthlyAmount: string;
  monthlyAmountRupees: number;
  tenureMonths: number;
  benefitType: BenefitType;
  benefitBonusRupees: number;
  benefitMakingDiscountPct: number;
  startDate: string;
  status: string;
  redeemedAt: string | null;
  notes: string;
  installmentsPaid: number;
  totalPaid: string;
  expectedTotal: string;
  isComplete: boolean;
  canRedeem: boolean;
};

type PaymentLine = {
  id: number;
  installmentNo: number;
  amount: string;
  paidDate: string;
  notes: string;
};

function benefitLabel(t: BenefitType, bonus: number, pct: number): string {
  if (t === "one_month_free") return "1 month free (installment waived / credited)";
  if (t === "bonus_rupees") return `Bonus ${formatCurrency(bonus)}`;
  return `Making charges ${pct}% off`;
}

export default function GoldSchemes() {
  const { customerList } = useAppDemo();
  const [schemes, setSchemes] = useState<GoldSchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPayments, setDetailPayments] = useState<(GoldSchemeRow & { payments?: PaymentLine[] }) | null>(null);
  const [payScheme, setPayScheme] = useState<GoldSchemeRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formCustomerId, setFormCustomerId] = useState("");
  const [formMonthly, setFormMonthly] = useState("");
  const [formTenure, setFormTenure] = useState<6 | 10 | 12>(12);
  const [formBenefit, setFormBenefit] = useState<BenefitType>("one_month_free");
  const [formBonus, setFormBonus] = useState("");
  const [formMkPct, setFormMkPct] = useState("");
  const [formStart, setFormStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiGet<GoldSchemeRow[]>("/api/gold-schemes");
      setSchemes(rows);
    } catch {
      toast({ title: "Could not load schemes", description: "Is the API server running?", variant: "destructive" });
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDetail = async (id: number) => {
    setDetailId(id);
    setDetailLoading(true);
    setDetailPayments(null);
    try {
      const d = await apiGet<GoldSchemeRow & { payments?: PaymentLine[] }>(`/api/gold-schemes/${id}`);
      setDetailPayments(d);
    } catch {
      toast({ title: "Failed to load details", variant: "destructive" });
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEnroll = async () => {
    const cid = Number(formCustomerId);
    const monthly = parseCurrency(formMonthly);
    if (!cid || !monthly) {
      toast({ title: "Missing fields", description: "Choose a customer and monthly amount.", variant: "destructive" });
      return;
    }
    const bonus = parseCurrency(formBonus);
    const pct = Math.min(100, Math.max(0, Number(formMkPct) || 0));
    setSubmitting(true);
    try {
      await apiPost("/api/gold-schemes", {
        customerId: cid,
        monthlyAmount: formMonthly,
        tenureMonths: formTenure,
        benefitType: formBenefit,
        benefitBonusRupees: bonus,
        benefitMakingDiscountPct: Math.round(pct),
        startDate: formStart,
        notes: formNotes.trim(),
      });
      toast({ title: "Scheme enrolled" });
      setEnrollOpen(false);
      setFormCustomerId("");
      setFormMonthly("");
      setFormTenure(12);
      setFormBenefit("one_month_free");
      setFormBonus("");
      setFormMkPct("");
      setFormNotes("");
      await refresh();
    } catch (e) {
      toast({
        title: "Could not enroll",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!payScheme) return;
    const schemeId = payScheme.id;
    const amt = payAmount.trim() ? parseCurrency(payAmount) : payScheme.monthlyAmountRupees;
    if (!amt) {
      toast({ title: "Enter amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/api/gold-schemes/${schemeId}/payments`, {
        amount: payAmount.trim() ? payAmount : undefined,
        paidDate: payDate,
      });
      toast({ title: "Payment recorded" });
      setPayScheme(null);
      setPayAmount("");
      setPayDate(new Date().toISOString().slice(0, 10));
      await refresh();
      if (detailId === schemeId) void openDetail(schemeId);
    } catch (e) {
      toast({
        title: "Payment failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async (s: GoldSchemeRow) => {
    setSubmitting(true);
    try {
      await apiPatch(`/api/gold-schemes/${s.id}/redeem`, {});
      toast({ title: "Marked redeemed", description: "Customer can use benefits on jewellery purchase." });
      await refresh();
      setDetailId(null);
      setDetailPayments(null);
    } catch (e) {
      toast({
        title: "Could not redeem",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (s: GoldSchemeRow) => {
    setSubmitting(true);
    try {
      await apiPatch(`/api/gold-schemes/${s.id}/cancel`, {});
      toast({ title: "Scheme cancelled" });
      await refresh();
    } catch {
      toast({ title: "Could not cancel", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const active = schemes.filter((x) => x.status === "active").length;
    const redeemed = schemes.filter((x) => x.status === "redeemed").length;
    return { active, redeemed, total: schemes.length };
  }, [schemes]);

  return (
    <AppLayout>
      <PageHeader
        title="Gold Saving Schemes"
        subtitle="Monthly installments toward jewellery - track payments and redemption."
        action={
          <Button onClick={() => setEnrollOpen(true)} className="gold-gradient text-primary-foreground gap-2">
            <Plus className="h-4 w-4" /> Enroll customer
          </Button>
        }
      />

      {/* Explainer */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-violet-500/[0.05] p-6 shadow-lg shadow-primary/5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Info className="h-5 w-5" />
          </span>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="font-serif text-lg font-semibold text-foreground">What is a Gold Saving Scheme?</h2>
            <p>
              The customer pays a <strong className="text-foreground">fixed amount every month</strong>. After{" "}
              <strong className="text-foreground">6, 10, or 12 months</strong> they can buy jewellery using the accumulated
              value.
            </p>
            <p className="font-medium text-foreground">Shops often offer a benefit such as:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>
                <strong className="text-foreground">1 month free</strong> - one installment waived or credited
              </li>
              <li>
                <strong className="text-foreground">Bonus amount</strong> - extra rupees on maturity
              </li>
              <li>
                <strong className="text-foreground">Making charges discount</strong> - % off making charges at purchase
              </li>
            </ul>
            <p className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
                <ChevronRight className="h-3 w-3" /> Join
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
                Pay monthly
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
                Track here
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary">
                Redeem at maturity
              </span>
            </p>
          </div>
        </div>
      </motion.section>

      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <span className="rounded-full border border-border bg-card px-4 py-2">
          Active: <strong className="text-foreground">{stats.active}</strong>
        </span>
        <span className="rounded-full border border-border bg-card px-4 py-2">
          Redeemed: <strong className="text-foreground">{stats.redeemed}</strong>
        </span>
        <span className="rounded-full border border-border bg-card px-4 py-2">
          Total enrollments: <strong className="text-foreground">{stats.total}</strong>
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : schemes.length === 0 ? (
        <div className="glass rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <PiggyBank className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <p>No schemes yet. Enroll a customer to start tracking installments.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schemes.map((s) => {
            const pct = (s.installmentsPaid / s.tenureMonths) * 100;
            return (
              <motion.div
                key={s.id}
                layout
                className="glass relative overflow-hidden rounded-xl border border-border/60 p-5 shadow-sm transition hover:border-primary/25"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg font-semibold text-foreground">{s.customerName}</p>
                    <p className="text-xs text-muted-foreground">{s.customerPhone || "-"}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      s.status === "active"
                        ? "bg-primary/15 text-primary"
                        : s.status === "redeemed"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {s.monthlyAmount}/mo · {s.tenureMonths} mo · starts {s.startDate}
                </p>
                <p className="mb-3 text-xs text-primary">{benefitLabel(s.benefitType, s.benefitBonusRupees, s.benefitMakingDiscountPct)}</p>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="mb-4 flex justify-between text-xs text-muted-foreground">
                  <span>
                    Paid {s.installmentsPaid}/{s.tenureMonths}
                  </span>
                  <span>
                    {s.totalPaid} / {s.expectedTotal}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => void openDetail(s.id)}>
                    History
                  </Button>
                  {s.status === "active" && !s.isComplete && (
                    <Button
                      size="sm"
                      className="flex-1 gold-gradient text-primary-foreground"
                      disabled={submitting}
                      onClick={() => {
                        setPayScheme(s);
                        setPayAmount("");
                        setPayDate(new Date().toISOString().slice(0, 10));
                      }}
                    >
                      Pay installment
                    </Button>
                  )}
                  {s.canRedeem && (
                    <Button size="sm" variant="secondary" className="w-full gap-1" disabled={submitting} onClick={() => handleRedeem(s)}>
                      <Gift className="h-3.5 w-3.5" /> Redeem (use benefit)
                    </Button>
                  )}
                  {s.status === "active" && !s.isComplete && (
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={submitting} onClick={() => handleCancel(s)}>
                      <Ban className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Enroll modal */}
      <AnimatePresence>
        {enrollOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={() => !submitting && setEnrollOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass gold-glow max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold gold-text">New enrollment</h2>
                <button type="button" disabled={submitting} className="rounded-lg p-2 hover:bg-secondary" onClick={() => setEnrollOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Customer</span>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                  >
                    <option value="">Select…</option>
                    {customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `· ${c.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Monthly (₹)</span>
                    <input
                      value={formMonthly}
                      onChange={(e) => setFormMonthly(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                      placeholder="5000"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Tenure</span>
                    <select
                      value={formTenure}
                      onChange={(e) => setFormTenure(Number(e.target.value) as 6 | 10 | 12)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                    >
                      <option value={6}>6 months</option>
                      <option value={10}>10 months</option>
                      <option value={12}>12 months</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Shop benefit</span>
                  <select
                    value={formBenefit}
                    onChange={(e) => setFormBenefit(e.target.value as BenefitType)}
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                  >
                    <option value="one_month_free">1 month free</option>
                    <option value="bonus_rupees">Bonus amount (₹)</option>
                    <option value="making_discount_pct">Making charges discount (%)</option>
                  </select>
                </label>
                {formBenefit === "bonus_rupees" && (
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Bonus ₹</span>
                    <input
                      value={formBonus}
                      onChange={(e) => setFormBonus(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                      placeholder="2000"
                    />
                  </label>
                )}
                {formBenefit === "making_discount_pct" && (
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Discount %</span>
                    <input
                      value={formMkPct}
                      onChange={(e) => setFormMkPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                      placeholder="25"
                    />
                  </label>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Start date</span>
                    <input
                      type="date"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Notes</span>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm"
                    placeholder="Optional"
                  />
                </label>
                <Button className="w-full gold-gradient text-primary-foreground" disabled={submitting} onClick={() => void handleEnroll()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create scheme"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment modal */}
      <AnimatePresence>
        {payScheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={() => !submitting && setPayScheme(null)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-2xl p-6"
            >
              <h3 className="mb-1 font-serif text-lg font-semibold">Record installment</h3>
              <p className="mb-4 text-sm text-muted-foreground">{payScheme.customerName}</p>
              <label className="mb-3 block text-sm">
                Amount (₹) - default {payScheme.monthlyAmount}
                <input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2"
                  placeholder="Leave blank for monthly amount"
                />
              </label>
              <label className="mb-4 block text-sm">
                Paid on
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2" />
              </label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayScheme(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 gold-gradient text-primary-foreground" disabled={submitting} onClick={() => void handlePayment()}>
                  {submitting ? <Loader2 className="animate-spin" /> : "Save"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail / payment history */}
      <AnimatePresence>
        {detailId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={() => setDetailId(null)}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold">Payment history</h3>
                <button type="button" className="rounded-lg p-2 hover:bg-secondary" onClick={() => setDetailId(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              {detailLoading || !detailPayments ? (
                <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {detailPayments.customerName} · {detailPayments.monthlyAmount} × {detailPayments.tenureMonths} mo
                  </p>
                  <ul className="space-y-2">
                    {(detailPayments.payments ?? []).length === 0 ? (
                      <li className="text-sm text-muted-foreground">No payments yet.</li>
                    ) : (
                      detailPayments.payments!.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />#{p.installmentNo}
                            <span className="text-muted-foreground">{p.paidDate}</span>
                          </span>
                          <span className="font-medium">{p.amount}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

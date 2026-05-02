import { useCallback, useEffect, useMemo, useState } from "react";
import {
  amountDuePaise as calcAmountDuePaise,
  clearOldGoldExchangeSession,
  findOldGoldHistoryById,
  readOldGoldExchangeFromSession,
  saveOldGoldExchangeToSession,
  sessionPayloadFromHistoryEntry,
  type OldGoldExchangeSessionPayload,
} from "@/lib/oldGoldExchange";
import { Camera, ChevronLeft, ChevronRight, Download, Loader2, Trash2 } from "lucide-react";
import type { Customer, InventoryItem, Order } from "@/lib/api";
import { lookupContactByPhone, normalizePhoneDigits } from "@/lib/customerPhoneLookup";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import { parseProductIdInput, formatProductId } from "@/lib/productQr";
import { QrScanDialog } from "@/components/shared/QrScanDialog";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { downloadSalesReceiptHtml, receiptLineTotals, type ReceiptLine } from "@/lib/salesReceiptHtml";
import {
  DEFAULT_PAYMENT_MODE,
  ORDER_PAYMENT_MODES,
  labelForPaymentMode,
  type OrderPaymentModeValue,
} from "@/lib/paymentMode";
import { PROVISIONAL_RECEIPT_SUBTITLE, SALES_RECEIPT_SAVED_SUBTITLE, SALES_RECEIPT_SUBTITLE } from "@/lib/company";

type OrderStatus = "ordered" | "in-production" | "ready" | "delivered";

export type CreateOrderPayload = {
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMode?: OrderPaymentModeValue;
  items: string;
  total: string;
  status: OrderStatus;
  date?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerList: Customer[];
  /** Used to match returning buyers by mobile saved on past orders. */
  salesOrders?: Order[];
  inventory: InventoryItem[];
  onCreateOrder: (payload: CreateOrderPayload) => Promise<{ id: string }>;
};

type CustomerDraft = {
  phone: string;
  name: string;
  email: string;
  address: string;
};

type LineDraft = {
  key: string;
  inventoryId: number;
  productIdLabel: string;
  name: string;
  category: string;
  purity: string;
  weight: string;
  size: string;
  storageBox: string;
  hallmark: boolean;
  hallmarkNumber: string;
  providerName: string;
  qty: number;
  unitPrice: string;
};

const emptyCustomer = (): CustomerDraft => ({
  phone: "",
  name: "",
  email: "",
  address: "",
});

const lineFromInventory = (item: InventoryItem): LineDraft => ({
  key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `line-${Date.now()}-${Math.random()}`,
  inventoryId: item.id,
  productIdLabel: formatProductId(item.id),
  name: item.name,
  category: item.category,
  purity: item.purity,
  weight: item.weight,
  size: item.size,
  storageBox: item.storageBoxNumber,
  hallmark: item.hallmark,
  hallmarkNumber: item.hallmarkNumber,
  providerName: item.providerName,
  qty: 1,
  unitPrice: item.price,
});

const DEFAULT_NEW_ORDER_STATUS: OrderStatus = "ordered";

export function CreateOrderWizard({
  open,
  onOpenChange,
  customerList,
  salesOrders = [],
  inventory,
  onCreateOrder,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [matchedExisting, setMatchedExisting] = useState(false);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [itemIdInput, setItemIdInput] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<OrderPaymentModeValue>(DEFAULT_PAYMENT_MODE);
  const { pending: submitting, runExclusive } = useSubmitLock();
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const [oldGoldPayload, setOldGoldPayload] = useState<OldGoldExchangeSessionPayload | null>(null);
  const [exchangeIdInput, setExchangeIdInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const p = readOldGoldExchangeFromSession();
    setOldGoldPayload(p);
    setExchangeIdInput(p?.historyEntryId?.trim() ?? "");
  }, [open]);

  const reset = useCallback(() => {
    setStep(1);
    setCustomer(emptyCustomer());
    setMatchedExisting(false);
    setLines([]);
    setItemIdInput("");
    setScanOpen(false);
    setOrderDate(new Date().toISOString().slice(0, 10));
    setPaymentMode(DEFAULT_PAYMENT_MODE);
    setSavedOrderId(null);
    setOldGoldPayload(null);
    setExchangeIdInput("");
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const lookupPhone = useCallback(
    (opts?: { quiet?: boolean }) => {
      const found = lookupContactByPhone(customer.phone, customerList, salesOrders);
      if (found) {
        setCustomer({
          phone: found.phone,
          name: found.name,
          email: found.email,
          address: found.address,
        });
        setMatchedExisting(true);
        if (!opts?.quiet) {
          toast({
            title: found.source === "customer" ? "Customer found" : "Welcome back",
            description:
              found.source === "customer"
                ? `${found.name} — from your Customers list.`
                : `${found.name} — details from their most recent order.`,
          });
        }
      } else {
        setMatchedExisting(false);
        if (!opts?.quiet) {
          toast({
            title: "New customer",
            description: "No match in Customers or past orders. Enter name and other details below.",
          });
        }
      }
    },
    [customer.phone, customerList, salesOrders],
  );

  const grandTotalRupees = useMemo(
    () => lines.reduce((s, l) => s + parseCurrency(l.unitPrice) * Math.max(1, l.qty), 0),
    [lines],
  );
  const grandTotalFormatted = useMemo(() => formatCurrency(grandTotalRupees), [grandTotalRupees]);

  const lineSubtotalPaise = useMemo(() => Math.round(grandTotalRupees * 100), [grandTotalRupees]);
  const exchangeCreditPaise = oldGoldPayload?.creditPaise ?? 0;
  const amountDuePaise = useMemo(
    () => calcAmountDuePaise(lineSubtotalPaise, exchangeCreditPaise),
    [lineSubtotalPaise, exchangeCreditPaise],
  );
  const amountDueRupees = amountDuePaise / 100;
  const amountDueFormatted = useMemo(() => formatCurrency(Math.round(amountDueRupees)), [amountDueRupees]);
  const exchangeCreditFormatted = useMemo(
    () => (exchangeCreditPaise > 0 ? formatCurrency(exchangeCreditPaise / 100) : null),
    [exchangeCreditPaise],
  );

  const itemsSummaryForApi = useMemo(
    () => {
      const base = lines.map((l) => `${l.name} [${l.productIdLabel}] ×${Math.max(1, l.qty)}`).join("; ");
      if (oldGoldPayload && exchangeCreditPaise > 0) {
        return `${base} | ${oldGoldPayload.summaryLine}`.trim();
      }
      return base;
    },
    [lines, oldGoldPayload, exchangeCreditPaise],
  );

  const applyProduct = useCallback(
    (raw: string) => {
      const id = parseProductIdInput(raw);
      if (id == null) {
        toast({ title: "Invalid ID", description: "Use JC-123 or numeric id." });
        return;
      }
      const item = inventory.find((i) => i.id === id);
      if (!item) {
        toast({ title: "Not found", description: `No product ${formatProductId(id)}.` });
        return;
      }
      setLines((prev) => [...prev, lineFromInventory(item)]);
      setItemIdInput("");
      toast({ title: "Line added", description: item.name });
    },
    [inventory],
  );

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const toReceiptLines = (): ReceiptLine[] =>
    lines.map((l) => ({
      productIdLabel: l.productIdLabel,
      name: l.name,
      category: l.category,
      purity: l.purity,
      weight: l.weight,
      size: l.size,
      storageBox: l.storageBox,
      hallmark: l.hallmark,
      hallmarkNumber: l.hallmarkNumber,
      qty: Math.max(1, l.qty),
      unitPrice: l.unitPrice,
      lineTotal: receiptLineTotals({ unitPrice: l.unitPrice, qty: Math.max(1, l.qty) }),
    }));

  const downloadReceipt = (orderId: string, subtitle?: string) => {
    const breakdown =
      exchangeCreditPaise > 0
        ? {
            lineSubtotal: grandTotalFormatted,
            exchangeCredit: exchangeCreditFormatted,
            amountDue: amountDueFormatted,
          }
        : undefined;
    downloadSalesReceiptHtml({
      filename: `receipt-${orderId}`.toLowerCase().replace(/\s+/g, "-"),
      orderId,
      date: orderDate,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      },
      lines: toReceiptLines(),
      grandTotal: breakdown ? amountDueFormatted : grandTotalFormatted,
      subtitle: subtitle ?? SALES_RECEIPT_SUBTITLE,
      paymentModeLabel: labelForPaymentMode(paymentMode),
      totalsBreakdown: breakdown,
    });
    toast({ title: "Receipt downloaded", description: "Open the HTML file or print to PDF." });
  };

  const canStep1Next = normalizePhoneDigits(customer.phone).length >= 10 && customer.name.trim().length > 0;
  const canStep2Next = lines.length > 0 && grandTotalRupees > 0;

  const applyExchangeId = () => {
    const raw = exchangeIdInput.trim();
    if (!raw) {
      toast({
        title: "Enter an exchange ID",
        description: "Use Save only on Old Gold Exchange, then copy the ID from the toast or history.",
      });
      return;
    }
    const entry = findOldGoldHistoryById(raw);
    if (!entry || entry.exchangeValuePaise <= 0) {
      toast({
        title: "Not found",
        description: "No saved exchange with that ID on this device. Check spelling or save again on Old Gold Exchange.",
      });
      return;
    }
    const payload = sessionPayloadFromHistoryEntry(entry);
    saveOldGoldExchangeToSession(payload);
    setOldGoldPayload(payload);
    setExchangeIdInput(entry.id);
    toast({
      title: "Exchange credit applied",
      description: `${formatCurrency(entry.exchangeValuePaise / 100)} will reduce the amount due.`,
    });
  };

  const clearExchangeCredit = () => {
    clearOldGoldExchangeSession();
    setOldGoldPayload(null);
    setExchangeIdInput("");
    toast({ title: "Old gold credit cleared" });
  };

  const handleCreateOrder = async () => {
    if (!canStep1Next || !canStep2Next) return;
    await runExclusive(async () => {
      try {
        const created = await onCreateOrder({
          customer: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          customerEmail: customer.email.trim(),
          customerAddress: customer.address.trim(),
          paymentMode,
          items: itemsSummaryForApi,
          total: amountDueFormatted,
          status: DEFAULT_NEW_ORDER_STATUS,
          date: orderDate,
        });
        setSavedOrderId(created.id);
        if (exchangeCreditPaise > 0) {
          clearOldGoldExchangeSession();
          setOldGoldPayload(null);
        }
        const savedBreakdown =
          exchangeCreditPaise > 0
            ? {
                lineSubtotal: grandTotalFormatted,
                exchangeCredit: exchangeCreditFormatted,
                amountDue: amountDueFormatted,
              }
            : undefined;
        downloadSalesReceiptHtml({
          filename: `receipt-${created.id}`.toLowerCase(),
          orderId: created.id,
          date: orderDate,
          customer: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          },
          lines: toReceiptLines(),
          grandTotal: savedBreakdown ? amountDueFormatted : grandTotalFormatted,
          subtitle: SALES_RECEIPT_SAVED_SUBTITLE,
          paymentModeLabel: labelForPaymentMode(paymentMode),
          totalsBreakdown: savedBreakdown,
        });
        toast({ title: "Order saved", description: `${created.id} — receipt downloaded.` });
      } catch {
        toast({ title: "Failed", description: "Could not save order." });
      }
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-background/80 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4 py-8 sm:py-10">
        <div className="relative glass rounded-2xl p-6 w-full max-w-4xl max-h-[min(92dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain gold-glow my-auto">
          {submitting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/55 backdrop-blur-[1px]">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Saving…
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-serif font-bold gold-text">Create New Order</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {step} of 3 — {step === 1 ? "Customer" : step === 2 ? "Items" : "Review & receipt"}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40"
            >
              Close
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "gold-gradient" : "bg-secondary"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile number *</label>
                <p className="text-xs text-muted-foreground mb-2">We use this to find an existing customer or start a new profile.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer((c) => ({ ...c, phone: e.target.value }));
                      setMatchedExisting(false);
                    }}
                    onBlur={() => lookupPhone({ quiet: true })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        lookupPhone();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                    placeholder="+91 98765 43210"
                  />
                  <button
                    type="button"
                    onClick={() => lookupPhone()}
                    className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-secondary/80"
                  >
                    Look up
                  </button>
                </div>
              </div>

              {matchedExisting && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                  Existing customer — details loaded from Customers or a previous order with this mobile number.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Full name *</label>
                  <input
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Address</label>
                  <textarea
                    value={customer.address}
                    onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 resize-y"
                    placeholder="Street, city, PIN…"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!canStep1Next || submitting}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Next: add items <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Scan or enter product code</p>
                <div className="flex flex-col lg:flex-row gap-2">
                  <input
                    value={itemIdInput}
                    onChange={(e) => setItemIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyProduct(itemIdInput);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary/50"
                    placeholder="JC-5"
                  />
                  <button
                    type="button"
                    onClick={() => applyProduct(itemIdInput)}
                    className="px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium"
                  >
                    Add by ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-medium"
                  >
                    <Camera className="h-4 w-4" /> Scan QR
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Old gold exchange ID</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After <strong className="font-medium text-foreground">Save only</strong> on Old Gold Exchange, paste the ID here to apply that valuation as credit on this bill.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={exchangeIdInput}
                    onChange={(e) => setExchangeIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyExchangeId();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary/50"
                    placeholder="Paste exchange ID"
                  />
                  <button
                    type="button"
                    onClick={() => applyExchangeId()}
                    className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-secondary/80"
                  >
                    Apply credit
                  </button>
                </div>
                {exchangeCreditPaise > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">
                      {oldGoldPayload?.historyEntryId ? (
                        <>
                          Applied exchange ID{" "}
                          <span className="font-mono text-foreground">{oldGoldPayload.historyEntryId}</span>
                        </>
                      ) : (
                        <>Credit from Old Gold Exchange (applied automatically — no ID).</>
                      )}
                    </span>
                    <button type="button" onClick={clearExchangeCredit} className="font-medium text-destructive hover:underline shrink-0">
                      Clear credit
                    </button>
                  </div>
                )}
              </div>

              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
                  No lines yet. Scan a label or type a product ID above.
                </p>
              ) : (
                <div className="space-y-4">
                  {lines.map((l) => (
                    <div key={l.key} className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-primary">{l.productIdLabel}</span>
                        <button
                          type="button"
                          onClick={() => removeLine(l.key)}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-muted-foreground">Item name</label>
                          <input
                            value={l.name}
                            onChange={(e) => updateLine(l.key, { name: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Category</label>
                          <input
                            value={l.category}
                            onChange={(e) => updateLine(l.key, { category: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Purity</label>
                          <input
                            value={l.purity}
                            onChange={(e) => updateLine(l.key, { purity: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Weight</label>
                          <input
                            value={l.weight}
                            onChange={(e) => updateLine(l.key, { weight: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Size</label>
                          <input
                            value={l.size}
                            onChange={(e) => updateLine(l.key, { size: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Storage box</label>
                          <input
                            value={l.storageBox}
                            onChange={(e) => updateLine(l.key, { storageBox: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Hallmark no.</label>
                          <input
                            value={l.hallmarkNumber}
                            onChange={(e) => updateLine(l.key, { hallmarkNumber: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            checked={l.hallmark}
                            onChange={(e) => updateLine(l.key, { hallmark: e.target.checked })}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm">Hallmark certified</span>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={l.qty}
                            onChange={(e) => updateLine(l.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Unit price (₹)</label>
                          <input
                            value={l.unitPrice}
                            onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                            className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">Line total</label>
                          <div className="mt-0.5 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold">
                            {receiptLineTotals({ unitPrice: l.unitPrice, qty: Math.max(1, l.qty) })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {exchangeCreditPaise > 0 && (
                <p className="mb-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  Old gold credit {exchangeCreditFormatted} will apply on review (items subtotal − credit = amount due).
                </p>
              )}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-lg font-serif font-bold gold-text">Items subtotal: {grandTotalFormatted}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    type="button"
                    disabled={!canStep2Next || submitting}
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    Next: review <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Customer</h3>
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  <p className="text-sm text-muted-foreground">{customer.email || "—"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{customer.address || "—"}</p>
                </div>
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Order date</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Payment mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as OrderPaymentModeValue)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                    >
                      {ORDER_PAYMENT_MODES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/80">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.key} className="border-t border-border">
                        <td className="px-3 py-2">{l.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.productIdLabel}</td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {receiptLineTotals({ unitPrice: l.unitPrice, qty: Math.max(1, l.qty) })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border px-3 py-3 text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items subtotal</span>
                    <span className="font-medium text-foreground">{grandTotalFormatted}</span>
                  </div>
                  {exchangeCreditPaise > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                      <span>Old gold exchange credit</span>
                      <span className="font-medium">− {exchangeCreditFormatted}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 font-serif text-lg font-bold text-foreground">
                    <span>Amount due</span>
                    <span>{amountDueFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-between items-stretch sm:items-center">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to items
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => downloadReceipt(`QUOTE-${Date.now()}`, PROVISIONAL_RECEIPT_SUBTITLE)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" /> Download receipt
                  </button>
                  <button
                    type="button"
                    disabled={submitting || savedOrderId !== null}
                    onClick={() => void handleCreateOrder()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : savedOrderId ? (
                      "Saved"
                    ) : (
                      "Save order & receipt"
                    )}
                  </button>
                </div>
              </div>

              {savedOrderId && (
                <p className="text-sm text-muted-foreground text-center">
                  Receipt for <span className="font-mono text-foreground">{savedOrderId}</span> was downloaded. Close when done.
                </p>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <QrScanDialog open={scanOpen} onOpenChange={setScanOpen} onDecoded={(t) => applyProduct(t.trim())} />
    </>
  );
}

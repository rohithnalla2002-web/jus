import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/demo";
import {
  appendOldGoldHistory,
  buildOldGoldOrderNote,
  clearOldGoldExchangeSession,
  clearOldGoldHistory,
  computeOldGoldExchange,
  deleteOldGoldHistoryEntry,
  fileToResizedJpegDataUrl,
  readOldGoldExchangeFromSession,
  readOldGoldHistory,
  saveOldGoldExchangeToSession,
  type OldGoldExchangeSessionPayload,
  type OldGoldHistoryEntry,
} from "@/lib/oldGoldExchange";
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  Copy,
  History,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

function parseNum(raw: string): number {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function startOfDayIso(d: string): string {
  if (!d) return "";
  return `${d}T00:00:00.000Z`;
}
function endOfDayIso(d: string): string {
  if (!d) return "";
  return `${d}T23:59:59.999Z`;
}

const fieldClass =
  "w-full rounded-xl border border-border/70 bg-background/95 px-3.5 py-2.5 text-sm shadow-sm ring-offset-background transition-all placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const filterFieldClass =
  "w-full rounded-xl border border-border/60 bg-background/90 px-3 py-2 text-sm shadow-sm focus-visible:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15";

const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export default function OldGoldExchange() {
  const [weightG, setWeightG] = useState("10");
  const [karat, setKarat] = useState("22");
  const [testedPct, setTestedPct] = useState("");
  const [ratePerG, setRatePerG] = useState("6000");
  const [deductionPct, setDeductionPct] = useState("2");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [pending, setPending] = useState<OldGoldExchangeSessionPayload | null>(() => readOldGoldExchangeFromSession());
  const [history, setHistory] = useState<OldGoldHistoryEntry[]>(() => readOldGoldHistory());

  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinCredit, setFilterMinCredit] = useState("");
  const [filterMaxCredit, setFilterMaxCredit] = useState("");
  const [filterKind, setFilterKind] = useState<"" | "exchange" | "bought">("");

  const refreshHistory = useCallback(() => setHistory(readOldGoldHistory()), []);

  useEffect(() => {
    setPending(readOldGoldExchangeFromSession());
  }, []);

  const result = useMemo(() => {
    const tested = testedPct.trim() === "" ? null : parseNum(testedPct);
    return computeOldGoldExchange({
      weightG: parseNum(weightG),
      karat: parseNum(karat),
      testedPurityPercent: tested != null && tested > 0 ? tested : null,
      rateRupeesPerGram: parseNum(ratePerG),
      deductionPercent: parseNum(deductionPct),
    });
  }, [weightG, karat, testedPct, ratePerG, deductionPct]);

  const creditRupees = result.exchangeValuePaise / 100;
  const displayValue = formatCurrency(Math.round(creditRupees));

  const buildSessionPayload = (): OldGoldExchangeSessionPayload | null => {
    if (result.exchangeValuePaise <= 0) return null;
    const tested = testedPct.trim() === "" ? null : parseNum(testedPct);
    const payload: OldGoldExchangeSessionPayload = {
      creditPaise: result.exchangeValuePaise,
      savedAt: new Date().toISOString(),
      summaryLine: "",
      weightG: parseNum(weightG),
      karat: parseNum(karat),
      testedPurityPercent: tested != null && tested > 0 ? tested : null,
      netFineGoldG: result.netFineGoldG,
      rateRupeesPerGram: parseNum(ratePerG),
      deductionPercent: parseNum(deductionPct),
    };
    payload.summaryLine = buildOldGoldOrderNote(payload);
    return payload;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Choose an image", description: "PNG or JPG works best." });
      return;
    }
    const dataUrl = await fileToResizedJpegDataUrl(file, 520, 0.75);
    if (!dataUrl) {
      toast({ title: "Could not read image", description: "Try another file." });
      return;
    }
    if (dataUrl.length > 900_000) {
      toast({ title: "Image still too large", description: "Try a smaller photo." });
      return;
    }
    setImagePreview(dataUrl);
    setImageName(file.name);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageName(null);
  };

  const handleSaveToHistory = () => {
    const payload = buildSessionPayload();
    if (!payload) {
      toast({ title: "Enter valid inputs", description: "Need a positive exchange value to save." });
      return;
    }
    const entry: OldGoldHistoryEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `oge-${Date.now()}`,
      createdAt: new Date().toISOString(),
      kind: "exchange",
      weightG: payload.weightG,
      karat: payload.karat,
      testedPurityPercent: payload.testedPurityPercent,
      fineGoldG: result.fineGoldG,
      netFineGoldG: result.netFineGoldG,
      rateRupeesPerGram: payload.rateRupeesPerGram,
      deductionPercent: payload.deductionPercent,
      exchangeValuePaise: payload.creditPaise,
      summaryLine: payload.summaryLine,
      imageDataUrl: imagePreview ?? null,
    };
    const ok = appendOldGoldHistory(entry);
    refreshHistory();
    if (!ok) {
      toast({
        title: "Could not save (storage full)",
        description: "Free browser storage or remove old entries, then try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Saved",
      description: `Exchange ID: ${entry.id} - enter this in Create order (items step) to apply the credit, or find it in history below.`,
    });
  };

  const handleUseOnNextOrder = () => {
    const payload = buildSessionPayload();
    if (!payload) {
      toast({ title: "Enter valid inputs", description: "Weight, rate, and purity are required to get a credit value." });
      return;
    }
    saveOldGoldExchangeToSession(payload);
    setPending(payload);

    const boughtEntry: OldGoldHistoryEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `oge-${Date.now()}`,
      createdAt: new Date().toISOString(),
      kind: "bought",
      weightG: payload.weightG,
      karat: payload.karat,
      testedPurityPercent: payload.testedPurityPercent,
      fineGoldG: result.fineGoldG,
      netFineGoldG: result.netFineGoldG,
      rateRupeesPerGram: payload.rateRupeesPerGram,
      deductionPercent: payload.deductionPercent,
      exchangeValuePaise: payload.creditPaise,
      summaryLine: payload.summaryLine,
      imageDataUrl: imagePreview ?? null,
    };
    const histOk = appendOldGoldHistory(boughtEntry);
    refreshHistory();

    toast({
      title: "Credit saved for next order",
      description: histOk
        ? "Recorded under History as Bought. Sales → Create order applies credit automatically."
        : "Credit is active for Create order; history could not be saved (storage full).",
    });
  };

  const handleClearSession = () => {
    clearOldGoldExchangeSession();
    setPending(null);
    toast({ title: "Cleared", description: "Old gold exchange credit will not apply to new orders." });
  };

  const filteredHistory = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    const minR = filterMinCredit.trim() === "" ? null : parseNum(filterMinCredit);
    const maxR = filterMaxCredit.trim() === "" ? null : parseNum(filterMaxCredit);
    const fromTs = filterDateFrom ? new Date(startOfDayIso(filterDateFrom)).getTime() : null;
    const toTs = filterDateTo ? new Date(endOfDayIso(filterDateTo)).getTime() : null;

    return history.filter((e) => {
      if (filterKind === "exchange" && e.kind !== "exchange") return false;
      if (filterKind === "bought" && e.kind !== "bought") return false;
      const credit = e.exchangeValuePaise / 100;
      if (minR != null && credit < minR) return false;
      if (maxR != null && credit > maxR) return false;
      const t = new Date(e.createdAt).getTime();
      if (fromTs != null && t < fromTs) return false;
      if (toTs != null && t > toTs) return false;
      if (!q) return true;
      const hay = `${e.kind} ${e.id} ${e.summaryLine} ${e.weightG} ${e.karat} ${e.netFineGoldG}`.toLowerCase();
      return hay.includes(q);
    });
  }, [history, filterKind, filterSearch, filterDateFrom, filterDateTo, filterMinCredit, filterMaxCredit]);

  const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <AppLayout>
      <div className="relative">
        {/* Ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-none">
          <div className="absolute -right-32 -top-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute left-[-80px] top-1/4 h-[320px] w-[320px] rounded-full bg-violet-400/15 blur-[100px]" />
          <div className="absolute bottom-[-80px] right-1/3 h-[280px] w-[280px] rounded-full bg-amber-300/12 blur-[90px]" />
        </div>

        {/* Hero */}
        <motion.header {...fadeUp} className="relative mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-background to-violet-500/[0.07] px-6 py-8 shadow-xl shadow-primary/[0.06] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10 opacity-60" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Valuation desk
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.5rem] gold-text">
                Old Gold Exchange
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Weigh and assay customer jewellery, compute fine gold after melting loss, and turn it into store credit
                for their next purchase - with a clear paper trail.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Gram-accurate
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                Credit-ready
              </span>
            </div>
          </div>
        </motion.header>

        {pending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.12] via-primary/[0.06] to-violet-500/[0.08] p-[1px] shadow-lg shadow-primary/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[15px] bg-card/90 px-5 py-4 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Active credit</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Pending for the next order - {" "}
                    <span className="font-semibold text-foreground">{formatCurrency(pending.creditPaise / 100)}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/sales"
                  className="inline-flex items-center gap-2 rounded-xl gold-gradient px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition hover:opacity-95"
                >
                  Go to Sales <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleClearSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-2.5 text-xs font-medium shadow-sm transition hover:bg-secondary"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear credit
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Input card */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 shadow-xl shadow-primary/[0.04] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">Valuation inputs</h2>
                  <p className="text-xs text-muted-foreground">Weights, purity, rate & deduction</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className={labelClass}>Weight & purity</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Weight (g)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={weightG}
                        onChange={(e) => setWeightG(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Karat</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={karat}
                        onChange={(e) => setKarat(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Assay % (optional)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={testedPct}
                        onChange={(e) => setTestedPct(e.target.value)}
                        placeholder="Overrides karat when set - e.g. 91.2"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                <div>
                  <p className={labelClass}>Pricing</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Rate ₹ / g</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={ratePerG}
                        onChange={(e) => setRatePerG(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Deduction %</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={deductionPct}
                        onChange={(e) => setDeductionPct(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                <div>
                  <span className={`${labelClass} flex items-center gap-2`}>
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    Jewellery photo
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="group/photo relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.04] to-transparent px-6 py-8 text-center transition hover:border-primary/45 hover:bg-primary/[0.06]">
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => void handleImageChange(e)} />
                      <Camera className="mx-auto h-8 w-8 text-primary/70 transition group-hover/photo:scale-105" />
                      <span className="mt-2 block text-sm font-medium text-foreground">Upload image</span>
                      <span className="text-xs text-muted-foreground">PNG or JPG</span>
                    </label>
                    {imageName && (
                      <span className="max-w-[180px] truncate text-xs text-muted-foreground">{imageName}</span>
                    )}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium transition hover:bg-secondary"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-inner">
                      <img src={imagePreview} alt="Jewellery preview" className="max-h-52 w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-background/90 px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-primary/30 hover:bg-secondary/80 sm:flex-initial min-[480px]:min-w-[160px]"
                >
                  <History className="h-4 w-4 shrink-0" />
                  Save only
                </button>
                <button
                  type="button"
                  onClick={handleUseOnNextOrder}
                  className="card-shine btn-ripple inline-flex flex-1 items-center justify-center gap-2 rounded-xl gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 sm:flex-initial min-[480px]:min-w-[220px]"
                >
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  Use credit on next order
                </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Save only</span> logs an{" "}
                <span className="text-primary">Exchange</span> row with an ID for Create order.{" "}
                <span className="font-medium text-foreground">Use credit</span> queues credit automatically and logs{" "}
                <span className="text-primary">Bought</span>.
              </p>
            </div>
          </motion.div>

          {/* Breakdown card */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="card-shine relative flex flex-col overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.08] via-card to-card p-6 shadow-xl shadow-primary/[0.08] sm:p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <h2 className="mb-6 font-serif text-xl font-semibold text-foreground">Live breakdown</h2>

            <div className="flex flex-1 flex-col">
              <div className="mb-6 rounded-2xl border border-primary/15 bg-background/60 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Exchange value</p>
                <p className="mt-2 font-serif text-4xl font-bold tracking-tight gold-text sm:text-5xl">{displayValue}</p>
                <p className="mt-2 text-xs text-muted-foreground">Net fine × rate per gram (after deduction)</p>
              </div>

              <dl className="space-y-0 rounded-xl border border-border/50 bg-background/50">
                <div className="flex items-center justify-between gap-4 border-b border-border/40 px-4 py-3.5">
                  <dt className="text-sm text-muted-foreground">Fine gold (gross)</dt>
                  <dd className="font-medium tabular-nums text-foreground">{result.fineGoldG.toFixed(4)} g</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <dt className="text-sm text-muted-foreground">Net fine gold</dt>
                  <dd className="font-semibold tabular-nums text-primary">{result.netFineGoldG.toFixed(4)} g</dd>
                </div>
              </dl>

              <div className="mt-auto pt-6">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                  Fine = weight × (karat ÷ 24), or weight × (assay % ÷ 100) when assay is set. Credit applies to Sales &
                  Billing as a deduction from the items subtotal.
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* History */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.12 }}
          className="mt-12 sm:mt-16"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 text-primary">
                <History className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Ledger</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">History</h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Filter by status, date, or amount. Stored locally on this device.
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearOldGoldHistory();
                  refreshHistory();
                  toast({ title: "History cleared", description: "All saved entries were removed from this browser." });
                }}
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-destructive hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mb-8 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-lg shadow-black/[0.03] backdrop-blur-sm sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Filters</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-3">
              <label className="block sm:col-span-1">
                <span className={labelClass}>Status</span>
                <select
                  value={filterKind}
                  onChange={(e) => setFilterKind(e.target.value as "" | "exchange" | "bought")}
                  className={filterFieldClass}
                >
                  <option value="">All</option>
                  <option value="exchange">Exchange</option>
                  <option value="bought">Bought</option>
                </select>
              </label>
              <div className="sm:col-span-2">
                <span className={labelClass}>Search</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="ID, weight, summary…"
                    className={`${filterFieldClass} pl-10`}
                  />
                </div>
              </div>
              <label className="block">
                <span className={labelClass}>From</span>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={filterFieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>To</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={filterFieldClass} />
              </label>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
                <label className="block">
                  <span className={labelClass}>Min ₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={filterMinCredit}
                    onChange={(e) => setFilterMinCredit(e.target.value)}
                    placeholder="0"
                    className={filterFieldClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Max ₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={filterMaxCredit}
                    onChange={(e) => setFilterMaxCredit(e.target.value)}
                    placeholder="∞"
                    className={filterFieldClass}
                  />
                </label>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredHistory.length}</span> of{" "}
              <span className="font-medium text-foreground">{history.length}</span> entries
            </p>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-br from-muted/30 to-primary/[0.03] px-8 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <History className="h-7 w-7 opacity-80" />
              </div>
              <p className="font-serif text-lg font-semibold text-foreground">No records yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {history.length === 0
                  ? "Save a valuation or queue credit - both appear here with Exchange or Bought status."
                  : "Nothing matches these filters. Try clearing dates or status."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredHistory.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-md transition duration-300 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div
                    className={`h-1 w-full ${
                      e.kind === "bought"
                        ? "bg-gradient-to-r from-primary via-violet-500 to-primary"
                        : "bg-gradient-to-r from-amber-500/80 via-amber-400/60 to-amber-500/80"
                    }`}
                  />
                  <div className="flex gap-4 border-b border-border/50 bg-muted/20 p-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted shadow-inner">
                      {e.imageDataUrl ? (
                        <img src={e.imageDataUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                          <Camera className="h-5 w-5 opacity-40" />
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          e.kind === "bought"
                            ? "bg-primary/15 text-primary"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {e.kind === "bought" ? "Bought" : "Exchange"}
                      </span>
                      <p className="mt-2 font-serif text-xl font-bold text-primary">{formatCurrency(e.exchangeValuePaise / 100)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Delete entry"
                      onClick={() => {
                        deleteOldGoldHistoryEntry(e.id);
                        refreshHistory();
                      }}
                      className="h-9 w-9 shrink-0 self-start rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 p-4 text-xs">
                    <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2">
                      <span className="min-w-0 flex-1 break-all font-mono text-[10px] leading-snug text-muted-foreground">ID: {e.id}</span>
                      <button
                        type="button"
                        title="Copy ID"
                        onClick={() => {
                          void navigator.clipboard?.writeText(e.id).then(() =>
                            toast({ title: "Copied", description: "Paste in Create order → Exchange ID." }),
                          );
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-background hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Weight</span> {e.weightG} g ·{" "}
                      {e.testedPurityPercent != null ? `Assay ${e.testedPurityPercent}%` : `${e.karat}K`}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Fine / Net</span>{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {e.fineGoldG.toFixed(3)} / {e.netFineGoldG.toFixed(3)} g
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      ₹{e.rateRupeesPerGram}/g · deduction {e.deductionPercent}%
                    </p>
                    <p className="line-clamp-2 border-t border-border/40 pt-2 text-[11px] leading-snug text-muted-foreground">
                      {e.summaryLine}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </AppLayout>
  );
}

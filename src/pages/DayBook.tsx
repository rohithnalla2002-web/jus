import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Loader2,
  Lock,
  Unlock,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { type CashBookDayPayload, type CashBookLine, fetchCashBookDay, patchCashBookDay } from "@/lib/api";
import { formatCurrency } from "@/lib/demo";

export default function DayBook() {
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<CashBookDayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesDraft, setNotesDraft] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchCashBookDay(bookDate);
      setData(d);
      setNotesDraft(d.notes ?? "");
    } catch {
      toast({
        title: "Could not load day book",
        description: "Is the API server running?",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bookDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const closed = data?.isClosed ?? false;

  const applyPayload = (d: CashBookDayPayload) => {
    setData(d);
    setNotesDraft(d.notes ?? "");
  };

  const saveNotes = async () => {
    try {
      const d = await patchCashBookDay(bookDate, { notes: notesDraft });
      applyPayload(d);
      toast({ title: "Notes saved" });
    } catch (e) {
      toast({
        title: "Could not save notes",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const toggleCloseDay = async () => {
    try {
      const d = await patchCashBookDay(bookDate, { isClosed: !closed });
      applyPayload(d);
      toast({ title: closed ? "Day reopened" : "Day marked closed" });
    } catch (e) {
      toast({
        title: "Could not update",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Day Book / Cash Book"
        subtitle="Built automatically from sales, gold scheme installments, and cash salary payments."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6 pb-10"
      >
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-background to-background p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Info className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What feeds this book</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <span className="text-foreground/90">Cash in:</span> each sale whose payment is not{" "}
                  <span className="text-foreground/90">credit note</span>, plus gold saving scheme installments recorded
                  for this date.
                </li>
                <li>
                  <span className="text-foreground/90">Cash out:</span> salary payments where the method is{" "}
                  <span className="text-foreground/90">Cash</span> (see Employees → Pay Salary).
                </li>
                <li>
                  <span className="text-foreground/90">Opening</span> is computed from all prior days in the same way;
                  there are no manual lines here—change source transactions (orders, schemes, salary) to correct totals.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="book-date" className="text-xs uppercase tracking-wide text-muted-foreground">
              Date
            </Label>
            <Input
              id="book-date"
              type="date"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
              className="max-w-[220px] rounded-xl border-border/70 bg-background/90"
            />
          </div>
          {data && (
            <div className="flex flex-wrap items-center gap-2">
              {closed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Day closed
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Day-end notes &amp; lock below</span>
              )}
              <Button
                type="button"
                variant={closed ? "default" : "secondary"}
                size="sm"
                className="gap-1.5"
                onClick={() => void toggleCloseDay()}
              >
                {closed ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Reopen day
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Close day
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && data && (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">{data.openingNote}</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<Wallet className="h-5 w-5" />}
                label="Opening balance"
                value={formatCurrency(data.openingRupees)}
                tone="neutral"
              />
              <SummaryCard
                icon={<ArrowDownCircle className="h-5 w-5 text-emerald-400" />}
                label="Cash in (today)"
                value={data.totalIn}
                tone="in"
              />
              <SummaryCard
                icon={<ArrowUpCircle className="h-5 w-5 text-rose-400" />}
                label="Cash out (today)"
                value={data.totalOut}
                tone="out"
              />
              <SummaryCard
                icon={<BookOpen className="h-5 w-5 text-sky-400" />}
                label="Closing balance"
                value={formatCurrency(data.closingRupees)}
                tone="close"
                emphasize
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <h3 className="mb-3 text-sm font-semibold tracking-tight">Day-end verification (optional)</h3>
              <Textarea
                className="min-h-[88px] rounded-xl border-border/70"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                disabled={closed}
                placeholder="Physical cash counted, handover, discrepancies…"
              />
              <Button type="button" variant="outline" size="sm" className="mt-2" disabled={closed} onClick={() => void saveNotes()}>
                Save notes
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Today: {data.sourcesSummary.ordersInCount} sale line(s), {data.sourcesSummary.schemePaymentsInCount} scheme
              installment(s), {data.sourcesSummary.salaryCashOutCount} cash salary payment(s).{" "}
              <Link to="/sales" className="text-primary underline-offset-4 hover:underline">
                Sales
              </Link>
              {" · "}
              <Link to="/gold-schemes" className="text-primary underline-offset-4 hover:underline">
                Gold schemes
              </Link>
              {" · "}
              <Link to="/employees" className="text-primary underline-offset-4 hover:underline">
                Employees
              </Link>
            </p>

            <div className="grid gap-6 lg:grid-cols-2">
              <LinesPanel title="Cash in" emptyHint="No sales or scheme installments on this date." lines={data.linesIn} />
              <LinesPanel title="Cash out" emptyHint="No cash salary payments recorded on this date." lines={data.linesOut} />
            </div>

            {data.lines.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Full timeline</span> (same rows as above, chronological)
              </div>
            )}
            <ul className="space-y-2">
              {data.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{line.category}</span>
                    <span className="text-muted-foreground"> · {line.memo}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums font-semibold">{line.amount}</span>
                    <LineSourceLink line={line} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}

function LineSourceLink({ line }: { line: CashBookLine }) {
  if (line.source === "order") {
    return (
      <Link
        to={`/orders/${encodeURIComponent(line.sourceId)}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Order <ExternalLink className="h-3 w-3" aria-hidden />
      </Link>
    );
  }
  if (line.source === "scheme_payment" && line.schemeId != null) {
    return (
      <Link to="/gold-schemes" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        Schemes <ExternalLink className="h-3 w-3" aria-hidden />
      </Link>
    );
  }
  if (line.source === "salary" && line.employeeId != null) {
    return (
      <Link
        to={`/employees/${line.employeeId}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Employee <ExternalLink className="h-3 w-3" aria-hidden />
      </Link>
    );
  }
  return null;
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
  emphasize,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "in" | "out" | "close";
  emphasize?: boolean;
}) {
  const border =
    tone === "in"
      ? "border-emerald-500/25"
      : tone === "out"
        ? "border-rose-500/25"
        : tone === "close"
          ? "border-sky-500/30"
          : "border-border/60";
  return (
    <div
      className={`rounded-2xl border ${border} bg-card/50 p-4 shadow-sm ${emphasize ? "ring-1 ring-sky-500/20" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-semibold tabular-nums tracking-tight ${emphasize ? "text-lg text-sky-100" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function LinesPanel({
  title,
  lines,
  emptyHint,
}: {
  title: string;
  lines: CashBookLine[];
  emptyHint: string;
}) {
  const variant = title.includes("out") ? "out" : "in";
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {variant === "in" ? (
          <ArrowDownCircle className="h-4 w-4 text-emerald-400" aria-hidden />
        ) : (
          <ArrowUpCircle className="h-4 w-4 text-rose-400" aria-hidden />
        )}
        {title}
      </h3>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{line.category}</p>
                <p className="truncate text-xs text-muted-foreground">{line.memo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums font-semibold">{line.amount}</span>
                <LineSourceLink line={line} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

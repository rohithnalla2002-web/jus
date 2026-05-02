import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Info, Scale } from "lucide-react";
import type { Employee, KarigarBoard, KarigarJob } from "@/lib/api";
import { getKarigarDemoFallback } from "@/lib/karigarDemoFallback";
import {
  buildKarigarGoldRollups,
  karatToFineFraction,
  karatToPurityPercent,
  summarizeAllJobsFineGold,
} from "@/lib/karigarFineGold";

type Props = {
  karigarBoard: KarigarBoard;
  allKarigarJobs: KarigarJob[];
  employeeList: Employee[];
};

const DEMO_JOB_ID_MIN = 90000;

/** Always show a gram amount when the number is finite (including 0). */
function fmtGrams(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} g`;
}

function formatQualitySummary(segments: ParsedGoldSegment[]): string {
  if (segments.length === 0) return "—";
  return segments
    .map((s) => `${s.karat}K (${karatToPurityPercent(s.karat).toFixed(2)}% Au)`)
    .join(" + ");
}

const columnLabel: Record<string, string> = {
  assigned: "Assigned",
  inProgress: "In progress",
  completed: "Completed",
};

export default function KarigarGoldBalances({ karigarBoard, allKarigarJobs, employeeList }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { boardInput, jobsInput, usingDemo } = useMemo(() => {
    if (allKarigarJobs.length > 0) {
      return { boardInput: karigarBoard, jobsInput: allKarigarJobs, usingDemo: false };
    }
    const d = getKarigarDemoFallback();
    return { boardInput: d.board, jobsInput: d.jobs, usingDemo: true };
  }, [karigarBoard, allKarigarJobs]);

  const rollups = useMemo(() => {
    const summaries = summarizeAllJobsFineGold(boardInput, jobsInput);
    const employeeKarigarNames = employeeList
      .filter((e) => e.role === "Karigar")
      .map((e) => e.name.trim())
      .filter(Boolean);
    return buildKarigarGoldRollups(employeeKarigarNames, summaries);
  }, [boardInput, jobsInput, employeeList]);

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {usingDemo && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Sample data</span> — no karigar jobs loaded from the server. Showing demo rows so you
          can explore the layout; run DB seed or assign jobs for live data.
        </div>
      )}
      <div className="glass rounded-xl border border-border/80 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-2 text-sm">
            <p className="font-medium text-foreground">How remaining gold is calculated</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground leading-relaxed">
              <li>
                <span className="text-foreground font-medium">Quantity (gross)</span> — grams of metal issued per line
                (e.g. 100g).
              </li>
              <li>
                <span className="text-foreground font-medium">Quality</span> — karat (fineness); purity % = (karat ÷ 24) ×
                100 (e.g. 18K → {karatToPurityPercent(18).toFixed(2)}% Au).
              </li>
              <li>
                <span className="text-foreground font-medium">Purity gold / fine Au</span> — gross × (karat ÷ 24); loss and
                balance must be tracked in these fine grams.
              </li>
              <li>
                <span className="text-foreground font-medium">Returned fine</span> — fine gold received back; open jobs
                show 0 until you record returns. Completed jobs assume full return of issued fine for now.
              </li>
              <li>
                <span className="text-foreground font-medium">Left (remaining)</span> — fine gold still with the karigar:
                issued fine − returned fine.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {rollups.length === 0 ? (
        <div className="glass rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          No karigars found. Add employees with role &quot;Karigar&quot; or assign a job to a karigar.
        </div>
      ) : (
        <div className="space-y-3">
          {rollups.map((r) => {
            const key = r.sortKey;
            const isOpen = expanded[key] === true;
            const grossIssuedOpenJobs = r.jobs
              .filter((j) => j.column === "assigned" || j.column === "inProgress")
              .reduce((acc, j) => acc + j.issuedGrossGoldGrams, 0);

            return (
              <div key={key} className="glass rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Scale className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-semibold text-foreground truncate">{r.displayName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.jobs.length} job{r.jobs.length === 1 ? "" : "s"}
                      {grossIssuedOpenJobs > 0 && (
                        <>
                          {" "}
                          · Open jobs gross issued:{" "}
                          <span className="text-foreground font-medium tabular-nums">{fmtGrams(grossIssuedOpenJobs)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {fmtGrams(r.totalOutstandingFineGoldGrams)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">fine gold left</p>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4">
                    {r.jobs.length === 0 ? (
                      <p className="pt-3 text-sm text-muted-foreground">No jobs linked to this karigar yet.</p>
                    ) : (
                      <div className="overflow-x-auto pt-3">
                        <table className="w-full min-w-[880px] text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                              <th className="pb-2 pr-3 font-medium">Item</th>
                              <th className="pb-2 pr-3 font-medium">Stage</th>
                              <th className="pb-2 pr-3 font-medium text-right whitespace-nowrap">Gross issued</th>
                              <th className="pb-2 pr-3 font-medium whitespace-nowrap">Quality</th>
                              <th className="pb-2 pr-3 font-medium text-right whitespace-nowrap">Fine issued</th>
                              <th className="pb-2 pr-3 font-medium text-right whitespace-nowrap">Returned fine</th>
                              <th className="pb-2 pr-3 font-medium text-right whitespace-nowrap">Left fine</th>
                              <th className="pb-2 font-medium">Material note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {r.jobs.map((row) => (
                              <tr key={row.job.id} className="align-top">
                                <td className="py-2.5 pr-3 max-w-[200px]">
                                  {usingDemo && row.job.id >= DEMO_JOB_ID_MIN ? (
                                    <span className="font-medium text-foreground">{row.job.title}</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/karigar/jobs/${row.job.id}`)}
                                      className="text-left font-medium text-primary hover:underline"
                                    >
                                      {row.job.title}
                                    </button>
                                  )}
                                  {!row.parseOk && (
                                    <p className="mt-0.5 text-[11px] text-warning">
                                      No gold line parsed — enter e.g. &quot;100g 18K&quot; in Material issued.
                                    </p>
                                  )}
                                </td>
                                <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                                  {columnLabel[row.column] ?? row.column}
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums text-foreground">
                                  {row.parseOk ? fmtGrams(row.issuedGrossGoldGrams) : "—"}
                                </td>
                                <td className="py-2.5 pr-3 text-xs text-foreground">
                                  {formatQualitySummary(row.segments)}
                                  {row.segments.length > 0 && (
                                    <span className="mt-1 block text-[10px] text-muted-foreground leading-snug">
                                      {row.segments.map((s, i) => (
                                        <span key={i}>
                                          {i > 0 ? " · " : ""}
                                          {fmtGrams(s.grossGrams)} × ({s.karat}÷24) = {fmtGrams(s.fineGrams)} fine
                                        </span>
                                      ))}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-foreground">
                                  {row.parseOk ? fmtGrams(row.issuedFineGoldGrams) : "—"}
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                                  {row.parseOk ? fmtGrams(row.returnedFineGoldGrams) : "—"}
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-amber-800 dark:text-amber-300">
                                  {row.parseOk ? fmtGrams(row.leftFineGoldGrams) : "—"}
                                </td>
                                <td className="py-2.5 text-xs text-muted-foreground max-w-[14rem]">
                                  <span className="line-clamp-3" title={row.job.material}>
                                    {row.job.material || "—"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

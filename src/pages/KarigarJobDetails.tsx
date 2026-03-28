import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAppDemo } from "@/context/AppDemoContext";
import {
  fetchKarigarJobById,
  normalizeKarigarJobFromApi,
  type KarigarBoard,
  type KarigarColumnKey,
  type KarigarJob,
} from "@/lib/api";
import { normCustomerKey, normalizePhoneDigits, phonesMatch } from "@/lib/customerPhoneLookup";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import { downloadKarigarJobReceiptHtml } from "@/lib/invoiceHtml";
import { ArrowLeft, ArrowRight, FileText, Hammer, Loader2, Mail, MapPin, Phone, User } from "lucide-react";

function displayStr(value: string | undefined | null) {
  const t = String(value ?? "").trim();
  return t.length > 0 ? t : "—";
}

function inferColumnKey(board: KarigarBoard, jobId: number): KarigarColumnKey | undefined {
  if (board.assigned.some((j) => j.id === jobId)) return "assigned";
  if (board.inProgress.some((j) => j.id === jobId)) return "inProgress";
  if (board.completed.some((j) => j.id === jobId)) return "completed";
  return undefined;
}

function findJobInBoard(board: KarigarBoard, jobId: number): KarigarJob | null {
  const all = [...board.assigned, ...board.inProgress, ...board.completed];
  return all.find((j) => j.id === jobId) ?? null;
}

function workflowLabel(stage: KarigarColumnKey | undefined) {
  switch (stage) {
    case "assigned":
      return "Assigned";
    case "inProgress":
      return "In production";
    case "completed":
      return "Completed";
    default:
      return "—";
  }
}

export default function KarigarJobDetails() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { pending: advancingJob, runExclusive } = useSubmitLock();
  const { karigarBoard, customerList, moveKarigarJob, dataLoading } = useAppDemo();

  const numericId = jobId ? Number(jobId) : NaN;

  const jobFromBoard = useMemo(() => {
    if (!Number.isFinite(numericId)) return null;
    return findJobInBoard(karigarBoard, numericId);
  }, [karigarBoard, numericId]);

  const [remoteJob, setRemoteJob] = useState<KarigarJob | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setRemoteJob(null);
      setRemoteLoaded(true);
      return;
    }
    let cancelled = false;
    setRemoteLoaded(false);
    setRemoteJob(null);
    fetchKarigarJobById(numericId)
      .then((raw) => {
        if (!cancelled) setRemoteJob(raw);
      })
      .catch(() => {
        if (!cancelled) setRemoteJob(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  const baseJob = useMemo(() => {
    if (remoteJob) return remoteJob;
    if (jobFromBoard) {
      const inferred = inferColumnKey(karigarBoard, numericId);
      return normalizeKarigarJobFromApi({
        ...jobFromBoard,
        columnKey: jobFromBoard.columnKey ?? inferred,
      } as KarigarJob & Record<string, unknown>);
    }
    return null;
  }, [remoteJob, jobFromBoard, karigarBoard, numericId]);

  const columnKey: KarigarColumnKey | undefined =
    baseJob?.columnKey ?? (Number.isFinite(numericId) ? inferColumnKey(karigarBoard, numericId) : undefined);

  const linkedCustomer = useMemo(() => {
    if (!baseJob) return null;
    const byPhone =
      normalizePhoneDigits(baseJob.customerMobile).length >= 10
        ? customerList.find((c) => phonesMatch(baseJob.customerMobile, c.phone))
        : undefined;
    const byName = customerList.find((c) => normCustomerKey(c.name) === normCustomerKey(baseJob.customerName));
    return byPhone ?? byName ?? null;
  }, [baseJob, customerList]);

  const handleDownloadReceipt = useCallback(() => {
    if (!baseJob) return;
    downloadKarigarJobReceiptHtml({
      job: baseJob,
      workflowStage: workflowLabel(columnKey),
      customerEmail: linkedCustomer?.email,
      customerAddress: linkedCustomer?.address,
    });
    toast({ title: "Receipt downloaded", description: `Job #${baseJob.id} receipt has been downloaded (HTML).` });
  }, [baseJob, columnKey, linkedCustomer]);

  const handleAdvance = async () => {
    if (!baseJob) return;
    const id = baseJob.id;
    await runExclusive(async () => {
      try {
        const next = await moveKarigarJob(id);
        if (!next) {
          toast({ title: "Already completed", description: "This job is already in the final stage." });
          return;
        }
        toast({ title: "Job updated", description: `Moved to ${workflowLabel(next as KarigarColumnKey)}.` });
        try {
          const fresh = await fetchKarigarJobById(id);
          setRemoteJob(fresh);
        } catch {
          /* context refresh updated board */
        }
      } catch {
        toast({ title: "Update failed", description: "Could not advance the job. Is the API running?" });
      }
    });
  };

  if (dataLoading) {
    return (
      <AppLayout>
        <PageHeader title="Karigar job" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading…</div>
      </AppLayout>
    );
  }

  if (!jobId || !Number.isFinite(numericId)) {
    return (
      <AppLayout>
        <PageHeader title="Karigar job" subtitle="Invalid link" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Missing job id.</div>
      </AppLayout>
    );
  }

  const waitingRemote = !remoteLoaded && !jobFromBoard;
  if (waitingRemote) {
    return (
      <AppLayout>
        <PageHeader title="Karigar job" subtitle="Loading…" />
        <div className="glass rounded-xl p-6 text-muted-foreground">Loading job…</div>
      </AppLayout>
    );
  }

  if (!baseJob) {
    return (
      <AppLayout>
        <PageHeader title="Karigar job" subtitle="Not found" />
        <div className="glass rounded-xl p-6 text-muted-foreground">
          This karigar job was not found. It may have been removed.
        </div>
      </AppLayout>
    );
  }

  const job = baseJob;
  const priceRupees = parseCurrency(String(job.price ?? ""));
  const priceDisplay = priceRupees > 0 ? formatCurrency(priceRupees) : "—";

  return (
    <AppLayout>
      <PageHeader
        title="Karigar job"
        subtitle={`Job #${job.id}`}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate("/karigar")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Karigar
          </motion.button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 mb-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-700 dark:text-violet-300">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">{job.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Custom work · {workflowLabel(columnKey)}</p>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
            {workflowLabel(columnKey)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Customer</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                {displayStr(job.customerName)}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                {displayStr(job.customerMobile)}
              </p>
              {linkedCustomer && (
                <>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    {displayStr(linkedCustomer.email)}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    {displayStr(linkedCustomer.address)}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/customers/${linkedCustomer.id}`)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open customer profile
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Job info</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Karigar: </span>
                <span className="font-medium text-foreground">{displayStr(job.karigar)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Deadline: </span>
                <span className="font-medium text-foreground">{displayStr(job.deadline)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-semibold text-primary">{priceDisplay}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Priority: </span>
                <span className="capitalize">{displayStr(job.priority)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div
            className={`grid grid-cols-1 gap-8 items-start ${job.referenceImage?.trim() ? "lg:grid-cols-2" : ""}`}
          >
            <div className="space-y-3 text-sm min-w-0">
              <p>
                <span className="text-muted-foreground">Material: </span>
                <span className="text-foreground">{displayStr(job.material)}</span>
              </p>
              {job.size && (
                <p>
                  <span className="text-muted-foreground">Size: </span>
                  <span className="text-foreground">{job.size}</span>
                </p>
              )}
              {job.instructions && (
                <div>
                  <p className="text-muted-foreground mb-1">Instructions</p>
                  <p className="text-foreground whitespace-pre-wrap">{job.instructions}</p>
                </div>
              )}
            </div>
            {job.referenceImage?.trim() ? (
              <div className="lg:pl-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Reference</p>
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 flex justify-center items-center min-h-[200px]">
                  <img
                    src={job.referenceImage}
                    alt="Design reference"
                    className="max-h-[min(420px,55vh)] w-full max-w-full rounded-lg object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
        <h3 className="font-serif font-semibold text-foreground mb-4">Workflow</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Advance this job through Assigned → In production → Completed (same as the Karigar board).
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
          >
            <span className="inline-flex items-center justify-center gap-2 w-full">
              <FileText className="w-4 h-4" /> Download receipt
            </span>
          </button>
          <button
            type="button"
            onClick={() => void handleAdvance()}
            disabled={columnKey === "completed" || advancingJob}
            className="flex-1 rounded-xl gold-gradient px-4 py-3 text-sm font-medium text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {advancingJob ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating…
              </>
            ) : (
              <>
                Advance job <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AppLayout>
  );
}

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Clock, Loader2, CheckCircle2, AlertCircle, Plus, X, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { parseCurrency } from "@/lib/demo";
import { lookupContactForKarigarAssign, normalizePhoneDigits } from "@/lib/customerPhoneLookup";

type AssignItemMode = "new" | "repair" | null;

const columns = [
  { key: "assigned" as const, title: "Assigned", icon: Clock, color: "border-info/40" },
  { key: "inProgress" as const, title: "In Progress", icon: Loader2, color: "border-warning/40" },
  { key: "completed" as const, title: "Completed", icon: CheckCircle2, color: "border-success/40" },
];
const progressStages = ["Assigned", "In Progress", "Completed"] as const;

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

const initialAssignForm = {
  customerPhone: "",
  customerName: "",
  customerEmail: "",
  customerAddress: "",
  title: "",
  karigar: "",
  deadline: "",
  material: "",
  instructions: "",
  size: "",
  price: "",
  referenceImage: "",
};

const Karigar = () => {
  const navigate = useNavigate();
  const suppressJobCardClickUntil = useRef(0);
  const { pending: karigarBusy, runExclusive } = useSubmitLock();
  const { karigarBoard, employeeList, customerList, salesOrders, moveKarigarJob, moveKarigarJobToColumn, addKarigarJob } =
    useAppDemo();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<1 | 2>(1);
  const [assignItemMode, setAssignItemMode] = useState<AssignItemMode>(null);
  const [matchedExisting, setMatchedExisting] = useState(false);
  const [form, setForm] = useState(initialAssignForm);
  const [draggedJobId, setDraggedJobId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<(typeof columns)[number]["key"] | null>(null);

  const karigarOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of employeeList) {
      if (e.role === "Karigar") {
        const n = e.name.trim();
        if (n) names.add(n);
      }
    }
    Object.values(karigarBoard).forEach((jobs) => {
      jobs.forEach((job) => {
        const k = job.karigar.trim();
        if (k) names.add(k);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [karigarBoard, employeeList]);

  const allKarigarJobs = useMemo(
    () => [...karigarBoard.assigned, ...karigarBoard.inProgress, ...karigarBoard.completed],
    [karigarBoard],
  );

  const resetAssignModal = () => {
    setForm(initialAssignForm);
    setAssignStep(1);
    setAssignItemMode(null);
    setMatchedExisting(false);
  };

  const openAssignModal = () => {
    resetAssignModal();
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    resetAssignModal();
  };

  const runCustomerLookup = (opts?: { quiet?: boolean }) => {
    const found = lookupContactForKarigarAssign(form.customerPhone, customerList, salesOrders, allKarigarJobs);
    if (found) {
      setForm((c) => ({
        ...c,
        customerPhone: found.phone.trim() || c.customerPhone,
        customerName: found.name,
        customerEmail: found.email || c.customerEmail,
        customerAddress: found.address || c.customerAddress,
      }));
      setMatchedExisting(true);
      if (!opts?.quiet) {
        const title = found.source === "customer" ? "Customer found" : "Details loaded";
        const description =
          found.source === "customer"
            ? `${found.name} - from your Customers list.`
            : found.source === "order"
              ? `${found.name} - from a previous order with this number.`
              : `${found.name} - from a prior karigar job. Add email or address if missing.`;
        toast({ title, description });
      }
    } else {
      setMatchedExisting(false);
      if (!opts?.quiet) {
        toast({
          title: "New customer",
          description: "No match in Customers, orders, or karigar jobs. Enter their details below.",
        });
      }
    }
  };

  const canAssignStep1Next =
    assignItemMode != null &&
    normalizePhoneDigits(form.customerPhone).length >= 10 &&
    form.customerName.trim().length > 0;

  const handleMove = async (jobId: number) => {
    await runExclusive(async () => {
      try {
        const nextColumn = await moveKarigarJob(jobId);

        if (!nextColumn) {
          toast({ title: "Job already completed", description: "This karigar job is already in the final stage." });
          return;
        }

        toast({ title: "Job moved", description: `The job has been moved to ${nextColumn}.` });
      } catch {
        toast({ title: "Move failed", description: "Check that the API server is running and try again." });
      }
    });
  };

  const handleDropToColumn = async (targetColumn: (typeof columns)[number]["key"]) => {
    const id = draggedJobId;
    if (!id) return;
    await runExclusive(async () => {
      try {
        const moved = await moveKarigarJobToColumn(id, targetColumn);
        setDraggedJobId(null);
        setDragOverColumn(null);

        if (moved) {
          toast({ title: "Job moved", description: `The job has been moved to ${targetColumn}.` });
        }
      } catch {
        setDraggedJobId(null);
        setDragOverColumn(null);
        toast({ title: "Move failed", description: "Check that the API server is running and try again." });
      }
    });
  };

  const handleAssign = async () => {
    if (!canAssignStep1Next) {
      toast({ title: "Customer incomplete", description: "Enter a valid mobile number and full name." });
      return;
    }
    if (!form.title.trim() || !form.karigar.trim() || !form.deadline.trim() || !form.material.trim() || !form.size.trim()) {
      toast({
        title: "Missing job details",
        description: "Fill item name, karigar, deadline, material issued, and size.",
      });
      return;
    }
    if (!parseCurrency(form.price)) {
      toast({ title: "Price required", description: "Enter a valid quoted price in ₹ (e.g. 125000)." });
      return;
    }
    if (assignItemMode === "repair" && !form.referenceImage.trim()) {
      toast({
        title: "Item photo required",
        description: "For a repair, upload a photo of the piece so the karigar can see the work.",
      });
      return;
    }

    const rawTitle = form.title.trim();
    const jobTitle =
      assignItemMode === "repair" && rawTitle && !/^repair\b/i.test(rawTitle) ? `Repair - ${rawTitle}` : rawTitle;
    const karigarName = form.karigar.trim();

    await runExclusive(async () => {
      try {
        await addKarigarJob({
          title: jobTitle,
          karigar: karigarName,
          deadline: form.deadline.trim(),
          material: form.material.trim(),
          instructions: form.instructions.trim(),
          customerName: form.customerName.trim(),
          customerMobile: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim(),
          customerAddress: form.customerAddress.trim(),
          size: form.size.trim(),
          price: form.price.trim(),
          referenceImage: form.referenceImage,
        });
        closeAssignModal();
        toast({
          title: "Item assigned",
          description: `${jobTitle} → ${karigarName}. Customer profile updated in CRM.`,
        });
      } catch {
        toast({ title: "Could not assign", description: "Check that the API server is running and try again." });
      }
    });
  };

  const handleReferenceImageUpload = (file: File | null) => {
    if (!file) {
      setForm((current) => ({ ...current, referenceImage: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, referenceImage: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Karigar Workflow"
        subtitle="Track artisan jobs and production"
        action={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openAssignModal}
            disabled={karigarBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Assign Item
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((col, ci) => {
          const Icon = col.icon;
          const jobs = karigarBoard[col.key];
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.15 }}
              className={`glass rounded-xl border-t-2 transition-colors ${col.color} ${
                dragOverColumn === col.key ? "ring-2 ring-primary/40 bg-primary/5" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.key);
              }}
              onDragLeave={() => {
                setDragOverColumn((current) => (current === col.key ? null : current));
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToColumn(col.key);
              }}
            >
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-serif font-semibold text-foreground">{col.title}</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{jobs.length}</span>
              </div>
              <div className="p-3 space-y-3">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ci * 0.15 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`glass rounded-lg p-3 card-shine hover:ring-1 hover:ring-primary/25 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      karigarBusy ? "cursor-not-allowed opacity-80" : "cursor-grab active:cursor-grabbing"
                    }`}
                    title="Open job details - or drag to another column"
                    draggable={!karigarBusy}
                    onDragStart={(e) => {
                      setDraggedJobId(job.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(job.id));
                    }}
                    onDragEnd={() => {
                      suppressJobCardClickUntil.current = Date.now() + 200;
                      setDraggedJobId(null);
                      setDragOverColumn(null);
                    }}
                    onClick={() => {
                      if (Date.now() < suppressJobCardClickUntil.current) return;
                      navigate(`/karigar/jobs/${job.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/karigar/jobs/${job.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">{job.title}</h4>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[job.priority]}`}>
                        {job.priority === "high" && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                        {job.priority}
                      </span>
                    </div>

                    <div className="mb-3 rounded-lg border border-border/60 bg-secondary/30 p-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Order Progress Tracker</p>
                      <div className="relative">
                        <div className="absolute top-2 left-0 right-0 h-0.5 bg-border" />
                        <div
                          className="absolute top-2 left-0 h-0.5 gold-gradient transition-all duration-500"
                          style={{
                            width:
                              col.key === "assigned"
                                ? "0%"
                                : col.key === "inProgress"
                                  ? "50%"
                                  : "100%",
                          }}
                        />
                        <div className="relative flex items-center justify-between">
                          {progressStages.map((stage, stageIndex) => {
                            const currentIndex =
                              col.key === "assigned" ? 0 : col.key === "inProgress" ? 1 : 2;
                            const active = stageIndex <= currentIndex;
                            return (
                              <div key={stage} className="flex flex-col items-center gap-1">
                                <span
                                  className={`w-4 h-4 rounded-full border text-[10px] leading-none flex items-center justify-center ${
                                    active
                                      ? "gold-gradient text-primary-foreground border-transparent"
                                      : "bg-secondary text-muted-foreground border-border"
                                  }`}
                                >
                                  {stageIndex + 1}
                                </span>
                                <span className={`text-[10px] ${active ? "text-foreground" : "text-muted-foreground"}`}>
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">👤 {job.karigar}</p>
                    <p className="text-xs text-muted-foreground mb-1">🧑‍💼 {job.customerName}</p>
                    <p className="text-xs text-muted-foreground mb-1">📱 {job.customerMobile}</p>
                    <p className="text-xs text-muted-foreground mb-2">📦 {job.material}</p>
                    <p className="text-xs font-semibold text-primary mb-1">💰 {job.price ?? "₹0"}</p>
                    {job.size && <p className="text-xs text-muted-foreground mb-1">📐 Size: {job.size}</p>}
                    {job.instructions && (
                      <p className="text-xs text-muted-foreground mb-2">📝 {job.instructions}</p>
                    )}
                    {job.referenceImage && (
                      <img
                        src={job.referenceImage}
                        alt={`${job.title} reference`}
                        className="w-full h-24 object-cover rounded-lg border border-border mb-2"
                      />
                    )}
                     <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Due: {job.deadline}</span>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           void handleMove(job.id);
                         }}
                         disabled={col.key === "completed" || karigarBusy}
                         className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-opacity disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed"
                       >
                         {col.key === "assigned" ? "Start" : col.key === "inProgress" ? "Complete" : "Done"}
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-background/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:py-10">
          <div className="relative glass rounded-2xl p-6 w-full max-w-2xl max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain my-auto">
            {karigarBusy && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/55 backdrop-blur-[1px]">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Please wait…
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-serif font-bold gold-text">Assign Item</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Step {assignStep} of 2 - {" "}
                  {assignStep === 2
                    ? assignItemMode === "repair"
                      ? "Repair job details & item photo"
                      : "Job details"
                    : assignItemMode === null
                      ? "Pick type, then customer"
                      : assignItemMode === "new"
                        ? "Customer (walk-in / new work)"
                        : "Customer bringing item for repair"}
                </p>
              </div>
              <button
                type="button"
                disabled={karigarBusy}
                onClick={closeAssignModal}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-1.5 mb-6">
              <div className={`h-1 flex-1 rounded-full ${assignStep >= 1 ? "gold-gradient" : "bg-secondary"}`} />
              <div className={`h-1 flex-1 rounded-full ${assignStep >= 2 ? "gold-gradient" : "bg-secondary"}`} />
            </div>

            {assignStep === 1 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/80 bg-secondary/30 p-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignItemMode("new");
                      setForm(initialAssignForm);
                      setMatchedExisting(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                      assignItemMode === "new"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    New item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignItemMode("repair");
                      setForm(initialAssignForm);
                      setMatchedExisting(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                      assignItemMode === "repair"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Wrench className="w-4 h-4 shrink-0 opacity-90" />
                    Repair
                  </button>
                </div>

                {assignItemMode === "repair" && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    Same as new: look up the customer by mobile (not an old job). Step 2 will ask for an{" "}
                    <span className="text-foreground font-medium">item photo</span> (required).
                  </p>
                )}

                {assignItemMode != null && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Mobile number *</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        We match Customers, past orders, and previous karigar jobs on this number.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={form.customerPhone}
                          onChange={(e) => {
                            setForm((c) => ({ ...c, customerPhone: e.target.value }));
                            setMatchedExisting(false);
                          }}
                          onBlur={() => runCustomerLookup({ quiet: true })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              runCustomerLookup();
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                          placeholder="+91 98765 43210"
                        />
                        <button
                          type="button"
                          onClick={() => runCustomerLookup()}
                          className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-secondary/80"
                        >
                          Look up
                        </button>
                      </div>
                    </div>

                    {matchedExisting && (
                      <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                        Existing or known contact - review name, email, and address below.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm text-muted-foreground mb-1 block">Full name *</label>
                        <input
                          value={form.customerName}
                          onChange={(e) => setForm((c) => ({ ...c, customerName: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                        <input
                          type="email"
                          value={form.customerEmail}
                          onChange={(e) => setForm((c) => ({ ...c, customerEmail: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-muted-foreground mb-1 block">Address</label>
                        <textarea
                          value={form.customerAddress}
                          onChange={(e) => setForm((c) => ({ ...c, customerAddress: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 resize-y"
                          placeholder="Street, city, PIN…"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={karigarBusy}
                    onClick={closeAssignModal}
                    className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canAssignStep1Next || karigarBusy}
                    onClick={() => setAssignStep(2)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    Next: job details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {assignStep === 2 && (
              <div className="space-y-4">
                {assignItemMode === "repair" && (
                  <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-foreground flex gap-2 items-start">
                    <Wrench className="w-4 h-4 shrink-0 mt-0.5 text-violet-700 dark:text-violet-400" />
                    <span>
                      <span className="font-semibold">Repair job.</span> Upload a clear photo of the customer&apos;s item.
                      Describe what needs fixing in Instructions.
                    </span>
                  </div>
                )}
                <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">{form.customerName}</span> · {form.customerPhone}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Item Name</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder={
                        assignItemMode === "repair" ? "e.g. Gold chain - clasp repair" : "Royal Bridal Necklace"
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Assign Karigar</label>
                    <select
                      value={form.karigar}
                      onChange={(e) => setForm((current) => ({ ...current, karigar: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Select karigar</option>
                      {karigarOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Deadline</label>
                    <input
                      value={form.deadline}
                      onChange={(e) => setForm((current) => ({ ...current, deadline: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="Apr 12"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Material Issued</label>
                    <input
                      value={form.material}
                      onChange={(e) => setForm((current) => ({ ...current, material: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="45g Gold 22K + stones"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Size</label>
                    <input
                      value={form.size}
                      onChange={(e) => setForm((current) => ({ ...current, size: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="e.g. 16 inch / Ring size 8"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Price (₹) *</label>
                    <input
                      value={form.price}
                      onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                      placeholder="e.g. 125000"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      {assignItemMode === "repair" ? "Item photo *" : "Reference image"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleReferenceImageUpload(e.target.files?.[0] ?? null)}
                      className={`w-full px-2.5 py-2 rounded-lg bg-secondary border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors ${
                        assignItemMode === "repair" && !form.referenceImage
                          ? "border-violet-500/50"
                          : "border-border"
                      }`}
                    />
                    {form.referenceImage && (
                      <img
                        src={form.referenceImage}
                        alt="Reference preview"
                        className="mt-3 w-full h-28 object-cover rounded-lg border border-border"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm text-muted-foreground mb-1 block">Instructions</label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setForm((current) => ({ ...current, instructions: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 min-h-24"
                      placeholder={
                        assignItemMode === "repair"
                          ? "What needs repair: e.g. broken clasp, stone loose, resize to size 7…"
                          : "Add all making instructions for karigar..."
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={karigarBusy}
                    onClick={() => setAssignStep(1)}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <button
                      type="button"
                      disabled={karigarBusy}
                      onClick={closeAssignModal}
                      className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={karigarBusy}
                      onClick={() => void handleAssign()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-medium btn-ripple disabled:opacity-60"
                    >
                      {karigarBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Assigning…
                        </>
                      ) : (
                        "Assign Item"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Karigar;

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, Inbox, Loader2, MessageSquareText, Plus, Sparkles, UserRound, X } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import {
  createSuperAdminTicket,
  fetchSuperAdminTickets,
  fetchSuperAdminUsers,
  updateSuperAdminTicket,
  type SuperAdminTicket,
  type SuperAdminTicketBody,
  type SuperAdminTicketPriority,
  type SuperAdminTicketStatus,
  type SuperAdminUser,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const emptyTicket: SuperAdminTicketBody = {
  title: "",
  description: "",
  requesterName: "",
  requesterEmail: "",
  priority: "medium",
  assignedAdminId: null,
};

const statusLabels: Record<SuperAdminTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityClass: Record<SuperAdminTicketPriority, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-violet-50 text-violet-700 ring-violet-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  urgent: "bg-red-50 text-red-700 ring-red-200",
};

const statusClass: Record<SuperAdminTicketStatus, string> = {
  open: "bg-sky-50 text-sky-700 ring-sky-200",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : "No date");

export default function SuperAdminTickets() {
  const { token } = useSuperAdminAuth();
  const [tickets, setTickets] = useState<SuperAdminTicket[]>([]);
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SuperAdminTicketStatus>("all");
  const [form, setForm] = useState<SuperAdminTicketBody>(emptyTicket);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    const data = await fetchSuperAdminTickets(token, statusFilter === "all" ? undefined : statusFilter);
    setTickets(data);
  }, [token, statusFilter]);

  useEffect(() => {
    if (!token) return;
    void loadTickets().catch((e) => toast({ title: "Could not load tickets", description: e instanceof Error ? e.message : "Try again." }));
    fetchSuperAdminUsers(token)
      .then(setAdmins)
      .catch(() => {});
  }, [token, loadTickets]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) =>
      [ticket.title, ticket.description, ticket.requesterName, ticket.requesterEmail, ticket.priority, ticket.status, ticket.assignedAdminName ?? ""].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [tickets, search]);

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
      urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
    };
  }, [tickets]);

  const saveTicket = async () => {
    if (!token) return;
    if (!form.title.trim()) {
      toast({ title: "Ticket title required", description: "Add a short title before creating the ticket." });
      return;
    }
    setBusy(true);
    try {
      await createSuperAdminTicket(token, form);
      toast({ title: "Ticket created", description: `${form.title} has been added to the queue.` });
      setForm(emptyTicket);
      setModalOpen(false);
      await loadTickets();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const updateTicket = async (ticket: SuperAdminTicket, body: Parameters<typeof updateSuperAdminTicket>[2]) => {
    if (!token) return;
    setBusy(true);
    try {
      await updateSuperAdminTicket(token, ticket.id, body);
      await loadTickets();
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminLayout search={search} onSearchChange={setSearch}>
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-violet-200/80 bg-gradient-to-br from-[#13051f] via-violet-950 to-fuchsia-900 p-5 text-white shadow-2xl shadow-violet-900/25 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-200" />
              Support Command
            </div>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Tickets</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-100/80">
              Manage support requests, onboarding issues, internal tasks, priorities, ownership, and resolution status.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg shadow-black/20 transition hover:bg-violet-50"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </motion.button>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total", counts.total, Inbox],
            ["Open", counts.open, MessageSquareText],
            ["In Progress", counts.inProgress, Clock3],
            ["Urgent", counts.urgent, AlertTriangle],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-violet-100/70">{label}</p>
                <Icon className="h-4 w-4 text-fuchsia-100" />
              </div>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200/80 bg-white/85 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                statusFilter === status
                  ? "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-violet-50 text-violet-800 hover:bg-violet-100"
              }`}
            >
              {status === "all" ? "All Tickets" : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {filteredTickets.map((ticket, index) => (
          <motion.article
            key={ticket.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -5, scale: 1.005 }}
            className="group relative overflow-hidden rounded-[1.4rem] border border-violet-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(76,29,149,0.65)] transition-all hover:border-violet-300 hover:shadow-[0_26px_70px_-34px_rgba(76,29,149,0.75)]"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-500" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/20 blur-2xl transition group-hover:scale-110" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/95 text-violet-800 shadow-lg">
                    <MessageSquareText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-xl font-bold text-white drop-shadow">{ticket.title}</h2>
                    <p className="mt-0.5 text-xs text-violet-100">#{ticket.id} · {formatDateTime(ticket.createdAt)}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ring-1 ${priorityClass[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/95 via-white to-cyan-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="max-w-xl text-sm leading-relaxed text-zinc-700">{ticket.description || "No description added."}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">Requester</p>
                    <p className="mt-1 truncate font-semibold text-zinc-900">{ticket.requesterName || "Internal"}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="mt-1 truncate font-semibold text-zinc-900">{ticket.assignedAdminName || "Unassigned"}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="mt-1 truncate font-semibold text-zinc-900">{formatDateTime(ticket.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-violet-100 pt-4 sm:grid-cols-3">
                <select
                  value={ticket.status}
                  disabled={busy}
                  onChange={(e) => void updateTicket(ticket, { status: e.target.value as SuperAdminTicketStatus })}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950 outline-none transition focus:border-violet-400"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={ticket.priority}
                  disabled={busy}
                  onChange={(e) => void updateTicket(ticket, { priority: e.target.value as SuperAdminTicketPriority })}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950 outline-none transition focus:border-violet-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={ticket.assignedAdminId ?? ""}
                  disabled={busy}
                  onChange={(e) => void updateTicket(ticket, { assignedAdminId: e.target.value ? Number(e.target.value) : null })}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950 outline-none transition focus:border-violet-400"
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {!filteredTickets.length ? (
        <div className="mt-5 rounded-2xl border border-violet-200/80 bg-white/90 p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-violet-600" />
          <p className="mt-3 font-semibold text-zinc-900">No tickets found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different filter or create a new ticket.</p>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-[1.4rem] border border-violet-200 bg-white shadow-2xl shadow-violet-900/20">
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-800 via-fuchsia-700 to-cyan-600 p-6 text-white">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">Ticket desk</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold">Create Ticket</h2>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg bg-white/10 p-1 text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm outline-none focus:border-violet-400 sm:col-span-2" placeholder="Ticket title" />
              <select value={form.priority} onChange={(e) => setForm((c) => ({ ...c, priority: e.target.value as SuperAdminTicketPriority }))} className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm outline-none focus:border-violet-400">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
              <select value={form.assignedAdminId ?? ""} onChange={(e) => setForm((c) => ({ ...c, assignedAdminId: e.target.value ? Number(e.target.value) : null }))} className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm outline-none focus:border-violet-400">
                <option value="">Assign later</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>{admin.name}</option>
                ))}
              </select>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
                <input value={form.requesterName} onChange={(e) => setForm((c) => ({ ...c, requesterName: e.target.value }))} className="w-full rounded-xl border border-violet-200 bg-violet-50/70 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400" placeholder="Requester name" />
              </div>
              <input value={form.requesterEmail} onChange={(e) => setForm((c) => ({ ...c, requesterEmail: e.target.value }))} className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm outline-none focus:border-violet-400" placeholder="Requester email" />
              <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-32 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5 text-sm outline-none focus:border-violet-400 sm:col-span-2" placeholder="Describe the issue or request" />
            </div>
            <div className="flex justify-end gap-3 border-t border-violet-100 bg-violet-50/70 px-6 py-4">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm">Cancel</button>
              <button type="button" disabled={busy} onClick={() => void saveTicket()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-violet-500/20 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminLayout>
  );
}

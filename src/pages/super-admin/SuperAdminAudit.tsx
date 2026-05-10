import { useEffect, useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import { fetchSuperAdminAuditLogs, type SuperAdminAuditLog } from "@/lib/api";

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : "Unknown time");

export default function SuperAdminAudit() {
  const { token } = useSuperAdminAuth();
  const [logs, setLogs] = useState<SuperAdminAuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchSuperAdminAuditLogs(token)
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load audit logs"));
  }, [token]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => [log.actor, log.action, log.detail].some((value) => value.toLowerCase().includes(q)));
  }, [logs, search]);

  return (
    <SuperAdminLayout search={search} onSearchChange={setSearch}>
      <PageHeader title="Audit Logs" subtitle="Track every Super Admin action across account management" />
      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground">{filteredLogs.length} events visible</p>
        </div>
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{log.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{log.detail}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Actor: {log.actor}</p>
            </article>
          ))}
          {!filteredLogs.length ? <p className="text-center text-sm text-muted-foreground">No audit logs found.</p> : null}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

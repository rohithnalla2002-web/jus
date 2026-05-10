import { useEffect, useState } from "react";
import { Activity, Clock, Database, Server } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import {
  fetchSuperAdminBusinessOverview,
  fetchSuperAdminSystemHealth,
  type SuperAdminBusinessOverview,
  type SuperAdminSystemHealth,
} from "@/lib/api";

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "No data");

export default function SuperAdminMonitoring() {
  const { token } = useSuperAdminAuth();
  const [business, setBusiness] = useState<SuperAdminBusinessOverview | null>(null);
  const [health, setHealth] = useState<SuperAdminSystemHealth | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchSuperAdminBusinessOverview(token), fetchSuperAdminSystemHealth(token)])
      .then(([businessData, healthData]) => {
        setBusiness(businessData);
        setHealth(healthData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load monitoring data"));
  }, [token]);

  return (
    <SuperAdminLayout>
      <PageHeader title="Business & System Monitoring" subtitle="Platform health, business KPIs, and latest operational activity" />
      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">System Health</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-secondary/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">API</p>
              <p className="mt-1 font-semibold text-emerald-600">{health?.api.status ?? "checking"}</p>
              <p className="text-xs text-muted-foreground">{health?.api.responseMs ?? 0}ms response</p>
            </div>
            <div className="rounded-xl bg-secondary/70 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Database className="h-3.5 w-3.5" />
                Database
              </p>
              <p className="mt-1 font-semibold text-emerald-600">{health?.database.status ?? "checking"}</p>
              <p className="text-xs text-muted-foreground">Server time: {formatDateTime(health?.database.serverTime)}</p>
            </div>
            <div className="rounded-xl bg-secondary/70 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Latest activity
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatDateTime(health?.latestActivityAt)}</p>
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">Latest Activity</h2>
          </div>
          <div className="space-y-3">
            {(business?.recentActivities ?? []).map((item, index) => (
              <div key={`${item.action}-${index}`} className="rounded-xl border border-border/70 bg-card/60 p-3">
                <p className="font-semibold text-foreground">{item.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
            {!business?.recentActivities.length ? <p className="text-sm text-muted-foreground">No recent activity found.</p> : null}
          </div>
        </section>
      </div>

      <section className="glass mt-6 rounded-2xl p-5">
        <h2 className="font-serif text-xl font-bold text-foreground">Database Table Counts</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(health?.tableCounts ?? {}).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-secondary/70 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</p>
            </div>
          ))}
        </div>
      </section>
    </SuperAdminLayout>
  );
}

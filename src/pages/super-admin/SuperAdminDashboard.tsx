import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, ShieldCheck, UserCheck, Users } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import {
  fetchSuperAdminOverview,
  type SuperAdminOverview,
} from "@/lib/api";

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : "Never");

export default function SuperAdminDashboard() {
  const { token } = useSuperAdminAuth();
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchSuperAdminOverview(token)
      .then(setOverview)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load overview"));
  }, [token]);

  const stats = [
    { label: "Total Admins", value: overview?.stats.totalAdmins ?? 0, icon: Users, color: "from-violet-600 to-fuchsia-500" },
    { label: "Active Admins", value: overview?.stats.activeAdmins ?? 0, icon: ShieldCheck, color: "from-emerald-500 to-teal-500" },
    { label: "Inactive Admins", value: overview?.stats.inactiveAdmins ?? 0, icon: ShieldAlert, color: "from-amber-500 to-orange-500" },
    { label: "Admins Logged In", value: overview?.stats.adminsWithLogins ?? 0, icon: UserCheck, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <SuperAdminLayout>
      <PageHeader title="Super Admin Command Center" subtitle="Platform-wide control for admin access, security and audits" />
      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="glass card-shine rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">Recent Admins</h2>
          </div>
          <div className="space-y-3">
            {(overview?.recentAdmins ?? []).map((admin) => (
              <div key={admin.id} className="rounded-xl border border-border/70 bg-card/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{admin.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{admin.username} · {admin.email || "No email"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${admin.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {admin.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Last login: {formatDateTime(admin.lastLoginAt)}</p>
              </div>
            ))}
            {!overview?.recentAdmins.length ? <p className="text-sm text-muted-foreground">No admins created yet.</p> : null}
          </div>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">Recent Audit Activity</h2>
          </div>
          <div className="space-y-3">
            {(overview?.recentAuditLogs ?? []).map((log) => (
              <div key={log.id} className="rounded-xl border border-border/70 bg-card/60 p-3">
                <p className="font-semibold text-foreground">{log.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">{log.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{log.actor} · {formatDateTime(log.createdAt)}</p>
              </div>
            ))}
            {!overview?.recentAuditLogs.length ? <p className="text-sm text-muted-foreground">No audit activity yet.</p> : null}
          </div>
        </section>
      </div>
    </SuperAdminLayout>
  );
}

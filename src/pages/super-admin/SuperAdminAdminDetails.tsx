import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, KeyRound, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import { fetchSuperAdminUserDetail, type AdminPermissionKey, type SuperAdminAuditLog, type SuperAdminUser } from "@/lib/api";

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : "Never");
const permissionItems: { key: AdminPermissionKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "karigar", label: "Karigar" },
  { key: "customers", label: "Customers" },
  { key: "employees", label: "Employees" },
  { key: "accounting", label: "Accounting" },
  { key: "reports", label: "Reports" },
  { key: "goldSchemes", label: "Gold Schemes" },
  { key: "oldGoldExchange", label: "Old Gold" },
];
const isAdminLocked = (admin: SuperAdminUser) => Boolean(admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now());

export default function SuperAdminAdminDetails() {
  const { token } = useSuperAdminAuth();
  const { adminId } = useParams();
  const [admin, setAdmin] = useState<SuperAdminUser | null>(null);
  const [logs, setLogs] = useState<SuperAdminAuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !adminId) return;
    fetchSuperAdminUserDetail(token, Number(adminId))
      .then((data) => {
        setAdmin(data.admin);
        setLogs(data.auditLogs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load admin"));
  }, [token, adminId]);

  return (
    <SuperAdminLayout>
      <PageHeader
        title={admin ? admin.name : "Admin Details"}
        subtitle="Complete account profile, login status and audit history"
        action={
          <Link to="/super-admin/admins" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {admin ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className="glass rounded-2xl p-5 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-cyan-500">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-serif text-2xl font-bold text-foreground">{admin.name}</h2>
                <p className="text-sm text-muted-foreground">@{admin.username}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {admin.roleLabel} · <span className={admin.status === "active" ? "text-emerald-600" : "text-amber-600"}>{admin.status}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                {admin.email || "No email"}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                {admin.phone || "No phone"}
              </p>
            </div>
            <div className="mt-5 rounded-xl bg-secondary/70 p-4 text-sm">
              <p className="text-muted-foreground">Created: <span className="text-foreground">{formatDateTime(admin.createdAt)}</span></p>
              <p className="mt-2 text-muted-foreground">Updated: <span className="text-foreground">{formatDateTime(admin.updatedAt)}</span></p>
              <p className="mt-2 text-muted-foreground">Last login: <span className="text-foreground">{formatDateTime(admin.lastLoginAt)}</span></p>
            </div>
            <div className="mt-5 rounded-xl border border-border/70 bg-card/70 p-4 text-sm">
              <p className="mb-3 font-semibold text-foreground">Security State</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Lock: <span className={isAdminLocked(admin) ? "text-destructive" : "text-emerald-600"}>
                  {isAdminLocked(admin) ? `Locked until ${formatDateTime(admin.lockedUntil)}` : "Unlocked"}
                </span>
              </p>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <KeyRound className="h-4 w-4 text-primary" />
                Force reset: <span className={admin.forcePasswordReset ? "text-amber-600" : "text-emerald-600"}>
                  {admin.forcePasswordReset ? "Required" : "Not required"}
                </span>
              </p>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Failed attempts: <span className="text-foreground">{admin.failedLoginCount}</span>
              </p>
              <p className="mt-2 text-muted-foreground">Last failed: <span className="text-foreground">{formatDateTime(admin.lastFailedLoginAt)}</span></p>
            </div>
          </section>

          <section className="glass rounded-2xl p-5 lg:col-span-2">
            <div className="mb-5 rounded-2xl border border-border/70 bg-card/60 p-4">
              <h2 className="font-serif text-xl font-bold text-foreground">Module Permissions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {permissionItems.map((item) => (
                  <span
                    key={item.key}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      admin.permissions[item.key] ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.label}: {admin.permissions[item.key] ? "On" : "Off"}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold text-foreground">Audit Trail</h2>
            </div>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border/70 bg-card/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{log.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Actor: {log.actor}</p>
                </div>
              ))}
              {!logs.length ? <p className="text-sm text-muted-foreground">No audit events for this admin yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </SuperAdminLayout>
  );
}

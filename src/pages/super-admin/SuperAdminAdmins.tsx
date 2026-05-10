import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Eye, KeyRound, Loader2, Lock, Pencil, Plus, ShieldCheck, ShieldX, Sparkles, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import {
  createSuperAdminUser,
  deactivateSuperAdminUser,
  fetchSuperAdminUsers,
  resetSuperAdminUserPassword,
  setSuperAdminUserForceReset,
  setSuperAdminUserLock,
  updateSuperAdminUser,
  type AdminPermissionKey,
  type AdminPermissions,
  type SuperAdminCreateAdminBody,
  type SuperAdminUser,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type AdminForm = SuperAdminCreateAdminBody & { status: "active" | "inactive"; permissions: AdminPermissions };

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

const allPermissions = Object.fromEntries(permissionItems.map((item) => [item.key, true])) as AdminPermissions;

const emptyForm: AdminForm = {
  username: "",
  password: "",
  name: "",
  email: "",
  phone: "",
  roleLabel: "Branch Admin",
  status: "active",
  permissions: allPermissions,
};

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : "Never");
const isAdminLocked = (admin: SuperAdminUser) => Boolean(admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now());

export default function SuperAdminAdmins() {
  const { token } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [editing, setEditing] = useState<SuperAdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordResetFor, setPasswordResetFor] = useState<SuperAdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAdmins = useCallback(async () => {
    if (!token) return;
    const data = await fetchSuperAdminUsers(token);
    setAdmins(data);
  }, [token]);

  useEffect(() => {
    void loadAdmins().catch((e) => toast({ title: "Could not load admins", description: e instanceof Error ? e.message : "Try again." }));
  }, [loadAdmins]);

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((admin) =>
      [admin.username, admin.name, admin.email, admin.phone, admin.roleLabel, admin.status].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [admins, search]);

  const adminSummary = useMemo(() => {
    const locked = admins.filter(isAdminLocked).length;
    return {
      total: admins.length,
      active: admins.filter((admin) => admin.status === "active").length,
      locked,
      resetRequired: admins.filter((admin) => admin.forcePasswordReset).length,
    };
  }, [admins]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (admin: SuperAdminUser) => {
    setEditing(admin);
    setForm({
      username: admin.username,
      password: "",
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      roleLabel: admin.roleLabel,
      status: admin.status,
      permissions: admin.permissions,
    });
    setModalOpen(true);
  };

  const saveAdmin = async () => {
    if (!token) return;
    if (!form.name.trim() || !form.username.trim() || (!editing && !form.password.trim())) {
      toast({ title: "Missing details", description: "Name, username and password are required for new admins." });
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await updateSuperAdminUser(token, editing.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          roleLabel: form.roleLabel,
          status: form.status,
          permissions: form.permissions,
        });
        toast({ title: "Admin updated", description: `${form.name} details were saved.` });
      } else {
        await createSuperAdminUser(token, form);
        toast({ title: "Admin created", description: `${form.name} can now sign in from Admin Login.` });
      }
      await loadAdmins();
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const deactivateAdmin = async (admin: SuperAdminUser) => {
    if (!token) return;
    setBusy(true);
    try {
      await deactivateSuperAdminUser(token, admin.id);
      toast({ title: "Admin deactivated", description: `${admin.name} can no longer sign in.` });
      await loadAdmins();
    } catch (e) {
      toast({ title: "Request failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const toggleLock = async (admin: SuperAdminUser) => {
    if (!token) return;
    const locked = !isAdminLocked(admin);
    setBusy(true);
    try {
      await setSuperAdminUserLock(token, admin.id, locked, 15);
      toast({
        title: locked ? "Admin locked" : "Admin unlocked",
        description: locked ? `${admin.name} is locked for 15 minutes.` : `${admin.name} can sign in again.`,
      });
      await loadAdmins();
    } catch (e) {
      toast({ title: "Request failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const toggleForceReset = async (admin: SuperAdminUser) => {
    if (!token) return;
    setBusy(true);
    try {
      await setSuperAdminUserForceReset(token, admin.id, !admin.forcePasswordReset);
      toast({
        title: admin.forcePasswordReset ? "Reset requirement cleared" : "Password reset required",
        description: admin.forcePasswordReset
          ? `${admin.name} can sign in with the current password.`
          : `${admin.name} must contact Super Admin before access.`,
      });
      await loadAdmins();
    } catch (e) {
      toast({ title: "Request failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const resetPasswordForAdmin = async () => {
    if (!token || !passwordResetFor) return;
    if (resetPassword.trim().length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters." });
      return;
    }
    setBusy(true);
    try {
      await resetSuperAdminUserPassword(token, passwordResetFor.id, resetPassword);
      toast({ title: "Password reset", description: `${passwordResetFor.name} can use the new password now.` });
      setPasswordResetFor(null);
      setResetPassword("");
      await loadAdmins();
    } catch (e) {
      toast({ title: "Reset failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminLayout search={search} onSearchChange={setSearch}>
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-violet-200/80 bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 p-5 text-white shadow-2xl shadow-violet-900/25 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">
              <Crown className="h-3.5 w-3.5 text-fuchsia-200" />
              Access Command
            </div>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Admin Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-100/80">
              Create polished admin profiles, control module permissions, lock risky access, and keep every login secure.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg shadow-black/20 transition hover:bg-violet-50"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </motion.button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total", adminSummary.total, "All admins"],
            ["Active", adminSummary.active, "Can access"],
            ["Locked", adminSummary.locked, "Temporarily blocked"],
            ["Reset", adminSummary.resetRequired, "Password required"],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-violet-100/70">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-[11px] text-violet-100/65">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAdmins.map((admin, index) => (
          (() => {
            const locked = isAdminLocked(admin);
            const enabledPermissions = permissionItems.filter((item) => admin.permissions[item.key]).length;
            const permissionPreview = permissionItems.filter((item) => admin.permissions[item.key]).slice(0, 4);
            const initials = admin.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || admin.username.slice(0, 2).toUpperCase();
            return (
          <motion.article
            key={admin.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="group relative overflow-hidden rounded-[1.4rem] border border-violet-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(76,29,149,0.65)] transition-all hover:border-violet-300 hover:shadow-[0_26px_70px_-34px_rgba(76,29,149,0.75)]"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-500" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/20 blur-2xl transition group-hover:scale-110" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/95 text-lg font-black text-violet-800 shadow-lg">
                    {initials}
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="truncate font-serif text-xl font-bold text-white drop-shadow">{admin.name}</p>
                    <p className="truncate text-sm text-violet-100">@{admin.username}</p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${admin.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {admin.status === "active" ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                  {admin.status}
                </span>
              </div>

              <div className="mt-7 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/95 via-white to-cyan-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{admin.roleLabel}</p>
                    <p className="mt-1 truncate text-sm text-zinc-700">{admin.email || "No email"} · {admin.phone || "No phone"}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <UserRound className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-muted-foreground">Permissions</p>
                    <p className="mt-1 font-bold text-violet-800">{enabledPermissions}/{permissionItems.length}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-muted-foreground">Failed logins</p>
                    <p className="mt-1 font-bold text-violet-800">{admin.failedLoginCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {permissionPreview.map((item) => (
                  <span key={item.key} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
                    {item.label}
                  </span>
                ))}
                {enabledPermissions > permissionPreview.length ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                    +{enabledPermissions - permissionPreview.length} more
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {locked ? <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive"><Lock className="h-3 w-3" /> Locked until {formatDateTime(admin.lockedUntil)}</span> : null}
                {admin.forcePasswordReset ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700"><KeyRound className="h-3 w-3" /> Password reset required</span> : null}
                {!locked && !admin.forcePasswordReset ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700"><Sparkles className="h-3 w-3" /> Access healthy</span> : null}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">Last login: <span className="font-medium text-zinc-700">{formatDateTime(admin.lastLoginAt)}</span></p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-violet-100 pt-4">
              <button type="button" onClick={() => navigate(`/super-admin/admins/${admin.id}`)} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700">
                <Eye className="h-3.5 w-3.5" />
                Details
              </button>
              <button type="button" onClick={() => openEdit(admin)} className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button type="button" onClick={() => setPasswordResetFor(admin)} className="rounded-xl bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-500/15">
                Reset Password
              </button>
              <button type="button" disabled={busy} onClick={() => void toggleLock(admin)} className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-50 hover:bg-amber-500/15">
                {locked ? "Unlock" : "Lock"}
              </button>
              <button type="button" disabled={busy} onClick={() => void toggleForceReset(admin)} className="rounded-xl bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-700 disabled:opacity-50 hover:bg-fuchsia-500/15">
                {admin.forcePasswordReset ? "Clear Reset" : "Force Reset"}
              </button>
              {admin.status === "active" ? (
                <button type="button" disabled={busy} onClick={() => void deactivateAdmin(admin)} className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive disabled:opacity-50 hover:bg-destructive/15">
                  Deactivate
                </button>
              ) : null}
              </div>
            </div>
          </motion.article>
            );
          })()
        ))}
      </div>

      {!filteredAdmins.length ? <div className="glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">No admins match your search.</div> : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl p-6 glass">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold gold-text">{editing ? "Edit Admin" : "Add Admin"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Full name" />
              <input value={form.username} disabled={Boolean(editing)} onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm disabled:opacity-60" placeholder="Username" />
              {!editing ? <input type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Password" /> : null}
              <input value={form.roleLabel} onChange={(e) => setForm((c) => ({ ...c, roleLabel: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Role label" />
              <input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Email" />
              <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Phone" />
              {editing ? (
                <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as AdminForm["status"] }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : null}
            </div>
            <div className="mt-5 rounded-xl border border-border/70 bg-secondary/50 p-4">
              <p className="text-sm font-semibold text-foreground">Module Permissions</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {permissionItems.map((item) => (
                  <label key={item.key} className="flex items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={form.permissions[item.key]}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          permissions: { ...current.permissions, [item.key]: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 accent-violet-600"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" disabled={busy} onClick={() => void saveAdmin()} className="inline-flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Save Changes" : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {passwordResetFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 glass">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">Reset Password</h2>
              <button type="button" onClick={() => setPasswordResetFor(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">Set a new password for {passwordResetFor.name}.</p>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="New password" />
            <button type="button" disabled={busy} onClick={() => void resetPasswordForAdmin()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reset Password
            </button>
          </div>
        </div>
      ) : null}
    </SuperAdminLayout>
  );
}

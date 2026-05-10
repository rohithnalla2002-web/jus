import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Lock, ShieldCheck, Sparkles, User } from "lucide-react";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import { COMPANY_CIN, COMPANY_LEGAL_NAME } from "@/lib/company";

/**
 * Optional VITE_LOGIN_HINT_* — mirror server ADMIN_* / SUPER_ADMIN_* for dev/prod hints.
 * Use `||` fallbacks: an empty string from the host env (e.g. Netlify key with no value) must not
 * wipe defaults — otherwise "super" would wrongly POST to /api/admin/login instead of /api/super-admin/login.
 */
const hintAdminUser = import.meta.env.VITE_LOGIN_HINT_ADMIN_USERNAME?.trim() || "admin";
const hintAdminPass = import.meta.env.VITE_LOGIN_HINT_ADMIN_PASSWORD ?? "";
const hintSuperUser = import.meta.env.VITE_LOGIN_HINT_SUPER_USERNAME?.trim() || "super";
const hintSuperPass = import.meta.env.VITE_LOGIN_HINT_SUPER_PASSWORD?.trim() || "super@123";

export default function AdminLogin() {
  const navigate = useNavigate();
  const adminAuth = useAdminAuth();
  const superAdminAuth = useSuperAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Wait until both sessions have finished loading; otherwise a stale admin token + slow super session (prod latency) sends users to /dashboard before super resolves. */
  useEffect(() => {
    if (!adminAuth.authReady || !superAdminAuth.authReady) return;
    if (superAdminAuth.isAuthenticated) {
      navigate("/super-admin", { replace: true });
      return;
    }
    if (adminAuth.isAuthenticated) navigate("/dashboard", { replace: true });
  }, [
    adminAuth.authReady,
    adminAuth.isAuthenticated,
    superAdminAuth.authReady,
    superAdminAuth.isAuthenticated,
    navigate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const isSuperAdminAttempt =
        username.trim().toLowerCase() === hintSuperUser.trim().toLowerCase();
      let result: { ok: boolean; error?: string; loginAsSuperAdmin?: boolean };
      if (isSuperAdminAttempt) {
        adminAuth.logout();
        result = await superAdminAuth.login(username, password);
      } else {
        superAdminAuth.logout();
        result = await adminAuth.login(username, password);
      }
      if (!result.ok) {
        setError(result.error ?? "Sign in failed");
        return;
      }
      /** Server accepted Super Admin on /api/admin/login; session key lives outside Router — hard-navigate so SuperAdminAuthProvider reloads. */
      if ("loginAsSuperAdmin" in result && result.loginAsSuperAdmin) {
        window.location.assign(`${window.location.origin}/super-admin`);
        return;
      }
      navigate(isSuperAdminAttempt ? "/super-admin" : "/dashboard", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&q=60')] bg-cover bg-center opacity-10" />
      <motion.div
        aria-hidden
        className="absolute -left-20 top-20 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
        animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-200/70 bg-white/90 p-8 shadow-2xl shadow-violet-200/60 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-500" />
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Unified Access
        </div>
        <div className="mx-auto flex justify-center">
          <GoldMindLogoMark size="xl" />
        </div>
        <h1 className="mt-6 text-center font-serif text-3xl font-bold text-zinc-900">Admin Login</h1>
        <p className="mt-2 text-center text-xs text-zinc-600">
          GoldMind ERP · {COMPANY_LEGAL_NAME} · CIN {COMPANY_CIN}
        </p>
        <p className="mt-1 text-center text-[11px] text-zinc-500">
          Sign in as Admin or Super Admin from this single secure page.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-violet-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-violet-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.01 }}
            whileTap={{ scale: submitting ? 1 : 0.99 }}
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {submitting ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>
        <div className="mt-4 space-y-1 text-center text-[11px] text-zinc-600">
          <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-violet-700" aria-hidden />
            Branch admin: <span className="font-semibold text-zinc-700">{hintAdminUser}</span>
            {hintAdminPass ? (
              <>
                {" "}
                / <span className="font-semibold text-zinc-700">{hintAdminPass}</span>
              </>
            ) : (
              <span className="text-zinc-500"> · password = ADMIN_PASSWORD in API .env</span>
            )}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
            <Crown className="h-3.5 w-3.5 shrink-0 text-violet-700" aria-hidden />
            Super Admin: <span className="font-semibold text-zinc-700">{hintSuperUser}</span> /{" "}
            <span className="font-semibold text-zinc-700">{hintSuperPass}</span>
          </p>
        </div>
        <button type="button" onClick={() => navigate("/")} className="mt-4 w-full text-center text-xs text-zinc-600 hover:text-violet-700">
          ← Back to shop
        </button>
      </motion.div>
    </div>
  );
}

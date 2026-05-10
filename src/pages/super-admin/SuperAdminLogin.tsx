import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Lock, ShieldCheck, Sparkles, User } from "lucide-react";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import { COMPANY_CIN, COMPANY_LEGAL_NAME } from "@/lib/company";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authReady } = useSuperAdminAuth();
  const [username, setUsername] = useState("super");
  const [password, setPassword] = useState("super@123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) navigate("/super-admin", { replace: true });
  }, [authReady, isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.ok) {
        setError(result.error ?? "Sign in failed");
        return;
      }
      navigate("/super-admin", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#12051f] via-violet-950 to-[#07111f] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1600&q=60')] bg-cover bg-center opacity-10" />
      <motion.div
        aria-hidden
        className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, 14, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl shadow-fuchsia-950/40 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-500" />
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/60 bg-fuchsia-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-800">
          <Crown className="h-3.5 w-3.5" />
          Super Admin Access
        </div>
        <div className="mx-auto flex justify-center">
          <GoldMindLogoMark size="xl" />
        </div>
        <h1 className="mt-6 text-center font-serif text-3xl font-bold text-zinc-900">Super Admin Login</h1>
        <p className="mt-2 text-center text-xs text-zinc-600">
          {COMPANY_LEGAL_NAME} · CIN {COMPANY_CIN}
        </p>
        <p className="mt-1 text-center text-[11px] text-zinc-500">Manage admins, permissions, and platform audit activity.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-violet-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-sm transition focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                placeholder="super"
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
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-violet-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-sm transition focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                placeholder="super@123"
              />
            </div>
          </div>
          {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p> : null}
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.01 }}
            whileTap={{ scale: submitting ? 1 : 0.99 }}
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {submitting ? "Opening command center..." : "Enter Super Admin"}
          </motion.button>
        </form>
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-zinc-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Default credentials: super / super@123
        </p>
      </motion.div>
    </div>
  );
}

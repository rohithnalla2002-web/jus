import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { COMPANY_CIN, COMPANY_LEGAL_NAME } from "@/lib/company";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authReady } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [authReady, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.ok) {
        setError(result.error ?? "Sign in failed");
        return;
      }
      navigate("/dashboard", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&q=60')] bg-cover bg-center opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-8 shadow-2xl shadow-amber-900/20 backdrop-blur-xl"
      >
        <div className="mx-auto flex justify-center">
          <GoldMindLogoMark size="xl" />
        </div>
        <h1 className="mt-6 text-center font-serif text-2xl font-bold text-white">Admin Login</h1>
        <p className="mt-2 text-center text-xs text-zinc-500">
          GoldMind ERP · {COMPANY_LEGAL_NAME} · CIN {COMPANY_CIN}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
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
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 py-3.5 text-sm font-bold text-black shadow-lg shadow-amber-600/25 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>
        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Credentials are set in <span className="text-zinc-500">.env</span> as{" "}
          <span className="text-zinc-500">ADMIN_USERNAME</span> / <span className="text-zinc-500">ADMIN_PASSWORD</span>
        </p>
        <button type="button" onClick={() => navigate("/")} className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-amber-400">
          ← Back to shop
        </button>
      </motion.div>
    </div>
  );
}

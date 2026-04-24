import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin, adminSession } from "@/lib/api";

const TOKEN_KEY = "goldmind-erp-admin-token";

type AdminAuthContextValue = {
  /** True after initial session check (or no token). */
  authReady: boolean;
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthReady(true);
      return;
    }
    adminSession(token)
      .then((r) => setUsername(r.username))
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setUsername(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const u = user.trim();
    if (!u) return { ok: false, error: "Enter your username." };
    if (!password?.trim()) return { ok: false, error: "Enter your password." };

    try {
      const { token, username: name } = await adminLogin(u, password);
      sessionStorage.setItem(TOKEN_KEY, token);
      setUsername(name);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUsername(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      authReady,
      isAuthenticated: Boolean(username),
      username,
      login,
      logout,
    }),
    [authReady, username, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

/** Bearer token for authenticated API calls (admin UI). */
export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

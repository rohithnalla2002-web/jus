import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin, adminSession } from "@/lib/api";
import { ADMIN_TOKEN_SESSION_KEY, SUPER_ADMIN_TOKEN_SESSION_KEY } from "@/lib/sessionKeys";

type AdminAuthContextValue = {
  /** True after initial session check (or no token). */
  authReady: boolean;
  isAuthenticated: boolean;
  username: string | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; loginAsSuperAdmin?: boolean }>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY);
    if (!token) {
      setAuthReady(true);
      return;
    }
    adminSession(token)
      .then((r) => setUsername(r.username))
      .catch(() => {
        sessionStorage.removeItem(ADMIN_TOKEN_SESSION_KEY);
        setUsername(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const u = user.trim();
    if (!u) return { ok: false, error: "Enter your username." };
    if (!password?.trim()) return { ok: false, error: "Enter your password." };

    try {
      const data = await adminLogin(u, password);
      if (data.loginAs === "super_admin") {
        sessionStorage.removeItem(ADMIN_TOKEN_SESSION_KEY);
        sessionStorage.setItem(SUPER_ADMIN_TOKEN_SESSION_KEY, data.token);
        return { ok: true, loginAsSuperAdmin: true };
      }
      sessionStorage.removeItem(SUPER_ADMIN_TOKEN_SESSION_KEY);
      sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, data.token);
      setUsername(data.username);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_TOKEN_SESSION_KEY);
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
  return sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY);
}

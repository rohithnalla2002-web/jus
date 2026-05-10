import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { superAdminLogin, superAdminSession } from "@/lib/api";
import { ADMIN_TOKEN_SESSION_KEY, SUPER_ADMIN_TOKEN_SESSION_KEY } from "@/lib/sessionKeys";

type SuperAdminAuthContextValue = {
  authReady: boolean;
  isAuthenticated: boolean;
  username: string | null;
  name: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | undefined>(undefined);

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SUPER_ADMIN_TOKEN_SESSION_KEY);
    if (!saved) {
      setAuthReady(true);
      return;
    }

    superAdminSession(saved)
      .then((session) => {
        setUsername(session.username);
        setName(session.name);
        setToken(saved);
      })
      .catch(() => {
        sessionStorage.removeItem(SUPER_ADMIN_TOKEN_SESSION_KEY);
        setUsername(null);
        setName(null);
        setToken(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const u = user.trim();
    if (!u) return { ok: false, error: "Enter your username." };
    if (!password?.trim()) return { ok: false, error: "Enter your password." };

    try {
      const result = await superAdminLogin(u, password);
      sessionStorage.removeItem(ADMIN_TOKEN_SESSION_KEY);
      sessionStorage.setItem(SUPER_ADMIN_TOKEN_SESSION_KEY, result.token);
      setUsername(result.username);
      setName(result.name);
      setToken(result.token);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SUPER_ADMIN_TOKEN_SESSION_KEY);
    setUsername(null);
    setName(null);
    setToken(null);
  }, []);

  const value = useMemo<SuperAdminAuthContextValue>(
    () => ({
      authReady,
      isAuthenticated: Boolean(username && token),
      username,
      name,
      token,
      login,
      logout,
    }),
    [authReady, username, name, token, login, logout],
  );

  return <SuperAdminAuthContext.Provider value={value}>{children}</SuperAdminAuthContext.Provider>;
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) throw new Error("useSuperAdminAuth must be used within SuperAdminAuthProvider");
  return ctx;
}

export function getSuperAdminToken(): string | null {
  return sessionStorage.getItem(SUPER_ADMIN_TOKEN_SESSION_KEY);
}

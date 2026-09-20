"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

type AuthUser = { id: string; email: string; name?: string };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

const TOKEN_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function clearStaleSession() {
  pb().authStore.clear();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("langlearn_auth");
  }
}

async function refreshSession(): Promise<AuthUser | null> {
  const client = pb();
  if (!client.authStore.isValid) return null;
  try {
    const record = await client.collection("users").authRefresh();
    const r = record.record as unknown as { id: string; email: string; name?: string };
    return { id: r.id, email: r.email, name: r.name };
  } catch {
    clearStaleSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("langlearn_auth");
        if (stored) {
          try {
            const u = JSON.parse(stored) as AuthUser;
            setUser(u);
          } catch {}
        }
      }
      // Validate the PocketBase session token: expired tokens keep the UI
      // "logged in" while every write fails with a generic 400.
      const validated = await refreshSession();
      if (cancelled) return;
      setUser(validated);
      if (validated && typeof window !== "undefined") {
        window.localStorage.setItem("langlearn_auth", JSON.stringify(validated));
      }
      setLoading(false);
    })();
    const timer = window.setInterval(async () => {
      const validated = await refreshSession();
      if (!cancelled) setUser(validated);
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await pb().collection("users").authWithPassword(email, password);
    const record = result.record as unknown as { id: string; email: string; name?: string };
    const u: AuthUser = {
      id: record.id,
      email: record.email,
      name: record.name,
    };
    setUser(u);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("langlearn_auth", JSON.stringify(u));
    }
  }, []);

  const logout = useCallback(() => {
    pb().authStore.clear();
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("langlearn_auth");
    }
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

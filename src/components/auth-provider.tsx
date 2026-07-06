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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One-time client restore of persisted auth (localStorage is a sync
    // external store); setState here is the canonical mount-restore pattern.
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("langlearn_auth");
    if (stored) {
      try {
        const u = JSON.parse(stored) as AuthUser;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(u);
      } catch {}
    }
    setLoading(false);
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

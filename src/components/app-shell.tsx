"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Nav } from "@/components/nav";

const HIDE_NAV = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [storeError, setStoreError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onStoreError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setStoreError(detail || "No se pudieron guardar los cambios");
    };
    window.addEventListener("langlearn:store-error", onStoreError);
    return () => window.removeEventListener("langlearn:store-error", onStoreError);
  }, []);

  // Register the service worker on first mount (installable PWA).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
    }
    if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const hideNav = HIDE_NAV.some((p) => pathname === p) || pathname.startsWith("/lessons/");
  return (
    <div className="flex min-h-dvh flex-col">
      {storeError && (
        <div className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/95 px-3 py-2 text-sm text-amber-100 shadow-lg">
          <span>{storeError}. Intenta de nuevo.</span>
          <button type="button" onClick={() => setStoreError(null)} aria-label="Cerrar">
            ×
          </button>
        </div>
      )}
      <main className="flex-1">{children}</main>
      {!hideNav && <Nav />}
    </div>
  );
}

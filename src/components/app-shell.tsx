"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Nav } from "@/components/nav";

const HIDE_NAV = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      <main className="flex-1">{children}</main>
      {!hideNav && <Nav />}
    </div>
  );
}

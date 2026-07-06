"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = [
    { href: "/", label: "Inicio" },
    { href: "/lessons", label: "Lecciones" },
    { href: "/review", label: "Repaso" },
  ];
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex-1 py-2.5 text-center text-xs ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
      {user && (
        <div className="mx-auto max-w-2xl border-t border-border/50 px-4 py-1.5 text-center text-[0.65rem] text-muted-foreground">
          {user.email} ·{" "}
          <button onClick={logout} className="underline">
            salir
          </button>
        </div>
      )}
    </nav>
  );
}

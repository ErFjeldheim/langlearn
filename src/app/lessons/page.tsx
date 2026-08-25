"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRICULUM } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
import type { ProgressRecord } from "@/lib/pocketbase";

export default function LessonsPage() {
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress()
      .then(setProgress)
      .finally(() => setLoading(false));
  }, []);

  const completed = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const practiced = new Map(progress.map((p) => [p.lesson_id, p]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Las 25 lecciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Cargando…" : `${completed.size}/${CURRICULUM.length} completadas`}
        </p>
      </header>

      <ol className="space-y-2">
        {CURRICULUM.map((l) => {
          const done = completed.has(l.id);
          const pr = practiced.get(l.id);
          const previous = CURRICULUM[l.day - 2];
          const locked = !!previous && !completed.has(previous.id);
          return (
            <li key={l.id}>
              <Link
                href={locked ? "#" : `/lessons/${l.id}`}
                aria-disabled={locked}
                onClick={(event) => {
                  if (locked) event.preventDefault();
                }}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  locked ? "cursor-not-allowed opacity-50" : "hover:border-primary"
                } ${
                  done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                    done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : l.day}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.topic}</p>
                </div>
                {pr?.last_practiced && (
                  <span className="text-[0.6rem] text-muted-foreground">
                    {new Date(pr.last_practiced).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                )}
                {locked && <span className="text-xs text-muted-foreground">Bloqueada</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

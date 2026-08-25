"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRICULUM } from "@/lib/curriculum";
import { loadDueVocab, loadProgress } from "@/lib/store";
import type { ProgressRecord, VocabRecord } from "@/lib/pocketbase";
import { getLearningStats, type LearningStats } from "@/lib/learning-stats";

export default function HomePage() {
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [due, setDue] = useState<VocabRecord[]>([]);
  const [stats, setStats] = useState<LearningStats>({ reviewed: 0, correct: 0 });
  const daysLeft = (() => {
    if (typeof window === "undefined") return 25;
    const target = new Date();
    target.setDate(target.getDate() + 25);
    return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
  })();

  useEffect(() => {
    loadProgress().then(setProgress);
    loadDueVocab().then(setDue);
    const timer = window.setTimeout(() => setStats(getLearningStats()));
    return () => window.clearTimeout(timer);
  }, []);

  const completed = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const nextLesson =
    CURRICULUM.find((l) => !completed.has(l.id)) || CURRICULUM[CURRICULUM.length - 1];
  const totalXp = progress.reduce((sum, p) => sum + (p.xp || 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Profe Sofía · A1 Español Mexicano
        </p>
        <h1 className="mt-1 text-2xl font-semibold">¡Hola, Erik! 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {daysLeft} días para tu vuelo a Querétaro.
        </p>
      </header>

      <Link
        href={`/lessons/${nextLesson.id}`}
        className="block rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-accent/15 p-5 transition hover:border-primary"
      >
        <p className="text-xs uppercase tracking-wide text-primary">Siguiente lección</p>
        <p className="mt-1 text-lg font-semibold">Día {nextLesson.day}: {nextLesson.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{nextLesson.topic}</p>
        <p className="mt-3 text-sm font-medium text-primary">Empezar →</p>
      </Link>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Lecciones" value={`${completed.size}/${CURRICULUM.length}`} />
        <Stat label="XP" value={String(totalXp)} />
        <Stat label="Repaso" value={String(due.length)} />
        <Stat
          label="Retención"
          value={stats.reviewed ? `${Math.round((stats.correct / stats.reviewed) * 100)}%` : "—"}
        />
      </section>

      {due.length > 0 && (
        <Link
          href="/review"
          className="mt-4 block rounded-xl border border-border bg-card p-4 transition hover:border-primary"
        >
          <p className="text-sm">
            Tienes <strong className="text-primary">{due.length}</strong> palabra(s) por repasar hoy.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Toca para repasar →</p>
        </Link>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Tu camino</h2>
        <div className="grid grid-cols-1 gap-2">
          {CURRICULUM.slice(0, 6).map((l) => {
            const done = completed.has(l.id);
            return (
              <Link
                key={l.id}
                href={`/lessons/${l.id}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition hover:border-primary ${
                  done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <span>
                  <span className="text-muted-foreground">Día {l.day} · </span>
                  {l.title}
                </span>
                <span className={done ? "text-primary" : "text-muted-foreground"}>
                  {done ? "✓" : "→"}
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          href="/lessons"
          className="mt-3 block text-center text-xs text-muted-foreground underline"
        >
          Ver las 25 lecciones
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-4 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

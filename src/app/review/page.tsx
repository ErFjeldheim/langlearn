"use client";

import { useEffect, useState } from "react";
import { loadDueVocab, gradeVocab } from "@/lib/store";
import type { VocabRecord } from "@/lib/pocketbase";
import { pickMexicanVoice, waitForVoices } from "@/lib/speech";
import type { SRSGrade } from "@/lib/srs";

export default function ReviewPage() {
  const [queue, setQueue] = useState<VocabRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [synthOk, setSynthOk] = useState(true);

  useEffect(() => {
    waitForVoices().then(() => {
      setVoiceReady(true);
      setSynthOk(!!pickMexicanVoice() || !!("speechSynthesis" in window && (window.speechSynthesis.getVoices().find(v => v.lang.startsWith("es")))));
    });
    loadDueVocab()
      .then(setQueue)
      .finally(() => setLoading(false));
  }, []);

  const card = queue[index];

  function speakTerm(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    const v = pickMexicanVoice();
    if (v) u.voice = v;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }

  async function grade(g: SRSGrade) {
    if (!card) return;
    await gradeVocab(card, g);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center text-muted-foreground">
        Cargando repaso…
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 font-medium">¡No hay palabras por repasar ahora!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vuelve más tarde o practica una lección para añadir vocabulario.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Repaso</h1>
        <p className="text-xs text-muted-foreground">
          {index + 1} / {queue.length}
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Palabra
        </p>
        <p className="mt-2 text-3xl font-semibold">{card.term}</p>
        <button
          onClick={() => speakTerm(card.term)}
          disabled={!synthOk}
          className="mt-3 rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
        >
          🔊 Escuchar
        </button>

        {revealed ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Traducción
            </p>
            <p className="mt-1 text-lg text-foreground">{card.translation}</p>
            {card.example && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                {card.example}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-5 rounded-lg border border-border px-4 py-2 text-sm"
          >
            Mostrar traducción
          </button>
        )}
      </div>

      {revealed && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <GradeBtn label="Otra vez" tone="red" onClick={() => grade("again")} />
          <GradeBtn label="Difícil" tone="amber" onClick={() => grade("hard")} />
          <GradeBtn label="Bien" tone="green" onClick={() => grade("good")} />
          <GradeBtn label="Fácil" tone="blue" onClick={() => grade("easy")} />
        </div>
      )}
      {!synthOk && voiceReady && (
        <p className="mt-3 text-center text-xs text-amber-300/80">
          Sin voz es-MX disponible; el botón de audio puede no funcionar.
        </p>
      )}
    </div>
  );
}

function GradeBtn({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "red" | "amber" | "green" | "blue";
  onClick: () => void;
}) {
  const colors: Record<string, string> = {
    red: "border-red-500/40 text-red-200 hover:bg-red-500/10",
    amber: "border-amber-500/40 text-amber-200 hover:bg-amber-500/10",
    green: "border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10",
    blue: "border-sky-500/40 text-sky-200 hover:bg-sky-500/10",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-sm ${colors[tone]}`}
    >
      {label}
    </button>
  );
}

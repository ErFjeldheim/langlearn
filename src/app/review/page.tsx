"use client";

import { useEffect, useState } from "react";
import { loadDueVocab, gradeVocab } from "@/lib/store";
import type { VocabRecord } from "@/lib/pocketbase";
import { pickMexicanVoice, waitForVoices } from "@/lib/speech";
import type { SRSGrade } from "@/lib/srs";
import { recordReview } from "@/lib/learning-stats";

export default function ReviewPage() {
  const [queue, setQueue] = useState<VocabRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
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
  const spanishPrompt = index % 2 === 0;
  const prompt = card && (spanishPrompt ? card.translation : card.term);
  const expected = card && (spanishPrompt ? card.term : card.translation);
  const answerIsCorrect =
    !!expected &&
    splitAcceptedAnswers(expected).some((value) => normalizeAnswer(answer) === value);

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
    recordReview(answerIsCorrect);
    await gradeVocab(card, g);
    if (g === "again") {
      setQueue((current) => [...current, card]);
    }
    setAnswer("");
    setChecked(false);
    setIndex((i) => i + 1);
  }

  function checkAnswer() {
    if (!answer.trim()) return;
    setChecked(true);
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
          {spanishPrompt ? "Traduce al español" : "¿Qué significa?"}
        </p>
        <p className="mt-2 text-3xl font-semibold">{prompt}</p>
        {!spanishPrompt && (
          <button
            onClick={() => speakTerm(card.term)}
            disabled={!synthOk}
            className="mt-3 rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
          >
            🔊 Escuchar
          </button>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            checkAnswer();
          }}
          className="mt-5 flex gap-2"
        >
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={checked}
            autoFocus
            placeholder={spanishPrompt ? "Escribe en español…" : "Escribe el significado…"}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={checked || !answer.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Comprobar
          </button>
        </form>

        {checked && (
          <div className="mt-4 border-t border-border pt-4">
            <p className={`font-medium ${answerIsCorrect ? "text-emerald-300" : "text-amber-300"}`}>
              {answerIsCorrect ? "¡Correcto!" : `Respuesta: ${expected}`}
            </p>
            {card.example && (
              <p className="mt-2 text-sm italic text-muted-foreground">{card.example}</p>
            )}
          </div>
        )}
      </div>

      {!checked && (
        <button
          onClick={() => setChecked(true)}
          className="mt-3 block w-full text-center text-xs text-muted-foreground underline"
        >
          No sé, mostrar respuesta
        </button>
      )}

      {checked && (
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

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, "")
    .trim();
}

function splitAcceptedAnswers(value: string): string[] {
  return value.split(/\s*\/\s*/).map(normalizeAnswer);
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

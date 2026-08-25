"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/lib/curriculum";
import LessonChat from "@/components/lesson-chat";
import {
  ensureVocabFromLesson,
  loadHistory,
  markLessonComplete,
  saveTurn,
  touchLesson,
} from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string };

export default function LessonChatClient({ lesson }: { lesson: Lesson }) {
  const [initialHistory, setInitialHistory] = useState<Msg[] | undefined>(undefined);
  const [history, setHistory] = useState<Msg[]>([]);
  const [prevCount, setPrevCount] = useState(0);
  const [userTurns, setUserTurns] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const recs = await loadHistory(lesson.id, 40);
      if (cancelled) return;
      const history: Msg[] = recs.map((r) => ({
        role: r.role === "user" ? "user" : "assistant",
        content: r.content,
      }));
      // If no saved history, start with empty array (lesson opener handled in LessonChat).
      setInitialHistory(history);
      setPrevCount(history.length);
      setHistory(history);
      setUserTurns(history.filter((m) => m.role === "user").length);
      ensureVocabFromLesson(lesson.id, lesson.vocab);
      touchLesson(lesson.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson]);

  const handleHistoryChange = useCallback(
    (history: Msg[]) => {
      // Diff: save only newly-appended messages.
      if (history.length <= prevCount) {
        return;
      }
      const newOnes = history.slice(prevCount);
      setPrevCount(history.length);
      setUserTurns(history.filter((m) => m.role === "user").length);
      for (const m of newOnes) {
        saveTurn(lesson.id, m.role, m.content);
      }
    },
    [lesson, prevCount]
  );

  function completeLesson() {
    if (userTurns < 6 || !objectivesMastered(currentHistory, lesson)) return;
    setCompleted(true);
    markLessonComplete(lesson.id, lesson.day * 10);
  }

  const currentHistory = history;

  if (initialHistory === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        Cargando lección…
      </div>
    );
  }

  return (
    <>
      <LessonChat
        lesson={lesson}
        initialHistory={initialHistory}
        onHistoryChange={handleHistoryChange}
      />
      {!completed && userTurns >= 6 && (
        <div className="fixed inset-x-4 bottom-20 z-10 mx-auto max-w-xl rounded-2xl border border-primary/40 bg-card p-4 shadow-xl">
          <p className="font-medium">Comprobación de objetivos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            La lección se completa cuando tus respuestas muestran práctica de cada objetivo.
          </p>
          <div className="mt-3 space-y-2">
            {lesson.objectives.map((objective, index) => (
              <div key={objective} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={objectiveMastered(currentHistory, lesson, index)}
                  readOnly
                  disabled
                  className="mt-0.5"
                />
                <span>{objective}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={completeLesson}
            disabled={!objectivesMastered(currentHistory, lesson)}
            className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Completar lección
          </button>
        </div>
      )}
    </>
  );
}

function objectiveMastered(history: Msg[], lesson: Lesson, objectiveIndex: number): boolean {
  const target = lesson.vocab[objectiveIndex % lesson.vocab.length]?.term || "";
  const targetWords = normalize(target).split(" ").filter((word) => word.length > 2);
  const responses = history
    .filter((message) => message.role === "user")
    .map((message) => normalize(message.content));
  return responses.some((response) => targetWords.some((word) => response.includes(word)));
}

function objectivesMastered(history: Msg[], lesson: Lesson): boolean {
  return lesson.objectives.every((_, index) => objectiveMastered(history, lesson, index));
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

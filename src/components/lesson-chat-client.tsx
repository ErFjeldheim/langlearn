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
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const recs = await loadHistory(lesson.id, 40);
      if (cancelled) return;
      const history: Msg[] = recs.map((r) => ({
        role: r.role === "user" ? "user" : "assistant",
        content: r.content,
      }));
      // If no saved history, start with the lesson opener (handled in LessonChat).
      setInitialHistory(history.length ? history : undefined);
      setPrevCount(history.length);
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
      for (const m of newOnes) {
        saveTurn(lesson.id, m.role, m.content);
      }
      // Mark lesson complete after ~6 user turns (rough A1 session length).
      const userTurns = history.filter((m) => m.role === "user").length;
      if (userTurns >= 6) {
        markLessonComplete(lesson.id, lesson.day * 10);
      }
    },
    [lesson, prevCount]
  );

  if (initialHistory === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        Cargando lección…
      </div>
    );
  }

  return (
    <LessonChat
      lesson={lesson}
      initialHistory={initialHistory}
      onHistoryChange={handleHistoryChange}
    />
  );
}

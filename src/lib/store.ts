"use client";

import { pb, type ConversationRecord, type ProgressRecord, type VocabRecord } from "@/lib/pocketbase";
import { freshSRS, review, type SRSGrade, type SRSState } from "@/lib/srs";
import type { Vocab } from "@/lib/curriculum";

function uid(): string {
  const auth = pb().authStore.record;
  if (!auth?.id) throw new Error("not-authed");
  return auth.id;
}

// --- Conversation history ---
export async function loadHistory(lessonId: string, limit = 30): Promise<ConversationRecord[]> {
  try {
    const recs = await pb().collection("conversations").getFullList({
      filter: `owner = "${uid()}" && lesson_id = "${lessonId}"`,
      sort: "-created",
    });
    // getFullList returns desc by -created; we want chronological. sort then reverse.
    const sorted = (recs as unknown as ConversationRecord[]).sort(
      (a, b) => +new Date(a.created) - +new Date(b.created)
    );
    return sorted.slice(-limit);
  } catch (err) {
    console.warn("loadHistory failed", err);
    return [];
  }
}

export async function saveTurn(lessonId: string, role: "user" | "assistant", content: string) {
  try {
    await pb().collection("conversations").create({
      owner: uid(),
      lesson_id: lessonId,
      role,
      content,
    });
  } catch (err) {
    console.warn("saveTurn failed", err);
  }
}

// --- Progress ---
export async function loadProgress(): Promise<ProgressRecord[]> {
  try {
    return (await pb().collection("progress").getFullList({
      filter: `owner = "${uid()}"`,
    })) as unknown as ProgressRecord[];
  } catch (err) {
    console.warn("loadProgress failed", err);
    return [];
  }
}

export async function markLessonComplete(lessonId: string, xp: number) {
  try {
    const existing = (await pb().collection("progress").getFirstListItem(
      `owner = "${uid()}" && lesson_id = "${lessonId}"`
    ).catch(() => null)) as (ProgressRecord & { id: string }) | null;
    if (existing) {
      await pb().collection("progress").update(existing.id, {
        completed: true,
        xp: Math.max(existing.xp || 0, xp),
        last_practiced: new Date().toISOString(),
      });
    } else {
      await pb().collection("progress").create({
        owner: uid(),
        lesson_id: lessonId,
        completed: true,
        xp,
        last_practiced: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("markLessonComplete failed", err);
  }
}

export async function touchLesson(lessonId: string) {
  try {
    const existing = (await pb().collection("progress").getFirstListItem(
      `owner = "${uid()}" && lesson_id = "${lessonId}"`
    ).catch(() => null)) as ((ProgressRecord & { id: string }) | null);
    if (existing) {
      await pb().collection("progress").update(existing.id, {
        last_practiced: new Date().toISOString(),
      });
    } else {
      await pb().collection("progress").create({
        owner: uid(),
        lesson_id: lessonId,
        completed: false,
        xp: 0,
        last_practiced: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("touchLesson failed", err);
  }
}

// --- Vocabulary SRS ---
export async function ensureVocabFromLesson(lessonId: string, vocab: Vocab[]) {
  try {
    const existing = (await pb().collection("vocabulary").getFullList({
      filter: `owner = "${uid()}" && source_lesson = "${lessonId}"`,
    })) as unknown as VocabRecord[];
    const existingTerms = new Set(existing.map((v) => v.term.toLowerCase()));
    for (const v of vocab) {
      if (existingTerms.has(v.term.toLowerCase())) continue;
      const srs = freshSRS();
      await pb().collection("vocabulary").create({
        owner: uid(),
        term: v.term,
        translation: v.translation,
        example: v.example || "",
        source_lesson: lessonId,
        srs_interval: srs.interval,
        srs_ease: srs.ease,
        srs_reps: srs.reps,
        srs_due: srs.due,
      });
    }
  } catch (err) {
    console.warn("ensureVocabFromLesson failed", err);
  }
}

export async function loadDueVocab(): Promise<VocabRecord[]> {
  try {
    const all = (await pb().collection("vocabulary").getFullList({
      filter: `owner = "${uid()}"`,
      sort: "srs_due",
    })) as unknown as VocabRecord[];
    const now = new Date();
    return all.filter((v) => {
      const due = v.srs_due ? new Date(v.srs_due + "T00:00:00Z") : new Date(0);
      return due <= now;
    });
  } catch (err) {
    console.warn("loadDueVocab failed", err);
    return [];
  }
}

export async function gradeVocab(record: VocabRecord, grade: SRSGrade): Promise<SRSState> {
  const current: SRSState = {
    interval: record.srs_interval || 0,
    ease: record.srs_ease || 2.5,
    reps: record.srs_reps || 0,
    due: record.srs_due || new Date().toISOString().slice(0, 10),
  };
  const next = review(current, grade);
  try {
    await pb().collection("vocabulary").update(record.id, {
      srs_interval: next.interval,
      srs_ease: next.ease,
      srs_reps: next.reps,
      srs_due: next.due,
    });
  } catch (err) {
    console.warn("gradeVocab persist failed", err);
  }
  return next;
}

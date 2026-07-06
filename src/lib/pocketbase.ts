// Client-side Pocketbase SDK wrapper. The Pocketbase server URL is exposed to the
// client on purpose (it is a public API; auth + rules protect the data).
import PocketBase from "pocketbase";

let _pb: PocketBase | null = null;

export function pb(): PocketBase {
  if (!_pb) {
    const url = process.env.NEXT_PUBLIC_PB_URL || "https://pb-langlearn.fjelldata.com";
    _pb = new PocketBase(url);
    _pb.autoCancellation(false);
  }
  return _pb;
}

export function isAuthed(): boolean {
  try {
    return pb().authStore.isValid;
  } catch {
    return false;
  }
}

export type VocabRecord = {
  id: string;
  owner: string;
  term: string;
  translation: string;
  example?: string;
  srs_interval: number;
  srs_ease: number;
  srs_reps: number;
  srs_due: string;
  source_lesson?: string;
};

export type ConversationRecord = {
  id: string;
  owner: string;
  lesson_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created: string;
};

export type ProgressRecord = {
  id: string;
  owner: string;
  lesson_id: string;
  completed: boolean;
  xp: number;
  last_practiced: string;
};

"use client";

const STORAGE_KEY = "langlearn-learning-stats";

export type LearningStats = {
  reviewed: number;
  correct: number;
};

const EMPTY_STATS: LearningStats = { reviewed: 0, correct: 0 };

export function getLearningStats(): LearningStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      parsed &&
      typeof parsed.reviewed === "number" &&
      typeof parsed.correct === "number"
    ) {
      return parsed;
    }
  } catch {
    // Treat invalid local data as a fresh stats record.
  }
  return EMPTY_STATS;
}

export function recordReview(correct: boolean): LearningStats {
  const current = getLearningStats();
  const next = {
    reviewed: current.reviewed + 1,
    correct: current.correct + (correct ? 1 : 0),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Statistics are helpful but must never block review.
  }
  return next;
}

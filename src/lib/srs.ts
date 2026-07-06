// SM-2 spaced repetition, simplified for single-user vocab review.
export type SRSState = {
  interval: number; // days
  ease: number; // ease factor (>= 1.3)
  reps: number;
  due: string; // ISO date (UTC midnight) the card is next due
};

export type SRSGrade = "again" | "hard" | "good" | "easy";

export function freshSRS(): SRSState {
  return {
    interval: 0,
    ease: 2.5,
    reps: 0,
    due: todayISO(),
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function review(state: SRSState, grade: SRSGrade): SRSState {
  let { interval, ease, reps } = state;
  if (grade === "again") {
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { interval, ease, reps, due: todayISO() };
  }
  reps += 1;
  if (grade === "hard") ease = Math.max(1.3, ease - 0.15);
  if (grade === "easy") ease += 0.15;
  if (grade === "good") ease += 0.0;

  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.round(interval * ease);

  const due = addDays(todayISO(), interval);
  return { interval, ease, reps, due };
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDue(state: SRSState, now = new Date()): boolean {
  const dueDate = new Date(state.due + "T00:00:00Z");
  return now >= dueDate;
}

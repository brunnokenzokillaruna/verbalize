import { incrementOralExerciseOutcome } from '@/services/firestore';

export type OralExerciseOutcome = 'completed' | 'skipped';

/** Records whether the user completed an oral exercise or skipped / bypassed it. */
export function recordOralExerciseOutcome(
  uid: string | undefined,
  outcome: OralExerciseOutcome,
): void {
  if (!uid) return;
  incrementOralExerciseOutcome(uid, outcome).catch(console.error);
}

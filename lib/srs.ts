/**
 * Simplified SM-2 Spaced Repetition System.
 *
 * srsLevel 0 → review in 1 day   (just learned)
 * srsLevel 1 → review in 3 days
 * srsLevel 2 → review in 7 days
 * srsLevel 3 → review in 14 days
 * srsLevel 4 → review in 30 days
 * srsLevel 5 → review in 90 days (well memorized)
 */

const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90] as const;

export interface SrsUpdate {
  newLevel: number;
  nextReview: Date;
}

/**
 * Calculates the next review date and new SRS level based on answer correctness.
 * Correct → level up (max 5). Incorrect → level down (min 0).
 */
export function calculateNextReview(currentLevel: number, correct: boolean): SrsUpdate {
  const newLevel = correct
    ? Math.min(currentLevel + 1, SRS_INTERVALS_DAYS.length - 1)
    : Math.max(currentLevel - 1, 0);

  const daysUntilReview = SRS_INTERVALS_DAYS[newLevel];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysUntilReview);

  return { newLevel, nextReview };
}

/**
 * Returns true if a vocabulary item is due for review today.
 */
export function isDueForReview(nextReviewDate: Date): boolean {
  return nextReviewDate <= new Date();
}

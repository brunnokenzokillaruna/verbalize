import type { UserVocabularyDocument } from '@/types';

export const REVIEW_SESSION_SIZE = 12;

/**
 * Picks a random subset of due vocabulary items for a review session.
 */
export function pickReviewSession(
  dueItems: UserVocabularyDocument[],
  size = REVIEW_SESSION_SIZE,
): UserVocabularyDocument[] {
  if (dueItems.length <= size) return [...dueItems];
  const shuffled = [...dueItems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, size);
}

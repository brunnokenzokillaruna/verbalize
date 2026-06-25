import { isPassiveOnlyVocabulary } from '@/lib/vocabKnowledgeMode';
import type { UserVocabularyDocument } from '@/types';

export const REVIEW_SESSION_SIZE = 12;

/** Passive-only words are 3× more likely to enter a review session. */
export const PASSIVE_REVIEW_WEIGHT = 3;
export const PRODUCED_REVIEW_WEIGHT = 1;

function getReviewSelectionWeight(item: UserVocabularyDocument): number {
  return isPassiveOnlyVocabulary(item) ? PASSIVE_REVIEW_WEIGHT : PRODUCED_REVIEW_WEIGHT;
}

export function countPassiveOnlyInSession(items: UserVocabularyDocument[]): number {
  return items.filter(isPassiveOnlyVocabulary).length;
}

/**
 * Picks a weighted subset of due vocabulary for review.
 * Prioritizes words never actively produced (passive-only) over recognition-only exposure.
 */
export function pickReviewSession(
  dueItems: UserVocabularyDocument[],
  size = REVIEW_SESSION_SIZE,
): UserVocabularyDocument[] {
  if (dueItems.length <= size) return [...dueItems];

  const pool = [...dueItems];
  const selected: UserVocabularyDocument[] = [];

  while (selected.length < size && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + getReviewSelectionWeight(item), 0);
    let roll = Math.random() * totalWeight;
    let pickedIndex = 0;

    for (let i = 0; i < pool.length; i++) {
      roll -= getReviewSelectionWeight(pool[i]);
      if (roll <= 0) {
        pickedIndex = i;
        break;
      }
    }

    selected.push(pool[pickedIndex]);
    pool.splice(pickedIndex, 1);
  }

  return selected;
}

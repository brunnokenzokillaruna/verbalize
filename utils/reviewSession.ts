import { isPassiveOnlyVocabulary } from '@/lib/vocabKnowledgeMode';
import type { UserVocabularyDocument } from '@/types';
import { timestampToMillis } from '@/utils/vocabPageHelpers';

export const REVIEW_SESSION_SIZE = 12;

/** When two words are equally overdue, passive-only ones come first. */
export const PASSIVE_REVIEW_WEIGHT = 3;
export const PRODUCED_REVIEW_WEIGHT = 1;

function getReviewSelectionWeight(item: UserVocabularyDocument): number {
  return isPassiveOnlyVocabulary(item) ? PASSIVE_REVIEW_WEIGHT : PRODUCED_REVIEW_WEIGHT;
}

/** Earlier nextReview is more overdue. A missing date sorts first so it is not skipped. */
function overdueMillis(item: UserVocabularyDocument): number {
  return timestampToMillis(item.nextReview) ?? 0;
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0 || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const current = copy[i];
    copy[i] = copy[j];
    copy[j] = current;
  }
  return copy;
}

export function countPassiveOnlyInSession(items: UserVocabularyDocument[]): number {
  return items.filter(isPassiveOnlyVocabulary).length;
}

/**
 * Fills a review session with the most overdue words first.
 * Passive-only words win only when the scheduled dates match.
 * `orderSeed` reshuffles the order of that same set; it does not replace overdue words.
 */
export function pickReviewSession(
  dueItems: UserVocabularyDocument[],
  size = REVIEW_SESSION_SIZE,
  orderSeed = 0,
): UserVocabularyDocument[] {
  const ranked = [...dueItems].sort((a, b) => {
    const byOverdue = overdueMillis(a) - overdueMillis(b);
    if (byOverdue !== 0) return byOverdue;
    const byPassive = getReviewSelectionWeight(b) - getReviewSelectionWeight(a);
    if (byPassive !== 0) return byPassive;
    return a.word.localeCompare(b.word);
  });

  const selected = ranked.slice(0, size);
  if (orderSeed === 0) return selected;
  return shuffleWithSeed(selected, orderSeed);
}

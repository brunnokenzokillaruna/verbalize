import type { UserVocabularyDocument } from '@/types';

export type SrsFilter = 'all' | 'new' | 'learning' | 'mastered';

export function getReviewDate(
  item: UserVocabularyDocument,
  field: 'nextReview' | 'lastReview' = 'nextReview',
): Date | null {
  const ts = item[field];
  if (
    ts &&
    typeof (ts as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (
    ts &&
    typeof (ts as { toMillis?: () => number }).toMillis === 'function'
  ) {
    return new Date((ts as { toMillis: () => number }).toMillis());
  }
  if (ts instanceof Date) return ts;
  return null;
}

export function isDueForReview(item: UserVocabularyDocument, now = new Date()): boolean {
  const reviewDate = getReviewDate(item, 'nextReview');
  return reviewDate !== null && reviewDate <= now;
}

export function isReviewedToday(item: UserVocabularyDocument, now = new Date()): boolean {
  const lastReviewDate = getReviewDate(item, 'lastReview');
  if (!lastReviewDate) return false;
  return (
    lastReviewDate.getFullYear() === now.getFullYear() &&
    lastReviewDate.getMonth() === now.getMonth() &&
    lastReviewDate.getDate() === now.getDate()
  );
}

export function computeVocabCounts(items: UserVocabularyDocument[], now = new Date()) {
  const dueTodayCount = items.filter((item) => isDueForReview(item, now)).length;
  const reviewedTodayCount = items.filter((item) => isReviewedToday(item, now)).length;
  return {
    totalCount: items.length,
    newCount: items.filter((v) => (v.srsLevel ?? 0) <= 1).length,
    learningCount: items.filter((v) => (v.srsLevel ?? 0) >= 2 && (v.srsLevel ?? 0) <= 4).length,
    masteredCount: items.filter((v) => (v.srsLevel ?? 0) >= 5).length,
    dueTodayCount,
    reviewedTodayCount,
  };
}

export function filterVocabulary(
  items: UserVocabularyDocument[],
  searchQuery: string,
  srsFilter: SrsFilter,
): UserVocabularyDocument[] {
  return items.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.translation && item.translation.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const level = item.srsLevel ?? 0;
    if (srsFilter === 'new') return level <= 1;
    if (srsFilter === 'learning') return level >= 2 && level <= 4;
    if (srsFilter === 'mastered') return level >= 5;

    return true;
  });
}

export function splitDueAndLearned(
  filteredItems: UserVocabularyDocument[],
  now = new Date(),
): { dueToday: UserVocabularyDocument[]; learned: UserVocabularyDocument[] } {
  const dueToday: UserVocabularyDocument[] = [];
  const learned: UserVocabularyDocument[] = [];

  for (const item of filteredItems) {
    if (isDueForReview(item, now)) {
      dueToday.push(item);
    } else {
      learned.push(item);
    }
  }

  return { dueToday, learned };
}

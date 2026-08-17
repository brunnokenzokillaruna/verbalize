import type { UserVocabularyDocument } from '@/types';

export type SrsFilter = 'all' | 'new' | 'learning' | 'mastered';

/** Reads Firestore Timestamp, Date, epoch ms, or a plain `{ seconds }` payload. */
export function timestampToMillis(ts: unknown): number | undefined {
  if (ts == null) return undefined;
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (ts instanceof Date) {
    const ms = ts.getTime();
    return Number.isNaN(ms) ? undefined : ms;
  }
  if (typeof ts !== 'object') return undefined;

  const obj = ts as {
    toMillis?: () => number;
    toDate?: () => Date;
    seconds?: number;
    nanoseconds?: number;
  };
  if (typeof obj.toMillis === 'function') return obj.toMillis();
  if (typeof obj.toDate === 'function') {
    const ms = obj.toDate().getTime();
    return Number.isNaN(ms) ? undefined : ms;
  }
  if (typeof obj.seconds === 'number') {
    const nanos = typeof obj.nanoseconds === 'number' ? obj.nanoseconds : 0;
    return obj.seconds * 1000 + Math.floor(nanos / 1e6);
  }
  return undefined;
}

export function getReviewDate(
  item: UserVocabularyDocument,
  field: 'nextReview' | 'lastReview' = 'nextReview',
): Date | null {
  const ms = timestampToMillis(item[field]);
  return ms == null ? null : new Date(ms);
}

export function isDueForReview(item: UserVocabularyDocument, now = new Date()): boolean {
  const reviewDate = getReviewDate(item, 'nextReview');
  return reviewDate !== null && reviewDate <= now;
}

export function formatLocalDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isReviewedToday(item: UserVocabularyDocument, now = new Date()): boolean {
  if (item.lastReviewDay) {
    return item.lastReviewDay === formatLocalDay(now);
  }
  const lastReviewDate = getReviewDate(item, 'lastReview');
  if (!lastReviewDate) return false;
  return formatLocalDay(lastReviewDate) === formatLocalDay(now);
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

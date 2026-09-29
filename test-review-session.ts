/**
 * Review session selection: most overdue words first.
 * Run: npx tsx test-review-session.ts
 */
import { isPassiveOnlyVocabulary, isVocabularyProduced } from './lib/vocabKnowledgeMode';
import { pickReviewSession, REVIEW_SESSION_SIZE } from './utils/reviewSession';
import type { UserVocabularyDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const base = {
  uid: 'u',
  language: 'fr' as const,
  firstSeen: {} as never,
  lastReview: {} as never,
  nextReview: {} as never,
  mistakeCount: 0,
  srsLevel: 2,
};

function dueDaysAgo(daysAgo: number): UserVocabularyDocument['nextReview'] {
  const ms = Date.UTC(2026, 0, 20) - daysAgo * 86_400_000;
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0 } as UserVocabularyDocument['nextReview'];
}

function word(
  id: string,
  daysAgo: number,
  produced = false,
): UserVocabularyDocument {
  return {
    ...base,
    id,
    word: id,
    translation: id,
    nextReview: dueDaysAgo(daysAgo),
    ...(produced ? { productionCount: 1 } : {}),
  };
}

const freshPassive = word('fresh-passive', 0);
const weekOld = word('week-old', 7, true);
const monthOld = word('month-old', 30, true);

assert(isPassiveOnlyVocabulary(freshPassive), 'no productionCount is passive');
assert(!isVocabularyProduced(freshPassive), 'passive is not produced');
assert(isVocabularyProduced(weekOld), 'productionCount marks produced');

const ranked = pickReviewSession([freshPassive, weekOld, monthOld], 2);
assert(
  ranked.map((item) => item.word).join(',') === 'month-old,week-old',
  'the most overdue words fill the session even when a newer one was never produced',
);

const sameDayPassive = word('same-passive', 4);
const sameDayProduced = word('same-produced', 4, true);
assert(
  pickReviewSession([sameDayProduced, sameDayPassive], 1)[0].word === 'same-passive',
  'passive-only wins only when the due dates match',
);

const pool = Array.from({ length: 15 }, (_, i) => word(`w${i}`, i, i % 2 === 0));
const session = pickReviewSession(pool, 12);
assert(session.length === 12, 'session size');
assert(
  session.every((item) => Number(item.word.slice(1)) >= 3),
  'the three most recently due words stay out of a full session',
);

assert(
  pickReviewSession(pool.slice(0, 3), REVIEW_SESSION_SIZE).length === 3,
  'short pool returns all items',
);

const reshuffled = pickReviewSession(pool, 12, 1);
assert(
  reshuffled.map((item) => item.word).sort().join(',') === session.map((item) => item.word).sort().join(','),
  'reshuffle keeps the same overdue words',
);
assert(
  reshuffled.map((item) => item.word).join(',') !== session.map((item) => item.word).join(','),
  'reshuffle changes the practice order',
);

console.log('✓ review session overdue-first tests passed');

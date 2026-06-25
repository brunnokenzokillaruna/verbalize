/**
 * Smoke tests for passive-first review session selection.
 * Run: npx tsx test-review-session.ts
 */
import { isPassiveOnlyVocabulary, isVocabularyProduced } from './lib/vocabKnowledgeMode';
import {
  countPassiveOnlyInSession,
  PASSIVE_REVIEW_WEIGHT,
  pickReviewSession,
  REVIEW_SESSION_SIZE,
} from './utils/reviewSession';
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

const passive: UserVocabularyDocument[] = Array.from({ length: 8 }, (_, i) => ({
  ...base,
  id: `p${i}`,
  word: `passive-${i}`,
  translation: `p${i}`,
}));

const produced: UserVocabularyDocument[] = Array.from({ length: 8 }, (_, i) => ({
  ...base,
  id: `a${i}`,
  word: `active-${i}`,
  translation: `a${i}`,
  productionCount: 1,
}));

assert(isPassiveOnlyVocabulary(passive[0]), 'no productionCount is passive');
assert(!isVocabularyProduced(passive[0]), 'passive is not produced');
assert(isVocabularyProduced(produced[0]), 'productionCount marks produced');

const mixed = [...passive, ...produced];
let passiveHeavyRuns = 0;
const runs = 200;

for (let i = 0; i < runs; i++) {
  const session = pickReviewSession(mixed, 6);
  assert(session.length === 6, 'session size');
  const passiveCount = countPassiveOnlyInSession(session);
  if (passiveCount >= 4) passiveHeavyRuns++;
}

assert(
  passiveHeavyRuns / runs >= 0.7,
  `passive-only words should dominate sessions (got ${passiveHeavyRuns}/${runs})`,
);

assert(
  pickReviewSession(mixed.slice(0, 3), REVIEW_SESSION_SIZE).length === 3,
  'short pool returns all items',
);

console.log(`✓ review session smoke tests passed (${PASSIVE_REVIEW_WEIGHT}× passive weight)`);

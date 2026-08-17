/**
 * Smoke tests for vocabulary page date helpers.
 * Run: npx tsx test-vocab-page-helpers.ts
 */
import { isReviewedToday, timestampToMillis } from './utils/vocabPageHelpers';
import type { UserVocabularyDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const now = new Date('2026-08-17T15:00:00');

const withSeconds: UserVocabularyDocument = {
  id: '1',
  uid: 'u',
  language: 'fr',
  word: 'chat',
  translation: 'gato',
  srsLevel: 1,
  mistakeCount: 0,
  firstSeen: { seconds: 1755442800, nanoseconds: 0 } as never,
  lastReview: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 } as never,
  nextReview: { seconds: Math.floor(now.getTime() / 1000) + 86400, nanoseconds: 0 } as never,
};

assert(isReviewedToday(withSeconds, now), 'plain {seconds} lastReview counts as reviewed today');
assert(timestampToMillis(withSeconds.lastReview) === Math.floor(now.getTime() / 1000) * 1000, 'timestampToMillis reads seconds');

const missing: UserVocabularyDocument = {
  ...withSeconds,
  lastReview: undefined as never,
};
assert(isReviewedToday(missing, now) === false, 'missing lastReview is not reviewed today');

console.log('\nAll vocab page helper tests passed.');

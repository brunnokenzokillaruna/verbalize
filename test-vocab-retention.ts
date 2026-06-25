/**
 * Smoke tests for vocabulary retention comparison.
 * Run: npx tsx test-vocab-retention.ts
 */
import { computeVocabRetentionComparison } from './lib/vocabRetentionStats';
import { resolveProductionVocabulary } from './lib/vocabProductionWords';
import type { Exercise, UserVocabularyDocument } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const produced: UserVocabularyDocument[] = [
  { id: '1', uid: 'u', language: 'fr', word: 'a', translation: 'a', srsLevel: 4, productionCount: 2, firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
  { id: '2', uid: 'u', language: 'fr', word: 'b', translation: 'b', srsLevel: 5, productionCount: 1, firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
  { id: '3', uid: 'u', language: 'fr', word: 'c', translation: 'c', srsLevel: 3, knowledgeMode: 'active', firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
];

const passive: UserVocabularyDocument[] = [
  { id: '4', uid: 'u', language: 'fr', word: 'd', translation: 'd', srsLevel: 2, firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
  { id: '5', uid: 'u', language: 'fr', word: 'e', translation: 'e', srsLevel: 3, firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
  { id: '6', uid: 'u', language: 'fr', word: 'f', translation: 'f', srsLevel: 2, firstSeen: {} as never, lastReview: {} as never, nextReview: {} as never, mistakeCount: 0 },
];

const comparison = computeVocabRetentionComparison([...produced, ...passive]);
assert(comparison.producedCount === 3, 'produced count');
assert(comparison.passiveOnlyCount === 3, 'passive count');
assert(comparison.hasEnoughData, 'enough data');
assert(comparison.upliftPercent !== null && comparison.upliftPercent > 15, 'uplift above goal');

const exercise: Exercise = {
  type: 'fill-gap-production',
  data: {
    sentence: 'Je ___ un café.',
    blankWord: 'prends',
    translation: 'Eu tomo um café.',
  },
};

const words = resolveProductionVocabulary(exercise, ['prends', 'café']);
assert(words.includes('prends'), 'resolves lesson vocab word');

console.log('✅ test-vocab-retention.ts passed');

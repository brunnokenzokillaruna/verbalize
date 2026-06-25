import type { ExerciseType } from '@/types';

/** Wrong attempts allowed before revealing the answer (total tries = maxWrongAttempts + 1). */
export const DESIRABLE_DIFFICULTY_MAX_WRONG = 1;

/** Recognition / scaffolded types — not free oral or open written production. */
const RETRY_ELIGIBLE_TYPES: ReadonlySet<ExerciseType> = new Set([
  'context-choice',
  'sentence-builder',
  'bridge-choice',
  'grammar-trap',
  'minimal-pair',
  'conjugation-speed',
  'listen-and-select',
  'listening-comprehension',
  'social-roleplay',
  'logic-connectors',
  'interactive-subtitles',
  'scrambled-conversation',
  'image-match',
  'error-correction',
  'word-bank-translation',
  'audio-dictation',
  'voicemail-dictation',
  'inference-tone',
  'connected-speech',
]);

export function supportsDesirableDifficulty(type: ExerciseType): boolean {
  return RETRY_ELIGIBLE_TYPES.has(type);
}

export function hasRetriesRemaining(wrongAttempts: number): boolean {
  return wrongAttempts <= DESIRABLE_DIFFICULTY_MAX_WRONG;
}

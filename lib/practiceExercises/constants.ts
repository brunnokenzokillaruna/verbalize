import type { SupportedLanguage, ProficiencyLevel } from '@/types';

export type ExerciseTypeId =
  | 'context-choice'
  | 'error-correction'
  | 'reverse-translation'
  | 'word-bank-translation'
  | 'bridge-choice'
  | 'listen-and-select'
  | 'listening-comprehension'
  | 'audio-dictation'
  | 'speak-repeat'
  | 'sentence-builder'
  | 'social-roleplay'
  | 'scrambled-conversation'
  | 'interactive-subtitles'
  | 'logic-connectors'
  | 'grammar-trap'
  | 'minimal-pair'
  | 'conjugation-speed';

export const PRACTICE_EXERCISE_COUNT = 5;

/** Bump when pregenerated exercise composition changes (e.g. mandatory production). */
export const PREGEN_SCHEMA_VERSION = 4;

/** When true, every lesson practice session must include at least one production exercise. */
export const ENFORCE_PRODUCTION_PER_LESSON =
  process.env.NEXT_PUBLIC_ENFORCE_PRODUCTION !== 'false';

export const HOOK_LISTEN_FIRST =
  process.env.NEXT_PUBLIC_HOOK_LISTEN_FIRST === 'true';

export const SEPARATE_PASSIVE_SRS =
  process.env.NEXT_PUBLIC_SEPARATE_PASSIVE_SRS === 'true';

export const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

export const LEVEL_EXERCISE_DESCRIPTORS: Record<ProficiencyLevel, string> = {
  A1: 'A1 BEGINNER: use only the 300–500 most common everyday words. Sentences max 8 words. Simple present tense only. No subordinate clauses. Very short, clear sentences.',
  A2: 'A2 ELEMENTARY: use everyday vocabulary (up to 1,500 words). Sentences 8–12 words. Present, simple past, futur proche / going to. Basic connectors (and, but, because).',
  B1: 'B1 INTERMEDIATE: intermediate vocabulary (up to 3,000 words). Sentences 10–16 words. Can use past, future, conditional, simple relative clauses.',
  B2: 'B2 UPPER-INTERMEDIATE: varied vocabulary (up to 6,000 words). Complex sentences allowed. Passive voice, subjunctive, complex conjunctions are fine.',
  C1: 'C1 ADVANCED: rich and precise vocabulary. Idiomatic, formal register welcome. Long complex sentences with multiple subordinate clauses.',
  C2: 'C2 MASTERY: fully native-level. Any register, tense, or structure. Stylistic sophistication expected.',
};

export const TIER_1_TYPES: ExerciseTypeId[] = [
  'sentence-builder',
  'context-choice',
  'speak-repeat',
  'listening-comprehension',
  'interactive-subtitles',
  'scrambled-conversation',
  'word-bank-translation',
];

export const TIER_2_ADDITIONS: ExerciseTypeId[] = [
  'error-correction',
  'social-roleplay',
  'logic-connectors',
  'bridge-choice',
  'listen-and-select',
  'reverse-translation',
];

export const TIER_3_ADDITIONS: ExerciseTypeId[] = [
  'audio-dictation',
];

export function getAllowedExerciseTypes(
  level: ProficiencyLevel,
  knownVocabCount: number,
): ExerciseTypeId[] {
  if (level === 'A1' && knownVocabCount < 30) {
    const types = [...TIER_1_TYPES];
    if (knownVocabCount >= 15) {
      types.push('reverse-translation');
    }
    return types;
  }
  if (level === 'A1' || (level === 'A2' && knownVocabCount < 60)) {
    return [...TIER_1_TYPES, ...TIER_2_ADDITIONS];
  }
  const tier3Eligible = !['A1'].includes(level) || knownVocabCount >= 60;
  if (!tier3Eligible) {
    return [...TIER_1_TYPES, ...TIER_2_ADDITIONS];
  }
  return [...TIER_1_TYPES, ...TIER_2_ADDITIONS, ...TIER_3_ADDITIONS];
}

export function getTagExclusiveType(tag: string): ExerciseTypeId | null {
  if (tag === 'GRAM') return 'grammar-trap';
  if (tag === 'PRON') return 'minimal-pair';
  if (tag === 'VERB') return 'conjugation-speed';
  return null;
}

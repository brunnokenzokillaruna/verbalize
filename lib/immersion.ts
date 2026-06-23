import type { ProficiencyLevel, SupportedLanguage } from '@/types';

export type ImmersionMode = 'auto' | 'always' | 'never';

export function shouldUseTargetLanguageInstructions(
  language: SupportedLanguage,
  level: ProficiencyLevel,
  immersionMode: ImmersionMode = 'auto',
): boolean {
  if (immersionMode === 'never') return false;
  if (immersionMode === 'always') return true;
  return level === 'B2' || level === 'C1' || level === 'C2';
}

export function getPlaybackRateForLevel(level: ProficiencyLevel): number {
  if (level === 'A1') return 0.9;
  return 1.0;
}

export const EXERCISE_INSTRUCTIONS_TARGET: Partial<Record<string, Record<SupportedLanguage, string>>> = {
  'reverse-translation': {
    fr: 'Écrivez la phrase en français.',
    en: 'Write the sentence in English.',
  },
  'speak-repeat': {
    fr: 'Répétez la phrase à voix haute.',
    en: 'Repeat the sentence aloud.',
  },
  'word-bank-translation': {
    fr: 'Assemblez la traduction avec les blocs.',
    en: 'Build the translation with the word blocks.',
  },
};

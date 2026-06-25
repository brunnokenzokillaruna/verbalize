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
  'minimal-pair-production': {
    fr: 'Écoutez les deux sons et prononcez le bon mot.',
    en: 'Listen to both sounds and say the correct word.',
  },
  shadowing: {
    fr: 'Écoutez et répétez en même temps que l\'audio.',
    en: 'Listen and speak along with the audio.',
  },
  'translation-with-constraint': {
    fr: 'Traduisez en incluant l\'expression obligatoire.',
    en: 'Translate including the required expression.',
  },
  'inference-tone': {
    fr: 'Écoutez les deux audios et identifiez le ton.',
    en: 'Listen to both clips and identify the tone.',
  },
  'connected-speech': {
    fr: 'Écoutez la phrase et écrivez ce que vous entendez, en notant la liaison.',
    en: 'Listen to the sentence and write what you hear, noting the linking.',
  },
  'story-continuation': {
    fr: 'Écrivez la suite logique de l\'histoire.',
    en: 'Write the next logical part of the story.',
  },
  'spot-the-register': {
    fr: 'Réécrivez la réplique surlignée avec le registre approprié.',
    en: 'Rewrite the highlighted line with the appropriate register.',
  },
  'prompted-monologue': {
    fr: 'Parlez pendant 30 à 60 secondes sur le sujet proposé.',
    en: 'Speak for 30–60 seconds about the given topic.',
  },
  'listen-and-respond': {
    fr: 'Écoutez le dialogue et répondez à voix haute.',
    en: 'Listen to the dialogue and respond aloud.',
  },
  'word-bank-translation': {
    fr: 'Assemblez la traduction avec les blocs.',
    en: 'Build the translation with the word blocks.',
  },
  paraphrase: {
    fr: 'Réécrivez la phrase avec d\'autres mots, même sens.',
    en: 'Rewrite the sentence with different words, same meaning.',
  },
  'fill-gap-production': {
    fr: 'Écrivez le mot qui manque.',
    en: 'Write the missing word.',
  },
};

import type { ContextChoiceData, Exercise, SentenceBuilderData } from '@/types';
import type { ExerciseTypeId } from './constants';

const RECOGNITION_TYPES: ExerciseTypeId[] = ['context-choice', 'sentence-builder'];

function isMasteredWord(word: string, masteredSet: Set<string>): boolean {
  return masteredSet.has(word.toLowerCase().trim());
}

function contextChoiceIsMastered(ex: Exercise, masteredSet: Set<string>): boolean {
  if (ex.type !== 'context-choice') return false;
  const data = ex.data as ContextChoiceData;
  return isMasteredWord(data.blankWord, masteredSet);
}

function sentenceBuilderIsMastered(ex: Exercise, masteredSet: Set<string>): boolean {
  if (ex.type !== 'sentence-builder') return false;
  const data = ex.data as SentenceBuilderData;
  const contentWords = data.correctOrder.filter((w) => w.replace(/[^a-zàâçéèêëîïôùûü]/gi, '').length > 2);
  if (contentWords.length === 0) return false;
  return contentWords.every((w) => isMasteredWord(w, masteredSet));
}

function convertContextChoiceToFillGap(ex: Exercise): Exercise {
  const data = ex.data as ContextChoiceData;
  return {
    type: 'fill-gap-production',
    data: {
      sentence: data.sentence,
      blankWord: data.blankWord,
      translation: data.translation,
      acceptable_variants: [data.blankWord],
    },
  };
}

function convertSentenceBuilderToProduction(ex: Exercise): Exercise {
  const data = ex.data as SentenceBuilderData;
  const target = data.correctOrder.join(' ');
  return {
    type: 'reverse-translation',
    data: {
      portuguese_sentence: data.translation,
      target_translation: target,
      acceptable_variants: [target],
    },
  };
}

/**
 * Upgrades recognition drills on mastered vocabulary to production (reverse-translation).
 */
export function applyAdaptiveTier(
  exercises: Exercise[],
  masteredVocabulary: string[],
): Exercise[] {
  if (masteredVocabulary.length === 0) return exercises;

  const masteredSet = new Set(masteredVocabulary.map((w) => w.toLowerCase().trim()));

  return exercises.map((ex) => {
    if (!RECOGNITION_TYPES.includes(ex.type as ExerciseTypeId)) return ex;
    if (ex.type === 'context-choice' && contextChoiceIsMastered(ex, masteredSet)) {
      return convertContextChoiceToFillGap(ex);
    }
    if (ex.type === 'sentence-builder' && sentenceBuilderIsMastered(ex, masteredSet)) {
      return convertSentenceBuilderToProduction(ex);
    }
    return ex;
  });
}

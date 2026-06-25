import { isProductionExerciseType } from '@/lib/practiceExercises/productionTypes';
import { resolveProductionVocabulary } from '@/lib/vocabProductionWords';
import { markVocabularyProduced } from '@/services/firestore';
import type { Exercise, SupportedLanguage } from '@/types';

/** Marks lesson vocabulary as actively produced after a successful production exercise. */
export function markExerciseProductionVocabulary(
  uid: string | undefined,
  language: SupportedLanguage | undefined,
  exercise: Exercise | undefined,
  lessonVocabulary: string[],
  accepted: boolean,
): void {
  if (!uid || !language || !exercise || !accepted || !isProductionExerciseType(exercise.type)) {
    return;
  }

  const words = resolveProductionVocabulary(exercise, lessonVocabulary);
  for (const word of words) {
    markVocabularyProduced(uid, word, language).catch(console.error);
  }
}

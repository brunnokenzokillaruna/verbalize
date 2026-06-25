import type { UserVocabularyDocument } from '@/types';

/** Word was actively produced in a lesson or review (not only MCQ exposure). */
export function isVocabularyProduced(item: Pick<UserVocabularyDocument, 'productionCount' | 'knowledgeMode'>): boolean {
  return (item.productionCount ?? 0) >= 1 || item.knowledgeMode === 'active';
}

/** Word has only been seen in receptive exercises (MCQ, flashcards, etc.). */
export function isPassiveOnlyVocabulary(
  item: Pick<UserVocabularyDocument, 'productionCount' | 'knowledgeMode'>,
): boolean {
  return !isVocabularyProduced(item);
}

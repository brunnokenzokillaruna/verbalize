import type { UserVocabularyDocument } from '@/types';

export function isMissingTranslation(item: UserVocabularyDocument): boolean {
  return !item.translation || item.translation === item.word;
}

export function isMissingImage(item: UserVocabularyDocument): boolean {
  return !item.imageUrl;
}

export function needsVocabEnrichment(item: UserVocabularyDocument): boolean {
  return isMissingTranslation(item) || isMissingImage(item);
}

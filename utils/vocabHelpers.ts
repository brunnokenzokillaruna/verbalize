import type { UserVocabularyDocument } from '@/types';

export function isMissingTranslation(item: UserVocabularyDocument): boolean {
  const translation = item.translation?.trim() ?? '';
  if (!translation) return true;
  if (item.translationConfirmed) return false;
  return translation === item.word;
}

export function isMissingImage(item: UserVocabularyDocument): boolean {
  return !item.imageUrl;
}

export function needsVocabEnrichment(item: UserVocabularyDocument): boolean {
  return isMissingTranslation(item) || isMissingImage(item);
}

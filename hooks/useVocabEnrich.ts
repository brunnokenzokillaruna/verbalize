import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { translateWordsBatch } from '@/app/actions/translateWord';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { updateVocabTranslation, updateVocabImage } from '@/services/firestore';
import { isMissingImage, isMissingTranslation } from '@/utils/vocabHelpers';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { User } from 'firebase/auth';

export function useVocabEnrich(
  user: User | null,
  items: UserVocabularyDocument[],
  language: SupportedLanguage,
  setItems: Dispatch<SetStateAction<UserVocabularyDocument[]>>,
) {
  const [enrichingWords, setEnrichingWords] = useState<Set<string>>(new Set());

  const handleEnrichItem = useCallback(
    async (word: string) => {
      if (!user || enrichingWords.has(word)) return;

      const item = items.find((v) => v.word === word);
      if (!item) return;

      const needsTranslation = isMissingTranslation(item);
      const needsImage = isMissingImage(item);
      if (!needsTranslation && !needsImage) return;

      setEnrichingWords((prev) => new Set(prev).add(word));

      try {
        let translation = item.translation;
        let imageUrl = item.imageUrl;

        if (needsTranslation) {
          const results = await translateWordsBatch([word], language);
          const match = results?.find((r) => r.word.toLowerCase() === word.toLowerCase());
          if (match?.translation && match.translation !== word) {
            translation = match.translation;
            await updateVocabTranslation(user.uid, word, language, translation);
          }
        }

        if (needsImage) {
          const context = translation && translation !== word ? translation : item.word;
          const imgResult = await getVocabImage(word, context, language);
          if (imgResult?.imageUrl) {
            imageUrl = imgResult.imageUrl;
            await updateVocabImage(user.uid, word, language, imageUrl);
          }
        }

        if (translation !== item.translation || imageUrl !== item.imageUrl) {
          setItems((prev) =>
            prev.map((v) => (v.word === word ? { ...v, translation, imageUrl } : v)),
          );
        }
      } catch (err) {
        console.error('[handleEnrichItem] Failed for', word, err);
      } finally {
        setEnrichingWords((prev) => {
          const next = new Set(prev);
          next.delete(word);
          return next;
        });
      }
    },
    [user, items, language, enrichingWords, setItems],
  );

  return { enrichingWords, handleEnrichItem };
}

import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { translateWord, translateWordsBatch } from '@/app/actions/translateWord';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { updateVocabTranslation, updateVocabImage } from '@/services/firestore';
import { findVocabularyItem, wordsMatchCanonically } from '@/lib/vocabCanonical';
import { pickBatchTranslation } from '@/lib/vocabTranslation';
import { isMissingImage, isMissingTranslation } from '@/utils/vocabHelpers';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { User } from 'firebase/auth';

async function resolveLibraryTranslation(
  word: string,
  language: SupportedLanguage,
): Promise<string | undefined> {
  const initial = await translateWordsBatch([word], language, undefined, 'initial');
  const first = pickBatchTranslation(word, initial, false);
  if (first) return first;

  // Different cache key than the first pass. A copied or failed answer is
  // otherwise reused for weeks and the button never changes the card.
  const strict = await translateWordsBatch([word], language, undefined, 'strict');
  const second = pickBatchTranslation(word, strict, true);
  if (second) return second;

  const single = await translateWord(word, word, language);
  return pickBatchTranslation(word, single?.translation
    ? [{ word, translation: single.translation }]
    : null, true);
}

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

      const item = findVocabularyItem(items, word);
      if (!item) return;

      const needsTranslation = isMissingTranslation(item);
      const needsImage = isMissingImage(item);
      if (!needsTranslation && !needsImage) return;

      setEnrichingWords((prev) => new Set(prev).add(word));

      try {
        let translation = item.translation;
        let imageUrl = item.imageUrl;
        let translationSaved = false;

        if (needsTranslation) {
          const resolved = await resolveLibraryTranslation(word, language);
          if (resolved) {
            translation = resolved;
            await updateVocabTranslation(user.uid, word, language, translation, item.id);
            translationSaved = true;
          }
        }

        if (needsImage) {
          const meaning = translation?.trim() && translation.trim() !== word.trim()
            ? translation.trim()
            : undefined;
          try {
            const imgResult = await getVocabImage(word, meaning ?? item.word, language, [], undefined, {
              translation: meaning,
              acceptBestEffort: true,
            });
            if (imgResult?.imageUrl) {
              imageUrl = imgResult.imageUrl;
              await updateVocabImage(user.uid, word, language, imageUrl, item.id);
            }
          } catch (err) {
            console.error('[handleEnrichItem] Image failed for', word, err);
          }
        }

        if (translationSaved || imageUrl !== item.imageUrl) {
          setItems((prev) =>
            prev.map((v) => (
              wordsMatchCanonically(v.word, word)
                ? {
                    ...v,
                    translation,
                    imageUrl,
                    ...(translationSaved ? { translationConfirmed: true } : {}),
                  }
                : v
            )),
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

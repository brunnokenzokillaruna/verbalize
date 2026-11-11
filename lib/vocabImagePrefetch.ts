import { devLog } from '@/lib/devLog';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import { lookupStoredTranslation } from '@/lib/vocabTranslation';
import { urlsAreSamePhoto } from '@/utils/canonicalImageKey';
import type { HookResult, LessonDefinition, VocabImageResult } from '@/types';

type PrefetchVocabImagesParams = {
  hook: HookResult;
  lesson: LessonDefinition;
  setVocabImage: (word: string, image: VocabImageResult | null) => void;
  /** Live PT-BR glosses — preferred over hook.vocabTranslations (usually empty on live hooks). */
  translations?: Record<string, string>;
};

function resolvePrefetchTranslation(
  word: string,
  hook: HookResult,
  translations?: Record<string, string>,
): string | undefined {
  return (
    lookupStoredTranslation(translations ?? {}, word) ??
    hook.vocabTranslations?.[word]?.translation
  );
}

/**
 * Fetches vocabulary images in parallel (lessons have at most 2 words).
 * Prefer calling after the vocab-card translations land so Pexels search/validation
 * have a PT-BR meaning. acceptBestEffort keeps a closest photo instead of an empty card.
 */
export async function prefetchVocabImages({
  hook,
  lesson,
  setVocabImage,
  translations,
}: PrefetchVocabImagesParams): Promise<void> {
  const words = hook.newVocabulary.map(sanitizeVocabularyToken);
  const dialogue = hook.dialogue;
  const language = lesson.language;

  if (words.length === 0) return;

  const tImages = performance.now();
  devLog(`[Timing] Buscando imagens (${words.length} palavras)...`);

  const imageResults = await Promise.all(
    words.map(async (word) => {
      const t = performance.now();
      const precomputedKeyword = hook.imageKeywords?.[word];
      const translation = resolvePrefetchTranslation(word, hook, translations);
      const result = await getVocabImage(word, dialogue, language, [], precomputedKeyword, {
        translation,
        precomputedKeyword,
        acceptBestEffort: true,
      });
      setVocabImage(word, result);
      devLog(`[Timing] Imagem '${word}': ${(performance.now() - t).toFixed(0)}ms`);
      return { word, result };
    }),
  );

  devLog(`[Timing] ✅ Todas as imagens (paralelo): ${(performance.now() - tImages).toFixed(0)}ms`);

  const usedUrls: string[] = [];
  const refetchWords: Array<{ word: string; fallback: VocabImageResult }> = [];

  imageResults.forEach(({ word, result }) => {
    if (result?.imageUrl && usedUrls.some((u) => urlsAreSamePhoto(u, result.imageUrl))) {
      refetchWords.push({ word, fallback: result });
    } else if (result?.imageUrl) {
      usedUrls.push(result.imageUrl);
    }
  });

  if (refetchWords.length === 0) return;

  for (const { word, fallback } of refetchWords) {
    const precomputedKeyword = hook.imageKeywords?.[word];
    const result = await getVocabImage(word, dialogue, language, [...usedUrls], precomputedKeyword, {
      translation: resolvePrefetchTranslation(word, hook, translations),
      precomputedKeyword,
      acceptBestEffort: true,
    });

    if (result?.imageUrl && !usedUrls.some((u) => urlsAreSamePhoto(u, result.imageUrl))) {
      setVocabImage(word, result);
      usedUrls.push(result.imageUrl);
    } else {
      setVocabImage(word, fallback);
      if (fallback.imageUrl) usedUrls.push(fallback.imageUrl);
    }
  }
}

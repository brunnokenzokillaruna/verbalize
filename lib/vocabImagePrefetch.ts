import { devLog } from '@/lib/devLog';
import { getVocabImage } from '@/app/actions/getVocabImage';
import type { HookResult, LessonDefinition, VocabImageResult } from '@/types';

type PrefetchVocabImagesParams = {
  hook: HookResult;
  lesson: LessonDefinition;
  setVocabImage: (word: string, image: VocabImageResult | null) => void;
};

/**
 * Fetches vocabulary images in parallel (lessons have at most 2 words).
 * Uses precomputed imageKeywords from the hook to skip extra Gemini calls.
 */
export async function prefetchVocabImages({
  hook,
  lesson,
  setVocabImage,
}: PrefetchVocabImagesParams): Promise<void> {
  const words = hook.newVocabulary;
  const dialogue = hook.dialogue;
  const language = lesson.language;

  if (words.length === 0) return;

  const tImages = performance.now();
  devLog(`[Timing] Buscando imagens (${words.length} palavras)...`);

  const imageResults = await Promise.all(
    words.map(async (word) => {
      const t = performance.now();
      const precomputedKeyword = hook.imageKeywords?.[word];
      const result = await getVocabImage(word, dialogue, language, [], precomputedKeyword);
      setVocabImage(word, result);
      devLog(`[Timing] Imagem '${word}': ${(performance.now() - t).toFixed(0)}ms`);
      return { word, result };
    }),
  );

  devLog(`[Timing] ✅ Todas as imagens (paralelo): ${(performance.now() - tImages).toFixed(0)}ms`);

  const usedUrls: string[] = [];
  const refetchWords: Array<{ word: string; fallback: VocabImageResult }> = [];

  imageResults.forEach(({ word, result }) => {
    if (result?.imageUrl && usedUrls.includes(result.imageUrl)) {
      refetchWords.push({ word, fallback: result });
    } else if (result?.imageUrl) {
      usedUrls.push(result.imageUrl);
    }
  });

  if (refetchWords.length === 0) return;

  for (const { word, fallback } of refetchWords) {
    const precomputedKeyword = hook.imageKeywords?.[word];
    const result = await getVocabImage(word, dialogue, language, [...usedUrls], precomputedKeyword);

    if (result?.imageUrl && !usedUrls.includes(result.imageUrl)) {
      setVocabImage(word, result);
      usedUrls.push(result.imageUrl);
    } else {
      setVocabImage(word, fallback);
      if (fallback.imageUrl) usedUrls.push(fallback.imageUrl);
    }
  }
}

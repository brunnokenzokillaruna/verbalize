'use server';

import { searchPexelsPhotos } from '@/services/pexels';
import { getCachedImage, saveImageCache } from '@/services/firestore';
import { scorePhotoCandidate } from '@/lib/vocabImageSearch';
import { buildLessonSceneKeyword, lessonSceneCacheKey } from '@/lib/lessonSceneKeyword';
import type { SupportedLanguage, VocabImageResult } from '@/types';

export interface GetLessonSceneImageParams {
  lessonId: string;
  theme: string;
  uiTitle?: string;
  language: SupportedLanguage;
}

function pickBestPhoto(
  candidates: Array<{ imageUrl: string; photographer: string; alt: string }>,
  keyword: string,
) {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort(
    (a, b) => scorePhotoCandidate(b, keyword) - scorePhotoCandidate(a, keyword),
  );
  return ranked[0] ?? null;
}

/**
 * Returns a shared scene/cover image for a lesson.
 * Cache key is scene_{lessonId} so all users reuse the same photo.
 * No Gemini — deterministic keyword + Pexels alt scoring only.
 */
export async function getLessonSceneImage(
  params: GetLessonSceneImageParams,
): Promise<VocabImageResult | null> {
  const { lessonId, theme, uiTitle, language } = params;
  const cacheKey = lessonSceneCacheKey(lessonId);

  try {
    const keyword = buildLessonSceneKeyword(theme, uiTitle);

    const cached = await getCachedImage(cacheKey);
    // Reuse cache only when the keyword algorithm still matches — otherwise refetch.
    if (cached?.approved && cached.imageUrl && cached.searchKeyword === keyword) {
      return { imageUrl: cached.imageUrl, imageAlt: cached.photographer };
    }

    const candidates = await searchPexelsPhotos(keyword, { perPage: 8, maxPages: 1 });
    let best = pickBestPhoto(candidates, keyword);

    if (!best) {
      const themeOnly = buildLessonSceneKeyword(theme);
      if (themeOnly !== keyword) {
        const fallback = await searchPexelsPhotos(themeOnly, { perPage: 8, maxPages: 1 });
        best = pickBestPhoto(fallback, themeOnly);
      }
    }

    if (!best) return null;

    await saveImageCache(cacheKey, {
      language,
      imageUrl: best.imageUrl,
      photographer: best.photographer,
      searchKeyword: keyword,
      translation: uiTitle?.trim() || theme,
      approved: true,
      kind: 'lesson_scene',
    });

    return { imageUrl: best.imageUrl, imageAlt: best.photographer };
  } catch (err) {
    console.error('[getLessonSceneImage] Error:', err);
    return null;
  }
}

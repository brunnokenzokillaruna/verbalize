'use server';

import { searchPexelsPhotos } from '@/services/pexels';
import { getCachedImage, saveImageCache } from '@/services/firestore';
import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import {
  buildVisualSearchKeyword,
  pickValidatedPhoto,
} from '@/lib/vocabImageSearch';
import type { SupportedLanguage, VocabImageResult } from '@/types';

function buildImageCachePayload(
  language: SupportedLanguage,
  imageUrl: string,
  photographer: string,
  searchKeyword: string,
  translation?: string,
  approved = true,
) {
  return {
    language,
    imageUrl,
    photographer,
    searchKeyword,
    approved,
    ...(translation ? { translation } : {}),
  };
}

export interface GetVocabImageOptions {
  translation?: string;
  precomputedKeyword?: string;
  /** When false, always re-search even if a cached image exists (unless admin-approved). */
  allowCached?: boolean;
}

/**
 * Returns a validated image URL for a vocabulary word.
 * Flow: approved cache → Pexels (multiple candidates) → Gemini validation → cache
 */
export async function getVocabImage(
  word: string,
  sentence: string,
  language: SupportedLanguage,
  excludeUrls: string[] = [],
  precomputedKeyword?: string,
  options?: GetVocabImageOptions,
): Promise<VocabImageResult | null> {
  try {
    const cleanWord = sanitizeVocabularyToken(word);
    const cacheKey = `${cleanWord}_${language}`;
    const translation = options?.translation?.trim();
    const keywordHint = options?.precomputedKeyword ?? precomputedKeyword;
    const cached = await getCachedImage(cacheKey);

    if (
      options?.allowCached !== false &&
      cached?.approved &&
      cached.imageUrl &&
      !excludeUrls.includes(cached.imageUrl)
    ) {
      return { imageUrl: cached.imageUrl, imageAlt: cached.photographer };
    }

    const keyword = await buildVisualSearchKeyword(
      cleanWord,
      language,
      translation,
      sentence,
      keywordHint,
    );

    const candidates = await searchPexelsPhotos(keyword, { perPage: 8, maxPages: 2 });
    const validated = await pickValidatedPhoto(
      candidates,
      cleanWord,
      language,
      keyword,
      translation,
      excludeUrls,
    );

    if (validated) {
      await saveImageCache(cacheKey, buildImageCachePayload(
        language,
        validated.imageUrl,
        validated.photographer,
        keyword,
        translation,
      ));
      return { imageUrl: validated.imageUrl, imageAlt: validated.photographer };
    }

    if (translation) {
      const fallbackKeyword = `${translation} photo isolated`;
      if (fallbackKeyword !== keyword) {
        const fallbackCandidates = await searchPexelsPhotos(fallbackKeyword, { perPage: 8, maxPages: 1 });
        const fallbackValidated = await pickValidatedPhoto(
          fallbackCandidates,
          cleanWord,
          language,
          fallbackKeyword,
          translation,
          excludeUrls,
        );
        if (fallbackValidated) {
          await saveImageCache(cacheKey, buildImageCachePayload(
            language,
            fallbackValidated.imageUrl,
            fallbackValidated.photographer,
            fallbackKeyword,
            translation,
          ));
          return { imageUrl: fallbackValidated.imageUrl, imageAlt: fallbackValidated.photographer };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('[getVocabImage] Error:', err);
    return null;
  }
}

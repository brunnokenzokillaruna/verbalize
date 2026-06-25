'use server';

import { callGemini } from '@/services/gemini';
import { searchPexels } from '@/services/pexels';
import { getCachedImage, saveImageCache } from '@/services/firestore';
import { sanitizeVocabularyToken } from '@/lib/hookSanitize';
import type { SupportedLanguage, VocabImageResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

function buildSimplePexelsKeyword(word: string): string {
  const cleaned = sanitizeVocabularyToken(word).replace(/-/g, ' ');
  return `${cleaned} isolated neutral background`;
}

async function searchPexelsWithKeyword(
  keyword: string,
  cacheKey: string,
  language: SupportedLanguage,
  excludeUrls: string[],
): Promise<VocabImageResult | null> {
  for (let page = 1; page <= 3; page++) {
    const photo = await searchPexels(keyword, page);
    if (!photo) break;

    if (!excludeUrls.includes(photo.imageUrl)) {
      if (page === 1) {
        await saveImageCache(cacheKey, {
          language,
          imageUrl: photo.imageUrl,
          photographer: photo.photographer,
        });
      }
      return { imageUrl: photo.imageUrl, imageAlt: photo.photographer };
    }
  }
  return null;
}

async function resolveGeminiKeyword(
  word: string,
  sentence: string,
  language: SupportedLanguage,
): Promise<string | null> {
  const keywordPrompt = `Generate a highly precise search keyword string to query Pexels for the ${LANG_LABEL[language]} word "${word}" in this sentence context: "${sentence}".

Rules:
- Focus on a single object or action.
- Avoid complex scenes with multiple people.
- Prefer neutral backgrounds and single subjects.
- Output ONLY the search query string in English (e.g., "coffee cup isolated white background").
- No explanation, no punctuation, just the keyword string.`;

  try {
    return (await callGemini(keywordPrompt, undefined, 150, 0, 'lightweight')).trim();
  } catch (err) {
    console.warn('[getVocabImage] Gemini keyword failed — using local fallback:', err);
    return null;
  }
}

/**
 * Returns an image URL for a vocabulary word.
 * Flow: Firestore cache → Pexels (local keyword) → Gemini keyword → Pexels again
 * Pass `excludeUrls` to avoid returning an image already used by another word.
 */
export async function getVocabImage(
  word: string,
  sentence: string,
  language: SupportedLanguage,
  excludeUrls: string[] = [],
  precomputedKeyword?: string,
): Promise<VocabImageResult | null> {
  try {
    const cleanWord = sanitizeVocabularyToken(word);
    const cacheKey = `${cleanWord}_${language}`;
    const cached = await getCachedImage(cacheKey);
    if (cached && !excludeUrls.includes(cached.imageUrl)) {
      return { imageUrl: cached.imageUrl, imageAlt: cached.photographer };
    }

    const keywordCandidates = [
      precomputedKeyword?.trim(),
      buildSimplePexelsKeyword(cleanWord),
    ].filter((k): k is string => !!k);

    for (const keyword of keywordCandidates) {
      const result = await searchPexelsWithKeyword(keyword, cacheKey, language, excludeUrls);
      if (result) return result;
    }

    const geminiKeyword = await resolveGeminiKeyword(cleanWord, sentence, language);
    if (geminiKeyword) {
      const result = await searchPexelsWithKeyword(geminiKeyword, cacheKey, language, excludeUrls);
      if (result) return result;
    }

    if (cached) return { imageUrl: cached.imageUrl, imageAlt: cached.photographer };
    return null;
  } catch (err) {
    console.error('[getVocabImage] Error:', err);
    return null;
  }
}

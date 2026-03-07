'use server';

import { callGemini } from '@/services/gemini';
import { searchPexels } from '@/services/pexels';
import { getCachedImage, saveImageCache } from '@/services/firestore';
import type { SupportedLanguage, VocabImageResult } from '@/types';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'French',
  en: 'English',
};

/**
 * Returns an image URL for a vocabulary word.
 * Flow: Firestore cache → Gemini keyword → Pexels → save cache
 * Returns null if any step fails (UI shows placeholder).
 */
export async function getVocabImage(
  word: string,
  sentence: string,
  language: SupportedLanguage,
): Promise<VocabImageResult | null> {
  try {
    // ── 1. Check Firestore cache ──────────────────────────────────────────────
    const cacheKey = `${word}_${language}`;
    const cached = await getCachedImage(cacheKey);
    if (cached) {
      return { imageUrl: cached.imageUrl, imageAlt: cached.photographer };
    }

    // ── 2. Generate image search keyword via Gemini (Prompt #3) ──────────────
    const keywordPrompt = `Generate a highly precise search keyword string to query Pexels for the ${LANG_LABEL[language]} word "${word}" in this sentence context: "${sentence}".

Rules:
- Focus on a single object or action.
- Avoid complex scenes with multiple people.
- Prefer neutral backgrounds and single subjects.
- Output ONLY the search query string in English (e.g., "coffee cup isolated white background").
- No explanation, no punctuation, just the keyword string.`;

    const keyword = await callGemini(keywordPrompt);

    // ── 3. Fetch from Pexels ──────────────────────────────────────────────────
    const photo = await searchPexels(keyword.trim());
    if (!photo) return null;

    // ── 4. Save to Firestore cache ────────────────────────────────────────────
    await saveImageCache(cacheKey, {
      language,
      imageUrl: photo.imageUrl,
      photographer: photo.photographer,
    });

    return { imageUrl: photo.imageUrl, imageAlt: photo.photographer };
  } catch (err) {
    console.error('[getVocabImage] Error:', err);
    return null;
  }
}

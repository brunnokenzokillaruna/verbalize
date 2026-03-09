'use server';

import {
  getAllImageCache,
  updateImageCache,
  approveImageCache,
  updateImageCacheTranslation,
} from '@/services/firestore';
import { searchPexels } from '@/services/pexels';
import { callGemini, callGeminiJSON } from '@/services/gemini';
import type { ImageCacheDocument } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strips language suffix from a cache key: "chat_fr" → "chat" */
function parseKey(cacheKey: string): { word: string; lang: string } {
  const m = cacheKey.match(/^(.+)_(fr|en)$/);
  return m ? { word: m[1], lang: m[2] } : { word: cacheKey, lang: '' };
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetches all image_cache entries sorted alphabetically.
 * For entries missing a pt-BR translation, generates them in a single Gemini
 * batch call and persists the results back to Firestore.
 */
export async function fetchAllImageCache(): Promise<ImageCacheDocument[]> {
  const entries = await getAllImageCache();
  entries.sort((a, b) => a.word.localeCompare(b.word));

  const missing = entries.filter((e) => !e.translation);

  if (missing.length > 0) {
    try {
      const wordList = missing
        .map((e) => {
          const { word, lang } = parseKey(e.word);
          const langLabel = lang === 'fr' ? 'French' : 'English';
          return `${e.word}: ${word} (${langLabel})`;
        })
        .join('\n');

      const prompt = `Translate the following words to Portuguese (pt-BR).
Return ONLY a valid JSON object mapping each key to its Portuguese translation.
Example: { "chat_fr": "gato", "eat_en": "comer" }

Words:
${wordList}`;

      const translations = await callGeminiJSON<Record<string, string>>(prompt);

      await Promise.all(
        missing.map(async (e) => {
          const t = translations[e.word];
          if (t) {
            e.translation = t;
            await updateImageCacheTranslation(e.word, t).catch(() => {});
          }
        }),
      );
    } catch {
      // Non-fatal — translations stay empty, display falls back to word only
    }
  }

  return entries;
}

/**
 * Searches Pexels for up to 6 alternative images for a given cache key.
 * Uses Gemini to generate a relevant English image search keyword.
 */
export async function fetchPexelsAlternatives(
  cacheKey: string,
  excludeUrl: string,
  translation?: string,
): Promise<Array<{ imageUrl: string; photographer: string }>> {
  const { word, lang } = parseKey(cacheKey);
  const langLabel = lang === 'fr' ? 'French' : 'English';
  const meaningHint = translation ? ` (meaning "${translation}" in Portuguese)` : '';

  let keyword = word; // safe fallback
  try {
    const prompt = `Generate a highly precise English search query for the Pexels image library.
The query is for the ${langLabel} word "${word}"${meaningHint}.

Rules:
- Focus on a single concrete object, action, or concept that visually represents the word.
- Avoid complex scenes with multiple people.
- Prefer neutral backgrounds and single subjects.
- Output ONLY the search query string (e.g., "red apple isolated white background").
- No explanation, no punctuation other than spaces.`;

    keyword = (await callGemini(prompt)).trim();
  } catch {
    // Use raw word as fallback
  }

  const results: Array<{ imageUrl: string; photographer: string }> = [];
  for (let page = 1; page <= 8 && results.length < 6; page++) {
    const photo = await searchPexels(keyword, page);
    if (!photo) break;
    if (photo.imageUrl !== excludeUrl) {
      results.push(photo);
    }
  }

  return results;
}

export async function replaceImageCacheEntry(
  cacheKey: string,
  imageUrl: string,
  photographer: string,
): Promise<void> {
  await updateImageCache(cacheKey, imageUrl, photographer);
}

export async function approveImageCacheEntry(cacheKey: string): Promise<void> {
  await approveImageCache(cacheKey);
}

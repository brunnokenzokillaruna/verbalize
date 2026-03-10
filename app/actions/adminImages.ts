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

/** Strips language suffix from a cache key: "chat_fr" → { word: "chat", lang: "fr" } */
function parseKey(cacheKey: string): { word: string; lang: string } {
  const m = cacheKey.match(/^(.+)_(fr|en)$/);
  return m ? { word: m[1], lang: m[2] } : { word: cacheKey, lang: '' };
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetches all image_cache entries sorted alphabetically.
 * Does NOT block on translations — returns immediately so images load fast.
 */
export async function fetchAllImageCache(): Promise<ImageCacheDocument[]> {
  try {
    const entries = await getAllImageCache();
    entries.sort((a, b) => a.word.localeCompare(b.word));
    return entries;
  } catch (err) {
    console.error('[adminImages] fetchAllImageCache failed:', err);
    return [];
  }
}

/**
 * Translates a batch of cache keys that are missing pt-BR translations.
 * Called separately after images are loaded so it never blocks the UI.
 * Returns a map of cacheKey → translation.
 */
export async function translateMissingEntries(
  cacheKeys: string[],
): Promise<Record<string, string>> {
  if (cacheKeys.length === 0) return {};

  const items = cacheKeys.map((key) => {
    const { word, lang } = parseKey(key);
    return { key, word, language: lang === 'fr' ? 'French' : 'English' };
  });

  const inputJson = JSON.stringify(items);
  const prompt = `Translate each word to Portuguese (pt-BR).
Input is a JSON array where each item has a "key", "word", and "language".
Return ONLY a valid JSON object mapping each "key" to its Portuguese translation.

Input: ${inputJson}

Example output: {"aimer_fr": "amar", "manger_fr": "comer"}
Output ONLY the JSON object, nothing else.`;

  try {
    const translations = await callGeminiJSON<Record<string, string>>(prompt);

    // Persist to Firestore in the background (fire-and-forget per entry)
    for (const [key, t] of Object.entries(translations)) {
      if (t) {
        updateImageCacheTranslation(key, t).catch((err) =>
          console.error('[adminImages] failed to save translation for', key, err),
        );
      }
    }

    return translations;
  } catch (err) {
    console.error('[adminImages] translateMissingEntries failed:', err);
    return {};
  }
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

  // ── Step 1: get the translation if not provided ───────────────────────────
  let resolvedTranslation = translation;
  if (!resolvedTranslation) {
    try {
      resolvedTranslation = (
        await callGemini(
          `Translate the ${langLabel} word "${word}" to Portuguese (pt-BR). Reply with ONLY the translation, no explanation.`,
        )
      ).trim();
    } catch (err) {
      console.error('[adminImages] on-demand translation failed:', err);
    }
  }

  const meaningHint = resolvedTranslation
    ? ` (meaning "${resolvedTranslation}" in Portuguese)`
    : '';

  // ── Step 2: generate a precise Pexels search keyword ─────────────────────
  let keyword = resolvedTranslation ?? word;
  try {
    keyword = (
      await callGemini(
        `Generate a precise English search query for the Pexels image library.
The query is for the ${langLabel} word "${word}"${meaningHint}.

Rules:
- Focus on a single concrete object, action, or concept that represents the word visually.
- Prefer isolated subjects on neutral backgrounds.
- Output ONLY the search query string (e.g., "red apple isolated white background").
- No explanation, no punctuation other than spaces.`,
      )
    ).trim();
  } catch (err) {
    console.error('[adminImages] keyword generation failed, fallback:', resolvedTranslation ?? word, err);
  }

  // ── Step 3: collect up to 6 Pexels results ────────────────────────────────
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

/**
 * Searches Pexels using a user-supplied custom query string.
 * Returns up to 6 results, skipping any URLs already seen.
 */
export async function fetchPexelsFromCustomPrompt(
  query: string,
  excludeUrls: string[] = [],
): Promise<Array<{ imageUrl: string; photographer: string }>> {
  if (!query.trim()) return [];
  const results: Array<{ imageUrl: string; photographer: string }> = [];
  for (let page = 1; page <= 10 && results.length < 6; page++) {
    const photo = await searchPexels(query.trim(), page);
    if (!photo) break;
    if (!excludeUrls.includes(photo.imageUrl)) {
      results.push(photo);
    }
  }
  return results;
}

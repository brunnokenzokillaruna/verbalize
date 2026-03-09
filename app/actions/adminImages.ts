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

/**
 * Translates a batch of items (max ~20) via a single Gemini call.
 * Sends input as JSON so the model returns keys exactly as given.
 */
async function batchTranslate(
  items: Array<{ key: string; word: string; lang: string }>,
): Promise<Record<string, string>> {
  const inputJson = JSON.stringify(
    items.map(({ key, word, lang }) => ({
      key,
      word,
      language: lang === 'fr' ? 'French' : 'English',
    })),
  );

  const prompt = `Translate each word to Portuguese (pt-BR).
Return ONLY a valid JSON object mapping each "key" to its Portuguese translation.

Input: ${inputJson}

Expected output format: {"aimer_fr": "amar", "manger_fr": "comer"}
Output ONLY the JSON object, nothing else.`;

  return callGeminiJSON<Record<string, string>>(prompt);
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetches all image_cache entries sorted alphabetically.
 * For entries missing a pt-BR translation, generates them in batches of 20
 * via Gemini and persists the results back to Firestore.
 */
export async function fetchAllImageCache(): Promise<ImageCacheDocument[]> {
  const entries = await getAllImageCache();
  entries.sort((a, b) => a.word.localeCompare(b.word));

  const missing = entries.filter((e) => !e.translation);

  if (missing.length > 0) {
    const BATCH_SIZE = 20;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      try {
        const items = batch.map((e) => {
          const { word, lang } = parseKey(e.word);
          return { key: e.word, word, lang };
        });
        const translations = await batchTranslate(items);

        await Promise.all(
          batch.map(async (e) => {
            const t = translations[e.word];
            if (t) {
              e.translation = t;
              await updateImageCacheTranslation(e.word, t).catch((err) => {
                console.error('[adminImages] failed to persist translation for', e.word, err);
              });
            } else {
              console.warn('[adminImages] no translation returned for key:', e.word, '| got keys:', Object.keys(translations));
            }
          }),
        );
      } catch (err) {
        console.error('[adminImages] batchTranslate failed for batch starting at', i, err);
      }
    }
  }

  return entries;
}

/**
 * Searches Pexels for up to 6 alternative images for a given cache key.
 * Uses Gemini to generate a relevant English image search keyword from the
 * word + its Portuguese translation, so results are topically accurate.
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
      console.error('[adminImages] translation fallback failed:', err);
    }
  }

  // ── Step 2: generate a precise Pexels search keyword ─────────────────────
  const meaningHint = resolvedTranslation
    ? ` (meaning "${resolvedTranslation}" in Portuguese)`
    : '';

  let keyword = resolvedTranslation ?? word; // better fallback than raw foreign word
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
    console.error('[adminImages] keyword generation failed, using fallback:', resolvedTranslation ?? word, err);
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

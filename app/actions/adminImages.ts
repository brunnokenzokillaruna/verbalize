'use server';

import { getAllImageCache, updateImageCache, approveImageCache } from '@/services/firestore';
import { searchPexels } from '@/services/pexels';
import type { ImageCacheDocument } from '@/types';

export async function fetchAllImageCache(): Promise<ImageCacheDocument[]> {
  const entries = await getAllImageCache();
  return entries.sort((a, b) => a.word.localeCompare(b.word));
}

/**
 * Searches Pexels for up to 6 alternative images for a given cache key.
 * Strips the language suffix (e.g., "chat_fr" → "chat") to use as the search term.
 */
export async function fetchPexelsAlternatives(
  cacheKey: string,
  excludeUrl: string,
): Promise<Array<{ imageUrl: string; photographer: string }>> {
  const searchWord = cacheKey.replace(/_(?:fr|en)$/, '');
  const results: Array<{ imageUrl: string; photographer: string }> = [];

  for (let page = 1; page <= 8 && results.length < 6; page++) {
    const photo = await searchPexels(searchWord, page);
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

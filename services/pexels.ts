import { getPexelsKey } from '@/lib/env';

interface PexelsPhoto {
  src: {
    large2x: string;
    large: string;
  };
  photographer: string;
  alt: string | null;
}

interface PexelsResponse {
  photos?: PexelsPhoto[];
  error?: string;
}

/**
 * Searches Pexels for a single landscape image matching the keyword.
 * Returns null if no results or on error.
 * Runs server-side only (uses PEXELS_API_KEY).
 */
export async function searchPexels(
  keyword: string,
): Promise<{ imageUrl: string; photographer: string } | null> {
  const apiKey = getPexelsKey();
  const params = new URLSearchParams({
    query: keyword,
    per_page: '1',
    orientation: 'landscape',
  });

  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
    // Cache for 1 hour at the edge — Pexels results for the same keyword rarely change
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[Pexels] API error ${res.status} for keyword: "${keyword}"`);
    return null;
  }

  const data: PexelsResponse = await res.json();
  const photo = data.photos?.[0];

  if (!photo) {
    console.warn(`[Pexels] No results for keyword: "${keyword}"`);
    return null;
  }

  return {
    imageUrl: photo.src.large2x || photo.src.large,
    photographer: photo.photographer,
  };
}

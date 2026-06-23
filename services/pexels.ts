import { getPexelsKey } from '@/lib/env';

interface PexelsPhoto {
  src: {
    large2x: string;
    large: string;
    medium: string;
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
  page = 1,
): Promise<{ imageUrl: string; photographer: string } | null> {
  const apiKey = getPexelsKey();
  const params = new URLSearchParams({
    query: keyword,
    per_page: '1',
    page: String(page),
    orientation: 'landscape',
  });

  let res: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: apiKey },
      // Cache for 1 hour at the edge — Pexels results for the same keyword rarely change
      next: { revalidate: 3600 },
    });

    if (res.ok) break;

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 2) {
      console.error(`[Pexels] API error ${res.status} for keyword: "${keyword}"`);
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  if (!res?.ok) return null;

  const data: PexelsResponse = await res.json();
  const photo = data.photos?.[0];

  if (!photo) {
    console.warn(`[Pexels] No results for keyword: "${keyword}"`);
    return null;
  }

  return {
    imageUrl: photo.src.large || photo.src.medium || photo.src.large2x,
    photographer: photo.photographer,
  };
}

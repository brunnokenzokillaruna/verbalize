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

export interface PexelsPhotoResult {
  imageUrl: string;
  photographer: string;
  alt: string;
}

interface PexelsResponse {
  photos?: PexelsPhoto[];
  error?: string;
}

async function fetchPexelsPage(
  keyword: string,
  page: number,
  perPage: number,
): Promise<PexelsPhoto[]> {
  const apiKey = getPexelsKey();
  const params = new URLSearchParams({
    query: keyword,
    per_page: String(perPage),
    page: String(page),
    orientation: 'landscape',
  });

  let res: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (res.ok) break;

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 2) {
      console.error(`[Pexels] API error ${res.status} for keyword: "${keyword}"`);
      return [];
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  if (!res?.ok) return [];

  const data: PexelsResponse = await res.json();
  return data.photos ?? [];
}

function mapPhoto(photo: PexelsPhoto): PexelsPhotoResult {
  return {
    imageUrl: photo.src.large || photo.src.medium || photo.src.large2x,
    photographer: photo.photographer,
    alt: photo.alt?.trim() ?? '',
  };
}

/**
 * Searches Pexels for multiple landscape photos matching the keyword.
 */
export async function searchPexelsPhotos(
  keyword: string,
  options?: { page?: number; perPage?: number; maxPages?: number },
): Promise<PexelsPhotoResult[]> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 8;
  const maxPages = options?.maxPages ?? 1;
  const results: PexelsPhotoResult[] = [];

  for (let currentPage = page; currentPage < page + maxPages; currentPage++) {
    const photos = await fetchPexelsPage(keyword, currentPage, perPage);
    if (photos.length === 0) break;
    results.push(...photos.map(mapPhoto));
    if (photos.length < perPage) break;
  }

  return results;
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
  const photos = await searchPexelsPhotos(keyword, { page, perPage: 1, maxPages: 1 });
  const photo = photos[0];
  if (!photo) {
    console.warn(`[Pexels] No results for keyword: "${keyword}"`);
    return null;
  }

  return {
    imageUrl: photo.imageUrl,
    photographer: photo.photographer,
  };
}

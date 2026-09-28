/**
 * Identity key for stock photos so size/query variants of the same asset collide.
 * Pexels serves the same photo under different `h`/`w` query params.
 */
export function canonicalImageKey(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const pexelsId = parsed.pathname.match(/\/photos\/(\d+)/)?.[1];
    if (pexelsId && parsed.hostname.includes('pexels')) {
      return `pexels:${pexelsId}`;
    }
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split(/[?#]/)[0].toLowerCase();
  }
}

export function urlsAreSamePhoto(a: string, b: string): boolean {
  const keyA = canonicalImageKey(a);
  const keyB = canonicalImageKey(b);
  return Boolean(keyA && keyB && keyA === keyB);
}

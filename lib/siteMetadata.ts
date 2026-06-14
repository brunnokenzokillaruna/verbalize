import type { Metadata } from 'next';

export const SITE_URL = 'https://verbalize-one.vercel.app';

export const ogImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Verbalize — Aprenda francês e inglês com micro-histórias',
} as const;

export function withOgImage(
  metadata: Metadata,
  pageUrl: string,
): Metadata {
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      url: pageUrl,
      images: [ogImage],
    },
    twitter: {
      ...metadata.twitter,
      images: [ogImage.url],
    },
  };
}

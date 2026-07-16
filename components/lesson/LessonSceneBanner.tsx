'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { VocabImageResult } from '@/types';

interface LessonSceneBannerProps {
  sceneImage: VocabImageResult | null;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Compact landscape scene banner used above dialogue / mission content.
 */
export function LessonSceneBanner({
  sceneImage,
  title,
  subtitle,
  className = '',
}: LessonSceneBannerProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [useNativeImage, setUseNativeImage] = useState(false);
  const showImage = !!sceneImage?.imageUrl && !imageFailed;
  const usePexelsDirect = !!sceneImage?.imageUrl?.includes('pexels.com');

  if (!showImage && !title) return null;

  return (
    <div
      className={[
        'relative w-full overflow-hidden rounded-2xl border border-border border-b-[3px]',
        'h-36 sm:h-44',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      {showImage ? (
        useNativeImage || usePexelsDirect ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sceneImage!.imageUrl}
            alt={sceneImage!.imageAlt ?? title ?? 'Cena da lição'}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Image
            src={sceneImage!.imageUrl}
            alt={sceneImage!.imageAlt ?? title ?? 'Cena da lição'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            onError={() => setUseNativeImage(true)}
          />
        )
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(12,10,9,0.72) 0%, rgba(12,10,9,0.15) 55%, transparent 100%)',
        }}
      />

      {(title || subtitle) && (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5 pt-8">
          {title && (
            <p className="font-display text-lg sm:text-xl font-black italic tracking-tight text-white leading-tight">
              {title}
            </p>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs font-semibold text-white/75">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

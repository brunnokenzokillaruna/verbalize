'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

interface VisualVocabCardProps {
  word: string;
  translation: string;
  language: SupportedLanguage;
  imageUrl?: string;
  imageAlt?: string;
  exampleSentence?: string;
  /** Short definition in the target language (e.g. "un fruit rouge" for "pomme"). Shown on A2+ immersive mode. */
  targetDefinition?: string;
  /** When true, hides translation initially and shows targetDefinition instead. User taps to reveal. */
  immersive?: boolean;
  /** True while the image is still being fetched from the server. */
  isImageLoading?: boolean;
}

export function VisualVocabCard({
  word,
  translation,
  language,
  imageUrl,
  imageAlt,
  exampleSentence,
  targetDefinition,
  immersive = false,
  isImageLoading = false,
}: VisualVocabCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [useNativeImage, setUseNativeImage] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const showImmersive = immersive && !!targetDefinition && !revealed;
  const showImage = !!imageUrl && !imageFailed;
  const usePexelsDirect = !!imageUrl?.includes('pexels.com');

  useEffect(() => {
    setUseNativeImage(false);
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={[
        'group flex flex-col overflow-hidden rounded-2xl border border-border border-b-[3px] bg-surface shadow-sm transition-all duration-150',
        'hover:translate-y-[1px] hover:border-b-[2px] active:translate-y-[2px] active:border-b-[1px]',
        immersive && !revealed ? 'cursor-pointer' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (immersive && !revealed) setRevealed(true);
      }}
      role={immersive && !revealed ? 'button' : undefined}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {showImage ? (
          useNativeImage || usePexelsDirect ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={imageAlt ?? word}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Image
              src={imageUrl}
              alt={imageAlt ?? word}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 45vw, 220px"
              onError={() => setUseNativeImage(true)}
            />
          )
        ) : isImageLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-transparent">
            <Loader2 size={24} className="animate-spin text-[var(--color-primary)] opacity-70" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-transparent">
            <span
              className="text-3xl opacity-60"
              role="img"
              aria-label={word}
            >
              🖼️
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-3 py-3 border-t border-border bg-surface">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="font-display text-base sm:text-lg font-bold leading-tight truncate"
              style={{ color: 'var(--color-vocab)' }}
            >
              {word}
            </p>
            {showImmersive ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRevealed(true);
                }}
                className="mt-0.5 text-left text-[11px] font-medium italic leading-snug text-text-secondary line-clamp-2"
              >
                {targetDefinition}
                <span className="ml-1 text-[8px] font-black uppercase not-italic tracking-widest text-text-muted">
                  · toque
                </span>
              </button>
            ) : (
              <p className="mt-0.5 text-xs font-semibold leading-snug text-text-secondary truncate">
                {translation}
              </p>
            )}
          </div>
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <AudioPlayerButton text={word} language={language} size="sm" />
          </div>
        </div>

        {exampleSentence && (
          <p className="text-[10px] font-medium leading-relaxed text-text-muted italic line-clamp-2 border-t border-border/60 pt-2">
            &ldquo;{exampleSentence}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

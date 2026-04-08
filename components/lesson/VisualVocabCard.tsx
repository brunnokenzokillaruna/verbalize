'use client';

import Image from 'next/image';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

interface VisualVocabCardProps {
  word: string;
  translation: string;
  language: SupportedLanguage;
  imageUrl?: string;
  imageAlt?: string;
  exampleSentence?: string;
}

export function VisualVocabCard({
  word,
  translation,
  language,
  imageUrl,
  imageAlt,
  exampleSentence,
}: VisualVocabCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-[1.25rem] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl/50"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Image area with refined treatment */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '16/10', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? word}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-transparent opacity-40"
          >
            <span className="text-3xl grayscale filter group-hover:scale-110 transition-transform duration-500" role="img" aria-label={word}>
              🖼️
            </span>
          </div>
        )}

        {/* Delicate Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 transition-opacity duration-700"
        />

        {/* Word Overlay with sophisticated typography */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex flex-col gap-0 transformation-gpu transition-transform duration-500 group-hover:translate-x-0.5">
            <h3
              className="font-display text-2xl font-bold tracking-tight text-white"
            >
              {word}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-white/80 italic tracking-wide">
              {translation}
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Control Bar */}
      <div className="relative px-4 py-3 bg-[var(--color-surface)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {exampleSentence && (
              <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] opacity-70 italic line-clamp-1 group-hover:opacity-100 transition-opacity">
                "{exampleSentence}"
              </p>
            )}
          </div>

          <div className="shrink-0 scale-90 transition-transform duration-300 hover:scale-100">
            <AudioPlayerButton text={word} language={language} size="sm" />
          </div>
        </div>
        
        {/* Very subtle Accent Line */}
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--color-primary)] opacity-60 transition-all duration-700 group-hover:w-full"></div>
      </div>
    </div>
  );
}

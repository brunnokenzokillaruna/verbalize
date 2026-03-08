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
      className="overflow-hidden rounded-3xl animate-slide-up"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '16/9', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? word}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        ) : (
          // Placeholder while image loads progressively
          <div
            className="flex h-full w-full animate-pulse items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <span className="text-6xl opacity-20" role="img" aria-label={word}>
              🖼️
            </span>
          </div>
        )}

        {/* Gradient overlay — word sits on top */}
        {imageUrl && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
            }}
          />
        )}

        {/* Word overlay on image */}
        {imageUrl && (
          <div className="absolute bottom-0 left-0 p-5">
            <p
              className="font-display text-3xl font-bold leading-tight text-white drop-shadow-lg"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            >
              {word}
            </p>
          </div>
        )}
      </div>

      {/* Bottom content area */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {!imageUrl && (
              <p
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--color-vocab)' }}
              >
                {word}
              </p>
            )}
            <p
              className="text-lg"
              style={{ color: 'var(--color-text-secondary)', marginTop: imageUrl ? 0 : 4 }}
            >
              {translation}
            </p>

            {exampleSentence && (
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}
              >
                {exampleSentence}
              </p>
            )}
          </div>

          <AudioPlayerButton text={word} language={language} size="md" />
        </div>
      </div>
    </div>
  );
}

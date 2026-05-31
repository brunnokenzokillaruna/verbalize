'use client';

import { useState } from 'react';
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
  /** Short definition in the target language (e.g. "un fruit rouge" for "pomme"). Shown on A2+ immersive mode. */
  targetDefinition?: string;
  /** When true, hides translation initially and shows targetDefinition instead. User taps to reveal. */
  immersive?: boolean;
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
}: VisualVocabCardProps) {
  const [revealed, setRevealed] = useState(false);
  const showImmersive = immersive && !!targetDefinition && !revealed;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl transition-all duration-150 border border-[var(--color-border)] border-b-[4px] shadow-[0_4px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.2)] bg-[var(--color-surface)]",
        "hover:translate-y-[1px] hover:border-b-[3px] active:translate-y-[2px] active:border-b-[1px]",
        immersive && !revealed ? "cursor-pointer" : ""
      ].filter(Boolean).join(" ")}
      onClick={() => { if (immersive && !revealed) setRevealed(true); }}
      role={immersive && !revealed ? 'button' : undefined}
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
            className="object-cover transition-transform duration-700 group-hover:scale-105"
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
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-70 transition-opacity duration-500"
        />

        {/* Word Overlay with sophisticated typography */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex flex-col gap-0.5 transform transition-transform duration-300 group-hover:translate-x-0.5">
            <h3
              className="font-serif text-2xl font-black italic tracking-tight text-white"
            >
              {word}
            </h3>
            {showImmersive ? (
              <p className="mt-0.5 text-xs font-semibold text-white/80 italic tracking-wide">
                {targetDefinition}
                <span className="ml-1.5 text-[8px] font-black uppercase text-white/40 not-italic tracking-widest bg-black/35 px-1.5 py-0.5 rounded">toque</span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs font-semibold text-white/95 italic tracking-wide">
                {translation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Control Bar */}
      <div className="relative px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {exampleSentence && (
              <p className="text-[11px] font-medium leading-relaxed text-[var(--color-text-secondary)] opacity-75 italic line-clamp-1 group-hover:opacity-100 transition-opacity">
                &quot;{exampleSentence}&quot;
              </p>
            )}
          </div>

          <div className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95">
            <AudioPlayerButton text={word} language={language} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

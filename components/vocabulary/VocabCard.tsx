import React from 'react';
import Image from 'next/image';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { SrsBar, SRS_BAR_COLOR, SRS_LABELS, formatNextReview } from './SrsBar';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

export function VocabCard({
  item,
  language,
  urgent = false,
  animDelay = 0,
}: {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
  animDelay?: number;
}) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const isPlaceholder = item.translation === item.word || !item.translation;
  const reviewText = formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0]);
  const barColor = SRS_BAR_COLOR[level];

  return (
    <div
      className="card-lift group flex flex-col rounded-2xl overflow-hidden animate-slide-up"
      style={{
        animationDelay: `${animDelay}ms`,
        animationFillMode: 'both',
        backgroundColor: 'var(--color-surface)',
        border: `1.5px solid ${urgent ? 'var(--color-error)' : 'var(--color-border)'}`,
        boxShadow: urgent ? '0 0 0 3px var(--color-error-bg)' : undefined,
      }}
    >
      {/* Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.word}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
              }}
            />
            <p
              className="absolute bottom-2 left-2.5 font-display text-lg font-bold leading-tight drop-shadow-sm"
              style={{ color: '#fff' }}
            >
              {item.word}
            </p>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3">
            <span className="text-3xl opacity-20">📖</span>
            <p
              className="font-display text-base font-bold text-center leading-tight"
              style={{ color: 'var(--color-vocab)' }}
            >
              {item.word}
            </p>
          </div>
        )}

        {/* SRS badge top-right */}
        <span
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
          style={{
            backgroundColor: item.imageUrl ? 'rgba(0,0,0,0.55)' : 'var(--color-surface)',
            color: item.imageUrl ? '#fff' : barColor,
            backdropFilter: item.imageUrl ? 'blur(4px)' : undefined,
            border: item.imageUrl ? undefined : `1px solid ${barColor}30`,
          }}
        >
          {SRS_LABELS[level]}
        </span>

        {/* Urgent pulse dot */}
        {urgent && (
          <span className="absolute top-2 left-2 flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: 'var(--color-error)' }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: 'var(--color-error)' }}
            />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <p
          className="text-sm leading-tight"
          style={{
            color: isPlaceholder ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            fontStyle: isPlaceholder ? 'italic' : 'normal',
          }}
        >
          {isPlaceholder ? 'traduzindo…' : item.translation}
        </p>
        <SrsBar level={level} />
        <div className="flex items-center justify-between mt-0.5">
          {reviewText ? (
            <p
              className="text-[11px] font-medium truncate"
              style={{ color: urgent ? 'var(--color-error)' : 'var(--color-text-muted)' }}
            >
              {reviewText}
            </p>
          ) : (
            <span />
          )}
          <AudioPlayerButton text={item.word} language={language} size="sm" />
        </div>
      </div>
    </div>
  );
}

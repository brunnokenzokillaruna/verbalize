import React from 'react';
import Image from 'next/image';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { Book } from 'lucide-react';
import { SrsBar, SRS_BAR_COLOR, SRS_LABELS, formatNextReview } from './SrsBar';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import { getCachedImage } from '@/services/firestore';

export function VocabCard({
  item,
  language,
  urgent = false,
  animDelay = 0,
  onImageLoaded,
}: {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
  animDelay?: number;
  onImageLoaded?: (word: string, imageUrl: string) => void;
}) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const isPlaceholder = item.translation === item.word || !item.translation;
  const reviewText = formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0]);
  const barColor = SRS_BAR_COLOR[level];

  const [imageUrl, setImageUrl] = React.useState(item.imageUrl);

  React.useEffect(() => {
    setImageUrl(item.imageUrl);
  }, [item.imageUrl]);

  React.useEffect(() => {
    if (imageUrl) return;
    let active = true;
    const fetchImage = async () => {
      try {
        const cached = await getCachedImage(`${item.word}_${language}`);
        if (active && cached?.imageUrl) {
          setImageUrl(cached.imageUrl);
          onImageLoaded?.(item.word, cached.imageUrl);
        }
      } catch (err) {
        console.error('Error fetching image for', item.word, err);
      }
    };
    fetchImage();
    return () => {
      active = false;
    };
  }, [item.word, language, imageUrl, onImageLoaded]);

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
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
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
          <div 
            className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 relative select-none"
            style={{
              background: `linear-gradient(90deg, transparent 31px, rgba(220, 38, 38, 0.2) 31px, rgba(220, 38, 38, 0.2) 32px, transparent 32px), 
                           repeating-linear-gradient(var(--color-surface) 0px, var(--color-surface) 23px, var(--color-border) 23px, var(--color-border) 24px)`,
              backgroundSize: '100% 100%, 100% 24px',
            }}
          >
            <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.1)] relative z-10 animate-float" style={{ color: 'var(--color-vocab)', animationDelay: '0.2s', animationDuration: '6s' }}>
              <Book size={28} />
            </span>
            <p
              className="font-display text-base font-extrabold text-center leading-tight px-1 break-words max-w-full relative z-10"
              style={{
                color: 'var(--color-vocab)',
                textShadow: '0.5px 0.5px 0px var(--color-surface), -0.5px -0.5px 0px rgba(0,0,0,0.15)',
              }}
            >
              {item.word}
            </p>
          </div>
        )}

        {/* SRS badge top-right */}
        <span
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
          style={{
            backgroundColor: imageUrl ? 'rgba(0,0,0,0.55)' : 'var(--color-surface)',
            color: imageUrl ? '#fff' : barColor,
            backdropFilter: imageUrl ? 'blur(4px)' : undefined,
            border: imageUrl ? undefined : `1px solid ${barColor}30`,
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

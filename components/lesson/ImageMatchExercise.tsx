'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { ImageMatchData } from '@/types';

interface ImageMatchExerciseProps {
  data: ImageMatchData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
  variant?: 'default' | 'gallery';
  hidePrompt?: boolean;
  accentColor?: string;
}

export function ImageMatchExercise({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
  variant = 'default',
  hidePrompt = false,
  accentColor = 'var(--color-primary)',
}: ImageMatchExerciseProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  useEffect(() => {
    setSelectedWord(null);
  }, [data.targetWord, data.correctWord]);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedWord !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedWord, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedWord !== null) {
      onAnswer(selectedWord === data.correctWord);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handlePick(word: string) {
    if (answered) return;
    setSelectedWord(word);
  }

  const isGallery = variant === 'gallery';
  const hasPendingSelection = selectedWord !== null && !answered;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-lg mx-auto w-full">
      {!hidePrompt && (
        <div className="flex flex-col gap-0.5 px-1 text-center sm:text-left">
          <p className="text-xl sm:text-2xl font-display font-bold text-[var(--color-text-primary)]">
            {data.targetWord}
          </p>
          {data.contextSentence && (
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
              &ldquo;{data.contextSentence}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className={`grid grid-cols-2 gap-2.5 sm:gap-3.5 max-w-md mx-auto w-full`}>
        {data.options.map((option, idx) => {
          const isSelected = selectedWord === option.word;
          const isCorrect = option.word === data.correctWord;

          let border = 'var(--color-border)';
          let ring = 'transparent';
          if (answered && isCorrect) {
            border = 'var(--color-success)';
            ring = 'rgba(16, 185, 129, 0.2)';
          } else if (answered && isSelected && !isCorrect) {
            border = 'var(--color-error)';
            ring = 'rgba(239, 68, 68, 0.2)';
          } else if (isSelected) {
            border = accentColor;
            ring = isGallery ? 'color-mix(in srgb, var(--color-warning) 35%, transparent)' : 'rgba(29, 94, 212, 0.2)';
          }

          const galleryRotate = isGallery ? (idx % 2 === 0 ? -1.5 : 1.5) : 0;
          const isDimmed = hasPendingSelection && !isSelected;

          return (
            <button
              key={`${option.word}-${option.imageUrl}`}
              type="button"
              disabled={answered}
              onClick={() => handlePick(option.word)}
              aria-pressed={isSelected}
              aria-label={
                isSelected ? `${option.imageAlt}, selecionada` : option.imageAlt
              }
              className={`relative overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:cursor-default ${
                isGallery
                  ? 'rounded-sm border-4 border-b-[16px] sm:border-[6px] sm:border-b-[20px] border-white shadow-md'
                  : 'rounded-xl border-2'
              } ${isSelected && !answered ? 'z-10' : 'z-0'}`}
              style={{
                borderColor: isGallery ? (isSelected && !answered ? accentColor : '#fff') : border,
                outline:
                  !isGallery && (isSelected || (answered && isCorrect))
                    ? `3px solid ${ring}`
                    : undefined,
                boxShadow: isGallery
                  ? isSelected && !answered
                    ? `0 0 0 3px ${accentColor}, 0 6px 18px rgba(0,0,0,0.18)`
                    : answered && isCorrect
                      ? `0 0 0 3px var(--color-success), 0 6px 16px rgba(0,0,0,0.12)`
                      : answered && isSelected && !isCorrect
                        ? `0 0 0 3px var(--color-error), 0 6px 16px rgba(0,0,0,0.12)`
                        : '0 3px 8px rgba(0,0,0,0.08)'
                  : isSelected || (answered && isCorrect)
                    ? `0 0 0 4px ${ring}`
                    : undefined,
                aspectRatio: '4/3',
                maxHeight: '145px',
                transform: isGallery
                  ? `rotate(${galleryRotate}deg) scale(${isSelected && !answered ? 1.03 : 1})`
                  : isSelected && !answered
                    ? 'scale(1.02)'
                    : undefined,
                opacity: isDimmed ? 0.45 : 1,
              }}
            >
              <Image
                src={option.imageUrl}
                alt={option.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, 200px"
              />

              {isSelected && !answered && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(to top, color-mix(in srgb, ${accentColor} 55%, transparent) 0%, transparent 55%)`,
                    }}
                  />
                  <div
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                  <div
                    className="absolute bottom-0 inset-x-0 py-2 text-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
                      {isGallery ? 'Sua escolha' : 'Selecionada'}
                    </span>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <p
          className="text-center text-sm font-semibold"
          style={{ color: accentColor }}
        >
          {data.targetWord}
        </p>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

  return (
    <div className="flex flex-col gap-6">
      {!hidePrompt && (
        <div className="flex flex-col gap-2 px-1">
          <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
            Qual imagem representa esta palavra?
          </p>
          <p className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
            {data.targetWord}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] italic">
            {data.translation}
          </p>
          {data.contextSentence && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              &ldquo;{data.contextSentence}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className={`grid grid-cols-2 gap-3 ${isGallery ? 'gap-4' : ''}`}>
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
            ring = isGallery ? 'rgba(217, 119, 6, 0.25)' : 'rgba(29, 94, 212, 0.2)';
          }

          const galleryRotate = isGallery ? (idx % 2 === 0 ? -2 : 2) : 0;

          return (
            <button
              key={option.imageUrl}
              type="button"
              disabled={answered}
              onClick={() => handlePick(option.word)}
              className={`relative overflow-hidden transition-all active:scale-[0.98] disabled:cursor-default ${
                isGallery
                  ? 'rounded-sm border-[10px] border-b-[28px] border-white shadow-md'
                  : 'rounded-xl border-2'
              }`}
              style={{
                borderColor: isGallery ? '#fff' : border,
                outline: !isGallery && (isSelected || (answered && isCorrect)) ? `3px solid ${ring}` : undefined,
                boxShadow: isGallery
                  ? isSelected || (answered && isCorrect)
                    ? `0 0 0 3px ${ring}, 0 8px 20px rgba(0,0,0,0.12)`
                    : '0 4px 12px rgba(0,0,0,0.08)'
                  : isSelected || (answered && isCorrect)
                    ? `0 0 0 4px ${ring}`
                    : undefined,
                aspectRatio: '4/3',
                transform: `rotate(${galleryRotate}deg)`,
              }}
            >
              <Image
                src={option.imageUrl}
                alt={option.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, 200px"
              />
              {isGallery && isSelected && !answered && (
                <div
                  className="absolute bottom-[-22px] left-0 right-0 text-center text-[9px] font-bold truncate px-1"
                  style={{ color: accentColor }}
                >
                  selecionada
                </div>
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
          {data.targetWord} — {data.translation}
        </p>
      )}
    </div>
  );
}

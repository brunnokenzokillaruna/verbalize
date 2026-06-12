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
}

export function ImageMatchExercise({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
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

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-2 gap-3">
        {data.options.map((option) => {
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
            border = 'var(--color-primary)';
            ring = 'rgba(29, 94, 212, 0.2)';
          }

          return (
            <button
              key={option.imageUrl}
              type="button"
              disabled={answered}
              onClick={() => handlePick(option.word)}
              className="relative overflow-hidden rounded-xl border-2 transition-all active:scale-[0.98] disabled:cursor-default"
              style={{
                borderColor: border,
                boxShadow: isSelected || (answered && isCorrect) ? `0 0 0 4px ${ring}` : undefined,
                aspectRatio: '4/3',
              }}
            >
              <Image
                src={option.imageUrl}
                alt={option.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, 200px"
              />
            </button>
          );
        })}
      </div>

      {answered && (
        <p className="text-center text-sm font-semibold text-[var(--color-primary)]">
          {data.targetWord} — {data.translation}
        </p>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ImageMatchData } from '@/types';

interface ImageMatchExerciseProps {
  data: ImageMatchData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

export function ImageMatchExercise({ data, onAnswer, answered }: ImageMatchExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handlePick(option: string) {
    if (answered) return;
    setSelected(option);
    onAnswer(option === data.word);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Qual palavra descreve esta imagem?
      </p>

      {/* Image */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: '16/9', maxHeight: 220, backgroundColor: 'var(--color-surface-raised)' }}
      >
        <Image
          src={data.imageUrl}
          alt={data.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {data.options.map((option) => {
          const isCorrect = option === data.word;
          const isSelected = option === selected;
          let bg = 'var(--color-surface)';
          let border = 'var(--color-border)';
          let color = 'var(--color-text-primary)';

          if (answered && isSelected) {
            bg = isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)';
            border = isCorrect ? 'var(--color-success)' : 'var(--color-error)';
            color = isCorrect ? 'var(--color-success)' : 'var(--color-error)';
          } else if (answered && isCorrect) {
            bg = 'var(--color-success-bg)';
            border = 'var(--color-success)';
            color = 'var(--color-success)';
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => handlePick(option)}
              className="rounded-2xl border-2 px-4 py-3.5 text-center text-base font-semibold transition-all active:scale-95 disabled:cursor-default"
              style={{ backgroundColor: bg, borderColor: border, color }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Translation reveal after answer */}
      {answered && (
        <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {data.word} = {data.translation}
        </p>
      )}
    </div>
  );
}

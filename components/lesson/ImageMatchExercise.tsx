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
  submitTrigger
}: ImageMatchExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selected !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selected, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && selected) {
      onAnswer(selected === data.word);
    }
  }, [submitTrigger]);

  function handlePick(option: string) {
    if (answered) return;
    setSelected(option);
    onAnswer(option === data.word);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Instruction */}
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          Qual palavra descreve esta imagem?
        </p>
      </div>

      {/* Image Container */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-[var(--color-border)] shadow-md"
        style={{ aspectRatio: '16/9', maxHeight: 220, backgroundColor: 'var(--color-surface-raised)' }}
      >
        <Image
          src={data.imageUrl}
          alt={data.imageAlt}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {data.options.map((option) => {
          const isCorrect = option === data.word;
          const isSelected = option === selected;
          
          let bg = 'var(--color-surface)';
          let border = 'var(--color-border)';
          let color = 'var(--color-text-primary)';
          let ring = 'transparent';

          if (answered && isSelected) {
            bg = isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)';
            border = isCorrect ? 'var(--color-success)' : 'var(--color-error)';
            color = isCorrect ? 'var(--color-success)' : 'var(--color-error)';
            ring = isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          } else if (answered && isCorrect) {
            bg = 'var(--color-success-bg)';
            border = 'var(--color-success)';
            color = 'var(--color-success)';
          } else if (!answered && isSelected) {
            bg = 'var(--color-primary-light)';
            border = 'var(--color-primary)';
            color = 'var(--color-primary-dark)';
            ring = 'rgba(37, 99, 235, 0.1)';
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => handlePick(option)}
              className="group relative rounded-xl border px-4 py-4 text-center text-sm font-bold transition-all duration-300 active:scale-95 disabled:cursor-default"
              style={{ 
                backgroundColor: bg, 
                borderColor: border, 
                color,
                boxShadow: isSelected ? `0 0 0 4px ${ring}` : 'none'
              }}
            >
              {option}
              {!answered && !isSelected && (
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              )}
            </button>
          );
        })}
      </div>

      {/* Translation reveal after answer */}
      {answered && (
        <div className="flex justify-center animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="px-4 py-2 rounded-full bg-[var(--color-surface-raised)]/50 border border-[var(--color-border)] flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{data.word}</span>
            <span className="text-xs text-[var(--color-text-muted)] opacity-60">significa</span>
            <span className="text-sm font-bold text-[var(--color-primary)] italic">{data.translation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

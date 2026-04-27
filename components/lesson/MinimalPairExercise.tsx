'use client';

import { useState, useEffect } from 'react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { MinimalPairData, SupportedLanguage } from '@/types';

interface MinimalPairExerciseProps {
  data: MinimalPairData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function MinimalPairExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: MinimalPairExerciseProps) {
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selected !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selected, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selected !== null) {
      const chosenWord = selected === 'A' ? data.wordA : data.wordB;
      onAnswer(chosenWord === data.correctWord);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handleSelect(choice: 'A' | 'B') {
    if (answered) return;
    setSelected(choice);
  }

  const chosenWord = selected === 'A' ? data.wordA : selected === 'B' ? data.wordB : null;
  const isCorrect = chosenWord === data.correctWord;

  return (
    <div className="flex flex-col gap-7">
      {/* Instruction badge */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-vocab-bg)',
          border: '1px solid rgba(217,119,6,0.3)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: 'rgba(217,119,6,0.2)' }}
        >
          🎧
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-vocab)' }}
          >
            Par Mínimo
          </span>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Ouça os dois sons e escolha a palavra que completa a frase corretamente.
          </p>
        </div>
      </div>

      {/* Sentence context with blank */}
      <div
        className="rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]"
      >
        <p className="font-display text-lg leading-relaxed text-[var(--color-text-primary)]">
          {data.sentenceContext.replace(data.correctWord, '______')}
        </p>
        <p className="mt-2 text-xs italic text-[var(--color-text-muted)]">
          {data.translation}
        </p>
      </div>

      {/* Two audio option cards */}
      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B'] as const).map((choice) => {
          const word = choice === 'A' ? data.wordA : data.wordB;
          const isSelected = selected === choice;
          const isThisCorrect = word === data.correctWord;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';

          if (answered && isThisCorrect) {
            bgColor = 'var(--color-success-bg)';
            borderColor = 'var(--color-success)';
            textColor = 'var(--color-success)';
          } else if (answered && isSelected && !isThisCorrect) {
            bgColor = 'var(--color-error-bg)';
            borderColor = 'var(--color-error)';
            textColor = 'var(--color-error)';
          } else if (!answered && isSelected) {
            bgColor = 'var(--color-primary-light)';
            borderColor = 'var(--color-primary)';
            textColor = 'var(--color-primary-dark)';
          }

          return (
            <button
              key={choice}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(choice)}
              className="flex flex-col items-center gap-3 rounded-xl px-4 py-5 transition-all duration-300 active:scale-[0.97]"
              style={{
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                cursor: answered ? 'default' : 'pointer',
              }}
            >
              <AudioPlayerButton text={word} language={language} size="md" />
              <span
                className="text-xl font-black tracking-tight"
                style={{ color: textColor }}
              >
                {word}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {!isCorrect && (
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success)',
              }}
            >
              <span
                className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70"
                style={{ color: 'var(--color-success)' }}
              >
                Resposta correta
              </span>
              <p
                className="text-sm font-bold mt-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {data.correctWord}
              </p>
            </div>
          )}
          <div className="px-1 border-l-2 border-[var(--color-primary)]/20 pl-4 py-2 opacity-90">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {data.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

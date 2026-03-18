'use client';

import { useMemo, useState } from 'react';
import type { ContextChoiceData } from '@/types';

interface ContextChoiceExerciseProps {
  data: ContextChoiceData;
  /** Called as soon as the user selects an option */
  onAnswer: (correct: boolean) => void;
  /** True once the parent CheckButton has been clicked — locks the UI */
  answered: boolean;
}

export function ContextChoiceExercise({ data, onAnswer, answered }: ContextChoiceExerciseProps) {
  const [choice, setChoice] = useState<string | null>(null);

  // Shuffle options once on mount so the correct answer isn't always top-left
  const shuffledOptions = useMemo(() => {
    const opts = [...data.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [data.options]);

  function handleSelect(option: string) {
    if (answered || choice !== null) return;
    setChoice(option);
    onAnswer(option === data.blankWord);
  }

  const parts = data.sentence.split('___');

  return (
    <div className="flex flex-col gap-6">
      {/* Portuguese translation hint */}
      <p className="text-sm" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        {data.translation}
      </p>

      {/* Sentence with fill-in blank */}
      <p
        className="font-display text-2xl font-semibold leading-snug"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {parts[0]}
        <span
          className="inline-block min-w-[80px] border-b-2 px-2 text-center align-baseline"
          style={{
            borderColor: 'var(--color-primary)',
            color: choice ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          {choice ?? '___'}
        </span>
        {parts[1]}
      </p>

      {/* Option pills */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((option) => {
          const isChosen = choice === option;
          const isCorrect = option === data.blankWord;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';

          if (answered && isCorrect) {
            bgColor = 'var(--color-success-bg)';
            borderColor = 'var(--color-success)';
            textColor = 'var(--color-success)';
          } else if (answered && isChosen && !isCorrect) {
            bgColor = 'var(--color-error-bg)';
            borderColor = 'var(--color-error)';
            textColor = 'var(--color-error)';
          } else if (!answered && isChosen) {
            bgColor = 'var(--color-primary-light)';
            borderColor = 'var(--color-primary)';
            textColor = 'var(--color-primary-dark)';
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered || choice !== null}
              onClick={() => handleSelect(option)}
              className="rounded-2xl px-4 py-3 text-base font-medium transition-all duration-150 active:scale-[0.97]"
              style={{
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                color: textColor,
                cursor: answered || choice !== null ? 'default' : 'pointer',
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

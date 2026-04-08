'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ContextChoiceData } from '@/types';

interface ContextChoiceExerciseProps {
  data: ContextChoiceData;
  /** Called as soon as the user selects an option */
  onAnswer: (correct: boolean) => void;
  /** True once the parent CheckButton has been clicked — locks the UI */
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function ContextChoiceExercise({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: ContextChoiceExerciseProps) {
  const [choice, setChoice] = useState<string | null>(null);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(choice !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [choice, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && choice) {
      onAnswer(choice === data.blankWord);
    }
  }, [submitTrigger]);

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
    <div className="flex flex-col gap-8">
      {/* Portuguese translation hint */}
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          {data.translation}
        </p>
      </div>

      {/* Sentence with fill-in blank */}
      <div className="px-2">
        <p
          className="font-display text-xl sm:text-2xl font-bold leading-relaxed text-[var(--color-text-primary)]"
        >
          {parts[0]}
          <span
            className="mx-1 inline-flex h-8 min-w-[3.5rem] items-center justify-center rounded-lg border-b-2 px-2 text-center transition-all duration-300 transform-gpu"
            style={{
              borderColor: choice ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: choice ? 'var(--color-primary-light)/10' : 'transparent',
              color: choice ? 'var(--color-primary)' : 'transparent',
              fontSize: choice ? '0.95em' : '1em'
            }}
          >
            {choice ?? ''}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* Option pills */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {shuffledOptions.map((option) => {
          const isChosen = choice === option;
          const isCorrect = option === data.blankWord;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';
          let ringColor = 'transparent';

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
            ringColor = 'rgba(37, 99, 235, 0.1)';
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered || choice !== null}
              onClick={() => handleSelect(option)}
              className="group relative flex items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.97]"
              style={{
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                color: textColor,
                boxShadow: isChosen ? `0 0 0 4px ${ringColor}` : 'none',
                cursor: answered || choice !== null ? 'default' : 'pointer',
              }}
            >
              {option}
              {!isChosen && !answered && (
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

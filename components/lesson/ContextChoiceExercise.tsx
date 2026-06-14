import React, { useMemo, useState, useEffect } from 'react';
import type { ContextChoiceData } from '@/types';
import { Languages } from 'lucide-react';

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
  const isCorrect = choice === data.blankWord;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Elegant Translation Prompt Card */}
      <div 
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <Languages size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Como se diz em francês?</span>
        </div>
        <div className="border-l-4 border-[var(--color-vocab)] pl-3.5 py-1">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)] leading-relaxed">
            {data.translation}
          </p>
        </div>
      </div>

      {/* 2. Sentence with fill-in blank */}
      <div className="px-2 py-2">
        <p
          className="font-display text-xl sm:text-2xl font-bold leading-relaxed text-[var(--color-text-primary)]"
        >
          {parts[0]}
          <span
            className="mx-1.5 inline-flex h-8.5 min-w-[5.5rem] items-center justify-center rounded-xl border px-3 text-center transition-all duration-300 transform-gpu font-bold text-[15px]"
            style={{
              borderColor: answered
                ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)')
                : choice
                  ? 'var(--color-primary)'
                  : 'rgba(217, 119, 6, 0.3)',
              backgroundColor: answered
                ? (isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)')
                : choice
                  ? 'var(--color-primary-light)'
                  : 'rgba(217, 119, 6, 0.01)',
              color: answered
                ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)')
                : choice
                  ? 'var(--color-primary-dark)'
                  : 'transparent',
              boxShadow: choice && !answered ? '0 0 10px rgba(37, 99, 235, 0.15)' : 'none',
              borderStyle: choice ? 'solid' : 'dashed'
            }}
          >
            {choice ?? '___'}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* 3. Option pills */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {shuffledOptions.map((option) => {
          const isChosen = choice === option;
          const isCorrectOption = option === data.blankWord;

          let stateStyles = "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--color-text-primary)] hover:scale-[1.005] active:scale-[0.995]";
          
          if (answered) {
            if (isCorrectOption) {
              stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
            } else if (isChosen) {
              stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200";
            } else {
              stateStyles = "opacity-25 scale-98 pointer-events-none";
            }
          } else if (isChosen) {
            stateStyles = "bg-[var(--color-primary-light)] border border-[var(--color-primary)] text-[var(--color-primary-dark)] scale-[1.01]";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered || choice !== null}
              onClick={() => handleSelect(option)}
              className={`group relative flex items-center justify-center rounded-xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-200 ${stateStyles}`}
              style={{
                boxShadow: isChosen && !answered ? '0 4px 12px rgba(29, 78, 216, 0.15)' : undefined
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

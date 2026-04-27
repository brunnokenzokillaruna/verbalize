'use client';

import { useMemo, useState, useEffect } from 'react';
import type { GrammarTrapData } from '@/types';

interface GrammarTrapExerciseProps {
  data: GrammarTrapData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function GrammarTrapExercise({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: GrammarTrapExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Shuffle options once on mount
  const shuffledOptions = useMemo(() => {
    const indexed = data.options.map((opt, i) => ({ ...opt, originalIndex: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }, [data.options]);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndex !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndex, answered, setIsExerciseReady]);

  // Listen for global submit trigger
  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndex !== null) {
      onAnswer(shuffledOptions[selectedIndex].isCorrect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handleSelect(index: number) {
    if (answered || selectedIndex !== null) return;
    setSelectedIndex(index);
    onAnswer(shuffledOptions[index].isCorrect);
  }

  const correctOption = shuffledOptions.find((opt) => opt.isCorrect);

  return (
    <div className="flex flex-col gap-7">
      {/* Scenario badge */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: 'var(--color-warning-border)' }}
        >
          🚨
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-warning)' }}
          >
            Desafio do Radar
          </span>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {data.scenario}
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="px-1">
        <p className="font-display text-lg font-bold leading-snug text-[var(--color-text-primary)]">
          {data.question}
        </p>
      </div>

      {/* Option cards — full-width stacked */}
      <div className="flex flex-col gap-3">
        {shuffledOptions.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = option.isCorrect;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';
          let ringColor = 'transparent';
          let translationColor = 'var(--color-text-muted)';

          if (answered && isCorrectOption) {
            bgColor = 'var(--color-success-bg)';
            borderColor = 'var(--color-success)';
            textColor = 'var(--color-success)';
            translationColor = 'var(--color-success)';
          } else if (answered && isSelected && !isCorrectOption) {
            bgColor = 'var(--color-error-bg)';
            borderColor = 'var(--color-error)';
            textColor = 'var(--color-error)';
            translationColor = 'var(--color-error)';
          } else if (!answered && isSelected) {
            bgColor = 'var(--color-primary-light)';
            borderColor = 'var(--color-primary)';
            textColor = 'var(--color-primary-dark)';
            ringColor = 'rgba(37, 99, 235, 0.1)';
          }

          return (
            <button
              key={i}
              type="button"
              disabled={answered || selectedIndex !== null}
              onClick={() => handleSelect(i)}
              className="group relative flex flex-col items-start gap-1.5 rounded-xl px-5 py-4 text-left transition-all duration-300 active:scale-[0.98]"
              style={{
                backgroundColor: bgColor,
                border: `1.5px solid ${borderColor}`,
                boxShadow: isSelected ? `0 0 0 4px ${ringColor}` : 'none',
                cursor: answered || selectedIndex !== null ? 'default' : 'pointer',
              }}
            >
              {/* Letter badge + sentence */}
              <div className="flex items-start gap-3 w-full">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black mt-0.5"
                  style={{
                    backgroundColor:
                      answered && isCorrectOption
                        ? 'var(--color-success)'
                        : answered && isSelected && !isCorrectOption
                          ? 'var(--color-error)'
                          : !answered && isSelected
                            ? 'var(--color-primary)'
                            : 'var(--color-surface-raised)',
                    color:
                      (answered && (isCorrectOption || isSelected)) || (!answered && isSelected)
                        ? '#fff'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold leading-relaxed"
                    style={{ color: textColor }}
                  >
                    {option.sentence}
                  </p>
                  <p
                    className="text-[11px] italic leading-relaxed opacity-70"
                    style={{ color: translationColor }}
                  >
                    {option.translation}
                  </p>
                </div>
              </div>

              {/* Hover effect */}
              {!isSelected && !answered && (
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback — explanation + trap rule (shown after answering) */}
      {answered && selectedIndex !== null && !shuffledOptions[selectedIndex].isCorrect && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Correct answer highlight */}
          {correctOption && (
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
                className="text-sm font-bold italic mt-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {correctOption.sentence}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="px-1 border-l-2 border-[var(--color-primary)]/20 pl-4 py-2 opacity-90">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {data.explanation}
            </p>
          </div>

          {/* Trap rule */}
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
            }}
          >
            <span className="text-sm">⚠️</span>
            <p
              className="text-xs font-semibold leading-relaxed"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {data.trapRule}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

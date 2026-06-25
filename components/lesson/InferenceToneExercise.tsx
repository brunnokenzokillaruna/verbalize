'use client';

import { useState, useEffect } from 'react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { InferenceToneData, SupportedLanguage } from '@/types';

interface InferenceToneExerciseProps {
  data: InferenceToneData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function InferenceToneExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: InferenceToneExerciseProps) {
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
      onAnswer(selected === data.correctOption);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handleSelect(choice: 'A' | 'B') {
    if (answered) return;
    setSelected(choice);
  }

  const options = [
    { key: 'A' as const, audio: data.audioTextA, label: data.labelA },
    { key: 'B' as const, audio: data.audioTextB, label: data.labelB },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#6366f1] mb-2">
          Tom da fala
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">{data.contextPt}</p>
        <p className="text-base font-bold text-[var(--color-text-primary)] leading-relaxed">
          {data.questionPt}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map(({ key, audio, label }) => {
          const isSelected = selected === key;
          const isCorrect = data.correctOption === key;

          let bgColor = 'var(--color-surface)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text-primary)';

          if (answered && isCorrect) {
            bgColor = 'var(--color-success-bg)';
            borderColor = 'var(--color-success)';
            textColor = 'var(--color-success)';
          } else if (answered && isSelected && !isCorrect) {
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
              key={key}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(key)}
              className="flex flex-col items-center gap-3 rounded-xl px-4 py-5 transition-all duration-300 active:scale-[0.97]"
              style={{
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                cursor: answered ? 'default' : 'pointer',
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-widest opacity-70"
                style={{ color: textColor }}
              >
                Áudio {key}
              </span>
              <AudioPlayerButton text={audio} language={language} size="md" />
              <span className="text-sm font-semibold text-center" style={{ color: textColor }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="px-1 border-l-2 border-[#6366f1]/30 pl-4 py-2">
          <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">
            {data.explanationPt}
          </p>
        </div>
      )}
    </div>
  );
}

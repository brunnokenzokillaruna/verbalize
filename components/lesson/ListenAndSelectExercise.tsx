'use client';

import { useState, useEffect, useMemo } from 'react';
import { AudioPlayerButton } from './AudioPlayerButton';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ListenAndSelectData, SupportedLanguage } from '@/types';

interface ListenAndSelectExerciseProps {
  data: ListenAndSelectData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function ListenAndSelectExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: ListenAndSelectExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const shuffled = useMemo(() => {
    const indexed = data.options.map((opt, i) => ({ text: opt, originalIndex: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }, [data.options]);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndex !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndex, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndex !== null) {
      onAnswer(shuffled[selectedIndex].originalIndex === data.correctIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Ouça e escolha a transcrição correta
        </p>
        <AudioPlayerButton text={data.audioText} language={language} size="lg" />
      </div>

      <p className="text-center text-sm italic text-[var(--color-text-muted)]">
        &ldquo;{data.translation}&rdquo;
      </p>

      <div className="flex flex-col gap-2.5">
        {shuffled.map((opt, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = opt.originalIndex === data.correctIndex;
          let styles = 'border border-[var(--color-border)] hover:border-[var(--color-primary)]/30';
          if (answered) {
            if (isCorrect) styles = 'border-emerald-500/40 bg-emerald-500/10';
            else if (isSelected) styles = 'border-red-500/40 bg-red-500/10';
            else styles = 'opacity-40';
          } else if (isSelected) {
            styles = 'border-[var(--color-primary)] bg-[var(--color-primary-light)]';
          }
          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => setSelectedIndex(index)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${styles}`}
            >
              <span className="flex items-center justify-between gap-2">
                {opt.text}
                {answered && isCorrect && <CheckCircle2 size={16} className="text-emerald-500" />}
                {answered && isSelected && !isCorrect && <XCircle size={16} className="text-red-500" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

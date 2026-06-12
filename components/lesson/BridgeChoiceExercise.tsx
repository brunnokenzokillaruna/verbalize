'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { BridgeChoiceData } from '@/types';

interface BridgeChoiceExerciseProps {
  data: BridgeChoiceData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function BridgeChoiceExercise({
  data,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: BridgeChoiceExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const shuffledOptions = useMemo(() => {
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
      onAnswer(shuffledOptions[selectedIndex].originalIndex === data.correctIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6">
      {data.scenario && (
        <p className="text-sm italic text-[var(--color-text-secondary)] border-l-4 border-[var(--color-primary)] pl-3">
          {data.scenario}
        </p>
      )}
      <p className="text-base font-semibold text-[var(--color-text-primary)]">{data.question}</p>

      <div className="flex flex-col gap-3">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.originalIndex === data.correctIndex;

          let styles = 'border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30';
          if (answered) {
            if (isCorrect) styles = 'border-emerald-500/40 bg-emerald-500/10';
            else if (isSelected) styles = 'border-red-500/40 bg-red-500/10';
            else styles = 'opacity-40 border-[var(--color-border)]';
          } else if (isSelected) {
            styles = 'border-[var(--color-primary)] bg-[var(--color-primary-light)]';
          }

          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => setSelectedIndex(index)}
              className={`rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all ${styles}`}
            >
              <span className="flex items-center justify-between gap-2">
                {option.text}
                {answered && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                {answered && isSelected && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-xl p-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Ponte PT-BR
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{data.explanation}</p>
          {data.trapRule && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2 italic">{data.trapRule}</p>
          )}
        </div>
      )}
    </div>
  );
}

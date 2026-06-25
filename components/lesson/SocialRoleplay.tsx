import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { RoleplayScenarioCard } from '@/components/lesson/RoleplayScenarioCard';
import { SocialRoleplayData } from '@/types';
import {
  buildOriginalToDisplayLetter,
  remapPositionalExplanation,
} from '@/utils/remapPositionalExplanation';

interface SocialRoleplayProps {
  data: SocialRoleplayData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function SocialRoleplay({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: SocialRoleplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const shuffledOptions = useMemo(() => {
    const indexed = data.options.map((opt, i) => ({
      text: opt,
      originalIndex: i,
      isCorrect: i === data.correctIndex,
    }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }, [data.options, data.correctIndex]);

  const displayExplanation = useMemo(() => {
    const letterMap = buildOriginalToDisplayLetter(shuffledOptions);
    return remapPositionalExplanation(data.explanation, letterMap);
  }, [data.explanation, shuffledOptions]);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndex !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndex, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndex !== null) {
      onAnswer(shuffledOptions[selectedIndex].isCorrect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RoleplayScenarioCard context={data.context} promptLine={data.promptLine} />

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--color-border)] opacity-30" />
        </div>
        <span className="relative rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] opacity-85">
          Escolha como responder
        </span>
      </div>

      <div className="flex flex-col items-end gap-3 w-full">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.isCorrect;
          const letter = String.fromCharCode(65 + index);

          let stateStyles = "border border-[var(--color-primary)]/10 bg-[var(--color-primary-light)]/10 hover:bg-[var(--color-primary-light)]/20 hover:border-[var(--color-primary)]/20 text-[var(--color-text-primary)]";

          if (answered) {
            if (isCorrect) {
              stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
            } else if (isSelected) {
              stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.05)]";
            } else {
              stateStyles = "opacity-25 scale-98 pointer-events-none border-white/5 bg-white/5";
            }
          } else if (isSelected) {
            stateStyles = "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30";
          }

          return (
            <button
              key={index}
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`flex items-center justify-between w-full self-end max-w-[88%] md:max-w-[75%] p-4 rounded-2xl rounded-tr-none text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md ${stateStyles}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                    answered && isCorrect
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : answered && isSelected
                        ? 'bg-red-500 text-white shadow-sm'
                        : isSelected && !answered
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10'
                  }`}
                >
                  {letter}
                </div>
                <span className="text-sm md:text-[15px] font-semibold leading-relaxed">{option.text}</span>
              </div>
              {answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-3" />}
              {answered && isSelected && !isCorrect && <XCircle size={18} className="text-red-500 shrink-0 ml-3" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="mt-2 rounded-xl p-4.5 border-l-4 border-[var(--color-primary)] animate-in slide-in-from-bottom-2 duration-300"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderLeftColor: (selectedIndex !== null && shuffledOptions[selectedIndex].isCorrect) ? 'var(--color-success)' : 'var(--color-error)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} style={{ color: (selectedIndex !== null && shuffledOptions[selectedIndex].isCorrect) ? 'var(--color-success)' : 'var(--color-error)' }} />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Dica & Explicação
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {displayExplanation}
          </p>
        </div>
      )}
    </div>
  );
}

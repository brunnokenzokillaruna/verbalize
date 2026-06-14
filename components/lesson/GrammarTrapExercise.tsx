import React, { useMemo, useState, useEffect } from 'react';
import type { GrammarTrapData } from '@/types';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface GrammarTrapExerciseProps {
  data: GrammarTrapData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function formatScenario(text: string): string {
  if (!text) return '';
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z]/g) || []).length;
  if (totalAlpha > 0 && (upperCount / totalAlpha) > 0.7) {
    const lower = text.toLowerCase();
    return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
  }
  return text;
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
  const formattedScenarioText = formatScenario(data.scenario);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Scenario / Radar banner with pulse animation */}
      <div
        className="flex items-start gap-3.5 rounded-2xl p-4.5 border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-vocab-bg)',
          borderColor: 'var(--color-warning-border)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg relative"
          style={{ backgroundColor: 'rgba(217, 119, 6, 0.08)' }}
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-amber-500 opacity-20 duration-1000"></span>
          🚨
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-vocab)' }}
          >
            Desafio do Radar
          </span>
          <p
            className="text-sm font-medium leading-relaxed italic text-[var(--color-text-secondary)]"
          >
            &ldquo;{formattedScenarioText}&rdquo;
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="px-1 mt-1">
        <p className="font-display text-lg font-bold leading-snug text-[var(--color-text-primary)]">
          {data.question}
        </p>
      </div>

      {/* Option cards — stacked with dynamic indicators */}
      <div className="flex flex-col gap-3">
        {shuffledOptions.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = option.isCorrect;
          const letter = String.fromCharCode(65 + i);

          let stateStyles = "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[var(--color-text-primary)] hover:scale-[1.005] active:scale-[0.995]";
          
          if (answered) {
            if (isCorrectOption) {
              stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
            } else if (isSelected) {
              stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200";
            } else {
              stateStyles = "opacity-25 scale-98 pointer-events-none";
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={answered || selectedIndex !== null}
              onClick={() => handleSelect(i)}
              className={`group relative flex flex-col items-start gap-2.5 rounded-xl px-5 py-4 text-left transition-all duration-200 ${stateStyles}`}
              style={{
                boxShadow: isSelected && !answered ? '0 4px 12px rgba(29, 78, 216, 0.15)' : undefined
              }}
            >
              {/* Letter badge + sentence */}
              <div className="flex items-start gap-3.5 w-full">
                <div 
                  className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md text-xs font-black transition-colors ${
                    answered && isCorrectOption 
                      ? 'bg-emerald-500 text-white' 
                      : answered && isSelected && !isCorrectOption
                        ? 'bg-red-500 text-white'
                        : isSelected && !answered
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10'
                  }`}
                >
                  {letter}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p
                    className="text-base font-semibold leading-relaxed"
                  >
                    {option.sentence}
                  </p>
                  <p
                    className="text-xs italic leading-relaxed opacity-65 text-[var(--color-text-muted)]"
                  >
                    {option.translation}
                  </p>
                </div>
                
                {answered && isCorrectOption && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-3 mt-0.5" />}
                {answered && isSelected && !isCorrectOption && <XCircle size={18} className="text-red-500 shrink-0 ml-3 mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback — explanation + trap rule (shown after answering) */}
      {answered && selectedIndex !== null && (
        <div className="flex flex-col gap-4.5 mt-2 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Correct answer highlight banner (if user got it wrong) */}
          {!shuffledOptions[selectedIndex].isCorrect && correctOption && (
            <div
              className="p-4.5 rounded-xl border border-emerald-500/30"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 opacity-90">
                  Gabarito Correto
                </span>
              </div>
              <p
                className="text-base font-bold italic text-[var(--color-text-primary)]"
              >
                {correctOption.sentence}
              </p>
            </div>
          )}

          {/* Explanation with Lightbulb */}
          <div 
            className="rounded-xl p-4.5 border-l-4"
            style={{ 
              backgroundColor: 'var(--color-surface-raised)',
              borderLeftColor: shuffledOptions[selectedIndex].isCorrect ? 'var(--color-success)' : 'var(--color-error)'
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Lightbulb size={15} style={{ color: shuffledOptions[selectedIndex].isCorrect ? 'var(--color-success)' : 'var(--color-error)' }} />
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                Dica & Explicação
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
              {data.explanation}
            </p>
          </div>

          {/* Trap rule box */}
          <div
            className="flex items-start gap-3 rounded-xl p-4 border border-dashed"
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.01)',
              borderColor: 'rgba(217, 119, 6, 0.15)',
            }}
          >
            <span className="text-base mt-0.5">⚠️</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 opacity-80">Armadilha Comum para Brasileiros</span>
              <p
                className="text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)]"
              >
                {data.trapRule}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

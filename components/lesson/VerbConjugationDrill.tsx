'use client';

import { useState, useRef, useEffect } from 'react';
import type { ConjugationDrillData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface VerbConjugationDrillProps {
  data: ConjugationDrillData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ').trim();
}

export function VerbConjugationDrill({ 
  data, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: VerbConjugationDrillProps) {
  const blanks = data.conjugations.filter((c) => c.blank);
  const [inputs, setInputs] = useState<string[]>(blanks.map(() => ''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      const allFilled = inputs.every((v) => v.trim() !== '');
      setIsExerciseReady(allFilled);
    } else {
      setIsExerciseReady(false);
    }
  }, [inputs, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered) {
      handleSubmit();
    }
  }, [submitTrigger]);

  const allFilled = inputs.every((v) => v.trim() !== '');

  // Each blank can be: 'correct', 'accent-warning', or 'wrong'
  const cellStatuses = blanks.map((c, i) => {
    const exact = normalize(inputs[i]) === normalize(c.form);
    if (exact) return 'correct';
    if (isAccentOnlyDiff(inputs[i], c.form)) return 'accent-warning';
    return 'wrong';
  });
  const hasAccentWarning = cellStatuses.includes('accent-warning');


  function handleChange(index: number, value: string) {
    const next = [...inputs];
    next[index] = value;
    setInputs(next);
  }

  function handleSubmit() {
    if (!allFilled || answered) return;
    onAnswer(cellStatuses.every((s) => s === 'correct' || s === 'accent-warning'));
  }

  // Map to track blank index per row
  let blankIndex = 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Verb header */}
      <div className="flex flex-col gap-1 px-1">
        <p
          className="font-display text-2xl font-bold tracking-tight text-[var(--color-primary)]"
        >
          {data.verb}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
          Conjugar no {data.tense}
        </p>
      </div>

      {/* Conjugation table */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm bg-[var(--color-bg)]"
      >
        {data.conjugations.map((row, rowIndex) => {
          const isBlank = row.blank;
          const currentBlankIndex = isBlank ? blankIndex++ : -1;
          const userInput = isBlank ? inputs[currentBlankIndex] : '';
          const cellStatus = isBlank ? cellStatuses[currentBlankIndex] : 'correct';

          return (
            <div
              key={rowIndex}
              className="flex items-center border-b last:border-b-0 border-[var(--color-border)]/50"
            >
              {/* Pronoun */}
              <div
                className="w-24 sm:w-32 shrink-0 px-4 py-4 text-xs font-bold uppercase tracking-widest bg-[var(--color-surface-raised)]/30 text-[var(--color-text-muted)] border-r border-[var(--color-border)]/50"
              >
                {row.pronoun}
              </div>

              {/* Conjugation: read-only or input */}
              <div className="flex-1 px-4 py-3">
                {isBlank ? (
                  <div className="relative group">
                    <input
                      ref={(el) => { inputRefs.current[currentBlankIndex] = el; }}
                      type="text"
                      value={userInput}
                      onChange={(e) => handleChange(currentBlankIndex, e.target.value)}
                      disabled={answered}
                      placeholder="..."
                      className="w-full rounded-lg px-4 py-2.5 text-base font-medium outline-none transition-all duration-300 ring-1"
                      style={{
                        backgroundColor: answered
                          ? cellStatus === 'correct'
                            ? 'var(--color-success-bg)'
                            : cellStatus === 'accent-warning'
                              ? '#fef3c7'
                              : 'var(--color-error-bg)'
                          : 'var(--color-surface-raised)',
                        borderColor: 
                          answered
                            ? cellStatus === 'correct'
                              ? 'var(--color-success)'
                              : cellStatus === 'accent-warning'
                                ? '#d97706'
                                : 'var(--color-error)'
                            : 'var(--color-border)',
                        color: answered
                          ? cellStatus === 'correct'
                            ? 'var(--color-success)'
                            : cellStatus === 'accent-warning'
                              ? '#92400e'
                              : 'var(--color-error)'
                          : 'var(--color-text-primary)',
                      }}
                      onFocus={(e) => {
                        if (!answered) {
                          e.target.style.borderColor = 'var(--color-primary)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!answered) {
                          e.target.style.borderColor = 'var(--color-border)';
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    {/* Inline correction */}
                    {answered && cellStatus !== 'correct' && (
                      <p className="mt-1.5 px-1 text-[11px] font-bold italic text-[var(--color-text-muted)] animate-in fade-in slide-in-from-top-1">
                        → {row.form}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="py-2.5 px-1 text-base font-semibold text-[var(--color-text-primary)]">
                    {row.form}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accent warning banner */}
      {answered && hasAccentWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
            Quase lá!
          </p>
          <p className="text-sm font-semibold text-amber-900 leading-relaxed italic">
            Verifique os acentos nas formas indicadas na tabela acima.
          </p>
        </div>
      )}

      {/* Memory tip */}
      {data.tip && (
        <div className="p-4 rounded-xl bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary)]/10 flex gap-3">
          <span className="text-base">💡</span>
          <p className="text-xs italic leading-relaxed text-[var(--color-primary-dark)]">
            {data.tip}
          </p>
        </div>
      )}

      {!answered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allFilled}
          className="self-end rounded-xl px-5 py-2 text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: allFilled ? 'var(--color-primary)' : 'var(--color-surface-raised)',
            color: allFilled ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: allFilled ? 'pointer' : 'not-allowed',
          }}
        >
          Verificar
        </button>
      )}
    </div>
  );
}

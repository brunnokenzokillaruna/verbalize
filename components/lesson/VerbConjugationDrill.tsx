'use client';

import { useState, useRef } from 'react';
import type { ConjugationDrillData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface VerbConjugationDrillProps {
  data: ConjugationDrillData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ');
}

export function VerbConjugationDrill({ data, onAnswer, answered }: VerbConjugationDrillProps) {
  const blanks = data.conjugations.filter((c) => c.blank);
  const [inputs, setInputs] = useState<string[]>(blanks.map(() => ''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    <div className="flex flex-col gap-5">
      {/* Verb header */}
      <div className="flex items-baseline gap-3">
        <p
          className="font-display text-2xl font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          {data.verb}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {data.tense}
        </p>
      </div>

      {/* Conjugation table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {data.conjugations.map((row, rowIndex) => {
          const isBlank = row.blank;
          const currentBlankIndex = isBlank ? blankIndex++ : -1;
          const userInput = isBlank ? inputs[currentBlankIndex] : '';
          const cellStatus = isBlank ? cellStatuses[currentBlankIndex] : 'correct';

          return (
            <div
              key={rowIndex}
              className="flex items-center border-b last:border-b-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Pronoun */}
              <div
                className="w-32 shrink-0 px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  borderRight: '1px solid var(--color-border)',
                }}
              >
                {row.pronoun}
              </div>

              {/* Conjugation: read-only or input */}
              <div className="flex-1 px-4 py-2">
                {isBlank ? (
                  <input
                    ref={(el) => { inputRefs.current[currentBlankIndex] = el; }}
                    type="text"
                    value={userInput}
                    onChange={(e) => handleChange(currentBlankIndex, e.target.value)}
                    disabled={answered}
                    placeholder="..."
                    className="w-full rounded-xl px-3 py-1.5 text-base outline-none transition-all"
                    style={{
                      backgroundColor: answered
                        ? cellStatus === 'correct'
                          ? 'var(--color-success-bg)'
                          : cellStatus === 'accent-warning'
                            ? '#fef3c7'
                            : 'var(--color-error-bg)'
                        : 'var(--color-surface-raised)',
                      border: `2px solid ${
                        answered
                          ? cellStatus === 'correct'
                            ? 'var(--color-success)'
                            : cellStatus === 'accent-warning'
                              ? '#d97706'
                              : 'var(--color-error)'
                          : 'var(--color-border)'
                      }`,
                      color: answered
                        ? cellStatus === 'correct'
                          ? 'var(--color-success)'
                          : cellStatus === 'accent-warning'
                            ? '#92400e'
                            : 'var(--color-error)'
                        : 'var(--color-text-primary)',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                ) : (
                  <p className="py-1 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {row.form}
                  </p>
                )}
                {/* Show correct form when wrong or accent-warning */}
                {answered && isBlank && cellStatus !== 'correct' && (
                  <p className="mt-1 text-xs" style={{ color: cellStatus === 'accent-warning' ? '#92400e' : 'var(--color-text-muted)' }}>
                    → {row.form}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accent warning banner */}
      {answered && hasAccentWarning && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          Quase! Verifique os acentos nas formas indicadas acima.
        </div>
      )}

      {/* Memory tip */}
      {data.tip && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
          }}
        >
          💡 {data.tip}
        </p>
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

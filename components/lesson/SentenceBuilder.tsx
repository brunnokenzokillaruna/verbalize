'use client';

import { useState } from 'react';
import type { SentenceBuilderData } from '@/types';

interface SentenceBuilderProps {
  data: SentenceBuilderData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

export function SentenceBuilder({ data, onAnswer, answered }: SentenceBuilderProps) {
  // Words still in the bank (shuffled on mount)
  const [bank, setBank] = useState<string[]>(() => [...data.words]);
  // Words assembled by the user
  const [assembled, setAssembled] = useState<string[]>([]);

  function moveToAssembled(index: number) {
    if (answered) return;
    const word = bank[index];
    const newBank = bank.filter((_, i) => i !== index);
    const newAssembled = [...assembled, word];
    setBank(newBank);
    setAssembled(newAssembled);
    // Auto-check when all words are placed
    if (newBank.length === 0) {
      onAnswer(newAssembled.join(' ') === data.correctOrder.join(' '));
    }
  }

  function moveToBank(index: number) {
    if (answered) return;
    const word = assembled[index];
    setAssembled(assembled.filter((_, i) => i !== index));
    setBank([...bank, word]);
  }

  const isCorrect = assembled.join(' ') === data.correctOrder.join(' ');

  return (
    <div className="flex flex-col gap-6">
      {/* Portuguese translation hint */}
      <p className="text-sm" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        {data.translation}
      </p>

      {/* Answer area */}
      <div
        className="min-h-[64px] rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `2px solid ${answered ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
          transition: 'border-color 200ms',
        }}
      >
        {assembled.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Toque nas palavras abaixo para montar a frase...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assembled.map((word, i) => (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => moveToBank(i)}
                className="rounded-xl px-3 py-1.5 text-base font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: answered
                    ? isCorrect
                      ? 'var(--color-success-bg)'
                      : 'var(--color-error-bg)'
                    : 'var(--color-primary-light)',
                  color: answered
                    ? isCorrect
                      ? 'var(--color-success)'
                      : 'var(--color-error)'
                    : 'var(--color-primary-dark)',
                  border: `1px solid ${answered ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-primary)'}`,
                }}
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Correct order shown on incorrect answer */}
      {answered && !isCorrect && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Ordem correta:{' '}
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {data.correctOrder.join(' ')}
          </span>
        </p>
      )}

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {bank.map((word, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => moveToAssembled(i)}
            className="rounded-xl px-3 py-1.5 text-base font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              cursor: answered ? 'default' : 'pointer',
              opacity: answered ? 0.5 : 1,
            }}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { SentenceBuilderData } from '@/types';

interface SentenceBuilderProps {
  data: SentenceBuilderData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function SentenceBuilder({ 
  data, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: SentenceBuilderProps) {
  const [bank, setBank] = useState<string[]>(() => {
    // Build bank from correctOrder to guarantee casing consistency,
    // then shuffle for display
    const wordsFromCorrect = [...data.correctOrder];
    return wordsFromCorrect.sort(() => Math.random() - 0.5);
  });
  const [assembled, setAssembled] = useState<string[]>([]);

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(assembled.length > 0);
    } else {
      setIsExerciseReady(false);
    }
  }, [assembled, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered && assembled.length > 0) {
      handleSubmit();
    }
  }, [submitTrigger]);

  function handleSubmit() {
    onAnswer(assembled.join(' ').toLowerCase() === data.correctOrder.join(' ').toLowerCase());
  }

  function moveToAssembled(index: number) {
    if (answered) return;
    const word = bank[index];
    const newBank = bank.filter((_, i) => i !== index);
    const newAssembled = [...assembled, word];
    setBank(newBank);
    setAssembled(newAssembled);
    // Auto-check when all words are placed
    if (newBank.length === 0) {
      onAnswer(newAssembled.join(' ').toLowerCase() === data.correctOrder.join(' ').toLowerCase());
    }
  }

  function moveToBank(index: number) {
    if (answered) return;
    const word = assembled[index];
    setAssembled(assembled.filter((_, i) => i !== index));
    setBank([...bank, word]);
  }

  const isCorrect = assembled.join(' ').toLowerCase() === data.correctOrder.join(' ').toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Portuguese translation hint */}
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          {data.translation}
        </p>
      </div>

      {/* Answer area */}
      <div
        className="min-h-[100px] flex items-center justify-center rounded-2xl p-6 transition-all duration-500 bg-[var(--color-surface-raised)]/30"
        style={{
          border: `1px solid ${answered ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
        }}
      >
        {assembled.length === 0 ? (
          <p className="text-xs text-center font-medium opacity-40 text-[var(--color-text-muted)] uppercase tracking-widest leading-relaxed max-w-[200px]">
            Toque nas palavras para montar a frase
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {assembled.map((word, i) => (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => moveToBank(i)}
                className="group relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95"
                style={{
                  backgroundColor: answered
                    ? isCorrect
                      ? 'var(--color-success-bg)'
                      : 'var(--color-error-bg)'
                    : 'var(--color-bg)',
                  color: answered
                    ? isCorrect
                      ? 'var(--color-success)'
                      : 'var(--color-error)'
                    : 'var(--color-text-primary)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: `1px solid ${answered ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
                }}
              >
                {word}
                {!answered && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Correct order shown on incorrect answer */}
      {answered && !isCorrect && (
        <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-error)] mb-1 opacity-70">
            Ordem correta:
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {data.correctOrder.join(' ')}
          </p>
        </div>
      )}

      {/* Word bank */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 px-2">
        {bank.map((word, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => moveToAssembled(i)}
            className="group relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              cursor: answered ? 'default' : 'pointer',
              opacity: answered ? 0.4 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {word}
            {!answered && (
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

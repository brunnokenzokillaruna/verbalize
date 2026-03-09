'use client';

import { useState } from 'react';
import type { ErrorCorrectionData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface ErrorCorrectionExerciseProps {
  data: ErrorCorrectionData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

type AnswerStatus = 'idle' | 'correct' | 'accent-warning' | 'wrong';

export function ErrorCorrectionExercise({ data, onAnswer, answered }: ErrorCorrectionExerciseProps) {
  const [input, setInput] = useState(data.error_word);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  const isCorrect =
    input.trim().toLowerCase() === data.correct_word.trim().toLowerCase();
  const isAccentWarning = !isCorrect && isAccentOnlyDiff(input, data.correct_word);

  function handleSubmit() {
    if (answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status !== 'wrong');
  }

  // Split sentence around the error word to highlight it
  const parts = data.sentence_with_error.split(data.error_word);

  return (
    <div className="flex flex-col gap-5">
      {/* Instruction */}
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Encontre e corrija o erro na frase abaixo:
      </p>

      {/* Sentence with highlighted error word */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p
          className="font-display text-xl leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {parts[0]}
          <span
            className="rounded px-1 font-bold"
            style={{
              backgroundColor: answered
                ? isCorrect
                  ? 'var(--color-success-bg)'
                  : 'var(--color-error-bg)'
                : 'var(--color-vocab-bg)',
              color: answered
                ? isCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)'
                : 'var(--color-vocab)',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
            }}
          >
            {data.error_word}
          </span>
          {parts.slice(1).join(data.error_word)}
        </p>
      </div>

      {/* Correction input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Escreva a palavra correta:
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={answered}
          className="w-full rounded-2xl px-4 py-3 text-base outline-none transition-all"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: `2px solid ${
              !answered
                ? 'var(--color-border)'
                : answerStatus === 'correct'
                  ? 'var(--color-success)'
                  : answerStatus === 'accent-warning'
                    ? '#d97706'
                    : 'var(--color-error)'
            }`,
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
          }}
          onFocus={(e) => !answered && (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e) => !answered && (e.target.style.borderColor = 'var(--color-border)')}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {/* Accent warning */}
      {answered && answerStatus === 'accent-warning' && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          Quase! Verifique os acentos:{' '}
          <span className="font-semibold">{data.correct_word}</span>
        </div>
      )}

      {/* Explanation on answer */}
      {answered && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {data.explanation}
        </p>
      )}

      {!answered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={input.trim() === ''}
          className="self-end rounded-xl px-5 py-2 text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: input.trim() ? 'var(--color-primary)' : 'var(--color-surface-raised)',
            color: input.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Verificar
        </button>
      )}
    </div>
  );
}

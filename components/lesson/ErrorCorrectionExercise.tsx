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
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ').trim();

  const normalizedInput = normalize(input);
  const normalizedCorrect = normalize(data.correct_word);
  const isExactCorrect = normalizedInput === normalizedCorrect;
  // Safety net: if correct_word is a bare clitic ending with ' (e.g. "J'"),
  // also accept answers that start with it (e.g. "J'écoute").
  // Use raw (non-normalized) strings so the apostrophe isn't stripped.
  const isElisionPrefix =
    !isExactCorrect &&
    data.correct_word.trimEnd().endsWith("'") &&
    input.toLowerCase().startsWith(data.correct_word.toLowerCase());
  const isAlternativeCorrect =
    !isExactCorrect &&
    !isElisionPrefix &&
    (data.acceptable_answers ?? []).some((alt) => normalize(alt) === normalizedInput);
  const isCorrect = isExactCorrect || isElisionPrefix || isAlternativeCorrect;
  const isAccentWarning =
    !isCorrect &&
    (isAccentOnlyDiff(input, data.correct_word) ||
      (data.acceptable_answers ?? []).some((alt) => isAccentOnlyDiff(input, alt)));

  function handleSubmit() {
    if (answered) return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status === 'correct');
  }

  // Split only on the FIRST occurrence of the error word to avoid highlighting duplicates
  const firstIdx = data.sentence_with_error.indexOf(data.error_word);
  const before = firstIdx >= 0 ? data.sentence_with_error.slice(0, firstIdx) : data.sentence_with_error;
  const after = firstIdx >= 0 ? data.sentence_with_error.slice(firstIdx + data.error_word.length) : '';

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
          {before}
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
          {after}
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
          placeholder={`Substitua "${data.error_word}"…`}
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

      {/* Alternative-correct note */}
      {answered && isAlternativeCorrect && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          Também correto! No diálogo foi usado{' '}
          <span className="font-semibold">&ldquo;{data.correct_word}&rdquo;</span>.
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

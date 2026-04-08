'use client';

import { useState, useEffect } from 'react';
import type { ErrorCorrectionData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';

interface ErrorCorrectionExerciseProps {
  data: ErrorCorrectionData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

type AnswerStatus = 'idle' | 'correct' | 'accent-warning' | 'wrong';

export function ErrorCorrectionExercise({ 
  data, 
  onAnswer, 
  answered,
  setIsExerciseReady,
  submitTrigger
}: ErrorCorrectionExerciseProps) {
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  // Notify parent of readiness
  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(input.trim().length > 0);
    } else {
      setIsExerciseReady(false);
    }
  }, [input, answered, setIsExerciseReady]);

  // Listen for global submit
  useEffect(() => {
    if (submitTrigger > 0 && !answered) {
      handleSubmit();
    }
  }, [submitTrigger]);

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
    <div className="flex flex-col gap-8">
      {/* Instruction */}
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          Encontre e corrija o erro na frase abaixo:
        </p>
      </div>

      {/* Sentence with highlighted error word */}
      <div
        className="rounded-xl p-6 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]"
      >
        <p className="font-display text-xl leading-relaxed text-[var(--color-text-primary)]">
          {before}
          <span
            className="mx-1 px-1.5 py-0.5 rounded-lg font-bold border-b-2 transition-all duration-300"
            style={{
              backgroundColor: answered
                ? isCorrect
                  ? 'var(--color-success-bg)'
                  : 'var(--color-error-bg)'
                : 'var(--color-primary-light)',
              borderColor: answered
                ? isCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)'
                : 'var(--color-primary)',
              color: answered
                ? isCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)'
                : 'var(--color-primary-dark)'
            }}
          >
            {data.error_word}
          </span>
          {after}
        </p>
      </div>

      {/* Correction input */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
            Sua Correção
          </span>
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={answered}
          placeholder={`Substitua "${data.error_word}"…`}
          className="w-full rounded-xl bg-[var(--color-surface-raised)] px-6 py-4 text-base font-medium outline-none transition-all duration-300 ring-1 shadow-inner"
          style={{
            borderColor: 
              !answered
                ? 'var(--color-border)'
                : answerStatus === 'correct'
                  ? 'var(--color-success)'
                  : answerStatus === 'accent-warning'
                    ? '#d97706'
                    : 'var(--color-error)',
            boxShadow: 
              answered && answerStatus === 'correct'
                ? '0 0 0 3px rgba(34, 197, 94, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                : answered && answerStatus === 'accent-warning'
                  ? '0 0 0 3px rgba(217, 119, 6, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                  : answered && answerStatus === 'wrong'
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(0,0,0,0.05)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
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
      </div>

      {/* Feedback Messages */}
      <div className="flex flex-col gap-4">
        {answered && answerStatus === 'accent-warning' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
              Quase lá! Atenção aos acentos:
            </p>
            <p className="text-sm font-semibold text-amber-900 italic">
              {data.correct_word}
            </p>
          </div>
        )}

        {answered && isAlternativeCorrect && (
          <div className="p-4 rounded-xl bg-[var(--color-success-bg)]/30 border border-[var(--color-success)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-success)] mb-1 opacity-70">
              Também correto!
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
              No diálogo foi usado &ldquo;{data.correct_word}&rdquo;.
            </p>
          </div>
        )}

        {answered && (
          <div className="px-1 border-l-2 border-[var(--color-primary)]/20 pl-4 py-2 opacity-90 italic">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {data.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

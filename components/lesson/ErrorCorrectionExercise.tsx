'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ErrorCorrectionData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import {
  errorCorrectionInstruction,
  errorCorrectionPlaceholder,
  getErrorCorrectionAnswerMode,
  isRewriteAnswerCorrect,
  normalizeErrorCorrectionData,
  normalizeErrorText,
  resolveErrorHighlightIndex,
  shouldHighlightErrorSpan,
} from '@/utils/errorCorrection';
import type { OnExerciseAnswer } from '@/hooks/useSoundEffects';

interface ErrorCorrectionExerciseProps {
  data: ErrorCorrectionData;
  onAnswer: OnExerciseAnswer;
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
  submitTrigger,
}: ErrorCorrectionExerciseProps) {
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');

  const exercise = useMemo(() => normalizeErrorCorrectionData(data), [data]);
  const isRewrite = getErrorCorrectionAnswerMode(exercise) === 'rewrite';

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(input.trim().length > 0);
    } else {
      setIsExerciseReady(false);
    }
  }, [input, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && input.trim().length > 0) {
      handleSubmit();
    }
  }, [submitTrigger]);

  const normalizedInput = normalizeErrorText(input);
  const normalizedCorrect = normalizeErrorText(exercise.correct_word);

  const isExactCorrect = isRewrite
    ? isRewriteAnswerCorrect(input, exercise)
    : normalizedInput === normalizedCorrect;

  const isElisionPrefix =
    !isExactCorrect &&
    !isRewrite &&
    exercise.correct_word.trimEnd().endsWith("'") &&
    input.toLowerCase().startsWith(exercise.correct_word.toLowerCase());

  const isAlternativeCorrect =
    !isExactCorrect &&
    !isElisionPrefix &&
    (exercise.acceptable_answers ?? []).some(
      (alt) => normalizeErrorText(alt) === normalizedInput,
    );

  const isCorrect = isExactCorrect || isElisionPrefix || isAlternativeCorrect;

  const isAccentWarning =
    !isCorrect &&
    !isRewrite &&
    (isAccentOnlyDiff(input, exercise.correct_word) ||
      (exercise.acceptable_answers ?? []).some((alt) => isAccentOnlyDiff(input, alt)));

  function handleSubmit() {
    if (answered || input.trim() === '') return;
    const status: AnswerStatus = isCorrect ? 'correct' : isAccentWarning ? 'accent-warning' : 'wrong';
    setAnswerStatus(status);
    onAnswer(status === 'correct' || status === 'accent-warning', {
      accentOnly: status === 'accent-warning',
    });
  }

  const highlightIdx = resolveErrorHighlightIndex(exercise);
  const showHighlight = shouldHighlightErrorSpan(exercise) && highlightIdx >= 0;
  const before =
    showHighlight
      ? exercise.sentence_with_error.slice(0, highlightIdx)
      : exercise.sentence_with_error;
  const after =
    showHighlight
      ? exercise.sentence_with_error.slice(highlightIdx + exercise.error_word.length)
      : '';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 px-1 opacity-70">
        <span className="h-px w-6 bg-[var(--color-border)]" />
        <p className="text-xs font-medium italic text-[var(--color-text-muted)]">
          {errorCorrectionInstruction(exercise)}
        </p>
      </div>

      <div className="rounded-xl p-6 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
        <p className="font-display text-xl leading-relaxed text-[var(--color-text-primary)]">
          {before}
          {showHighlight ? (
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
                  : 'var(--color-primary-dark)',
              }}
            >
              {exercise.error_word}
            </span>
          ) : null}
          {after}
        </p>

        {exercise.translation && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]/50">
            <p className="text-sm font-medium italic text-[var(--color-text-muted)]">
              &ldquo;{exercise.translation}&rdquo;
            </p>
          </div>
        )}
      </div>

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
          placeholder={errorCorrectionPlaceholder(exercise)}
          className="w-full rounded-xl bg-[var(--color-surface-raised)] px-6 py-4 text-base font-medium outline-none transition-all duration-300 ring-1 shadow-inner"
          style={{
            borderColor: !answered
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

      <div className="flex flex-col gap-4">
        {answered && answerStatus === 'accent-warning' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 opacity-80">
              Quase lá! Atenção aos acentos:
            </p>
            <p className="text-sm font-semibold text-amber-900 italic">
              {exercise.correct_word}
            </p>
          </div>
        )}

        {answered && isAlternativeCorrect && (
          <div className="p-4 rounded-xl bg-[var(--color-success-bg)]/30 border border-[var(--color-success)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-success)] mb-1 opacity-70">
              Também correto!
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed italic">
              {isRewrite
                ? <>Outra forma válida da frase corrigida.</>
                : <>No diálogo foi usado &ldquo;{exercise.correct_word}&rdquo;.</>}
            </p>
          </div>
        )}

        {answered && answerStatus === 'wrong' && isRewrite && (
          <div className="p-4 rounded-xl bg-[var(--color-error-bg)]/40 border border-[var(--color-error)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              A frase correta é:{' '}
              <strong className="not-italic">{exercise.corrected_sentence}</strong>
            </p>
          </div>
        )}

        {answered && (
          <div className="px-1 border-l-2 border-[var(--color-primary)]/20 pl-4 py-2 opacity-90 italic">
            <p className="text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {exercise.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lightbulb, XCircle, PenLine } from 'lucide-react';
import type { FillGapProductionData } from '@/types';
import { isAccentOnlyDiff } from '@/utils/accent';
import { validateReverseTranslationLocal } from '@/lib/reverseTranslationValidate';
import { sanitizeFillGapDirectional } from '@/lib/fillGapDirectionalSanitize';
import { incrementProductionStats } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';

interface FillGapProductionExerciseProps {
  data: FillGapProductionData;
  language: string;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type AnswerStatus = 'idle' | 'correct' | 'accent-warning' | 'wrong';

export function FillGapProductionExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: FillGapProductionExerciseProps) {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const sanitized = useMemo(
    () =>
      language === 'fr'
        ? sanitizeFillGapDirectional({
            blankWord: data.blankWord,
            translation: data.translation,
            acceptable_variants: data.acceptable_variants,
          })
        : data,
    [data, language],
  );
  const blankWord = sanitized.blankWord;
  const variants = sanitized.acceptable_variants ?? [];
  const frenchAccents = ['é', 'à', 'è', 'ù', 'ç', 'œ', 'ê', 'â', 'ô', 'î', 'ë', 'ï'];

  useEffect(() => {
    setIsExerciseReady(!answered && input.trim().length > 0);
  }, [input, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function reportProduction(correct: boolean) {
    if (user) incrementProductionStats(user.uid, 'freeWrite', correct).catch(console.error);
    onAnswer(correct);
  }

  function handleSubmit() {
    if (input.trim() === '' || answered) return;

    const userNorm = normalize(input);
    const isExact =
      userNorm === normalize(blankWord) ||
      variants.some((v) => userNorm === normalize(v));

    if (isExact) {
      setAnswerStatus('correct');
      reportProduction(true);
      return;
    }

    const accentOnly =
      isAccentOnlyDiff(input, blankWord) ||
      variants.some((v) => isAccentOnlyDiff(input, v));

    if (accentOnly) {
      setAnswerStatus('accent-warning');
      reportProduction(true);
      return;
    }

    const result = validateReverseTranslationLocal(input, blankWord, variants);
    if (result.accepted) {
      setAnswerStatus('correct');
      reportProduction(true);
    } else {
      setAnswerStatus('wrong');
      reportProduction(false);
    }
  }

  function insertAccent(char: string) {
    if (isAnswered) return;
    setInput((prev) => prev + char);
    inputRef.current?.focus();
  }

  const isAnswered = answered || answerStatus !== 'idle';
  const parts = data.sentence.split('___');
  const isCorrect = answerStatus === 'correct' || answerStatus === 'accent-warning';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <PenLine size={15} className="text-[var(--color-vocab)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            Complete escrevendo a palavra
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] italic mb-3 border-l-4 border-[var(--color-vocab)] pl-3">
          {data.translation}
        </p>
        <p className="font-display text-xl sm:text-2xl font-bold leading-relaxed text-[var(--color-text-primary)]">
          {parts[0]}
          <span
            className="mx-1.5 inline-flex min-h-[2.25rem] min-w-[6rem] items-center justify-center rounded-xl border px-3 text-center font-bold text-[15px]"
            style={{
              borderColor: isAnswered
                ? isCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)'
                : 'rgba(217, 119, 6, 0.35)',
              backgroundColor: isAnswered
                ? isCorrect
                  ? 'var(--color-success-bg)'
                  : 'var(--color-error-bg)'
                : 'rgba(217, 119, 6, 0.04)',
              borderStyle: isAnswered ? 'solid' : 'dashed',
            }}
          >
            {isAnswered ? input || blankWord : '___'}
          </span>
          {parts[1] ?? ''}
        </p>
      </div>

      {!isAnswered && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite a palavra que falta..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full rounded-2xl bg-[var(--color-surface-raised)] px-5 py-4 text-base font-semibold outline-none ring-1 border-[var(--color-border)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {language === 'fr' && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              {frenchAccents.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertAccent(char)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold"
                >
                  {char}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {isAnswered && answerStatus === 'wrong' && (
        <div className="p-4.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
          <div className="flex items-center gap-2 mb-1.5">
            <XCircle size={15} className="text-[var(--color-error)]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-error)]">
              Resposta correta:
            </span>
          </div>
          <p className="text-base font-semibold italic">{blankWord}</p>
          <div className="flex items-center gap-2 mt-3">
            <Lightbulb size={14} className="text-amber-500" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Neste exercício você escreve a palavra — não escolhe entre opções.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

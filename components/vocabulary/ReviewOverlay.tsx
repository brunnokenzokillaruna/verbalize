import React from 'react';
import Image from 'next/image';
import { Loader2, X, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import type { SupportedLanguage } from '@/types';

export interface ReviewResult {
  word: string;
  correct: boolean;
}

interface ReviewOverlayProps {
  state: 'running' | 'done';
  items: VocabReviewItem[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  wordImageMap: Record<string, string>;
  savingResults: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export function ReviewOverlay({
  state,
  items,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  wordImageMap,
  savingResults,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
}: ReviewOverlayProps) {
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (state === 'done') {
    const correctCount = results.filter((r) => r.correct).length;
    const pct = Math.round((correctCount / Math.max(results.length, 1)) * 100);

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <X size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Sessão concluída
          </span>
          <span className="w-9" />
        </div>

        {/* Results content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 text-center mx-auto max-w-sm w-full">
          {/* Score circle */}
          <div
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{
              background: pct >= 70
                ? 'linear-gradient(135deg, var(--color-success-bg), #d1fae5)'
                : 'linear-gradient(135deg, var(--color-error-bg), #fee2e2)',
              border: `3px solid ${pct >= 70 ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          >
            <span
              className="font-display text-3xl font-bold"
              style={{ color: pct >= 70 ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {pct}%
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              acertos
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Os níveis de memória foram atualizados.
            </p>
          </div>

          {/* Per-word results */}
          <div className="w-full flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={r.word}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{
                  backgroundColor: r.correct ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${r.correct ? 'var(--color-success)' : 'var(--color-error)'}20`,
                }}
              >
                {r.correct ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                )}
                <span
                  className="text-sm font-semibold flex-1 text-left"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.word}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r.correct ? 'Correto' : 'Errado'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finish button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onFinish}
            disabled={savingResults}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 4px 16px rgba(29, 94, 212, 0.3)',
              cursor: savingResults ? 'wait' : 'pointer',
            }}
          >
            {savingResults ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Concluir revisão
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Running screen ────────────────────────────────────────────────────────────
  if (!currentItem) return null;

  const exercise = currentItem.exercise;
  const wordImage = wordImageMap[currentItem.word];
  const progress = ((currentIdx) / total) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <X size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            {/* Progress bar */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
            <span
              className="text-xs font-semibold tabular-nums shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {currentIdx + 1} / {total}
            </span>
          </div>
        </div>
      </div>

      {/* ── Exercise content ── */}
      <div className="flex-1 px-5 pb-8 mx-auto max-w-lg w-full">

        {/* Word context chip — hidden for context-choice to avoid giving away the answer */}
        {exercise.type !== 'context-choice' && (
          <div
            className="flex items-center gap-3 rounded-2xl p-3 mb-6"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            {wordImage ? (
              <div
                className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <Image
                  src={wordImage}
                  alt={currentItem.word}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                📖
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Revisando
              </p>
              <p
                className="font-display text-lg font-bold truncate"
                style={{ color: 'var(--color-vocab)' }}
              >
                {currentItem.word}
              </p>
            </div>
            <AudioPlayerButton text={currentItem.word} language={language} size="sm" />
          </div>
        )}

        {/* Exercise */}
        {exercise.type === 'context-choice' && (
          <ContextChoiceExercise
            data={exercise.data}
            onAnswer={onAnswer}
            answered={answered}
          />
        )}

        {exercise.type === 'reverse-translation' && (
          <ReverseTranslationInput
            data={exercise.data}
            language={language}
            onAnswer={onAnswer}
            answered={answered}
          />
        )}
      </div>

      {/* ── Bottom feedback + continue ── */}
      <div
        className="sticky bottom-0"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Feedback banner */}
        {answered && (
          <div
            className="flex items-start gap-3 px-5 py-3"
            style={{
              backgroundColor: lastCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              borderTop: `2px solid ${lastCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          >
            {lastCorrect ? (
              <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
            ) : (
              <XCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
            )}
            <p
              className="text-sm font-semibold"
              style={{ color: lastCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {lastCorrect ? 'Correto! Nível de memória aumentou.' : 'Incorreto. Continue praticando!'}
            </p>
          </div>
        )}

        {/* Continue button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            disabled={!answered}
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: !answered
                ? 'var(--color-surface-raised)'
                : lastCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)',
              color: !answered ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
              boxShadow: answered
                ? `0 4px 16px ${lastCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'}`
                : 'none',
              cursor: answered ? 'pointer' : 'not-allowed',
            }}
          >
            {currentIdx + 1 < total ? (
              <>
                Continuar
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                Ver resultados
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

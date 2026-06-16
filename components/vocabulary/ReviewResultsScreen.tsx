'use client';

import { useRef, useEffect } from 'react';
import { Loader2, X, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useLockDocumentScroll } from '@/hooks/useLockDocumentScroll';
import { useReviewSoundFeedback } from '@/hooks/useReviewSoundFeedback';
import type { ReviewTheme } from './reviewThemes';
import type { UserVocabularyDocument } from '@/types';
import type { ReviewResult } from './reviewTypes';

interface ReviewResultsScreenProps {
  theme: ReviewTheme;
  results: ReviewResult[];
  sessionItems: UserVocabularyDocument[];
  savingResults: boolean;
  correctLabel?: string;
  incorrectLabel?: string;
  hasMoreDue?: boolean;
  onFinish: () => void;
  onClose: () => void;
}

export function ReviewResultsScreen({
  theme,
  results,
  sessionItems,
  savingResults,
  correctLabel = 'Correto',
  incorrectLabel = 'Errado',
  hasMoreDue = false,
  onFinish,
  onClose,
}: ReviewResultsScreenProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const pct = Math.round((correctCount / Math.max(results.length, 1)) * 100);
  const containerRef = useRef<HTMLDivElement>(null);
  const completionSoundPlayedRef = useRef(false);
  const ThemeIcon = theme.icon;
  const { playSessionComplete } = useReviewSoundFeedback();

  const translationMap = Object.fromEntries(
    sessionItems.map((item) => [item.word, item.translation]),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btn = container.querySelector('button[type="button"]:last-of-type');
    (btn as HTMLButtonElement | null)?.focus();
  }, []);

  const scoreColor = pct >= 70 ? 'var(--color-success)' : 'var(--color-error)';
  const scoreBg = pct >= 70 ? 'var(--color-success-bg)' : 'var(--color-error-bg)';

  useLockDocumentScroll();

  useEffect(() => {
    if (completionSoundPlayedRef.current) return;
    completionSoundPlayedRef.current = true;
    playSessionComplete(pct);
  }, [pct, playSessionComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: theme.ambient }}
        aria-hidden
      />

      <div className="flex items-center justify-between px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 relative shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Fechar"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: theme.accentLight, color: theme.accent }}
          >
            <ThemeIcon size={14} />
          </div>
          <span className="text-sm font-bold text-text-primary">{theme.resultsTitle}</span>
        </div>
        <span className="w-9" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto scrollbar-hide px-6 py-6 text-center mx-auto max-w-sm w-full relative">
        <div
          className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[3px]"
          style={{
            background: `linear-gradient(135deg, ${scoreBg}, var(--color-surface))`,
            borderColor: scoreColor,
          }}
        >
          <span className="font-display text-3xl font-bold" style={{ color: scoreColor }}>
            {pct}%
          </span>
          <span className="text-xs font-medium text-text-muted">acertos</span>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {pct >= 80 ? 'Excelente!' : pct >= 50 ? 'Bom trabalho!' : 'Continue praticando!'}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {hasMoreDue
              ? 'Salve e volte para a próxima sessão.'
              : 'Seus níveis de memória foram atualizados.'}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          {results.map((r) => {
            const translation = translationMap[r.word];
            return (
              <div
                key={r.word}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-left"
                style={{
                  backgroundColor: r.correct ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${r.correct ? 'var(--color-success)' : 'var(--color-error)'}25`,
                }}
              >
                {r.correct ? (
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                ) : (
                  <XCircle size={16} className="text-error shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block text-text-primary">{r.word}</span>
                  {!r.correct && translation && translation !== r.word && (
                    <span className="text-xs block mt-0.5 text-text-secondary">{translation}</span>
                  )}
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r.correct ? correctLabel : incorrectLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-3 relative" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          onClick={onFinish}
          disabled={savingResults}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all active:scale-[0.98] text-white cursor-pointer disabled:cursor-wait"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 3px 0 ${theme.accentDark}`,
          }}
        >
          {savingResults ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              {hasMoreDue ? 'Salvar e continuar' : 'Concluir'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

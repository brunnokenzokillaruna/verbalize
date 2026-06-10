'use client';

import React, { useRef, useEffect } from 'react';
import { Loader2, X, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { UserVocabularyDocument } from '@/types';
import type { ReviewResult } from './reviewTypes';

interface ReviewResultsScreenProps {
  title: string;
  results: ReviewResult[];
  sessionItems: UserVocabularyDocument[];
  savingResults: boolean;
  correctLabel?: string;
  incorrectLabel?: string;
  onFinish: () => void;
  onClose: () => void;
}

export function ReviewResultsScreen({
  title,
  results,
  sessionItems,
  savingResults,
  correctLabel = 'Correto',
  incorrectLabel = 'Errado',
  onFinish,
  onClose,
}: ReviewResultsScreenProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const pct = Math.round((correctCount / Math.max(results.length, 1)) * 100);
  const containerRef = useRef<HTMLDivElement>(null);

  const translationMap = Object.fromEntries(
    sessionItems.map((item) => [item.word, item.translation]),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btn = container.querySelector('button');
    btn?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Fechar"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
        <span className="w-9" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 text-center mx-auto max-w-sm w-full">
        <div
          className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
          style={{
            background:
              pct >= 70
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
            {pct >= 80 ? 'Excelente!' : pct >= 50 ? 'Bom trabalho!' : 'Continue praticando!'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Os níveis de memória foram atualizados.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          {results.map((r) => {
            const translation = translationMap[r.word];
            return (
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
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-sm font-semibold block" style={{ color: 'var(--color-text-primary)' }}>
                    {r.word}
                  </span>
                  {!r.correct && translation && translation !== r.word && (
                    <span className="text-xs block mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {translation}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-medium shrink-0"
                  style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r.correct ? correctLabel : incorrectLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
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
              Concluir
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

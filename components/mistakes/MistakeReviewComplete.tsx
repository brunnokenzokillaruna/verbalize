'use client';

import { Trophy, RefreshCw, ChevronRight } from 'lucide-react';
import { MISTAKE_THEME } from './mistakeTheme';
import type { LessonMistakeDocument } from '@/types';

type MistakeReviewCompleteProps = {
  mistake: LessonMistakeDocument;
  correctCount: number;
  totalExercises: number;
  onRetry: () => void;
  onFinish: () => void;
  finishing?: boolean;
};

export function MistakeReviewComplete({
  mistake,
  correctCount,
  totalExercises,
  onRetry,
  onFinish,
  finishing = false,
}: MistakeReviewCompleteProps) {
  const allCorrect = correctCount >= totalExercises;
  const pct = Math.round((correctCount / totalExercises) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10 text-center mx-auto max-w-sm w-full animate-slide-up-spring">
      <div
        className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px]"
        style={{
          background: allCorrect
            ? 'linear-gradient(135deg, var(--color-success-bg), var(--color-surface))'
            : `linear-gradient(135deg, ${MISTAKE_THEME.accentLight}, var(--color-surface))`,
          borderColor: allCorrect ? 'var(--color-success)' : MISTAKE_THEME.accent,
        }}
      >
        {allCorrect ? (
          <Trophy size={36} className="text-success" />
        ) : (
          <>
            <span className="font-display text-2xl font-bold text-error">{pct}%</span>
            <RefreshCw size={14} className="text-error mt-0.5" />
          </>
        )}
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {allCorrect ? 'Erro superado!' : 'Quase lá'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {allCorrect
            ? 'Você acertou todos os exercícios. Este erro sai da sua lista.'
            : `Você acertou ${correctCount} de ${totalExercises}. Tente de novo para fixar o ponto.`}
        </p>
      </div>

      <div
        className="w-full rounded-xl px-4 py-3 text-left border border-border"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
          Tópico
        </p>
        <p className="mt-1 text-sm font-bold text-text-primary">{mistake.grammarFocus}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {!allCorrect && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white cursor-pointer active:scale-[0.98]"
            style={{
              backgroundColor: MISTAKE_THEME.accent,
              boxShadow: `0 3px 0 ${MISTAKE_THEME.accentDark}`,
            }}
          >
            Tentar novamente
            <RefreshCw size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onFinish}
          disabled={finishing}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
          style={{
            backgroundColor: allCorrect ? 'var(--color-success)' : 'var(--color-surface)',
            color: allCorrect ? '#fff' : 'var(--color-text-primary)',
            border: allCorrect ? 'none' : '1px solid var(--color-border)',
            boxShadow: allCorrect ? '0 3px 0 #047857' : 'none',
          }}
        >
          {finishing ? 'Salvando…' : allCorrect ? 'Voltar ao perfil' : 'Voltar ao perfil'}
          {!finishing && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}

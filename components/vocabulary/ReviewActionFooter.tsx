'use client';

import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useReviewSoundFeedback } from '@/hooks/useReviewSoundFeedback';
import type { ReviewTheme } from './reviewThemes';

type ReviewActionFooterProps = {
  theme: ReviewTheme;
  answered: boolean;
  lastCorrect: boolean | null;
  isExerciseReady: boolean;
  isLast: boolean;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  onSubmit: () => void;
  onContinue: () => void;
};

export function ReviewActionFooter({
  theme,
  answered,
  lastCorrect,
  isExerciseReady,
  isLast,
  feedbackCorrect = 'Correto!',
  feedbackWrong = 'Quase! Veja a resposta acima.',
  onSubmit,
  onContinue,
}: ReviewActionFooterProps) {
  const { playTap } = useReviewSoundFeedback();

  function handlePrimaryAction() {
    if (answered) {
      playTap();
      onContinue();
      return;
    }
    playTap();
    onSubmit();
  }

  return (
    <div style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      {answered && (
        <div
          className="px-5 py-3 flex items-start gap-3 animate-slide-up"
          style={{
            backgroundColor: lastCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
            borderTop: `2px solid ${lastCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
          }}
        >
          {lastCorrect ? (
            <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-error shrink-0 mt-0.5" />
          )}
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: lastCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
          >
            {lastCorrect ? feedbackCorrect : feedbackWrong}
          </p>
        </div>
      )}

      <div className="px-5 pt-3">
        <button
          type="button"
          disabled={!answered && !isExerciseReady}
          onClick={handlePrimaryAction}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
          style={{
            backgroundColor: !answered
              ? isExerciseReady
                ? theme.accent
                : 'var(--color-surface-raised)'
              : lastCorrect
                ? 'var(--color-success)'
                : theme.accent,
            color: !answered && !isExerciseReady ? 'var(--color-text-muted)' : '#fff',
            boxShadow:
              answered || isExerciseReady ? `0 3px 0 ${theme.accentDark}` : 'none',
          }}
        >
          {!answered ? (
            'Verificar resposta'
          ) : isLast ? (
            <>
              Ver resultados
              <ChevronRight size={18} />
            </>
          ) : (
            <>
              Próxima palavra
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

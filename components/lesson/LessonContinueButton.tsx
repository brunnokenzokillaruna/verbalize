import { Loader2 } from 'lucide-react';
import { TAGS_WITH_GRAMMAR_PHASE } from '@/app/(app)/lesson/constants';
import type { LessonPhase } from '@/store/lessonStore';
import type { LessonTag } from '@/types';

type LessonContinueButtonProps = {
  phase: LessonPhase;
  isLoading: boolean;
  rolePlayComplete: boolean;
  lessonTag?: LessonTag;
  onAdvance: () => void;
};

function getNextLabel(phase: LessonPhase, lessonTag?: LessonTag): string {
  if (phase === 'vocabulary') {
    return lessonTag === 'MISS' ? 'Role-play' : 'Diálogo';
  }
  if (phase === 'hook') {
    if (lessonTag && TAGS_WITH_GRAMMAR_PHASE.has(lessonTag)) return 'Gramática';
    if (lessonTag === 'PRON') return 'Fonética';
    return 'Prática';
  }
  if (phase === 'mission') return 'Vocabulário';
  return 'Prática';
}

export function LessonContinueButton({
  phase,
  isLoading,
  rolePlayComplete,
  lessonTag,
  onAdvance,
}: LessonContinueButtonProps) {
  const disabled = isLoading || (phase === 'role-play' && !rolePlayComplete);

  return (
    <div className="mt-10 animate-slide-up delay-300">
      <button
        type="button"
        disabled={disabled}
        onClick={onAdvance}
        className={[
          'cta-shimmer relative flex w-full max-w-sm mx-auto items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-base font-bold',
          'transition-all duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-primary',
          disabled
            ? 'cursor-not-allowed border border-[var(--color-border)]'
            : 'cursor-pointer active:translate-y-[2px] active:border-b-[2px]',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          background: disabled
            ? 'var(--color-surface-raised)'
            : phase === 'role-play'
              ? 'var(--color-success)'
              : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          color: disabled ? 'var(--color-text-muted)' : '#fff',
          borderBottomWidth: disabled ? '1px' : '4px',
          borderBottomColor: disabled ? 'var(--color-border)' : 'rgba(0, 0, 0, 0.35)',
          boxShadow: disabled
            ? 'none'
            : phase === 'role-play'
              ? '0 6px 16px rgba(16,185,129,0.3)'
              : '0 6px 16px rgba(29,94,212,0.25)',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Sincronizando…</span>
          </>
        ) : phase === 'hook' ? (
          <>Entendido!</>
        ) : phase === 'mission' ? (
          <>Aceitar Missão 🚀</>
        ) : phase === 'phonetics' ? (
          <>Entendido, vamos praticar!</>
        ) : phase === 'role-play' ? (
          rolePlayComplete ? (
            <>Missão cumprida, ir à prática →</>
          ) : (
            <>Finalize a conversa…</>
          )
        ) : (
          <>Avançar →</>
        )}
      </button>
      <p className="mt-3 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em] opacity-50">
        Próximo: {getNextLabel(phase, lessonTag)}
      </p>
    </div>
  );
}

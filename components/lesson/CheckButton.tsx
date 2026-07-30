'use client';

import { CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';

export type CheckButtonState = 'idle' | 'disabled' | 'correct' | 'incorrect';

interface CheckButtonProps {
  state: CheckButtonState;
  /** @deprecated Analysis lives on the exercise screen — banner shows status only. */
  correctAnswer?: string;
  /** @deprecated Analysis lives on the exercise screen — banner shows status only. */
  hint?: string;
  retryNotice?: string | null;
  /** @deprecated Analysis lives on the exercise screen — banner shows status only. */
  elaborationHint?: string | null;
  onCheck: () => void;
  onContinue: () => void;
  loading?: boolean;
}

/**
 * Bottom check/continue bar. Result banner shows only Correto! / Resposta incorreta —
 * detailed corrections stay on the exercise page itself.
 */
export function CheckButton({
  state,
  retryNotice,
  onCheck,
  onContinue,
  loading = false,
}: CheckButtonProps) {
  const isResult = state === 'correct' || state === 'incorrect';
  const isCorrect = state === 'correct';

  function handleClick() {
    if (isResult) {
      onContinue();
    } else if (state === 'idle') {
      onCheck();
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
      {retryNotice && !isResult && (
        <div
          className="border-t-4 border-amber-500 px-5 py-3"
          style={{ backgroundColor: 'var(--color-warning-bg)' }}
        >
          <p className="text-sm font-semibold text-amber-700">{retryNotice}</p>
        </div>
      )}

      <div
        style={{
          backgroundColor: isCorrect
            ? 'var(--color-success-bg)'
            : state === 'incorrect'
              ? 'var(--color-error-bg)'
              : 'transparent',
          transition: 'all 300ms ease',
          overflow: 'hidden',
          maxHeight: isResult ? '88px' : '0px',
          borderTop: isResult
            ? `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`
            : 'none',
        }}
      >
        {isResult && (
          <div className="flex items-center gap-3 px-5 py-3.5">
            {isCorrect ? (
              <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            ) : (
              <XCircle size={22} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            )}
            <p
              className="font-bold text-base"
              style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {isCorrect ? 'Correto!' : 'Resposta incorreta'}
            </p>
          </div>
        )}
      </div>

      <div
        className="px-5 pt-3"
        style={{ backgroundColor: 'var(--color-bg)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          disabled={state === 'disabled' || loading}
          onClick={handleClick}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold',
            'transition-all duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-primary',
            state === 'disabled' ? 'cursor-not-allowed border border-[var(--color-border)]' : 'cursor-pointer active:translate-y-[2px] active:border-b-[2px]',
            isResult ? (isCorrect ? 'animate-correct' : 'animate-shake') : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            backgroundColor:
              state === 'disabled'
                ? 'var(--color-surface-raised)'
                : isCorrect
                  ? 'var(--color-success)'
                  : state === 'incorrect'
                    ? 'var(--color-error)'
                    : 'var(--color-primary)',
            color: state === 'disabled' ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
            borderBottomWidth: state === 'disabled' ? '1px' : '4px',
            borderBottomColor: state === 'disabled' ? 'var(--color-border)' : 'rgba(0, 0, 0, 0.35)',
            boxShadow:
              state !== 'disabled'
                ? isCorrect
                  ? '0 6px 16px rgba(16, 185, 129, 0.25)'
                  : state === 'incorrect'
                    ? '0 6px 16px rgba(220, 38, 38, 0.25)'
                    : '0 6px 16px rgba(29, 94, 212, 0.25)'
                : 'none',
          }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isResult ? (
            <>
              Continuar
              <ChevronRight size={20} />
            </>
          ) : (
            'Verificar'
          )}
        </button>
      </div>
    </div>
  );
}

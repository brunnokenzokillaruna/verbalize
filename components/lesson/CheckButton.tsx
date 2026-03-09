'use client';

import { CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';

export type CheckButtonState = 'idle' | 'disabled' | 'correct' | 'incorrect';

interface CheckButtonProps {
  state: CheckButtonState;
  correctAnswer?: string;
  hint?: string;
  onCheck: () => void;
  onContinue: () => void;
  loading?: boolean;
}

export function CheckButton({
  state,
  correctAnswer,
  hint,
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
      {/* Result feedback banner */}
      <div
        style={{
          backgroundColor: isCorrect
            ? 'var(--color-success-bg)'
            : state === 'incorrect'
              ? 'var(--color-error-bg)'
              : 'transparent',
          transition: 'all 300ms ease',
          overflow: 'hidden',
          maxHeight: isResult ? '120px' : '0px',
          borderTop: isResult
            ? `2px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`
            : 'none',
        }}
      >
        {isResult && (
          <div className="flex items-start gap-3 px-5 py-4">
            {isCorrect ? (
              <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
            ) : (
              <XCircle size={22} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
            )}
            <div>
              <p
                className="font-semibold"
                style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
              >
                {isCorrect ? 'Correto!' : 'Resposta incorreta'}
              </p>
              {!isCorrect && correctAnswer && (
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Resposta certa:{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {correctAnswer}
                  </span>
                </p>
              )}
              {hint && (
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {hint}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div
        className="px-5 pb-6 pt-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <button
          type="button"
          disabled={state === 'disabled' || loading}
          onClick={handleClick}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold',
            'transition-all duration-150 active:scale-[0.98]',
            state === 'disabled' ? 'cursor-not-allowed' : 'cursor-pointer',
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
            color:
              state === 'disabled'
                ? 'var(--color-text-muted)'
                : 'var(--color-text-inverse)',
            boxShadow:
              state !== 'disabled'
                ? isCorrect
                  ? '0 4px 16px rgba(5, 150, 105, 0.3)'
                  : state === 'incorrect'
                    ? '0 4px 16px rgba(220, 38, 38, 0.3)'
                    : '0 4px 16px rgba(29, 94, 212, 0.3)'
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

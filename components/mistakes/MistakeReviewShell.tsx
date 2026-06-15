'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { MISTAKE_THEME } from './mistakeTheme';

type MistakeReviewShellProps = {
  current: number;
  total: number;
  grammarFocus?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function MistakeReviewShell({
  current,
  total,
  grammarFocus,
  onClose,
  children,
  footer,
}: MistakeReviewShellProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = total > 0 ? (current / total) * 100 : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) setShowExitConfirm(false);
        else setShowExitConfirm(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitConfirm]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: MISTAKE_THEME.ambient }}
        aria-hidden
      />

      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
              aria-label="Sair da revisão"
            >
              <X size={18} className="text-text-muted" />
            </button>

            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: MISTAKE_THEME.accentLight, color: MISTAKE_THEME.accent }}
            >
              <AlertCircle size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-text-primary">
                {MISTAKE_THEME.label}
              </p>
              {grammarFocus && (
                <p className="text-[10px] font-medium truncate text-text-muted">
                  {grammarFocus}
                </p>
              )}
            </div>

            <span
              className="text-xs font-bold tabular-nums shrink-0 rounded-lg px-2 py-1"
              style={{ backgroundColor: MISTAKE_THEME.accentLight, color: MISTAKE_THEME.accent }}
            >
              {current}/{total}
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: MISTAKE_THEME.accent }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col">{children}</div>

      {footer}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in border-2 border-border bg-surface"
          >
            <h3 className="font-display text-xl font-bold mb-2 text-text-primary">
              Sair da revisão?
            </h3>
            <p className="text-sm font-medium mb-6 leading-relaxed text-text-secondary">
              O progresso desta sessão não será salvo.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-border bg-surface-raised text-text-primary cursor-pointer active:scale-95"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white cursor-pointer active:scale-95"
                style={{ backgroundColor: MISTAKE_THEME.accent }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

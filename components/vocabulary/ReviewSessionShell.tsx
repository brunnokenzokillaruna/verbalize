'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface ReviewSessionShellProps {
  modeLabel: string;
  current: number;
  total: number;
  onCloseRequest: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ReviewSessionShell({
  modeLabel,
  current,
  total,
  onCloseRequest,
  children,
  footer,
}: ReviewSessionShellProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = total > 0 ? (current / total) * 100 : 0;

  function handleCloseRequest() {
    setShowExitConfirm(true);
  }

  function confirmExit() {
    setShowExitConfirm(false);
    onCloseRequest();
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) setShowExitConfirm(false);
        else handleCloseRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitConfirm]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);

    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = getFocusable();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first || !focusableElements.includes(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last || !focusableElements.includes(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleFocusTrap);
    return () => container.removeEventListener('keydown', handleFocusTrap);
  }, [current, total, showExitConfirm, footer]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={handleCloseRequest}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
              aria-label="Sair da revisão"
            >
              <X size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-widest truncate"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {modeLabel}
              </p>
              <div
                className="mt-1.5 h-2 rounded-full overflow-hidden"
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
            </div>
            <span
              className="text-xs font-semibold tabular-nums shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {current} / {total}
            </span>
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current - 1 ? 16 : 6,
                  backgroundColor:
                    i < current ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">{children}</div>

      {footer && (
        <div className="sticky bottom-0" style={{ backgroundColor: 'var(--color-bg)' }}>
          {footer}
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in"
            style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-border)' }}
          >
            <h3 className="font-display text-xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Sair da revisão?
            </h3>
            <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Seu progresso nesta sessão não será salvo.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm border-2 border-[var(--color-border)] transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmExit}
                className="flex-1 py-3 rounded-xl font-extrabold text-sm text-white transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-error)' }}
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

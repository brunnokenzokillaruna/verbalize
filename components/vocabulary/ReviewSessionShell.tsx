'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLockDocumentScroll } from '@/hooks/useLockDocumentScroll';
import type { ReviewTheme } from './reviewThemes';

interface ReviewSessionShellProps {
  theme: ReviewTheme;
  current: number;
  total: number;
  onCloseRequest: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ReviewSessionShell({
  theme,
  current,
  total,
  onCloseRequest,
  children,
  footer,
}: ReviewSessionShellProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = total > 0 ? (current / total) * 100 : 0;
  const ThemeIcon = theme.icon;

  useLockDocumentScroll();

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
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: theme.ambient }}
        aria-hidden
      />

      <div
        className="sticky top-0 z-10 shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={handleCloseRequest}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
              aria-label="Sair da revisão"
            >
              <X size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>

            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.accentLight, color: theme.accent }}
            >
              <ThemeIcon size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {theme.label}
              </p>
              <p className="text-[10px] font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                {theme.tagline}
              </p>
            </div>

            <span
              className="text-xs font-bold tabular-nums shrink-0 rounded-lg px-2 py-1"
              style={{ backgroundColor: theme.accentLight, color: theme.accent }}
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
              style={{ width: `${progress}%`, backgroundColor: theme.accent }}
            />
          </div>

          <div className="flex justify-center gap-1 mt-2.5">
            {Array.from({ length: Math.min(total, 12) }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current - 1 ? 14 : 5,
                  height: 5,
                  backgroundColor: i < current ? theme.accent : 'var(--color-border)',
                }}
              />
            ))}
            {total > 12 && (
              <span className="text-[9px] font-bold text-text-muted ml-1">+{total - 12}</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>

      {footer && (
        <div
          className="sticky bottom-0 z-10 shrink-0 border-t border-border"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          {footer}
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in border-2 border-border"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="font-display text-xl font-bold mb-2 text-text-primary">
              Sair da revisão?
            </h3>
            <p className="text-sm font-medium mb-6 leading-relaxed text-text-secondary">
              Seu progresso nesta sessão não será salvo.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-border transition-all active:scale-95 cursor-pointer bg-surface-raised text-text-primary"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmExit}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 cursor-pointer"
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

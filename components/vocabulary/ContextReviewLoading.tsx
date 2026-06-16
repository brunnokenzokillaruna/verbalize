'use client';

import { Loader2, X, Brain, Sparkles } from 'lucide-react';
import { useLockDocumentScroll } from '@/hooks/useLockDocumentScroll';
import { REVIEW_THEMES } from './reviewThemes';

const THEME = REVIEW_THEMES.context;

interface ContextReviewLoadingProps {
  wordCount: number;
  onClose: () => void;
}

export function ContextReviewLoading({ wordCount, onClose }: ContextReviewLoadingProps) {
  useLockDocumentScroll();

  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: THEME.ambient }}
        aria-hidden
      />

      <div className="flex items-center justify-between px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 relative shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Cancelar"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <div className="flex items-center gap-2">
          <Brain size={16} style={{ color: THEME.accent }} />
          <span className="text-sm font-bold text-text-primary">{THEME.label}</span>
        </div>
        <span className="w-9" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6 text-center relative pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="relative">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl animate-pulse"
            style={{ backgroundColor: THEME.accentBg }}
          >
            <Sparkles size={32} style={{ color: THEME.accent }} />
          </div>
          <Loader2
            size={28}
            className="animate-spin absolute -bottom-2 -right-2"
            style={{ color: THEME.accent }}
          />
        </div>

        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Montando suas frases…
          </h2>
          <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed text-text-secondary">
            A IA está criando exercícios personalizados para {wordCount} palavra
            {wordCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full animate-bounce"
              style={{
                backgroundColor: THEME.accent,
                animationDelay: `${i * 160}ms`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Loader2, X } from 'lucide-react';

interface ContextReviewLoadingProps {
  wordCount: number;
  onClose: () => void;
}

export function ContextReviewLoading({ wordCount, onClose }: ContextReviewLoadingProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Cancelar"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Em contexto
        </span>
        <span className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-verb)' }} />
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Preparando exercícios…
          </h2>
          <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Gerando frases com IA para {wordCount} palavra{wordCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

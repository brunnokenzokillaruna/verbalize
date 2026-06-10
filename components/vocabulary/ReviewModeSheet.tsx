'use client';

import React, { useRef, useEffect } from 'react';
import { X, Layers, Brain, Clock } from 'lucide-react';
interface ReviewModeSheetProps {
  sessionCount: number;
  totalDue: number;
  onSelectFlashcard: () => void;
  onSelectContext: () => void;
  onClose: () => void;
}

export function ReviewModeSheet({
  sessionCount,
  totalDue,
  onSelectFlashcard,
  onSelectContext,
  onClose,
}: ReviewModeSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const remaining = Math.max(0, totalDue - sessionCount);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btn = container.querySelector('button');
    btn?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Fechar"
        >
          <X size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Escolha o modo
        </span>
        <span className="w-9" />
      </div>

      <div className="flex-1 px-5 pb-8 mx-auto max-w-lg w-full flex flex-col gap-5">
        <div className="text-center mb-2">
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Como quer revisar?
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {sessionCount} palavras nesta sessão
            {remaining > 0 && ` · ${remaining} ficam para depois`}
          </p>
        </div>

        <button
          type="button"
          onClick={onSelectFlashcard}
          className="flex items-start gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.98] border-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-primary)',
            boxShadow: '0 4px 0 var(--color-primary-light)',
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <Layers size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Cartões
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Vire o cartão e diga se lembrou da tradução.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {sessionCount} palavras
              </span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Clock size={11} /> ~3 min
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onSelectContext}
          className="flex items-start gap-4 rounded-2xl p-5 text-left transition-all active:scale-[0.98] border-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-verb)',
            boxShadow: '0 4px 0 rgba(124, 58, 237, 0.15)',
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: 'var(--color-verb)' }}
          >
            <Brain size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Em contexto
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Complete frases e traduza em situações reais (usa IA).
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: 'var(--color-verb)' }}
              >
                {sessionCount} palavras
              </span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Clock size={11} /> ~5 min
              </span>
            </div>
          </div>
        </button>

        <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {totalDue} palavra{totalDue !== 1 ? 's' : ''} pendente{totalDue !== 1 ? 's' : ''} no total
        </p>
      </div>
    </div>
  );
}

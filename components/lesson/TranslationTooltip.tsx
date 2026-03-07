'use client';

import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AudioPlayerButton } from './AudioPlayerButton';
import type { SupportedLanguage } from '@/types';

export interface TranslationData {
  word: string;
  language: SupportedLanguage;
  translation?: string;
  explanation?: string;
  example?: string;
  exampleTranslation?: string;
}

interface TranslationTooltipProps extends TranslationData {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
}

export function TranslationTooltip({
  word,
  language,
  translation,
  explanation,
  example,
  exampleTranslation,
  isOpen,
  isLoading = false,
  onClose,
}: TranslationTooltipProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms ease',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tradução: ${word}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          maxWidth: '640px',
          margin: '0 auto',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: '65dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{ width: 40, height: 4, backgroundColor: 'var(--color-border-strong)' }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-3 pb-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex-1">
            {/* Word */}
            <div className="flex items-center gap-3">
              <span
                className="font-display text-3xl font-semibold"
                style={{ color: 'var(--color-vocab)' }}
              >
                {word}
              </span>
              {!isLoading && word && (
                <AudioPlayerButton text={word} language={language} size="sm" />
              )}
            </div>

            {/* Translation */}
            {isLoading ? (
              <div className="mt-2 flex items-center gap-2">
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Buscando tradução...
                </span>
              </div>
            ) : (
              <p
                className="mt-1 text-xl font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {translation ?? '—'}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-90"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        {!isLoading && (explanation || example) && (
          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Explanation */}
            {explanation && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-bridge-bg)' }}
              >
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-bridge)' }}
                >
                  Explicação
                </p>
                <p className="bridge-text" style={{ fontStyle: 'normal', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  {explanation}
                </p>
              </div>
            )}

            {/* Example sentence */}
            {example && (
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Exemplo
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p
                      className="text-base font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {example}
                    </p>
                    {exampleTranslation && (
                      <p
                        className="mt-1 text-sm"
                        style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
                      >
                        {exampleTranslation}
                      </p>
                    )}
                  </div>
                  <AudioPlayerButton text={example} language={language} size="sm" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3 px-6 py-5">
            {[80, 60, 90].map((w) => (
              <div
                key={w}
                className="h-4 rounded-lg"
                style={{
                  width: `${w}%`,
                  backgroundColor: 'var(--color-surface-raised)',
                  animation: 'fade-in 1s ease infinite alternate',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

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
  partOfSpeech?: string;
  infinitive?: string;
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
  partOfSpeech,
  infinitive,
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
      <button
        type="button"
        aria-label="Fechar tradução"
        onClick={onClose}
        className="focus-visible:outline-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms ease',
          backdropFilter: 'blur(2px)',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'default',
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
          borderTop: '4px solid var(--color-border)',
          borderLeft: '1px solid var(--color-border)',
          borderRight: '1px solid var(--color-border)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: '65dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div
            className="rounded-full"
            style={{ width: 40, height: 4, backgroundColor: 'var(--color-border-strong)', opacity: 0.5 }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-3 pb-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex-1 min-w-0">
            {/* Word */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="font-serif text-3xl font-black italic tracking-tight"
                style={{ color: partOfSpeech === 'Verbo' ? 'var(--color-verb)' : 'var(--color-vocab)' }}
              >
                {word}
              </span>
              {!isLoading && word && (
                <AudioPlayerButton text={word} language={language} size="sm" />
              )}
              {!isLoading && partOfSpeech === 'Verbo' && (
                <span
                  className="rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--color-verb-bg)',
                    borderColor: 'rgba(124, 58, 237, 0.25)',
                    color: 'var(--color-verb)',
                  }}
                >
                  Verbo{infinitive ? `: ${infinitive}` : ''}
                </span>
              )}
            </div>

            {/* Translation */}
            {isLoading ? (
              <div className="mt-2.5 flex items-center gap-2">
                <Loader2
                  size={16}
                  className="animate-spin text-[var(--color-text-muted)]"
                />
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Buscando tradução...
                </span>
              </div>
            ) : (
              <p
                className="mt-1.5 text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
              >
                {translation ?? '—'}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-100 active:translate-y-[2px] active:border-b-[1px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] border-b-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
          >
            <X size={16} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Body */}
        {!isLoading && (explanation || example) && (
          <div className="flex flex-col gap-5 px-6 py-6">
            {/* Explanation */}
            {explanation && (
              <div
                className="rounded-2xl p-4 border border-[var(--color-border)] border-b-[3px]"
                style={{ backgroundColor: 'var(--color-bridge-bg)' }}
              >
                <p
                  className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]"
                >
                  Explicação
                </p>
                <p className="bridge-text text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {explanation}
                </p>
              </div>
            )}

            {/* Example sentence */}
            {example && (
              <div className="rounded-2xl p-4 border border-[var(--color-border)] border-b-[3px] bg-[var(--color-surface-raised)]/35 flex flex-col gap-2">
                <p
                  className="text-[10px] font-black uppercase tracking-widest text-[var(--color-vocab)]"
                >
                  Exemplo de Uso
                </p>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-bold leading-relaxed text-[var(--color-text-primary)] font-serif italic"
                    >
                      {example}
                    </p>
                    {exampleTranslation && (
                      <p
                        className="mt-1 text-sm font-medium text-[var(--color-text-secondary)] opacity-85"
                      >
                        {exampleTranslation}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <AudioPlayerButton text={example} language={language} size="sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3.5 px-6 py-6">
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

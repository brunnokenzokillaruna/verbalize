import React, { useState } from 'react';
import Image from 'next/image';
import { Loader2, X, CheckCircle2, XCircle, ChevronRight, RotateCw, X as XIcon, Check as CheckIcon } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './ReviewOverlay';

interface QuickReviewOverlayProps {
  state: 'running' | 'done';
  items: UserVocabularyDocument[];
  currentIdx: number;
  results: ReviewResult[];
  language: SupportedLanguage;
  savingResults: boolean;
  onAnswer: (correct: boolean) => void;
  onFinish: () => void;
  onClose: () => void;
}

export function QuickReviewOverlay({
  state,
  items,
  currentIdx,
  results,
  language,
  savingResults,
  onAnswer,
  onFinish,
  onClose,
}: QuickReviewOverlayProps) {
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;
  const [isFlipped, setIsFlipped] = useState(false);

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (state === 'done') {
    const correctCount = results.filter((r) => r.correct).length;
    const pct = Math.round((correctCount / Math.max(results.length, 1)) * 100);

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <X size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Revisão Rápida concluída
          </span>
          <span className="w-9" />
        </div>

        {/* Results content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 text-center mx-auto max-w-sm w-full">
          {/* Score circle */}
          <div
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{
              background: pct >= 70
                ? 'linear-gradient(135deg, var(--color-success-bg), #d1fae5)'
                : 'linear-gradient(135deg, var(--color-error-bg), #fee2e2)',
              border: `3px solid ${pct >= 70 ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          >
            <span
              className="font-display text-3xl font-bold"
              style={{ color: pct >= 70 ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {pct}%
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              lembrados
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {pct >= 80 ? 'Excelente memória!' : pct >= 50 ? 'Bom trabalho!' : 'Continue praticando!'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Seu vocabulário foi atualizado.
            </p>
          </div>

          {/* Per-word results */}
          <div className="w-full flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={r.word}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{
                  backgroundColor: r.correct ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${r.correct ? 'var(--color-success)' : 'var(--color-error)'}20`,
                }}
              >
                {r.correct ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                )}
                <span
                  className="text-sm font-semibold flex-1 text-left"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.word}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r.correct ? 'Lembrou' : 'Esqueceu'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finish button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onFinish}
            disabled={savingResults}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 4px 16px rgba(29, 94, 212, 0.3)',
              cursor: savingResults ? 'wait' : 'pointer',
            }}
          >
            {savingResults ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Concluir
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Running screen ────────────────────────────────────────────────────────────
  if (!currentItem) return null;

  const progress = ((currentIdx) / total) * 100;

  function handleAnswer(correct: boolean) {
    setIsFlipped(false);
    onAnswer(correct);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <X size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            {/* Progress bar */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
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
            <span
              className="text-xs font-semibold tabular-nums shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {currentIdx + 1} / {total}
            </span>
          </div>
        </div>
      </div>

      {/* ── Flashcard ── */}
      <div className="flex-1 px-5 py-8 mx-auto max-w-lg w-full flex flex-col items-center justify-center">
        
        {/* Card Container */}
        <div 
          className="relative w-full aspect-[3/4] max-h-[60vh] transition-all duration-500 rounded-3xl"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            cursor: !isFlipped ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (!isFlipped) setIsFlipped(true);
          }}
        >
          {/* Front of card */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              boxShadow: '0 12px 40px rgba(29, 94, 212, 0.15)',
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            {currentItem.imageUrl && (
              <div className="absolute top-0 left-0 w-full h-full opacity-10 rounded-3xl overflow-hidden pointer-events-none">
                <Image
                  src={currentItem.imageUrl}
                  alt={currentItem.word}
                  fill
                  className="object-cover blur-sm"
                />
              </div>
            )}
            
            <p className="text-xs font-bold uppercase tracking-widest mb-6 relative z-10" style={{ color: 'var(--color-primary)' }}>
              Pense na tradução
            </p>
            
            <div className="flex flex-col items-center gap-6 relative z-10">
              <p className="font-display text-5xl font-bold text-center break-words w-full" style={{ color: 'var(--color-text-primary)' }}>
                {currentItem.word}
              </p>
              
              <AudioPlayerButton text={currentItem.word} language={language} size="lg" />
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce relative z-10 mt-auto pt-12">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <RotateCw size={14} style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Toque para virar</span>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            <p className="font-display text-2xl font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>
              {currentItem.word}
            </p>
            
            <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
            
            <p className="text-3xl font-semibold text-center mb-8" style={{ color: 'var(--color-vocab)' }}>
              {currentItem.translation}
            </p>
          </div>
        </div>

      </div>

      {/* ── Bottom Controls (Only visible when flipped) ── */}
      <div
        className="px-5 pt-3 pb-8 flex gap-4 transition-all duration-300"
        style={{ 
          opacity: isFlipped ? 1 : 0, 
          pointerEvents: isFlipped ? 'auto' : 'none',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' 
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-5 transition-all active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#ef4444' }}>
            <XIcon size={24} color="#fff" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold" style={{ color: '#ef4444' }}>Esqueci</span>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
          className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-5 transition-all active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--color-success-bg)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-success)' }}>
            <CheckIcon size={24} color="#fff" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>Lembrei</span>
        </button>
      </div>
    </div>
  );
}

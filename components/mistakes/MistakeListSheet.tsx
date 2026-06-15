'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { LanguageFlag } from '@/components/LanguageFlag';
import type { LessonMistakeDocument } from '@/types';

type MistakeListSheetProps = {
  mistakes: LessonMistakeDocument[];
  onSelect: (mistake: LessonMistakeDocument) => void;
  onClose: () => void;
};

export function MistakeListSheet({ mistakes, onSelect, onClose }: MistakeListSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl flex flex-col max-h-[80dvh] animate-slide-up border border-border bg-surface shadow-xl"
        role="dialog"
        aria-label="Lista de erros para revisar"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Erros pendentes
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {mistakes.length} tópico{mistakes.length !== 1 ? 's' : ''} · toque para revisar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer bg-surface-raised"
            aria-label="Fechar"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {mistakes.map((m, idx) => (
            <button
              key={m.id ?? idx}
              type="button"
              onClick={() => onSelect(m)}
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-left w-full transition-all active:scale-[0.99] cursor-pointer border border-border bg-bg hover:border-error/40 hover:bg-surface-raised"
            >
              <span className="text-xs font-bold tabular-nums text-text-muted w-5 shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {m.grammarFocus}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <LanguageFlag language={m.language} size="sm" />
                  <span className="text-[10px] font-bold text-text-muted">{m.level}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold text-text-secondary cursor-pointer border border-border bg-surface-raised active:scale-[0.98]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

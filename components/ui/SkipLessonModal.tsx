'use client';

import { FastForward, X } from 'lucide-react';

interface SkipLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  lessonTitle?: string;
}

export function SkipLessonModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  lessonTitle,
}: SkipLessonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] p-8 text-center shadow-2xl animate-scale-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-6 top-6 rounded-full p-2 text-muted transition-colors hover:bg-surface-raised active:scale-95 disabled:opacity-0"
        >
          <X size={20} />
        </button>

        {/* Icon Ring */}
        <div 
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: 'var(--color-primary-light)',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 8px 24px rgba(29, 94, 212, 0.15)',
          }}
        >
          <FastForward size={36} className="text-primary ml-1" strokeWidth={2.5} />
        </div>

        {/* Content */}
        <h2 className="font-display text-2xl font-black text-primary leading-tight">
          Pular esta lição?
        </h2>
        
        <p className="mt-3 text-base font-medium text-muted leading-relaxed">
          {lessonTitle ? (
            <>
              Você vai marcar <span className="text-text-primary font-bold">"{lessonTitle}"</span> como concluída e avançar para o próximo tema.
            </>
          ) : (
            'Você vai marcar esta lição como concluída e avançar para o próximo tema.'
          )}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="cta-shimmer relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] disabled:opacity-70"
            style={{
              boxShadow: '0 8px 20px rgba(29, 94, 212, 0.3)',
            }}
          >
            {isLoading ? 'Sincronizando...' : 'Confirmar e Pular'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 text-sm font-bold text-muted transition-colors hover:text-text-primary disabled:opacity-50"
          >
            Ainda não, quero aprender!
          </button>
        </div>
      </div>
    </div>
  );
}

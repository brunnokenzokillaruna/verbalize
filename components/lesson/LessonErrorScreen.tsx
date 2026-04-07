import React from 'react';

interface LessonErrorScreenProps {
  onRetry: () => void;
  onExit: () => void;
}

export function LessonErrorScreen({ onRetry, onExit }: LessonErrorScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl animate-scale-in"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          border: '1.5px solid rgba(220,38,38,0.2)',
        }}
      >
        ⚠️
      </div>
      <div className="animate-slide-up delay-75">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Erro ao gerar lição
        </h2>
        <p className="mt-2 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          Não foi possível conectar ao servidor de IA. Verifique sua conexão e tente novamente.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-slide-up delay-150">
        <button
          type="button"
          onClick={onRetry}
          className="cta-shimmer relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
            boxShadow: '0 6px 20px rgba(29,94,212,0.3)',
          }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={onExit}
          className="text-sm font-medium transition-opacity hover:opacity-70 py-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

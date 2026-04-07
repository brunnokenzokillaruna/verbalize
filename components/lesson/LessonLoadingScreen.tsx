import React from 'react';
import { Loader2 } from 'lucide-react';

export function LessonLoadingScreen() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl animate-pulse"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface-raised))',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Preparando sua lição
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          A IA está gerando o conteúdo…
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: 'var(--color-primary)', animationDelay: `${i * 150}ms`, opacity: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

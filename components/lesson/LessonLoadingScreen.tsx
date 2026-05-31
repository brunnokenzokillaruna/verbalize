import React from 'react';
import { Loader2 } from 'lucide-react';

export function LessonLoadingScreen() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl animate-pulse border border-[var(--color-border)] border-b-[4px] shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
        style={{
          background: 'var(--color-surface)',
        }}
      >
        <Loader2 size={36} className="animate-spin text-[var(--color-primary)]" />
      </div>
      
      <div className="text-center max-w-xs flex flex-col items-center">
        <h2 className="font-serif text-2xl font-black italic tracking-tight text-[var(--color-text-primary)]">
          Preparando sua jornada…
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)] leading-relaxed">
          Nossa inteligência está moldando e sintonizando seus desafios de áudio e exercícios.
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-bounce bg-[var(--color-primary)] shadow-sm"
            style={{ animationDelay: `${i * 150}ms`, opacity: 0.75 }}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          border: '1.5px solid rgba(220,38,38,0.2)',
        }}
        aria-hidden="true"
      >
        ⚠️
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-2xl px-6 py-3.5 text-base font-semibold text-white transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="w-full rounded-2xl px-6 py-3.5 text-base font-semibold border transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border-strong)',
            color: 'var(--color-text-primary)',
          }}
        >
          Página inicial
        </Link>
      </div>
    </main>
  );
}

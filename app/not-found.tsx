import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <p
        className="font-display text-6xl font-bold tabular-nums"
        style={{ color: 'var(--color-primary)' }}
        aria-hidden="true"
      >
        404
      </p>
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          O endereço pode estar incorreto ou a página foi movida.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <Link
          href="/dashboard"
          className="w-full rounded-2xl px-6 py-3.5 text-base font-semibold text-white transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Ir para o início
        </Link>
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

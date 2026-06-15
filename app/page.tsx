import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'Verbalize',
  description: 'Aprenda francês e inglês no seu ritmo.',
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden flex flex-col items-center selection:bg-[var(--color-primary)] selection:text-white"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-[100] flex w-full items-center justify-between px-8 py-8 md:px-16 lg:px-24"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          <Sparkles size={20} className="text-[var(--color-primary)]" aria-hidden="true" />
          VERBALIZE
        </Link>

        <div className="flex items-center gap-4 text-xs sm:text-sm sm:gap-6">
          <Link
            href="/login"
            className="font-semibold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="group relative px-6 py-2 rounded-full overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
          >
            <span className="relative z-10 font-bold uppercase tracking-widest text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-2">
              Cadastrar <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </nav>

      <main
        id="main-content"
        className="relative w-full min-h-dvh flex flex-col items-center justify-center overflow-visible"
      >
        <h1 className="sr-only">Verbalize</h1>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 blur-[120px]"
            style={{
              background: 'radial-gradient(circle at center, var(--color-primary), transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden pb-[5vh]"
          aria-hidden="true"
        >
          <div className="font-display font-black text-[10vw] leading-none tracking-[0.1em] text-[var(--color-text-primary)] opacity-[0.03] uppercase">
            O FUTURO DO
          </div>
          <div className="font-display font-black text-[13vw] leading-none tracking-tight text-[var(--color-primary)] opacity-[0.05] uppercase">
            APRENDIZADO
          </div>
        </div>

        <LandingPageClient />
      </main>
    </div>
  );
}

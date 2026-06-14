'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SplineRobot = dynamic(() => import('@/components/landing/SplineRobot'), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden="true" />,
});

export default function LandingPage() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [initialized, user, router]);

  if (!initialized) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
        aria-busy="true"
        aria-label="Carregando"
      >
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  if (user) {
    return null;
  }

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

      <main className="relative w-full h-dvh flex flex-col items-center justify-center overflow-visible">
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

        <h1 className="sr-only">
          Verbalize — Aprenda francês e inglês com micro-histórias e revisão espaçada
        </h1>

        <p className="absolute bottom-10 left-0 right-0 z-20 px-6 text-center text-sm text-[var(--color-text-secondary)] pointer-events-none max-w-xl mx-auto">
          Francês e inglês para falantes de português.{' '}
          <Link href="/login" className="pointer-events-auto underline hover:text-[var(--color-primary)]">
            Entrar
          </Link>
          {' · '}
          <Link href="/signup" className="pointer-events-auto underline hover:text-[var(--color-primary)]">
            Criar conta
          </Link>
        </p>

        <div className="relative z-10 w-full h-full max-w-6xl flex items-center justify-center pointer-events-auto">
          <div className="w-full h-full flex items-center justify-center">
            <SplineRobot />
          </div>
        </div>
      </main>
    </div>
  );
}

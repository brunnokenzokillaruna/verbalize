import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FirebaseProviders } from '@/components/FirebaseProviders';
import { AuthModalFromQuery } from '@/components/landing/AuthModalFromQuery';
import { LandingAuthNav } from '@/components/landing/LandingAuthNav';
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
    <FirebaseProviders>
      <Suspense fallback={null}>
        <AuthModalFromQuery />
      </Suspense>
      <div
        className="relative min-h-dvh overflow-x-hidden flex flex-col items-center selection:bg-[var(--color-primary)] selection:text-white"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
        }}
      >
        <LandingAuthNav />

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
    </FirebaseProviders>
  );
}

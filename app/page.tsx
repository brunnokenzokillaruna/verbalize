'use client';

import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplineRobot from '@/components/landing/SplineRobot';

export default function LandingPage() {
  const { openModal } = useAuthModal();
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [initialized, user, router]);

  if (!initialized || user) {
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
      {/* ── Minimal Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex w-full items-center justify-between px-8 py-8 md:px-16 lg:px-24">
        <div className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          <Sparkles size={20} className="text-[var(--color-primary)]" />
          VERBALIZE
        </div>

        <div className="flex items-center gap-6 text-xs sm:text-sm">
          <button
            onClick={() => openModal('login')}
            className="font-semibold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => openModal('signup')}
            className="group relative px-6 py-2 rounded-full overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
          >
            <span className="relative z-10 font-bold uppercase tracking-widest text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-2">
              Cadastrar <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </nav>

      {/* ── Main Hero Section ── */}
      <main className="relative w-full h-dvh flex flex-col items-center justify-center overflow-visible">
        {/* Background Visuals */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* Subtle Ambient Glows */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 blur-[120px]"
            style={{ 
              background: 'radial-gradient(circle at center, var(--color-primary), transparent 60%)' 
            }}
          />
          
          {/* Extremely Subtle Grid */}
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{ backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        </div>

        {/* ── Large Background Text ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden pb-[5vh]">
          <h1 className="font-display font-black text-[10vw] leading-none tracking-[0.1em] text-[var(--color-text-primary)] opacity-[0.03] uppercase">
            O FUTURO DO
          </h1>
          <h1 className="font-display font-black text-[13vw] leading-none tracking-tight text-[var(--color-primary)] opacity-[0.05] uppercase">
            APRENDIZADO
          </h1>
        </div>

        {/* ── Primary 3D Robot ── */}
        <div className="relative z-10 w-full h-full max-w-6xl flex items-center justify-center pointer-events-auto">
          <div className="w-full h-full flex items-center justify-center">
             <SplineRobot />
          </div>
        </div>

      </main>


    </div>
  );
}







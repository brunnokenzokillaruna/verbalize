'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Menu, X } from 'lucide-react';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

function DesktopAuthButtons({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onLogin}
        className="font-semibold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors whitespace-nowrap"
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={onSignup}
        className="group relative px-5 lg:px-6 py-2 rounded-full overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors whitespace-nowrap"
      >
        <span className="relative z-10 font-bold uppercase tracking-widest text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-2">
          Cadastrar <ArrowRight size={14} aria-hidden="true" />
        </span>
      </button>
    </>
  );
}

export function LandingAuthNav() {
  const { openModal } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  function handleOpenModal(type: 'login' | 'signup') {
    setMenuOpen(false);
    openModal(type);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[100]">
      <nav
        aria-label="Navegação principal"
        className="relative flex w-full items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-8 sm:pb-5 md:px-16 lg:px-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-display text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          <Sparkles
            size={20}
            className="shrink-0 text-[var(--color-primary)]"
            aria-hidden="true"
          />
          <span className="truncate">VERBALIZE</span>
        </Link>

        <div className="hidden md:flex items-center gap-5 lg:gap-6 text-sm">
          <DesktopAuthButtons
            onLogin={() => openModal('login')}
            onSignup={() => openModal('signup')}
          />
        </div>

        <button
          type="button"
          className="md:hidden shrink-0 p-2 -mr-1 rounded-full hover:bg-[var(--color-surface)] transition-colors"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X size={22} style={{ color: 'var(--color-text-primary)' }} />
          ) : (
            <Menu size={22} style={{ color: 'var(--color-text-primary)' }} />
          )}
        </button>
      </nav>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[60px] z-[99] bg-black/50 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="landing-mobile-menu"
            className="absolute left-0 right-0 top-full z-[100] md:hidden border-b border-[var(--color-border)] px-4 py-4 flex flex-col gap-3 animate-fade-in shadow-lg"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <button
              type="button"
              onClick={() => handleOpenModal('login')}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold uppercase tracking-widest transition-colors hover:text-[var(--color-primary)]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal('signup')}
              className="w-full py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 6px 20px rgba(29,94,212,0.3)',
              }}
            >
              Cadastrar <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </header>
  );
}

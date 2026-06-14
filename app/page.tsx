import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'Verbalize — Aprenda francês e inglês com micro-histórias',
  description:
    'Aprenda francês e inglês com micro-histórias, pontes gramaticais e revisão espaçada. Método Ponte Português para brasileiros.',
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

        <h1 className="absolute bottom-24 left-0 right-0 z-20 px-6 text-center text-base sm:text-lg font-display font-bold text-[var(--color-text-primary)] max-w-xl mx-auto pointer-events-none">
          Verbalize — Aprenda francês e inglês com micro-histórias e revisão espaçada
        </h1>

        <p
          className="absolute bottom-10 left-0 right-0 z-20 mx-auto max-w-xl px-6 text-center text-sm pointer-events-none rounded-xl py-2"
          style={{
            color: 'var(--color-text-primary)',
            backgroundColor: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
          }}
        >
          Francês e inglês para falantes de português.{' '}
          <Link href="/login" className="pointer-events-auto underline hover:text-[var(--color-primary)]">
            Entrar
          </Link>
          {' · '}
          <Link href="/signup" className="pointer-events-auto underline hover:text-[var(--color-primary)]">
            Criar conta
          </Link>
        </p>

        <LandingPageClient />
      </main>

      <footer
        className="relative z-20 w-full border-t px-6 py-12 md:px-16 lg:px-24"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            O que é o Verbalize?
          </h2>
          <p>
            O Verbalize é um aplicativo de micro-aprendizado de idiomas criado para brasileiros que
            querem dominar francês e inglês sem abandonar a rotina. Nosso Método Ponte Português
            compara estruturas gramaticais com o que você já domina em português, acelerando a
            compreensão e reduzindo a frustração típica de cursos tradicionais.
          </p>
          <p>
            Cada lição dura de cinco a dez minutos e combina histórias contextuais, vocabulário
            destacado por cores, áudio integrado e revisão espaçada inteligente. Você aprende
            palavras dentro de frases reais, pratica com exercícios gerados por inteligência
            artificial e retém o conhecimento com repetições calculadas no momento certo.
          </p>
          <p>
            Comece gratuitamente, escolha seu idioma-alvo e evolua no seu ritmo — seja no celular
            durante o intervalo do café ou no computador ao final do dia.
          </p>
          <nav aria-label="Links legais" className="flex flex-wrap gap-4 pt-2 text-xs">
            <Link
              href="/about"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Sobre
            </Link>
            <Link
              href="/contact"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Contato
            </Link>
            <Link
              href="/privacy"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

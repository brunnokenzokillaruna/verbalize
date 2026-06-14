import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, withOgImage } from '@/lib/siteMetadata';

export const metadata: Metadata = withOgImage(
  {
    title: 'Sobre o Verbalize',
    description:
      'Conheça o Verbalize: micro-aprendizado de francês e inglês para brasileiros com o Método Ponte Português e revisão espaçada.',
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: 'Sobre o Verbalize',
      description:
        'Conheça o Verbalize: micro-aprendizado de francês e inglês para brasileiros com o Método Ponte Português e revisão espaçada.',
      type: 'website',
    },
    twitter: {
      title: 'Sobre o Verbalize',
      description:
        'Conheça o Verbalize: micro-aprendizado de francês e inglês para brasileiros com o Método Ponte Português e revisão espaçada.',
    },
  },
  `${SITE_URL}/about`,
);

const publishedDate = '2026-06-14';

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Sobre o Verbalize',
    datePublished: publishedDate,
    url: `${SITE_URL}/about`,
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: 'Verbalize',
      url: SITE_URL,
    },
  };

  return (
    <main
      id="main-content"
      className="min-h-dvh px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-2xl">
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            ← Voltar ao Verbalize
          </Link>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">Sobre o Verbalize</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Publicado em 14 de junho de 2026
          </p>
        </header>

        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            O Verbalize nasceu para tornar o aprendizado de francês e inglês mais acessível a
            brasileiros que têm pouco tempo no dia a dia. Em vez de aulas longas e desconectadas da
            realidade, oferecemos micro-lições de cinco a dez minutos com histórias contextuais,
            áudio integrado e vocabulário destacado dentro de frases reais.
          </p>
          <p>
            Nosso Método Ponte Português compara estruturas gramaticais com o que o aluno já domina
            em português, reduzindo a curva de frustração típica de cursos tradicionais. Cada lição
            combina leitura guiada, exercícios interativos e revisão espaçada para fixar o
            conhecimento no momento certo.
          </p>
          <p>
            O produto é desenvolvido com foco mobile-first, priorizando carregamento rápido e uma
            interface limpa que não sobrecarrega o estudante. Utilizamos Firebase para autenticação
            e sincronização de progresso, Google Gemini para personalização de conteúdo educacional
            e hospedagem na Vercel, mantendo a operação enxuta e acessível.
          </p>
          <p>
            O Verbalize é um projeto em evolução contínua, orientado por feedback de usuários e por
            boas práticas de micro-aprendizado, acessibilidade e privacidade conforme a LGPD.
          </p>

          <nav aria-label="Links relacionados" className="flex flex-wrap gap-4 pt-4 text-sm">
            <Link
              href="/contact"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Contato
            </Link>
            <Link
              href="/privacy"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </article>
    </main>
  );
}

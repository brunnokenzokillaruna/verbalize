import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, withOgImage } from '@/lib/siteMetadata';

export const metadata: Metadata = withOgImage(
  {
    title: 'Contato',
    description:
      'Entre em contato com a equipe Verbalize para dúvidas sobre privacidade, suporte técnico ou parcerias educacionais.',
    alternates: {
      canonical: '/contact',
    },
    openGraph: {
      title: 'Contato — Verbalize',
      description:
        'Entre em contato com a equipe Verbalize para dúvidas sobre privacidade, suporte técnico ou parcerias educacionais.',
      type: 'website',
    },
    twitter: {
      title: 'Contato — Verbalize',
      description:
        'Entre em contato com a equipe Verbalize para dúvidas sobre privacidade, suporte técnico ou parcerias educacionais.',
    },
  },
  `${SITE_URL}/contact`,
);

export default function ContactPage() {
  return (
    <main
      id="main-content"
      className="min-h-dvh px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
    >
      <article className="mx-auto max-w-2xl">
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            ← Voltar ao Verbalize
          </Link>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">Contato</h1>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Estamos disponíveis para ajudar com questões sobre conta, privacidade, sugestões de
            conteúdo e parcerias relacionadas ao aprendizado de idiomas.
          </p>
        </header>

        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="mb-2 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              E-mail
            </h2>
            <p>
              <a
                href="mailto:contato@verbalize.app"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato@verbalize.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Tempo de resposta
            </h2>
            <p>
              Respondemos solicitações em até 5 dias úteis. Para pedidos relacionados à LGPD,
              inclua o e-mail da conta Verbalize na mensagem.
            </p>
          </section>

          <nav aria-label="Links relacionados" className="flex flex-wrap gap-4 pt-4 text-sm">
            <Link
              href="/privacy"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Política de Privacidade
            </Link>
            <Link
              href="/about"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Sobre o Verbalize
            </Link>
          </nav>
        </div>
      </article>
    </main>
  );
}

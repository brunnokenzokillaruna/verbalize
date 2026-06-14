import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, withOgImage } from '@/lib/siteMetadata';

export const metadata: Metadata = withOgImage(
  {
    title: 'Política de Privacidade',
    description:
      'Como o Verbalize trata informações de conta, progresso de estudos e conteúdo gerado por IA, conforme a LGPD.',
    alternates: {
      canonical: '/privacy',
    },
    openGraph: {
      title: 'Política de Privacidade — Verbalize',
      description:
        'Como o Verbalize trata informações de conta, progresso de estudos e conteúdo gerado por IA, conforme a LGPD.',
      type: 'website',
    },
    twitter: {
      title: 'Política de Privacidade — Verbalize',
      description:
        'Como o Verbalize trata informações de conta, progresso de estudos e conteúdo gerado por IA, conforme a LGPD.',
    },
  },
  `${SITE_URL}/privacy`,
);

const publishedDate = '2026-06-14';

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Política de Privacidade — Verbalize',
    datePublished: publishedDate,
    dateModified: publishedDate,
    url: `${SITE_URL}/privacy`,
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
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Publicado em 14 de junho de 2026
          </p>
        </header>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              1. Quem somos
            </h2>
            <p>
              O Verbalize é um aplicativo de aprendizado de idiomas voltado a falantes de português
              brasileiro. Esta política explica como tratamos informações pessoais quando você acessa
              verbalize-one.vercel.app e utiliza nossas funcionalidades de estudo de francês e inglês.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              2. Informações que coletamos
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Conta:</strong> nome, e-mail
                e identificador de autenticação (via Firebase Auth, incluindo login com Google).
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Progresso:</strong> lições
                concluídas, vocabulário salvo, preferências de idioma e estatísticas de revisão
                espaçada (armazenados no Firebase Firestore).
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Conteúdo gerado:</strong>{' '}
                textos enviados durante exercícios podem ser processados pelo Google Gemini para
                gerar feedback e conteúdo educacional.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Técnicos:</strong> registros
                básicos de uso e desempenho fornecidos pela hospedagem (Vercel) para manter o
                serviço estável e seguro.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              3. Finalidades do tratamento
            </h2>
            <p>
              Utilizamos as informações para autenticar a sessão, personalizar lições, sincronizar
              progresso entre dispositivos, gerar exercícios com inteligência artificial e melhorar
              a experiência de aprendizado. O Verbalize não comercializa informações pessoais com
              terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              4. Serviços de terceiros
            </h2>
            <p>
              O Verbalize utiliza Google Firebase (autenticação e banco de dados), Google Gemini
              (geração de conteúdo educacional) e Vercel (hospedagem). Cada provedor possui sua
              própria política de privacidade e pode processar informações conforme seus termos de
              serviço e acordos de processamento aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              5. Direitos do titular (LGPD)
            </h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão de informações pessoais entrando em
              contato pelo e-mail{' '}
              <a
                href="mailto:contato@verbalize.app"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato@verbalize.app
              </a>
              . Também é possível excluir a conta nas configurações do perfil, o que remove o
              progresso de estudos armazenado no Firestore.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              6. Retenção e segurança
            </h2>
            <p>
              Mantemos as informações enquanto a conta permanecer ativa. Aplicamos práticas de
              segurança padrão da indústria, incluindo comunicação criptografada (HTTPS) e regras
              de acesso no Firebase. Nenhum método de transmissão ou armazenamento digital é
              totalmente isento de riscos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              7. Cookies e armazenamento local
            </h2>
            <p>
              O aplicativo pode utilizar armazenamento local do navegador para preferências de tema
              e estado de sessão. Cookies essenciais de autenticação podem ser definidos pelo
              Firebase Auth para manter o login ativo entre visitas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              8. Atualizações desta política
            </h2>
            <p>
              Esta política pode ser atualizada periodicamente para refletir mudanças legais ou
              funcionais do produto. A data de publicação no topo da página indica a versão
              vigente. Recomendamos revisitar esta página ao continuar utilizando o Verbalize.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              9. Contato
            </h2>
            <p>
              Dúvidas sobre privacidade? Escreva para{' '}
              <a
                href="mailto:contato@verbalize.app"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato@verbalize.app
              </a>
              {' '}ou visite a página de{' '}
              <Link
                href="/contact"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

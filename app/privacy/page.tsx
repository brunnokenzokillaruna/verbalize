import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Saiba como o Verbalize coleta, usa e protege seus dados pessoais. Informações sobre Firebase, autenticação, progresso de estudos e uso de inteligência artificial.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div
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
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Última atualização: junho de 2026
          </p>
        </header>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              1. Quem somos
            </h2>
            <p>
              O Verbalize é um aplicativo de aprendizado de idiomas voltado a falantes de português
              brasileiro. Esta política descreve como tratamos dados pessoais quando você usa nosso
              site e aplicativo em verbalize-one.vercel.app.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              2. Dados que coletamos
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
                <strong style={{ color: 'var(--color-text-primary)' }}>Técnicos:</strong> logs básicos
                de uso e desempenho fornecidos pela hospedagem (Vercel) para manter o serviço
                estável.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              3. Como usamos seus dados
            </h2>
            <p>
              Utilizamos seus dados para autenticar sua sessão, personalizar lições, sincronizar
              progresso entre dispositivos, gerar exercícios com inteligência artificial e melhorar
              a experiência de aprendizado. Não vendemos seus dados pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              4. Serviços de terceiros
            </h2>
            <p>
              O Verbalize utiliza Google Firebase (autenticação e banco de dados), Google Gemini
              (geração de conteúdo educacional) e Vercel (hospedagem). Cada provedor possui sua
              própria política de privacidade e pode processar dados conforme seus termos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              5. Seus direitos (LGPD)
            </h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão dos seus dados entrando em contato pelo
              e-mail{' '}
              <a
                href="mailto:contato@verbalize.app"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato@verbalize.app
              </a>
              . Você também pode excluir sua conta nas configurações do perfil, o que remove seus
              dados de progresso do Firestore.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              6. Retenção e segurança
            </h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Aplicamos práticas de segurança
              padrão da indústria, incluindo comunicação criptografada (HTTPS) e regras de acesso no
              Firebase. Nenhum método de transmissão ou armazenamento é 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              7. Contato
            </h2>
            <p>
              Dúvidas sobre esta política? Escreva para{' '}
              <a
                href="mailto:contato@verbalize.app"
                className="font-semibold underline underline-offset-2"
                style={{ color: 'var(--color-primary)' }}
              >
                contato@verbalize.app
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

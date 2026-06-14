import type { Metadata } from 'next';

const title = 'Entrar — Acesse francês e inglês';
const description =
  'Acesse sua conta Verbalize para continuar suas micro-lições de francês e inglês com o Método Ponte Português, revisão espaçada e histórias contextuais feitas para brasileiros.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title,
    description,
    url: 'https://verbalize-one.vercel.app/login',
    type: 'website',
  },
  twitter: {
    title,
    description,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

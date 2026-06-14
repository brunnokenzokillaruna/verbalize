import type { Metadata } from 'next';

const title = 'Criar conta grátis — Comece agora';
const description =
  'Cadastre-se no Verbalize e comece a aprender francês e inglês com micro-lições de 5 minutos, pontes gramaticais em português e revisão espaçada inteligente. Grátis para brasileiros.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title,
    description,
    url: 'https://verbalize-one.vercel.app/signup',
    type: 'website',
  },
  twitter: {
    title,
    description,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { SITE_URL, withOgImage } from '@/lib/siteMetadata';

const title = 'Criar conta grátis — Comece agora';
const description =
  'Crie sua conta gratuita no Verbalize e aprenda francês e inglês com micro-lições, pontes gramaticais e revisão espaçada.';

export const metadata: Metadata = withOgImage(
  {
    title,
    description,
    alternates: {
      canonical: '/signup',
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      title,
      description,
    },
  },
  `${SITE_URL}/signup`,
);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" href="/logo.webp" as="image" type="image/webp" fetchPriority="high" />
      {children}
    </>
  );
}

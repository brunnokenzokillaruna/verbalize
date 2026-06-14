import type { Metadata } from 'next';
import { SITE_URL, withOgImage } from '@/lib/siteMetadata';

const title = 'Entrar — Acesse francês e inglês';
const description =
  'Acesse sua conta Verbalize e continue micro-lições de francês e inglês com revisão espaçada e o Método Ponte Português.';

export const metadata: Metadata = withOgImage(
  {
    title,
    description,
    alternates: {
      canonical: '/login',
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
  `${SITE_URL}/login`,
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" href="/logo.webp" as="image" type="image/webp" fetchPriority="high" />
      {children}
    </>
  );
}

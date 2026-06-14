import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://verbalize-one.vercel.app'),
  title: {
    default: 'Verbalize — Aprenda francês e inglês com micro-histórias',
    template: '%s | Verbalize',
  },
  description:
    'Aprenda francês e inglês através de micro-histórias, pontes gramaticais e revisão espaçada — feito para falantes de português brasileiro. Lições de 5 minutos com o Método Ponte Português.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Verbalize — Aprenda francês e inglês com micro-histórias',
    description:
      'Micro-lições de francês e inglês para brasileiros: histórias contextuais, pontes gramaticais e revisão espaçada inteligente.',
    url: 'https://verbalize-one.vercel.app',
    siteName: 'Verbalize',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verbalize — Aprenda francês e inglês com micro-histórias',
    description:
      'Micro-lições de francês e inglês para brasileiros: histórias contextuais, pontes gramaticais e revisão espaçada inteligente.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-surface focus:text-text-primary focus:font-bold focus:ring-2 focus:ring-primary"
          >
            Pular para o conteúdo principal
          </a>
          <AuthProvider>
            <AuthModalProvider>
              {children}
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

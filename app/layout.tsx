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
    default: 'Verbalize | Aprenda o mundo',
    template: '%s | Verbalize',
  },
  description:
    'Aprenda francês e inglês através de micro-histórias, pontes gramaticais e revisão espaçada — feito para falantes de português brasileiro.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Verbalize | Aprenda o mundo',
    description: 'Aprenda francês e inglês de forma interativa.',
    url: 'https://verbalize-one.vercel.app',
    siteName: 'Verbalize',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verbalize | Aprenda o mundo',
    description: 'Aprenda francês e inglês de forma interativa.',
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
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:font-bold"
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

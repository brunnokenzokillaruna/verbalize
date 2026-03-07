import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
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
  title: 'Verbalize',
  description:
    'Aprenda francês e inglês através de micro-histórias, pontes gramaticais e revisão espaçada — feito para falantes de português brasileiro.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

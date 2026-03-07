import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
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
    'Learn French and English through micro-stories, grammar bridges, and spaced repetition — designed for Brazilian Portuguese speakers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: 'var(--font-body)' }}>{children}</body>
    </html>
  );
}

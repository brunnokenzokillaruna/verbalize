import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta Verbalize e continue aprendendo francês e inglês.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

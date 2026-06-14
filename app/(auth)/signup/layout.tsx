import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Cadastre-se no Verbalize e comece a aprender francês e inglês de forma interativa.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

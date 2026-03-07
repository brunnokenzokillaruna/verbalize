'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          <CheckCircle2
            size={12}
            style={{ color: c.ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}
          />
          <span style={{ color: c.ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      router.replace('/');
    }
  }, [initialized, user, router]);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoadingEmail(true);
    try {
      await signUpWithEmail(email, password);
      // After signup → onboarding to collect name + profile
      router.replace('/onboarding');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setError('Erro ao criar conta. Verifique seus dados.');
      }
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleGoogleSignup() {
    setError('');
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      router.replace('/onboarding');
    } catch {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  if (initialized && user) return null;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <BrandPanel />

      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 lg:min-h-full"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center lg:hidden animate-slide-up">
          <h1
            className="font-display text-4xl font-bold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Verbalize
          </h1>
          <p className="mt-1 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
            Aprenda o mundo.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 animate-slide-up delay-75">
            <h2
              className="font-display text-3xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Crie sua conta
            </h2>
            <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Comece sua jornada gratuitamente.
            </p>
          </div>

          {/* Google */}
          <div className="animate-slide-up delay-150">
            <Button
              variant="google"
              size="lg"
              fullWidth
              loading={loadingGoogle}
              onClick={handleGoogleSignup}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Cadastrar com Google
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 animate-slide-up delay-150">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              ou use seu e-mail
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          <form onSubmit={handleEmailSignup} className="flex flex-col gap-4 animate-slide-up delay-225">
            <Input
              label="Nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex flex-col gap-2">
              <Input
                label="Senha"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordStrength password={password} />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                }}
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loadingEmail} className="mt-2">
              Criar conta
            </Button>
          </form>

          <p
            className="mt-6 text-center text-sm animate-slide-up delay-300"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

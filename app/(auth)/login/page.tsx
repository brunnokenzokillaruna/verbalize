'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '@/services/auth';
import { getUser } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { Input } from '@/components/ui/Input';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { user, initialized, profile, setProfile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      if (profile) router.replace('/dashboard');
      else router.replace('/onboarding');
    }
  }, [initialized, user, profile, router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoadingEmail(true);
    try {
      const cred = await signInWithEmail(email, password);
      const profile = await getUser(cred.user.uid);
      setProfile(profile);
      router.replace(profile ? '/dashboard' : '/onboarding');
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoadingGoogle(true);
    try {
      const cred = await signInWithGoogle();
      const profile = await getUser(cred.user.uid);
      setProfile(profile);
      router.replace(profile ? '/dashboard' : '/onboarding');
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

      {/* ── Form side ── */}
      <div
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12 overflow-hidden lg:min-h-full"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Subtle background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-60"
            style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 -left-16 h-52 w-52 rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden animate-slide-up-spring">
            <span className="mb-3 flex gap-1.5 text-xl">🇧🇷 🇫🇷 🇬🇧</span>
            <h1
              className="font-display text-4xl font-bold tracking-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              Verbalize
            </h1>
            <p className="mt-1.5 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
              Aprenda o mundo.
            </p>
          </div>

          {/* Heading */}
          <div className="mb-8 animate-slide-up-spring delay-75">
            <h2
              className="font-display text-3xl font-semibold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Continue sua jornada de hoje.
            </p>
          </div>

          {/* Google button */}
          <div className="animate-slide-up-spring delay-150">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingEmail}
              className="card-lift flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {loadingGoogle ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Entrar com Google
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 animate-slide-up-spring delay-150">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-muted)',
              }}
            >
              ou com e-mail
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 animate-slide-up-spring delay-225">
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
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm animate-scale-in"
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  border: '1px solid var(--color-error)',
                }}
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="cta-shimmer relative mt-2 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
                boxShadow: '0 6px 20px rgba(29,94,212,0.3)',
              }}
            >
              {loadingEmail ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Entrando…
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Switch to signup */}
          <p
            className="mt-6 text-center text-sm animate-slide-up-spring delay-300"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Não tem uma conta?{' '}
            <Link
              href="/signup"
              className="font-bold transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              Cadastre-se grátis →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

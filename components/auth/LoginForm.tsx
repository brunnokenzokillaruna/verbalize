'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '@/services/auth';
import { getUser } from '@/services/firestore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import {
  AuthFormDivider,
  AuthFormFooter,
  AuthFormHeader,
  AuthGoogleButton,
} from '@/components/auth/AuthFormLayout';
import { Input } from '@/components/ui/Input';

export function LoginForm() {
  const router = useRouter();
  const { openModal, closeModal } = useAuthModal();
  const { user, initialized, profile, setProfile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      closeModal();
      if (profile) router.replace('/dashboard');
      else router.replace('/onboarding');
    }
  }, [initialized, user, profile, router, closeModal]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoadingEmail(true);
    try {
      const cred = await signInWithEmail(email, password);
      const userProfile = await getUser(cred.user.uid);
      setProfile(userProfile);
      router.replace(userProfile ? '/dashboard' : '/onboarding');
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
      const userProfile = await getUser(cred.user.uid);
      setProfile(userProfile);
      router.replace(userProfile ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') return;
      if (code === 'auth/popup-blocked') {
        setError('Popup bloqueado pelo navegador. Permita popups e tente novamente.');
        return;
      }
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  if (initialized && user) return null;

  return (
    <div className="w-full max-w-sm mx-auto">
      <AuthFormHeader
        title="Bem-vindo de volta"
        description="Continue sua jornada de francês e inglês com micro-lições personalizadas."
      />

      <AuthGoogleButton
        label="Entrar com Google"
        loading={loadingGoogle}
        disabled={loadingGoogle || loadingEmail}
        onClick={handleGoogleLogin}
      />

      <AuthFormDivider />

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-3 sm:gap-4">
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
            className="flex items-start gap-2.5 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm animate-scale-in"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
            }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loadingEmail || loadingGoogle}
          className="cta-shimmer relative mt-1 sm:mt-2 w-full overflow-hidden rounded-xl sm:rounded-2xl py-3 sm:py-3.5 text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-primary)',
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

      <AuthFormFooter>
        Não tem uma conta?{' '}
        <button
          type="button"
          onClick={() => openModal('signup')}
          className="font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          Cadastre-se grátis →
        </button>
      </AuthFormFooter>
    </div>
  );
}

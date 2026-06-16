'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import {
  AuthFormDivider,
  AuthFormFooter,
  AuthFormHeader,
  AuthGoogleButton,
} from '@/components/auth/AuthFormLayout';
import { Input } from '@/components/ui/Input';

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: 'Maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
  ];
  const passedCount = checks.filter((c) => c.ok).length;

  const barColors = ['var(--color-error)', 'var(--color-warning)', 'var(--color-success)'];
  const strengthLabel = ['Fraca', 'Média', 'Forte'];
  const activeColor = barColors[passedCount - 1] ?? 'var(--color-border)';

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < passedCount ? activeColor : 'var(--color-border)',
            }}
          />
        ))}
        {passedCount > 0 && (
          <span
            className="ml-1 text-[10px] sm:text-xs font-semibold transition-colors duration-300"
            style={{ color: activeColor }}
          >
            {strengthLabel[passedCount - 1]}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1 text-[10px] sm:text-xs">
            <span
              className="flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full text-[8px] sm:text-[9px] font-bold transition-all duration-200"
              style={{
                backgroundColor: c.ok ? 'var(--color-success)' : 'var(--color-border)',
                color: c.ok ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
              }}
            >
              {c.ok ? '✓' : '·'}
            </span>
            <span
              className="transition-colors duration-200"
              style={{ color: c.ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { openModal, closeModal } = useAuthModal();
  const { user, profile, initialized } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (initialized && user) {
      closeModal();
      if (profile) router.replace('/dashboard');
      else router.replace(`/onboarding${name ? `?name=${encodeURIComponent(name)}` : ''}`);
    }
  }, [initialized, user, profile, router, name, closeModal]);

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
      router.replace(`/onboarding?name=${encodeURIComponent(name)}`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;

      switch (code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está cadastrado. Tente fazer login.');
          break;
        case 'auth/invalid-email':
          setError('E-mail inválido. Verifique o formato digitado.');
          break;
        case 'auth/weak-password':
          setError('Senha muito fraca. Tente uma senha mais complexa.');
          break;
        case 'auth/operation-not-allowed':
          setError('O cadastro com e-mail não está ativado. Contate o suporte.');
          break;
        case 'auth/network-request-failed':
          setError('Falha na rede. Verifique sua conexão.');
          break;
        default:
          setError('Erro ao criar conta. Tente novamente em instantes.');
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
        title="Comece agora"
        description="Crie sua conta gratuita e aprenda francês e inglês com o Método Ponte Português."
      />

      <AuthGoogleButton
        label="Cadastrar com Google"
        loading={loadingGoogle}
        disabled={loadingGoogle || loadingEmail}
        onClick={handleGoogleSignup}
      />

      <AuthFormDivider />

      <form onSubmit={handleEmailSignup} className="flex flex-col gap-3 sm:gap-4">
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
            className="flex items-start gap-2.5 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm animate-scale-in"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid',
              borderColor: 'rgba(220,38,38,0.2)',
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
              Criando conta…
            </span>
          ) : (
            'Criar conta grátis'
          )}
        </button>
      </form>

      <AuthFormFooter>
        Já tem uma conta?{' '}
        <button
          type="button"
          onClick={() => openModal('login')}
          className="font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          Entrar →
        </button>
      </AuthFormFooter>
    </div>
  );
}

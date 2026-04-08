'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { useAuthModal } from './AuthModalProvider';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
  ];
  const passedCount = checks.filter((c) => c.ok).length;

  const barColors = ['#ef4444', '#f59e0b', '#10b981'];
  const strengthLabel = ['Fraca', 'Média', 'Forte'];
  const activeColor = barColors[passedCount - 1] ?? '#e5e7eb';

  return (
    <div className="flex flex-col gap-2.5 animate-fade-in">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i < passedCount ? activeColor : 'var(--color-border)' }} />
        ))}
        {passedCount > 0 && (
          <span className="ml-1 text-xs font-semibold transition-colors duration-300" style={{ color: activeColor }}>
            {strengthLabel[passedCount - 1]}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1 text-xs">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-200" style={{ backgroundColor: c.ok ? '#10b981' : 'var(--color-border)', color: c.ok ? '#fff' : 'var(--color-text-muted)' }}>
              {c.ok ? '✓' : '·'}
            </span>
            <span className="transition-colors duration-200" style={{ color: c.ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { user, profile, initialized } = useAuthStore();
  const { closeModal, openModal } = useAuthModal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Auto-redirect if logged in (for modal it might be weird, but consistent)
  useEffect(() => {
    if (initialized && user) {
      closeModal();
      if (profile) router.replace('/dashboard');
      else router.replace(`/onboarding?name=${encodeURIComponent(name)}`);
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
      closeModal();
      router.replace(`/onboarding?name=${encodeURIComponent(name)}`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      console.error('Signup form error:', err);
      
      switch (code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está cadastrado.');
          break;
        case 'auth/invalid-email':
          setError('E-mail inválido.');
          break;
        case 'auth/weak-password':
          setError('Senha muito fraca.');
          break;
        case 'auth/operation-not-allowed':
          setError('Cadastro desativado.');
          break;
        default:
          setError('Erro ao criar conta.');
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
      closeModal();
      router.replace('/onboarding');
    } catch {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 animate-slide-up-spring delay-75">
        <h2 className="font-display text-3xl font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          Comece agora
        </h2>
        <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Crie sua conta gratuitamente.
        </p>
      </div>

      <div className="animate-slide-up-spring delay-150">
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loadingGoogle || loadingEmail}
          className="card-lift flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          {loadingGoogle ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <GoogleIcon />}
          Cadastrar com Google
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 animate-slide-up-spring delay-150">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
        <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
          ou com e-mail
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>

      <form onSubmit={handleEmailSignup} className="flex flex-col gap-4 animate-slide-up-spring delay-225">
        <Input label="Nome" type="text" autoComplete="name" placeholder="Seu nome" icon={User} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="E-mail" type="email" autoComplete="email" placeholder="seu@email.com" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="flex flex-col gap-2.5">
          <Input label="Senha" type="password" autoComplete="new-password" placeholder="••••••••" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <PasswordStrength password={password} />
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm animate-scale-in" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid', borderColor: 'rgba(220,38,38,0.2)' }}>
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loadingEmail || loadingGoogle}
          className="cta-shimmer relative mt-2 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)', boxShadow: '0 6px 20px rgba(29,94,212,0.3)' }}
        >
          {loadingEmail ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Criando conta…</span> : 'Criar conta grátis'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm animate-slide-up-spring delay-450" style={{ color: 'var(--color-text-secondary)' }}>
        Já tem uma conta?{' '}
        <button type="button" onClick={() => openModal('login')} className="font-bold transition-opacity hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
          Entrar →
        </button>
      </p>
    </div>
  );
}

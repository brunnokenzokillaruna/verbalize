'use client';

import { LogOut, BookOpen, Flame, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logOut } from '@/services/auth';
import { useRouter } from 'next/navigation';

const LANG_LABEL: Record<string, { name: string; flag: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷' },
  en: { name: 'Inglês', flag: '🇬🇧' },
};

export default function DashboardPage() {
  const { profile, reset } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/login');
  }

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];

  return (
    <div
      className="min-h-dvh px-5 py-8 max-w-lg mx-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1
            className="font-display text-3xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            Verbalize
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Olá, {profile.name} 👋
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
          aria-label="Sair"
        >
          <LogOut size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </header>

      {/* Streak card */}
      <div
        className="mb-4 flex items-center gap-4 rounded-2xl p-5 animate-slide-up delay-75"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: 'var(--color-vocab-bg)' }}
        >
          <Flame size={24} style={{ color: 'var(--color-vocab)' }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {profile.currentStreak}{' '}
            <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>
              {profile.currentStreak === 1 ? 'dia' : 'dias'}
            </span>
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Sequência atual
          </p>
        </div>
      </div>

      {/* Current language */}
      <div
        className="mb-4 flex items-center justify-between rounded-2xl p-5 animate-slide-up delay-150"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={lang.name}>
            {lang.flag}
          </span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {lang.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Idioma atual
            </p>
          </div>
        </div>
      </div>

      {/* Coming soon — Lesson CTA */}
      <div
        className="flex flex-col items-center justify-center rounded-3xl p-10 text-center animate-slide-up delay-225"
        style={{
          backgroundColor: 'var(--color-primary-light)',
          border: '2px dashed var(--color-primary)',
        }}
      >
        <BookOpen size={40} style={{ color: 'var(--color-primary)' }} className="mb-4" />
        <h2
          className="font-display text-xl font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          Lições em breve
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          O motor de lições está sendo construído. Em breve você começará sua jornada em {lang.name}!
        </p>
        <div
          className="mt-4 flex items-center gap-1 text-sm font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          Fase 3 a caminho <ChevronRight size={14} />
        </div>
      </div>

      <p
        className="mt-6 text-center text-xs animate-slide-up delay-300"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {profile.totalLessonsCompleted} lição{profile.totalLessonsCompleted !== 1 ? 'ões' : ''} concluída{profile.totalLessonsCompleted !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

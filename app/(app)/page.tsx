'use client';

import { LogOut, BookOpen, Flame, ChevronRight, Sun, Moon, Check, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { logOut } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { getLessonsForLanguage } from '@/lib/curriculum';

const LANG_LABEL: Record<string, { name: string; flag: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷' },
  en: { name: 'Inglês', flag: '🇬🇧' },
};

export default function DashboardPage() {
  const { profile, reset } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/login');
  }

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];
  const allLessons = getLessonsForLanguage(profile.currentTargetLanguage);

  // Determine which lesson is the user's current frontier
  const frontierLessonId = profile.lessonProgress?.[profile.currentTargetLanguage];
  const frontierIndex = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;

  return (
    <div
      className="min-h-dvh px-5 py-8 pb-24 max-w-lg mx-auto"
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
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
            aria-label="Alternar tema"
          >
            {theme === 'dark'
              ? <Sun size={18} style={{ color: 'var(--color-text-muted)' }} />
              : <Moon size={18} style={{ color: 'var(--color-text-muted)' }} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
            aria-label="Sair"
          >
            <LogOut size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
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

      {/* Next lesson CTA */}
      <button
        type="button"
        onClick={() => router.push('/lesson')}
        className="w-full rounded-3xl p-6 text-left transition-all active:scale-[0.98] animate-slide-up delay-225"
        style={{
          backgroundColor: 'var(--color-primary)',
          boxShadow: '0 8px 32px rgba(29, 94, 212, 0.3)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <BookOpen size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <p className="font-display text-xl font-bold" style={{ color: 'white' }}>
                {!frontierLessonId ? 'Iniciar Lição 1' : `Continuar · Lição ${frontierIndex + 1}`}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {lang.flag} {lang.name} · {allLessons[frontierIndex]?.grammarFocus.split(' — ')[0]}
              </p>
            </div>
          </div>
          <ChevronRight size={22} style={{ color: 'rgba(255,255,255,0.75)' }} />
        </div>
      </button>

      <p
        className="mt-4 text-center text-xs animate-slide-up delay-300"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {profile.totalLessonsCompleted} lição{profile.totalLessonsCompleted !== 1 ? 'ões' : ''} concluída{profile.totalLessonsCompleted !== 1 ? 's' : ''}
      </p>

      {/* Lesson list */}
      <div className="mt-8 animate-slide-up">
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Todas as lições
        </p>
        <div className="flex flex-col gap-2">
          {allLessons.map((lesson, i) => {
            const isCompleted = i < frontierIndex;
            const isCurrent = i === frontierIndex;
            const isLocked = i > frontierIndex;
            const title = lesson.grammarFocus.split(' — ')[0];

            return (
              <button
                key={lesson.id}
                type="button"
                disabled={isLocked}
                onClick={() => router.push(`/lesson?id=${lesson.id}`)}
                className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isCurrent
                    ? 'var(--color-primary-light)'
                    : 'var(--color-surface)',
                  border: `1px solid ${isCurrent ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  opacity: isLocked ? 0.45 : 1,
                }}
              >
                {/* Status badge */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: isCompleted
                      ? 'var(--color-success-bg, #dcfce7)'
                      : isCurrent
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-raised)',
                    color: isCompleted
                      ? 'var(--color-success, #16a34a)'
                      : isCurrent
                        ? 'white'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {isCompleted ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                </div>

                {/* Lesson info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: isLocked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    }}
                  >
                    {title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {lesson.level}
                    {isCurrent && (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        {' '}· Próxima
                      </span>
                    )}
                  </p>
                </div>

                {/* Right icon */}
                {isLocked
                  ? <Lock size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

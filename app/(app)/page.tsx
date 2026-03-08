'use client';

import { useState } from 'react';
import { LogOut, BookOpen, Flame, ChevronRight, ChevronLeft, Sun, Moon, Check, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { logOut } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { getLessonsForLanguage } from '@/lib/curriculum';
import type { ProficiencyLevel } from '@/types';

const LANG_LABEL: Record<string, { name: string; flag: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷' },
  en: { name: 'Inglês', flag: '🇬🇧' },
};

const ALL_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LESSONS_PER_PAGE = 5;

export default function DashboardPage() {
  const { profile, reset } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // ── Derive initial selected level from user's frontier ─────────────────────
  // getLessonsForLanguage is a static lookup — safe to call before hooks.
  const allLessonsComputed = profile ? getLessonsForLanguage(profile.currentTargetLanguage) : [];
  const frontierLessonId = profile?.lessonProgress?.[profile.currentTargetLanguage ?? 'fr'];
  const frontierIndexComputed = frontierLessonId
    ? allLessonsComputed.findIndex((l) => l.id === frontierLessonId)
    : 0;
  const initialLevel: ProficiencyLevel =
    (allLessonsComputed[frontierIndexComputed]?.level as ProficiencyLevel) ?? 'A1';

  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(initialLevel);
  const [page, setPage] = useState(0);

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/login');
  }

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];
  const allLessons = getLessonsForLanguage(profile.currentTargetLanguage);

  // Current frontier (next lesson to study)
  const frontierIndex = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;

  // Set of levels that have at least one lesson in the curriculum
  const levelsWithLessons = new Set(allLessons.map((l) => l.level));

  function handleSelectLevel(level: ProficiencyLevel) {
    setSelectedLevel(level);
    setPage(0);
  }

  // Lessons for the selected level + pagination
  const levelLessons = allLessons.filter((l) => l.level === selectedLevel);
  const totalPages = Math.max(1, Math.ceil(levelLessons.length / LESSONS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleLessons = levelLessons.slice(
    safePage * LESSONS_PER_PAGE,
    (safePage + 1) * LESSONS_PER_PAGE,
  );

  return (
    <div
      className="min-h-dvh px-5 py-8 pb-24 max-w-lg mx-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Header ── */}
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

      {/* ── Streak card ── */}
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

      {/* ── Current language ── */}
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

      {/* ── Next lesson CTA ── */}
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

      {/* ── Lesson browser ── */}
      <div className="mt-8 animate-slide-up">
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Explorar lições
        </p>

        {/* Level selector chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
          {ALL_LEVELS.map((level) => {
            const hasLessons = levelsWithLessons.has(level);
            const isSelected = selectedLevel === level;

            return (
              <button
                key={level}
                type="button"
                disabled={!hasLessons}
                onClick={() => handleSelectLevel(level)}
                className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--color-primary)'
                    : hasLessons
                      ? 'var(--color-surface)'
                      : 'var(--color-surface-raised)',
                  color: isSelected
                    ? 'var(--color-text-inverse)'
                    : hasLessons
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)',
                  border: `1px solid ${
                    isSelected
                      ? 'var(--color-primary)'
                      : 'var(--color-border)'
                  }`,
                  opacity: !hasLessons ? 0.55 : 1,
                }}
              >
                {level}
                {!hasLessons && <Lock size={11} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Empty state for locked levels */}
        {levelLessons.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl py-12"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Lock size={28} style={{ color: 'var(--color-text-muted)' }} />
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Nível {selectedLevel} — Em breve
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Este nível ainda está sendo preparado.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Lesson list */}
            <div className="flex flex-col gap-2">
              {visibleLessons.map((lesson) => {
                const i = allLessons.findIndex((l) => l.id === lesson.id);
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: safePage === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    opacity: safePage === 0 ? 0.45 : 1,
                  }}
                >
                  <ChevronLeft size={15} />
                  Anterior
                </button>

                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {safePage + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: safePage >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    opacity: safePage >= totalPages - 1 ? 0.45 : 1,
                  }}
                >
                  Próxima
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

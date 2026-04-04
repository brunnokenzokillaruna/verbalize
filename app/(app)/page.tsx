'use client';

import { useState } from 'react';
import {
  LogOut, BookOpen, Flame, ChevronRight, ChevronLeft,
  Sun, Moon, Check, Lock, ArrowLeftRight, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { logOut } from '@/services/auth';
import { updateUser } from '@/services/firestore';
import { useRouter } from 'next/navigation';
import { getLessonsForLanguage } from '@/lib/curriculum';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

const LANG_LABEL: Record<string, { name: string; flag: string; countryCode: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷', countryCode: 'fr' },
  en: { name: 'Inglês', flag: '🇬🇧', countryCode: 'gb' },
};

const ALL_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LESSONS_PER_PAGE = 5;

export default function DashboardPage() {
  const { profile, user, setProfile, reset } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const allLessonsComputed = profile ? getLessonsForLanguage(profile.currentTargetLanguage) : [];
  const frontierLessonId = profile?.lessonProgress?.[profile.currentTargetLanguage ?? 'fr'];
  const frontierIndexComputed = frontierLessonId
    ? allLessonsComputed.findIndex((l) => l.id === frontierLessonId)
    : 0;
  const initialLevel: ProficiencyLevel =
    (allLessonsComputed[frontierIndexComputed]?.level as ProficiencyLevel) ?? 'A1';

  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(initialLevel);
  const [page, setPage] = useState(0);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [switchingLang, setSwitchingLang] = useState(false);

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/login');
  }

  async function handleSwitchLanguage(lang: SupportedLanguage) {
    if (!user || !profile || lang === profile.currentTargetLanguage || switchingLang) return;
    setSwitchingLang(true);
    await updateUser(user.uid, { currentTargetLanguage: lang });
    const newProfile = { ...profile, currentTargetLanguage: lang };
    setProfile(newProfile);
    const newLessons = getLessonsForLanguage(lang);
    const newFrontier = newProfile.lessonProgress?.[lang];
    const newFrontierIndex = newFrontier ? newLessons.findIndex((l) => l.id === newFrontier) : 0;
    setSelectedLevel((newLessons[newFrontierIndex]?.level as ProficiencyLevel) ?? 'A1');
    setPage(0);
    setSwitchingLang(false);
    setShowLangSheet(false);
  }

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];
  const allLessons = getLessonsForLanguage(profile.currentTargetLanguage);
  const frontierIndex = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;
  const levelsWithLessons = new Set(allLessons.map((l) => l.level));

  function handleSelectLevel(level: ProficiencyLevel) {
    setSelectedLevel(level);
    setPage(0);
  }

  const levelLessons = allLessons.filter((l) => l.level === selectedLevel);
  const totalPages = Math.max(1, Math.ceil(levelLessons.length / LESSONS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleLessons = levelLessons.slice(
    safePage * LESSONS_PER_PAGE,
    (safePage + 1) * LESSONS_PER_PAGE,
  );

  const completionPct = allLessons.length > 0
    ? Math.round((frontierIndex / allLessons.length) * 100)
    : 0;

  const firstName = profile.name?.split(' ')[0] ?? profile.name;
  const initials = profile.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Decorative gradient orbs (fixed, non-interactive) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -left-24 h-60 w-60 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative px-5 py-8 pb-24 md:pb-12 max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-8 animate-slide-up-spring">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm md:hidden"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                color: '#fff',
              }}
            >
              {initials}
            </div>
            <div>
              <h1
                className="font-display text-2xl font-bold leading-none md:hidden"
                style={{ color: 'var(--color-primary)' }}
              >
                Verbalize
              </h1>
              <p
                className="mt-0.5 text-sm md:text-xl md:font-semibold md:mt-0"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Olá, <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{firstName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-150 hover:opacity-80 active:scale-90"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
              aria-label="Alternar tema"
            >
              {theme === 'dark'
                ? <Sun size={17} style={{ color: 'var(--color-text-muted)' }} />
                : <Moon size={17} style={{ color: 'var(--color-text-muted)' }} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-150 hover:opacity-80 active:scale-90"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
              aria-label="Sair"
            >
              <LogOut size={17} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </header>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 mb-4 md:gap-4">

          {/* Streak card */}
          <div
            className="card-lift relative overflow-hidden rounded-2xl p-5 animate-slide-up-spring delay-75 flex flex-col"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #3d2e00 0%, #4a3800 100%)'
                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid',
              borderColor: theme === 'dark' ? 'rgba(251,191,36,0.2)' : 'rgba(217,119,6,0.2)',
            }}
          >
            {/* Decorative orbs */}
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
            />
            <div
              className="pointer-events-none absolute -left-4 bottom-0 h-16 w-16 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
            />

            {/* Top row: label + flame */}
            <div className="relative flex items-center justify-between mb-3">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.55)' : '#b45309' }}
              >
                Sequência
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl animate-glow-amber shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 12px rgba(217,119,6,0.4)',
                }}
              >
                <Flame size={16} color="#fff" />
              </div>
            </div>

            {/* Big number */}
            <p
              className="relative text-4xl font-bold leading-none tabular-nums"
              style={{ color: theme === 'dark' ? '#fbbf24' : '#92400e' }}
            >
              {profile.currentStreak}
            </p>
            <p
              className="relative text-xs mt-0.5 font-medium"
              style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.65)' : '#b45309' }}
            >
              {profile.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
            </p>

            {/* Weekly progress dots */}
            <div className="relative flex gap-1 mt-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const filled = profile.currentStreak === 0 ? 0
                  : profile.currentStreak % 7 === 0 ? 7
                  : profile.currentStreak % 7;
                const isActive = i < filled;
                return (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isActive
                        ? (theme === 'dark' ? '#fbbf24' : '#d97706')
                        : (theme === 'dark' ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.2)'),
                      boxShadow: isActive ? '0 0 4px rgba(217,119,6,0.5)' : 'none',
                    }}
                  />
                );
              })}
            </div>
            <p
              className="relative text-xs mt-1"
              style={{ color: theme === 'dark' ? 'rgba(251,191,36,0.35)' : 'rgba(180,83,9,0.55)' }}
            >
              Meta semanal
            </p>
          </div>

          {/* Language card */}
          <div
            className="card-lift flex flex-col justify-between rounded-2xl p-5 animate-slide-up-spring delay-150"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${lang.countryCode}.png`}
                alt={lang.name}
                className="h-7 w-auto object-contain rounded-sm"
              />
              <button
                type="button"
                onClick={() => setShowLangSheet(true)}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <ArrowLeftRight size={11} />
                Trocar
              </button>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-sm leading-none" style={{ color: 'var(--color-text-primary)' }}>
                {lang.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Idioma atual
              </p>
            </div>
          </div>
        </div>

        {/* ── Progress bar (overall) ── */}
        {allLessons.length > 0 && (
          <div className="mb-4 animate-slide-up-spring delay-225">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Progresso geral
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                {completionPct}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), #60a5fa)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Next lesson CTA ── */}
        <button
          type="button"
          onClick={() => router.push('/lesson')}
          className="cta-shimmer relative w-full rounded-3xl p-6 text-left overflow-hidden transition-transform duration-150 active:scale-[0.98] animate-slide-up-spring delay-300"
          style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #1d5ed4 100%)',
            boxShadow: '0 12px 40px rgba(29, 94, 212, 0.35)',
          }}
        >
          {/* Decorative diagonal lines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '16px 16px',
            }}
          />
          {/* Radial glow top-right */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)' }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
              >
                <BookOpen size={22} color="white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles size={12} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {!frontierLessonId ? 'Começar' : 'Continuar'}
                  </p>
                </div>
                <p className="font-display text-xl font-bold" style={{ color: 'white' }}>
                  {!frontierLessonId ? 'Lição 1' : `Lição ${frontierIndex + 1}`}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {lang.flag} {lang.name} · {allLessons[frontierIndex]?.grammarFocus.split(' — ')[0]}
                </p>
              </div>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:translate-x-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ChevronRight size={20} color="white" />
            </div>
          </div>
        </button>

        {/* Lessons completed counter */}
        <p
          className="mt-3 text-center text-xs animate-slide-up-spring delay-375"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {profile.totalLessonsCompleted} {profile.totalLessonsCompleted === 1 ? 'lição concluída' : 'lições concluídas'}
        </p>

        {/* ── Lesson browser ── */}
        <div className="mt-10 animate-slide-up-spring delay-450">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Explorar lições
            </p>
          </div>

          {/* Level selector chips */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-5 lg:flex-wrap lg:overflow-visible lg:pb-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {ALL_LEVELS.map((level) => {
              const hasLessons = levelsWithLessons.has(level);
              const isSelected = selectedLevel === level;

              return (
                <button
                  key={level}
                  type="button"
                  disabled={!hasLessons}
                  onClick={() => handleSelectLevel(level)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--color-primary)'
                      : hasLessons
                        ? 'var(--color-surface)'
                        : 'var(--color-surface-raised)',
                    color: isSelected
                      ? '#fff'
                      : hasLessons
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    opacity: !hasLessons ? 0.5 : 1,
                    boxShadow: isSelected ? '0 4px 12px rgba(29,94,212,0.25)' : 'none',
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
              className="flex flex-col items-center gap-4 rounded-3xl py-14 animate-fade-in"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px dashed var(--color-border)',
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <Lock size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {visibleLessons.map((lesson, idx) => {
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
                      className="card-lift group flex items-center gap-4 rounded-2xl p-4 text-left disabled:cursor-not-allowed animate-slide-up"
                      style={{
                        animationDelay: `${idx * 60}ms`,
                        animationFillMode: 'both',
                        backgroundColor: isCurrent
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface)',
                        border: `1.5px solid ${
                          isCurrent ? 'var(--color-primary)' : 'var(--color-border)'
                        }`,
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      {/* Status badge */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold${isCurrent ? ' lesson-current-dot' : ''}`}
                        style={{
                          background: isCompleted
                            ? 'linear-gradient(135deg, #059669, #10b981)'
                            : isCurrent
                              ? 'var(--color-primary)'
                              : 'var(--color-surface-raised)',
                          color: isCompleted || isCurrent ? '#fff' : 'var(--color-text-muted)',
                          boxShadow: isCompleted
                            ? '0 2px 8px rgba(5,150,105,0.3)'
                            : isCurrent
                              ? '0 2px 8px rgba(29,94,212,0.3)'
                              : 'none',
                        }}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                      </div>

                      {/* Lesson info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            color: isLocked
                              ? 'var(--color-text-muted)'
                              : isCurrent
                                ? 'var(--color-primary)'
                                : 'var(--color-text-primary)',
                          }}
                        >
                          {title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {lesson.level}
                          {isCurrent && (
                            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                              {' '}· Próxima
                            </span>
                          )}
                          {isCompleted && (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              {' '}· Concluída
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Right icon */}
                      {isLocked
                        ? <Lock size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        : (
                          <ChevronRight
                            size={16}
                            style={{
                              color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              flexShrink: 0,
                              transition: 'transform 200ms ease',
                            }}
                            className="group-hover:translate-x-0.5"
                          />
                        )}
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5">
                  <button
                    type="button"
                    disabled={safePage === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      color: safePage === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      border: '1.5px solid var(--color-border)',
                      opacity: safePage === 0 ? 0.45 : 1,
                    }}
                  >
                    <ChevronLeft size={15} />
                    Anterior
                  </button>

                  <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                    {safePage + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      color: safePage >= totalPages - 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      border: '1.5px solid var(--color-border)',
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

      {/* ── Language switcher bottom sheet ── */}
      {showLangSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLangSheet(false); }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl px-6 pb-10 pt-5 flex flex-col gap-5 md:rounded-3xl md:max-w-sm md:pb-6 animate-slide-up"
            style={{
              backgroundColor: 'var(--color-surface)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Handle */}
            <div
              className="mx-auto h-1 w-10 rounded-full md:hidden"
              style={{ backgroundColor: 'var(--color-border-strong)' }}
            />

            <div>
              <h2
                className="font-display text-xl font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Trocar idioma
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Escolha o idioma que deseja praticar.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {(
                [
                  { lang: 'fr', countryCode: 'fr', name: 'Francês', sub: 'Français' },
                  { lang: 'en', countryCode: 'gb', name: 'Inglês', sub: 'English' },
                ] as const
              ).map(({ lang: l, countryCode, name, sub }) => {
                const isCurrent = profile.currentTargetLanguage === l;
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={switchingLang}
                    onClick={() => handleSwitchLanguage(l)}
                    className="flex items-center gap-4 rounded-2xl p-4 text-left transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{
                      backgroundColor: isCurrent ? 'var(--color-primary-light)' : 'var(--color-surface-raised)',
                      border: `2px solid ${isCurrent ? 'var(--color-primary)' : 'transparent'}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/w40/${countryCode}.png`}
                      alt={name}
                      className="h-8 w-auto object-contain rounded-sm shrink-0"
                    />
                    <div className="flex-1">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                      >
                        {name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
                    </div>
                    {isCurrent && (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), #60a5fa)' }}
                      >
                        <Check size={13} color="white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowLangSheet(false)}
              className="text-center text-sm font-semibold py-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

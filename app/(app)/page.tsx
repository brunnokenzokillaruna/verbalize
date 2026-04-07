'use client';

import { useState } from 'react';
import {
  LogOut, BookOpen, ChevronRight,
  Sun, Moon, Sparkles,
} from 'lucide-react';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { LessonBrowser } from '@/components/dashboard/LessonBrowser';
import { LanguageSwitcherSheet } from '@/components/dashboard/LanguageSwitcherSheet';
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
        <StatsRow profile={profile} lang={lang} theme={theme} onShowLangSheet={() => setShowLangSheet(true)} />

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
        <LessonBrowser
          key={profile.currentTargetLanguage}
          allLessons={allLessons as any}
          frontierIndex={frontierIndex}
          initialLevel={initialLevel}
        />
      </div>

      {/* ── Language switcher bottom sheet ── */}
      {showLangSheet && (
        <LanguageSwitcherSheet
          currentTargetLanguage={profile.currentTargetLanguage!}
          switchingLang={switchingLang}
          onSwitchLanguage={handleSwitchLanguage}
          onClose={() => setShowLangSheet(false)}
        />
      )}
    </div>
  );
}

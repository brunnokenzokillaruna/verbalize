'use client';

import { useState, useEffect } from 'react';
import {
  LogOut,
  Sun, Moon, Flame, Zap,
  ArrowLeftRight, Lock, FastForward,
} from 'lucide-react';
import { LanguageSwitcherSheet } from '@/components/dashboard/LanguageSwitcherSheet';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { logOut } from '@/services/auth';
import { updateUser, getUser, logLesson, updateLessonStats } from '@/services/firestore';
import { SkipLessonModal } from '@/components/ui/SkipLessonModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LessonDefinition } from '@/types';
import { getLessonsForLanguage } from '@/lib/curriculum';
import { getEffectiveStreak } from '@/lib/stats';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

const LANG_LABEL: Record<string, { name: string; flag: string; countryCode: string }> = {
  fr: { name: 'Francês', flag: '🇫🇷', countryCode: 'fr' },
  en: { name: 'Inglês', flag: '🇬🇧', countryCode: 'gb' },
};

const ALL_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const THEME_COLORS = [
  ['#3b82f6', '#1d4ed8'], // Blue
  ['#10b981', '#047857'], // Emerald
  ['#8b5cf6', '#6d28d9'], // Violet
  ['#f59e0b', '#b45309'], // Amber
  ['#ec4899', '#be185d'], // Pink
  ['#14b8a6', '#0f766e'], // Teal
  ['#f43f5e', '#be123c'], // Rose
];

/* ── Sinusoidal path offset for each node index ───────────── */
function getPathOffset(index: number, isMobile = false): number {
  // Pattern over 8 nodes: center -> left -> far left -> left -> center -> right -> far right -> right
  const amplitude = isMobile ? 55 : 85;
  const period = 8;
  return -Math.sin((index / period) * Math.PI * 2) * amplitude;
}

/* ── Custom illustrated SVG icons for each lesson tag ─────────── */
function IconPRON({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Mic capsule body */}
      <rect x="11" y="2" width="10" height="17" rx="5" fill="currentColor"/>
      {/* Shine on capsule */}
      <rect x="12" y="4" width="4" height="7" rx="2" fill="rgba(255,255,255,0.25)"/>
      {/* Pickup grill lines */}
      <line x1="13" y1="10" x2="19" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="19" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Support arm arc */}
      <path d="M7 16 Q7 25 16 25 Q25 25 25 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Stand */}
      <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Base */}
      <line x1="11" y1="30" x2="21" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconGRAM({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Left page */}
      <path d="M16 8 C13 6 7 6 4 8 L4 26 C7 24 13 24 16 26 Z" fill="currentColor" fillOpacity="0.65"/>
      {/* Right page (slightly brighter) */}
      <path d="M16 8 C19 6 25 6 28 8 L28 26 C25 24 19 24 16 26 Z" fill="currentColor"/>
      {/* Spine */}
      <line x1="16" y1="8" x2="16" y2="26" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      {/* Text lines – right page */}
      <line x1="19" y1="13" x2="25" y2="13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="17" x2="25" y2="17" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="21" x2="23" y2="21" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Text lines – left page */}
      <line x1="7"  y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="17" x2="13" y2="17" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="21" x2="11" y2="21" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconVOC({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Bulb globe */}
      <path d="M16 3 C10.48 3 6 7.48 6 13 C6 16.7 7.96 19.93 10.9 21.6 L10.9 24.5 L21.1 24.5 L21.1 21.6 C24.04 19.93 26 16.7 26 13 C26 7.48 21.52 3 16 3 Z" fill="currentColor"/>
      {/* Shine */}
      <ellipse cx="12.5" cy="9" rx="2.5" ry="3.5" fill="rgba(255,255,255,0.22)" transform="rotate(-20 12.5 9)"/>
      {/* Screw base segments */}
      <rect x="11" y="24.5" width="10" height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.75"/>
      <rect x="11.5" y="27.5" width="9"  height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.5"/>
      {/* Checkmark inside bulb */}
      <path d="M12 13.5 L15 16.5 L20.5 10" stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IconDIAL({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Main bubble */}
      <rect x="2" y="2" width="20" height="14" rx="5" fill="currentColor"/>
      {/* Left tail */}
      <path d="M5 16 L3 23 L11 17 Z" fill="currentColor"/>
      {/* Three dots inside main bubble */}
      <circle cx="8"  cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="14" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="20" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      {/* Reply bubble */}
      <rect x="10" y="18" width="20" height="12" rx="4" fill="currentColor" fillOpacity="0.6"/>
      {/* Right tail */}
      <path d="M27 30 L30 32 L22 30 Z" fill="currentColor" fillOpacity="0.6"/>
      {/* Dash in reply bubble */}
      <line x1="15" y1="24" x2="25" y2="24" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconMISS({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Crown body */}
      <path d="M3 26 L5.5 12 L12 19 L16 8 L20 19 L26.5 12 L29 26 Z" fill="currentColor"/>
      {/* Crown base band */}
      <rect x="3" y="26" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.8"/>
      {/* Tip jewels */}
      <circle cx="5.5"  cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="16"   cy="8"  r="2.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="26.5" cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      {/* Center gem in band */}
      <circle cx="16" cy="28" r="1.5" fill="rgba(255,255,255,0.6)"/>
      {/* Side gems in band */}
      <circle cx="8"  cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
      <circle cx="24" cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function IconVERB({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Action/Gears style */}
      <circle cx="16" cy="16" r="5" fill="currentColor" />
      <path d="M16 8V5M16 27v-3M8 16H5m22 0h-3M10.3 10.3L8.2 8.2m15.5 15.5l-2.1-2.1m0-11.3l2.1-2.1M8.2 23.8l2.1-2.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6z" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
    </svg>
  );
}

function IconEXPR({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Sparkles Speech Bubble */}
      <path d="M16 4C9.4 4 4 8.5 4 14c0 2.2 0.8 4.2 2.3 5.8L4 26l6.5-2.5c1.7 0.9 3.6 1.5 5.5 1.5 6.6 0 12-4.5 12-10s-5.4-10-12-10z" fill="currentColor" fillOpacity="0.4" />
      <path d="M16 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="white" />
      <path d="M22 15l0.5 1 1 0.5-1 0.5-0.5 1-0.5-1-1-0.5 1-0.5 0.5-1z" fill="white" fillOpacity="0.8" />
      <path d="M12 17l0.5 1 1 0.5-1 0.5-0.5 1-0.5-1-1-0.5 1-0.5 0.5-1z" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function IconCULT({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Beret / French style */}
      <path d="M26 20c0 4-10 6-10 6s-10-2-10-6c0-4 4-8 10-8s10 4 10 8z" fill="currentColor" />
      <path d="M16 12V8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 8h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

function getTagIcon(tag: string, size = 30) {
  switch (tag) {
    case 'PRON': return <IconPRON size={size} />;
    case 'GRAM': return <IconGRAM size={size} />;
    case 'VOC':  return <IconVOC  size={size} />;
    case 'DIAL': return <IconDIAL size={size} />;
    case 'MISS': return <IconMISS size={size} />;
    case 'VERB': return <IconVERB size={size} />;
    case 'EXPR': return <IconEXPR size={size} />;
    case 'CULT': return <IconCULT size={size} />;
    default:     return <IconGRAM size={size} />;
  }
}

export default function DashboardPage() {
  const { profile, user, setProfile, reset } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const allLessons = profile ? getLessonsForLanguage(profile.currentTargetLanguage) : [];
  const frontierLessonId = profile?.lessonProgress?.[profile.currentTargetLanguage ?? 'fr'];
  let frontierIndex = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;
  if (frontierIndex === -1) frontierIndex = 0;

  const [showLangSheet, setShowLangSheet] = useState(false);
  const [switchingLang, setSwitchingLang] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(
    (allLessons[frontierIndex]?.level as ProficiencyLevel) ?? 'A1'
  );
  const [visibleThemeIdx, setVisibleThemeIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    lesson: LessonDefinition | null;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    tagLabel: string;
  }>({
    isOpen: false,
    lesson: null,
    isCompleted: false,
    isCurrent: false,
    isLocked: false,
    tagLabel: '',
  });

  // Responsiveness: check if mobile for the zigzag path
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Re-fetch profile from Firestore on mount so lessonProgress is always up to date
  // (finishLesson/skipLesson write to Firestore asynchronously; Zustand may be stale)
  useEffect(() => {
    if (!user) return;
    getUser(user.uid).then((fresh) => {
      if (fresh) setProfile(fresh);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Reset scroll observer state when changing level
  useEffect(() => {
    setVisibleThemeIdx(null);
  }, [selectedLevel]);

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/');
  }

  async function handleSwitchLanguage(lang: SupportedLanguage) {
    if (!user || !profile || lang === profile.currentTargetLanguage || switchingLang) return;
    setSwitchingLang(true);
    await updateUser(user.uid, { currentTargetLanguage: lang });
    const newProfile = { ...profile, currentTargetLanguage: lang };
    setProfile(newProfile);
    setSwitchingLang(false);
    setShowLangSheet(false);
  }

  async function handleConfirmSkip() {
    if (!user || !profile || !activeLessonObj) return;

    setIsSkipping(true); 
    try {
      const lessonId = activeLessonObj.id;
      const language = profile.currentTargetLanguage;

      await logLesson({ uid: user.uid, lessonId, language, score: 100 });
      const updates = await updateLessonStats(user.uid, profile, lessonId, language);
      setProfile({ ...profile, ...updates });
      setShowSkipModal(false);
    } catch (err) {
      console.error('[Dashboard] Error skipping lesson:', err);
      alert('Erro ao pular lição. Tente novamente.');
    } finally {
      setIsSkipping(false);
    }
  }

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];
  const currentStreak = getEffectiveStreak(profile);
  const completionPct = allLessons.length > 0
    ? Math.round((frontierIndex / allLessons.length) * 100)
    : 0;
  const firstName = profile.name?.split(' ')[0] ?? profile.name;
  const levelsWithLessons = new Set(allLessons.map((l) => l.level));
  const levelLessons = allLessons.filter((l) => l.level === selectedLevel);

  // Group lessons by theme
  const themes: { title: string; lessons: typeof levelLessons }[] = [];
  for (const lesson of levelLessons) {
    const lastTheme = themes[themes.length - 1];
    if (lastTheme && lastTheme.title === lesson.theme) {
      lastTheme.lessons.push(lesson);
    } else {
      themes.push({ title: lesson.theme || `Nível ${selectedLevel}`, lessons: [lesson] });
    }
  }

  // Which theme contains the frontier?
  const initialThemeIdx = Math.max(0, themes.findIndex(t => 
    t.lessons.some(l => allLessons.findIndex(x => x.id === l.id) >= frontierIndex)
  ));
  
  const currentThemeIdx = visibleThemeIdx !== null ? visibleThemeIdx : initialThemeIdx;
  const currentBannerColors = THEME_COLORS[currentThemeIdx % THEME_COLORS.length];
  const activeThemeTitle = themes[currentThemeIdx]?.title ?? `Nível ${selectedLevel}`;
  const activeLessonObj = allLessons[frontierIndex] || allLessons[0];
  const activeLessonTitle = activeLessonObj?.uiTitle || activeLessonObj?.grammarFocus?.split(' — ')[0] || 'Carregando...';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleThemeIdx(Number(entry.target.getAttribute('data-theme-idx') || 0));
          }
        });
      },
      { rootMargin: '-140px 0px -50% 0px', threshold: 0.1 }
    );
    
    document.querySelectorAll('.theme-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [themes.length]);

  return (
    <div className="min-h-dvh overflow-x-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="relative w-full max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl px-0 sm:px-4">

        {/* ═══════════════════ TOP BAR ═══════════════════ */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderBottom: '2px solid var(--color-border)',
          }}
        >
          {/* Language pill */}
          <button
            onClick={() => setShowLangSheet(true)}
            className="duo-btn-flat flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold active:scale-95 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w40/${lang.countryCode}.png`}
              alt={lang.name}
              className="h-4 w-auto rounded-[2px] sm:h-5 sm:rounded-[3px]"
            />
            <span className="hidden xs:inline">{lang.name}</span>
            <span className="xs:hidden">{lang.countryCode.toUpperCase()}</span>
            <ArrowLeftRight size={10} style={{ color: 'var(--color-text-muted)' }} className="sm:w-3 sm:h-3" />
          </button>

          {/* Stats bar */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Flame size={18} className="sm:w-5 sm:h-5" style={{ color: currentStreak > 0 ? '#f59e0b' : 'var(--color-text-muted)' }} />
              <span
                className="text-xs font-extrabold tabular-nums sm:text-sm"
                style={{ color: currentStreak > 0 ? '#f59e0b' : 'var(--color-text-muted)' }}
              >
                {currentStreak}
              </span>
            </div>

            {/* Lessons completed */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Zap size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-extrabold tabular-nums sm:text-sm" style={{ color: 'var(--color-primary)' }}>
                {profile.totalLessonsCompleted}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="duo-icon-btn flex h-8 w-8 items-center justify-center rounded-xl active:scale-90 sm:h-9 sm:w-9"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
              }}
              aria-label="Alternar tema"
            >
              {theme === 'dark'
                ? <Sun size={14} className="sm:w-4 sm:h-4" style={{ color: '#fbbf24' }} />
                : <Moon size={14} className="sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="duo-icon-btn flex h-8 w-8 items-center justify-center rounded-xl active:scale-90 sm:h-9 sm:w-9"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
              }}
              aria-label="Sair"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </header>

        {/* ═══════════════════ STICKY SECTION BANNER & LEVELS ═══════════════════ */}
        <div className="sticky top-[61px] z-10 px-4 pt-2 pb-4" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div
            className="rounded-2xl p-4 shadow-xl transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${currentBannerColors[0]} 0%, ${currentBannerColors[1]} 100%)`,
              borderBottom: '4px solid rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors duration-500 line-clamp-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {lang.flag} SEÇÃO {selectedLevel} · {activeThemeTitle}
                </p>
                <h1
                  className="font-display text-lg sm:text-[1.4rem] leading-tight font-black mt-1 text-white line-clamp-2"
                >
                  {activeLessonTitle}
                </h1>
              </div>

              {/* Skip Button */}
              <button
                onClick={() => setShowSkipModal(true)}
                disabled={switchingLang}
                className="duo-btn-flat shrink-0 flex flex-col items-center gap-0.5 sm:gap-1 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tighter transition-all active:scale-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                }}
                title="Pular esta lição"
              >
                <FastForward size={20} strokeWidth={2.5} />
                <span>Pular</span>
              </button>
            </div>

            {/* LEVEL SELECTOR IN BANNER */}
            <div 
              className="mt-4 pt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0" 
              style={{ borderTop: '1px solid rgba(255,255,255,0.2)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {ALL_LEVELS.map((level) => {
                const hasLessons = levelsWithLessons.has(level);
                const isSelected = selectedLevel === level;

                return (
                  <button
                    key={level}
                    type="button"
                    disabled={!hasLessons}
                    onClick={() => setSelectedLevel(level)}
                    className="shrink-0 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold active:scale-95 disabled:cursor-not-allowed transition-all"
                    style={{
                      backgroundColor: isSelected ? '#fff' : 'rgba(255,255,255,0.1)',
                      color: isSelected ? 'var(--color-primary)' : '#fff',
                      borderTop: '2px solid transparent',
                      borderLeft: '2px solid transparent',
                      borderRight: '2px solid transparent',
                      borderBottom: isSelected ? '4px solid #e2e8f0' : '2px solid rgba(255,255,255,0.1)',
                      opacity: !hasLessons ? 0.35 : 1,
                    }}
                  >
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      {level}
                      {!hasLessons && <Lock size={10} className="sm:w-3 sm:h-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════ LESSON PATH (Duolingo Zigzag) ═══════════════════ */}
        {themes.length === 0 ? (
          <div
            className="mx-4 mt-6 flex flex-col items-center gap-4 rounded-3xl py-16 animate-fade-in"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px dashed var(--color-border)',
            }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <Lock size={28} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {allLessons.length === 0 ? `Idioma ${lang.name} não possui lições` : `Nível ${selectedLevel}`}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {allLessons.length === 0 
                  ? 'Mude para o Francês na bandeirinha acima!' 
                  : 'Em breve — continue praticando!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pb-28 md:pb-12">
            {themes.map((themeGroup, themeIdx) => {
              const bgColors = THEME_COLORS[themeIdx % THEME_COLORS.length];
              return (
              <div key={themeIdx} className="w-full flex flex-col items-center theme-section" data-theme-idx={themeIdx}>
                {/* ── Theme Divider ── */}
                <div className="flex items-center gap-3 w-full px-4 sm:gap-4 sm:px-6 mt-14 mb-8">
                  <div className="flex-1 h-[3px]" style={{ backgroundColor: bgColors[0], borderRadius: 3, opacity: 0.3 }} />
                  <h2 className="text-xl sm:text-2xl font-display font-black text-center tracking-tight" style={{ color: bgColors[0] }}>
                    {themeGroup.title}
                  </h2>
                  <div className="flex-1 h-[3px]" style={{ backgroundColor: bgColors[0], borderRadius: 3, opacity: 0.3 }} />
                </div>

                {/* ── Theme Pathway ── */}
                {themeGroup.lessons.map((lesson, localIdx) => {
                  const globalIdx = allLessons.findIndex((l) => l.id === lesson.id);
                  const isCompleted = globalIdx < frontierIndex;
                  const isCurrent = globalIdx === frontierIndex;
                  const isLocked = globalIdx > frontierIndex;
                  const title = lesson.uiTitle || lesson.grammarFocus.split(' — ')[0];
                  
                  // Use localIdx for offset so each theme path starts in the center
                  const offset = getPathOffset(localIdx, isMobile);
                  const prevOffset = localIdx > 0 ? getPathOffset(localIdx - 1, isMobile) : offset;

                  const NODE_SIZE = isMobile ? 64 : 72;
                  const CONNECTOR_HEIGHT = isMobile ? 36 : 44;
                  const SVG_CENTER = isMobile ? 120 : 150;
                  const SVG_WIDTH = isMobile ? 240 : 300;

                  // Refined Palette for 3D effect
                  // Verbalize uses amber/emerald/slate. We can mimic Duolingo while using these.
                  const inactiveBg = theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
                  const inactiveShadow = theme === 'dark' ? '#1e293b' : '#cbd5e1'; // slate-800 / slate-300
                  const inactiveIcon = theme === 'dark' ? '#475569' : '#94a3b8'; // slate-600 / slate-400

                  const nodeColors = isCompleted
                    ? {
                        backgroundColor: '#10b981', // emerald-500
                        color: '#fff',
                        boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 4px 0 rgba(255,255,255,0.2), 0 8px 0 #059669`, // emerald-600
                        border: '2px solid rgba(255,255,255,0.1)',
                      }
                    : isCurrent
                      ? {
                          backgroundColor: 'var(--color-primary)', 
                          color: '#fff',
                          boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 5px 0 rgba(255,255,255,0.25), 0 8px 0 var(--color-primary-dark), 0 8px 24px rgba(29,94,212,0.4)`,
                          border: '2px solid rgba(255,255,255,0.15)',
                        }
                      : {
                          backgroundColor: inactiveBg,
                          color: inactiveIcon,
                          boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.1), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 0 ${inactiveShadow}`,
                        };

                  // Connector color (only if localIdx > 0 within the theme)
                  const prevGlobalIdx = localIdx > 0
                    ? allLessons.findIndex((l) => l.id === themeGroup.lessons[localIdx - 1].id)
                    : -1;
                  const connectorDone = prevGlobalIdx >= 0 && prevGlobalIdx < frontierIndex;
                  const connectorColor = connectorDone
                    ? '#10b981' // emerald-500 line
                    : inactiveBg; // Match the inactive node body

                  // MISS nodes get a special golden treatment
                  const isMission = lesson.tag === 'MISS';
                  const NODE_SIZE_ACTUAL = isMission ? 80 : NODE_SIZE;
                  const iconSize = isMission ? 34 : 28;
                  const nodeIcon = getTagIcon(lesson.tag ?? 'GRAM', iconSize);

                  // Override colors for MISS nodes
                  const missionColors = {
                    backgroundColor: isCompleted ? '#f59e0b' : isCurrent ? '#f59e0b' : inactiveBg,
                    color: (isCompleted || isCurrent) ? '#fff' : inactiveIcon,
                    boxShadow: (isCompleted || isCurrent)
                      ? `inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 5px 0 rgba(255,255,255,0.25), 0 8px 0 #b45309, 0 8px 24px rgba(245,158,11,0.4)`
                      : `inset 0 -4px 0 rgba(0,0,0,0.1), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 0 ${inactiveShadow}`,
                    border: (isCompleted || isCurrent) ? '2px solid rgba(255,255,255,0.2)' : undefined,
                  };

                  const finalNodeColors = isMission ? missionColors : nodeColors;

                  // Tag label text
                  const TAG_LABELS: Record<string, string> = {
                    PRON: 'Pronúncia', GRAM: 'Gramática',
                    VOC: 'Vocabulário', DIAL: 'Diálogo', MISS: 'Missão',
                  };

                  return (
                    <div 
                      key={lesson.id} 
                      className="relative flex flex-col items-center animate-scale-in" 
                      style={{ 
                        animationDelay: `${localIdx * 40}ms`, 
                        animationFillMode: 'both',
                        zIndex: modalState.isOpen && modalState.lesson?.id === lesson.id ? 50 : 10
                      }}
                    >

                      {/* ── Node container (translateX for zigzag) ── */}
                      <div
                        className="relative shrink-0 flex flex-col items-center mb-6"
                        style={{ transform: `translateX(${offset}px)` }}
                      >
                        {/* "COMEÇAR" tooltip — positioned above */}
                        {isCurrent && !(modalState.isOpen && modalState.lesson?.id === lesson.id) && (
                          <div
                            className="duo-tooltip mb-3 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              color: isMission ? '#b45309' : 'var(--color-primary)',
                              border: '2px solid var(--color-border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              animation: 'float 2.5s ease-in-out infinite'
                            }}
                          >
                            {isMission ? '⭐ Missão!' : 'Começar'}
                            <div
                              className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 rotate-45"
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                borderRight: '2px solid var(--color-border)',
                                borderBottom: '2px solid var(--color-border)',
                              }}
                            />
                          </div>
                        )}

                        {/* Circle button */}
                        <button
                          type="button"
                          onClick={() => setModalState(prev => prev.isOpen && prev.lesson?.id === lesson.id ? { isOpen: false, lesson: null, isCompleted: false, isCurrent: false, isLocked: false, tagLabel: '' } : {
                            isOpen: true,
                            lesson,
                            isCompleted,
                            isCurrent,
                            isLocked,
                            tagLabel: TAG_LABELS[lesson.tag ?? ''] ?? (lesson.tag === 'VERB' ? 'Verbos' : lesson.tag === 'EXPR' ? 'Expressões' : lesson.tag === 'CULT' ? 'Cultura' : 'Gramática')
                          })}
                          className={`relative flex items-center justify-center rounded-full transition-transform active:scale-95 ${isLocked ? 'cursor-default' : ''} ${isCurrent ? 'lesson-current-dot' : ''}`}
                          style={{
                            width: NODE_SIZE_ACTUAL,
                            height: NODE_SIZE_ACTUAL,
                            ...finalNodeColors,
                          }}
                        >
                          {/* Inner soft highlight */}
                          <div
                            className="absolute inset-2 rounded-full pointer-events-none"
                            style={{
                              background: isLocked ? 'transparent' : 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)'
                            }}
                          />
                          <div className="relative z-10 translate-y-[-2px]">
                            {nodeIcon}
                          </div>
                        </button>

                        {/* Inline Popover Modal */}
                        {modalState.isOpen && modalState.lesson?.id === lesson.id && (() => {
                          const [mainTitle, subTitle] = lesson.grammarFocus.split(' — ');
                          return (
                            <div 
                              className="absolute z-50 flex flex-col items-stretch w-[260px] p-4 rounded-2xl shadow-2xl animate-fade-in"
                              style={{ 
                                top: '115%',
                                backgroundColor: 'var(--color-surface)',
                                border: '2px solid var(--color-border)',
                                cursor: 'default'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Triangle Pointing Up */}
                              <div 
                                className="absolute left-1/2 -top-[9px] -translate-x-1/2 w-4 h-4 rotate-45"
                                style={{
                                  backgroundColor: 'var(--color-surface)',
                                  borderTop: '2px solid var(--color-border)',
                                  borderLeft: '2px solid var(--color-border)',
                                }}
                              />
                              
                              <h3 className="text-[17px] font-bold mb-1.5 text-left" style={{ color: 'var(--color-text-primary)' }}>
                                {lesson.uiTitle || mainTitle}
                              </h3>
                              <p className="text-sm font-medium mb-4 leading-relaxed text-left" style={{ color: 'var(--color-text-muted)' }}>
                                {isLocked ? 'Complete todos os níveis acima pra desbloquear esse aqui!' : (lesson.uiTitle ? lesson.grammarFocus : (subTitle || lesson.theme))}
                              </p>
                              
                              <button
                                onClick={() => {
                                   if (!isLocked) {
                                      router.push(isCurrent ? '/lesson' : `/lesson?id=${lesson.id}`);
                                   }
                                }}
                                disabled={isLocked}
                                className={`w-full rounded-xl py-3.5 text-[13px] font-black uppercase tracking-widest transition-all ${
                                  isLocked 
                                    ? 'opacity-80 cursor-not-allowed'
                                    : 'active:scale-95 shadow-[0_4px_0_var(--color-primary-dark)]'
                                }`}
                                style={{
                                  backgroundColor: isLocked ? 'var(--color-surface-raised)' : 'var(--color-primary)',
                                  color: isLocked ? 'var(--color-text-muted)' : '#fff',
                                }}
                              >
                                {isLocked ? 'Bloqueado' : isCompleted ? 'Revisar' : 'Começar'}
                              </button>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  );
                })}
              </div>
            )})}
          </div>
        )}

        {/* ═══════════════════ BOTTOM STATS ═══════════════════ */}
        <div
          className="mx-4 mb-8 text-center animate-fade-in"
          style={{ animationDelay: '500ms', animationFillMode: 'both' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {frontierIndex} de {allLessons.length} lições concluídas
          </p>
          <div
            className="h-2 w-40 mx-auto mt-2 rounded-full overflow-hidden"
            style={{ backgroundColor: theme === 'dark' ? 'rgba(55,65,81,0.5)' : '#e5e3de' }}
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

      {/* ── Skip lesson modal ── */}
      <SkipLessonModal
        isOpen={showSkipModal}
        isLoading={isSkipping}
        lessonTitle={activeLessonTitle}
        onClose={() => setShowSkipModal(false)}
        onConfirm={handleConfirmSkip}
      />

      {/* ── Popover Clickaway Overlay ── */}
      {modalState.isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setModalState({ isOpen: false, lesson: null, isCompleted: false, isCurrent: false, isLocked: false, tagLabel: '' })} 
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      ` }} />
    </div>
  );
}

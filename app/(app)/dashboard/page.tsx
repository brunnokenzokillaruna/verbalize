'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Sun, Moon, Flame, Zap,
  ArrowLeftRight, Lock, FastForward, X, Search, User,
} from 'lucide-react';
import { LanguageSwitcherSheet } from '@/components/dashboard/LanguageSwitcherSheet';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { logOut } from '@/services/auth';
import { updateUser, getUser, logLesson, updateLessonStats, getPregeneratedLesson, getUserVocabulary } from '@/services/firestore';
import { pregenerateNextLesson } from '@/app/actions/pregenerateNextLesson';
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
  const amplitude = isMobile ? 55 : 85;
  const period = 8;
  return -Math.sin((index / period) * Math.PI * 2) * amplitude;
}

/* ── Custom illustrated SVG icons for each lesson tag ─────────── */
function IconPRON({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="11" y="2" width="10" height="17" rx="5" fill="currentColor"/>
      <rect x="12" y="4" width="4" height="7" rx="2" fill="rgba(255,255,255,0.25)"/>
      <line x1="13" y1="10" x2="19" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="19" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7 16 Q7 25 16 25 Q25 25 25 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="11" y1="30" x2="21" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconGRAM({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 8 C13 6 7 6 4 8 L4 26 C7 24 13 24 16 26 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M16 8 C19 6 25 6 28 8 L28 26 C25 24 19 24 16 26 Z" fill="currentColor"/>
      <line x1="16" y1="8" x2="16" y2="26" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <line x1="19" y1="13" x2="25" y2="13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="17" x2="25" y2="17" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="21" x2="23" y2="21" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="13" x2="13" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="17" x2="13" y2="17" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="21" x2="11" y2="21" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconVOC({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 C10.48 3 6 7.48 6 13 C6 16.7 7.96 19.93 10.9 21.6 L10.9 24.5 L21.1 24.5 L21.1 21.6 C24.04 19.93 26 16.7 26 13 C26 7.48 21.52 3 16 3 Z" fill="currentColor"/>
      <ellipse cx="12.5" cy="9" rx="2.5" ry="3.5" fill="rgba(255,255,255,0.22)" transform="rotate(-20 12.5 9)"/>
      <rect x="11" y="24.5" width="10" height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.75"/>
      <rect x="11.5" y="27.5" width="9"  height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.5"/>
      <path d="M12 13.5 L15 16.5 L20.5 10" stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IconDIAL({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="14" rx="5" fill="currentColor"/>
      <path d="M5 16 L3 23 L11 17 Z" fill="currentColor"/>
      <circle cx="8"  cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="14" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <circle cx="20" cy="9" r="2" fill="rgba(255,255,255,0.75)"/>
      <rect x="10" y="18" width="20" height="12" rx="4" fill="currentColor" fillOpacity="0.6"/>
      <path d="M27 30 L30 32 L22 30 Z" fill="currentColor" fillOpacity="0.6"/>
      <line x1="15" y1="24" x2="25" y2="24" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconMISS({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M3 26 L5.5 12 L12 19 L16 8 L20 19 L26.5 12 L29 26 Z" fill="currentColor"/>
      <rect x="3" y="26" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.8"/>
      <circle cx="5.5"  cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="16"   cy="8"  r="2.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="26.5" cy="12" r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="16" cy="28" r="1.5" fill="rgba(255,255,255,0.6)"/>
      <circle cx="8"  cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
      <circle cx="24" cy="28" r="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function IconVERB({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill="currentColor" />
      <path d="M16 8V5M16 27v-3M8 16H5m22 0h-3M10.3 10.3L8.2 8.2m15.5 15.5l-2.1-2.1m0-11.3l2.1-2.1M8.2 23.8l2.1-2.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6z" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
    </svg>
  );
}

function IconEXPR({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
  const activeLessonObj = allLessons[frontierIndex] || allLessons[0];

  const [showLangSheet, setShowLangSheet] = useState(false);
  const [switchingLang, setSwitchingLang] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  function handleNodeKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      let nextIdx = index + 1;
      while (nextIdx < allLessons.length) {
        const nextL = allLessons[nextIdx];
        if (nextIdx <= frontierIndex) {
          const el = document.getElementById(`lesson-node-${nextL.id}`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
        nextIdx++;
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let prevIdx = index - 1;
      while (prevIdx >= 0) {
        const prevL = allLessons[prevIdx];
        if (prevIdx <= frontierIndex) {
          const el = document.getElementById(`lesson-node-${prevL.id}`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
        prevIdx--;
      }
    }
  }

  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(
    (allLessons[frontierIndex]?.level as ProficiencyLevel) ?? 'A1'
  );
  const [visibleThemeIdx, setVisibleThemeIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const currentLessonRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToCurrentRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  // Responsiveness zigzag path offset check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync profile progress
  useEffect(() => {
    if (!user) return;
    getUser(user.uid).then((fresh) => {
      if (fresh) setProfile(fresh);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Pre-generate active lesson in background
  useEffect(() => {
    if (!user || !profile || !activeLessonObj) return;

    const lessonId = activeLessonObj.id;
    const language = profile.currentTargetLanguage;

    (async () => {
      try {
        let cached = null;
        try {
          cached = await getPregeneratedLesson(user.uid, lessonId);
        } catch (err) {
          // Firestore security rules block reading non-existent docs by checking resource.data.uid,
          // which throws permission-denied. We catch this safely and treat it as a cache miss.
          console.log(`[Dashboard Pregen] Cache status check failed or document not found (treating as MISS).`);
        }

        const isTimedOut = (createdAt: any) => {
          if (!createdAt) return true;
          const createdMs = createdAt.toMillis ? createdAt.toMillis() : (createdAt.seconds * 1000);
          return Date.now() - createdMs > 5 * 60 * 1000; // 5 minutes
        };

        if (!cached || (cached.status === 'generating' && isTimedOut(cached.createdAt))) {
          console.log(`[Dashboard Pregen] 🔮 Active lesson ${lessonId} is a cache MISS. Pregenerating in background...`);
          const userVocabulary = await getUserVocabulary(user.uid, language);
          const knownVocabulary = userVocabulary.map((v) => v.word.toLowerCase());
          await pregenerateNextLesson(
            user.uid,
            activeLessonObj,
            profile.interests ?? [],
            knownVocabulary
          );
          console.log(`[Dashboard Pregen] ✅ Active lesson ${lessonId} pregeneration complete.`);
        } else if (cached.status === 'generating') {
          console.log(`[Dashboard Pregen] ⏳ Active lesson ${lessonId} is already generating in background (HIT).`);
        } else {
          console.log(`[Dashboard Pregen] ✅ Active lesson ${lessonId} is already cached (HIT).`);
        }
      } catch (err) {
        console.error('[Dashboard Pregen] Error pregenerating active lesson:', err);
      }
    })();
  }, [user?.uid, activeLessonObj?.id, profile?.currentTargetLanguage]);

  useEffect(() => {
    setVisibleThemeIdx(null);
  }, [selectedLevel]);

  // Scroll to frontier
  useEffect(() => {
    if (hasScrolledToCurrentRef.current) return;
    if (!currentLessonRef.current) return;

    const timer = setTimeout(() => {
      if (currentLessonRef.current) {
        currentLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledToCurrentRef.current = true;
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [frontierIndex, allLessons.length, selectedLevel]);

  // Keys to close popover/drawer
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileDrawer) setShowProfileDrawer(false);
        if (modalState.isOpen) {
          setModalState({
            isOpen: false,
            lesson: null,
            isCompleted: false,
            isCurrent: false,
            isLocked: false,
            tagLabel: '',
          });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showProfileDrawer, modalState.isOpen]);

  // Drawer focus trap
  useEffect(() => {
    if (!showProfileDrawer) return;
    const container = drawerRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first || !focusableElements.includes(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last || !focusableElements.includes(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProfileDrawer]);

  // Popover focus trap
  useEffect(() => {
    if (!modalState.isOpen) return;
    const container = popoverRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first || !focusableElements.includes(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last || !focusableElements.includes(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState.isOpen]);

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

  // Group by theme
  const themes: { title: string; lessons: typeof levelLessons }[] = [];
  for (const lesson of levelLessons) {
    const lastTheme = themes[themes.length - 1];
    if (lastTheme && lastTheme.title === lesson.theme) {
      lastTheme.lessons.push(lesson);
    } else {
      themes.push({ title: lesson.theme || `Nível ${selectedLevel}`, lessons: [lesson] });
    }
  }

  const initialThemeIdx = Math.max(0, themes.findIndex(t => 
    t.lessons.some(l => allLessons.findIndex(x => x.id === l.id) >= frontierIndex)
  ));
  
  const currentThemeIdx = visibleThemeIdx !== null ? visibleThemeIdx : initialThemeIdx;
  const currentBannerColors = THEME_COLORS[currentThemeIdx % THEME_COLORS.length];
  const activeThemeTitle = themes[currentThemeIdx]?.title ?? `Nível ${selectedLevel}`;
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
    <div className="min-h-dvh animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
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
            className="duo-btn-flat flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold active:translate-y-[2px] active:shadow-none sm:gap-2 sm:px-3 sm:py-2 sm:text-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              boxShadow: '0 3px 0 var(--color-border)',
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
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border border-border bg-surface" style={{ boxShadow: '0 2px 0 var(--color-border)' }}>
              <Flame size={16} className="sm:w-5 sm:h-5 text-amber-500 animate-float" />
              <span
                className="text-xs font-extrabold tabular-nums sm:text-sm text-amber-500"
              >
                {currentStreak}
              </span>
            </div>

            {/* Lessons completed */}
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border border-border bg-surface" style={{ boxShadow: '0 2px 0 var(--color-border)' }}>
              <Zap size={16} className="sm:w-[18px] sm:h-[18px] text-primary animate-float" style={{ animationDelay: '0.3s' }} />
              <span className="text-xs font-extrabold tabular-nums sm:text-sm text-primary">
                {profile.totalLessonsCompleted}
              </span>
            </div>

            {/* Profile Avatar trigger */}
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="duo-icon-btn flex h-11 w-11 items-center justify-center rounded-xl font-extrabold text-sm uppercase transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                boxShadow: '0 3px 0 var(--color-border)',
                color: 'var(--color-primary)',
              }}
              aria-label="Abrir Perfil"
            >
              {firstName ? firstName[0] : 'U'}
            </button>
          </div>
        </header>

        {/* ═══════════════════ STICKY SECTION BANNER & LEVELS ═══════════════════ */}
        <div className="sticky top-[61px] z-20 px-0 sm:px-4 pt-2 pb-4 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div
            className="rounded-2xl p-4.5 shadow-xl transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${currentBannerColors[0]} 0%, ${currentBannerColors[1]} 100%)`,
              borderBottom: '4px solid rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors duration-500 line-clamp-1 text-white/85">
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
                className="duo-btn-flat shrink-0 flex flex-col items-center gap-0.5 sm:gap-1 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tighter transition-all active:scale-90 disabled:opacity-50 cursor-pointer active:translate-y-[2px]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  boxShadow: '0 2px 0 rgba(0,0,0,0.1)'
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
                    className="shrink-0 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold active:scale-95 transition-all disabled:cursor-not-allowed cursor-pointer active:translate-y-[1px]"
                    style={{
                      backgroundColor: isSelected ? '#fff' : 'rgba(255,255,255,0.12)',
                      color: isSelected ? 'var(--color-primary)' : '#fff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: isSelected ? '0 2px 0 #cbd5e1' : '0 2px 0 rgba(0,0,0,0.1)',
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
              <p className="mt-1 text-sm text-text-muted">
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
                  <div className="flex flex-col items-center w-full overflow-visible">
                    {themeGroup.lessons.map((lesson, localIdx) => {
                      const globalIdx = allLessons.findIndex((l) => l.id === lesson.id);
                      const isCompleted = globalIdx < frontierIndex;
                      const isCurrent = globalIdx === frontierIndex;
                      const isLocked = globalIdx > frontierIndex;
                      
                      const offset = getPathOffset(localIdx, isMobile);
                      const NODE_SIZE = isMobile ? 64 : 72;
                      const NODE_SIZE_ACTUAL = lesson.tag === 'MISS' ? 80 : NODE_SIZE;
                      const iconSize = lesson.tag === 'MISS' ? 34 : 28;
                      const nodeIcon = getTagIcon(lesson.tag ?? 'GRAM', iconSize);

                      const inactiveBg = theme === 'dark' ? '#334155' : '#e2e8f0';
                      const inactiveShadow = theme === 'dark' ? '#1e293b' : '#cbd5e1';
                      const inactiveIcon = theme === 'dark' ? '#475569' : '#94a3b8';

                      const nodeColors = isCompleted
                        ? {
                            backgroundColor: '#10b981',
                            color: '#fff',
                            boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 4px 0 rgba(255,255,255,0.2), 0 8px 0 #059669`,
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

                      const isMission = lesson.tag === 'MISS';
                      const missionColors = {
                        backgroundColor: isCompleted ? '#f59e0b' : isCurrent ? '#f59e0b' : inactiveBg,
                        color: (isCompleted || isCurrent) ? '#fff' : inactiveIcon,
                        boxShadow: (isCompleted || isCurrent)
                          ? `inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 5px 0 rgba(255,255,255,0.25), 0 8px 0 #b45309, 0 8px 24px rgba(245,158,11,0.4)`
                          : `inset 0 -4px 0 rgba(0,0,0,0.1), inset 0 4px 0 rgba(255,255,255,0.06), 0 8px 0 ${inactiveShadow}`,
                        border: (isCompleted || isCurrent) ? '2px solid rgba(255,255,255,0.2)' : undefined,
                      };

                      const finalNodeColors = isMission ? missionColors : nodeColors;

                      const TAG_LABELS: Record<string, string> = {
                        PRON: 'Pronúncia',
                        GRAM: 'Gramática',
                        VOC: 'Vocab.',
                        DIAL: 'Diálogo',
                        MISS: 'Missão',
                        VERB: 'Verbos',
                        EXPR: 'Expressões',
                        CULT: 'Cultura',
                      };

                      return (
                        <div 
                          key={lesson.id}
                          ref={isCurrent ? currentLessonRef : undefined}
                          className="relative flex flex-col items-center animate-scale-in" 
                          style={{ 
                            animationDelay: `${localIdx * 40}ms`, 
                            animationFillMode: 'both',
                            zIndex: modalState.isOpen && modalState.lesson?.id === lesson.id ? 50 : 10
                          }}
                        >
                          {/* ── Node container (translateX for zigzag) ── */}
                          <div
                            className="relative shrink-0 flex flex-col items-center mb-6 animate-fade-in"
                            style={{ transform: `translateX(${offset}px)` }}
                          >
                            {/* "COMEÇAR" tooltip — positioned above */}
                            {isCurrent && !(modalState.isOpen && modalState.lesson?.id === lesson.id) && (
                              <div
                                className="duo-tooltip mb-3 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap border-2"
                                style={{
                                  backgroundColor: 'var(--color-surface)',
                                  color: isMission ? '#b45309' : 'var(--color-primary)',
                                  borderColor: 'var(--color-border)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                  animation: 'float 2.5s ease-in-out infinite'
                                }}
                              >
                                {isMission ? '⭐ Missão!' : 'Começar'}
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 rotate-45 border-r-2 border-b-2"
                                  style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                  }}
                                />
                              </div>
                            )}

                            {/* Circle button */}
                            <button
                              id={`lesson-node-${lesson.id}`}
                              type="button"
                              tabIndex={isLocked ? -1 : 0}
                              onKeyDown={(e) => handleNodeKeyDown(e, globalIdx)}
                              onClick={() => setModalState(prev => prev.isOpen && prev.lesson?.id === lesson.id ? { isOpen: false, lesson: null, isCompleted: false, isCurrent: false, isLocked: false, tagLabel: '' } : {
                                isOpen: true,
                                lesson,
                                isCompleted,
                                isCurrent,
                                isLocked,
                                tagLabel: TAG_LABELS[lesson.tag ?? ''] ?? 'Gramática'
                              })}
                              className={`relative flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isLocked ? 'cursor-default' : 'hover:scale-[1.03] cursor-pointer'} ${isCurrent ? 'lesson-current-dot' : ''}`}
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

                            {/* Micro-label category indicator */}
                            <span 
                              className="text-[10px] font-black uppercase tracking-wider mt-2 select-none transition-colors duration-200"
                              style={{
                                color: isLocked ? 'var(--color-text-muted)' : isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                              }}
                            >
                              {TAG_LABELS[lesson.tag ?? ''] ?? 'Gramática'}
                            </span>

                            {/* Inline Popover Modal */}
                            {modalState.isOpen && modalState.lesson?.id === lesson.id && (() => {
                              const [mainTitle, subTitle] = lesson.grammarFocus.split(' — ');
                              return (
                                <div 
                                  ref={popoverRef}
                                  className="absolute z-50 flex flex-col items-stretch w-[260px] p-4.5 rounded-2xl shadow-2xl animate-fade-in border"
                                  style={{ 
                                    top: '120%',
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                    cursor: 'default'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Triangle Pointing Up */}
                                  <div 
                                    className="absolute left-1/2 -top-[9px] -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l"
                                    style={{
                                      backgroundColor: 'var(--color-surface)',
                                      borderColor: 'var(--color-border)',
                                    }}
                                  />
                                  
                                  <h3 className="text-[17px] font-display font-extrabold mb-1.5 text-left text-text-primary leading-tight">
                                    {lesson.uiTitle || mainTitle}
                                  </h3>
                                  <p className="text-xs font-semibold mb-4 leading-relaxed text-left text-text-muted">
                                    {isLocked ? 'Complete todos os níveis acima pra desbloquear esse aqui!' : (lesson.uiTitle ? lesson.grammarFocus : (subTitle || lesson.theme))}
                                  </p>
                                  
                                  <button
                                    onClick={() => {
                                       if (!isLocked) {
                                          router.push(isCurrent ? '/lesson' : `/lesson?id=${lesson.id}`);
                                       }
                                    }}
                                    disabled={isLocked}
                                    className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:translate-y-[2px] ${
                                      isLocked 
                                        ? 'opacity-85 cursor-not-allowed'
                                        : 'active:scale-95'
                                    }`}
                                    style={{
                                      backgroundColor: isLocked ? 'var(--color-surface-raised)' : isMission ? '#f59e0b' : 'var(--color-primary)',
                                      color: isLocked ? 'var(--color-text-muted)' : '#fff',
                                      boxShadow: isLocked ? 'none' : isMission ? '0 3px 0 #b45309' : '0 3px 0 var(--color-primary-dark)',
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
                </div>
              );
            })}
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
            className="h-2.5 w-40 mx-auto mt-2.5 rounded-full overflow-hidden"
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
        <button 
          type="button"
          aria-label="Fechar informações da lição"
          className="fixed inset-0 z-40 bg-transparent cursor-default focus:outline-none" 
          onClick={() => setModalState({ isOpen: false, lesson: null, isCompleted: false, isCurrent: false, isLocked: false, tagLabel: '' })} 
        />
      )}

      {/* ── Profile Slide-over Drawer ── */}
      {showProfileDrawer && (
        <>
          {/* Backdrop blur clickaway overlay */}
          <button 
            type="button"
            aria-label="Fechar perfil"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in cursor-default focus:outline-none"
            onClick={() => setShowProfileDrawer(false)}
          />
          {/* Drawer container */}
          <div 
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 shadow-2xl flex flex-col justify-between animate-drawer-slide"
          >
            {/* Top Area */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-extrabold text-text-primary">Perfil</h2>
                <button 
                  onClick={() => setShowProfileDrawer(false)}
                  className="duo-icon-btn h-8 w-8 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 cursor-pointer border border-border bg-surface"
                  aria-label="Fechar Perfil"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              </div>
              
              {/* Student Passport Card */}
              <div 
                className="relative overflow-hidden rounded-2xl p-4 border border-primary-light mb-6 flex items-center gap-3.5"
                style={{
                  background: 'linear-gradient(to right, #0c1524 0%, #173870 100%)',
                  boxShadow: '0 4px 12px rgba(29, 94, 212, 0.1)',
                }}
              >
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary/25 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 shadow-sm">
                  <span className="font-display text-lg font-extrabold text-white">{firstName ? firstName[0] : 'U'}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-extrabold text-white leading-tight truncate">{profile.name}</p>
                  <p className="text-[10px] text-white/50 mt-0.5 truncate font-medium">{profile.email || user?.email}</p>
                </div>
              </div>

              {/* Progress and Streak Stats */}
              <div className="space-y-3 mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Progresso Geral</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="p-3.5 rounded-xl text-center border"
                    style={{ 
                      borderColor: 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)',
                      boxShadow: '0 2px 0 var(--color-border)'
                    }}
                  >
                    <Flame size={20} className="mx-auto mb-1 text-amber-500 animate-float" />
                    <span className="block text-lg font-extrabold tabular-nums text-text-primary font-display">{currentStreak}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">Dias Seguidos</span>
                  </div>
                  <div 
                    className="p-3.5 rounded-xl text-center border"
                    style={{ 
                      borderColor: 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)',
                      boxShadow: '0 2px 0 var(--color-border)'
                    }}
                  >
                    <Zap size={18} className="mx-auto mb-1 text-primary animate-float" style={{ animationDelay: '0.3s' }} />
                    <span className="block text-lg font-extrabold tabular-nums text-text-primary font-display">{profile.totalLessonsCompleted}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">Lições Feitas</span>
                  </div>
                </div>
              </div>

              {/* Settings Configuration */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Configurações</h4>
                
                {/* Theme toggle row button */}
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer border bg-surface"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 3px 0 var(--color-border)'
                  }}
                >
                  <span className="flex items-center gap-2 text-text-primary">
                    {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-text-muted" />}
                    {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
                  </span>
                  <span className="text-[10px] font-black uppercase text-primary">Alterar</span>
                </button>

                <Link
                  href="/profile"
                  onClick={() => setShowProfileDrawer(false)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[2px] active:shadow-none cursor-pointer border bg-surface"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 3px 0 var(--color-border)'
                  }}
                >
                  <span className="flex items-center gap-2 text-text-primary">
                    <User size={16} className="text-text-muted" />
                    Ajustes de Perfil
                  </span>
                  <span className="text-[10px] font-black uppercase text-primary">Acessar</span>
                </Link>
              </div>
            </div>

            {/* Logout CTA button */}
            <div>
              <button
                onClick={handleLogout}
                className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer active:translate-y-[2px]"
              >
                <div 
                  className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-200" 
                  style={{ backgroundColor: 'var(--color-error)', borderBottom: '3px solid #b91c1c' }}
                >
                  <LogOut size={16} />
                  Sair da Conta
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Language Switching Skeleton Loading Overlay ── */}
      {switchingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
            <div className="animate-spin rounded-full h-9 w-9 border-4 border-primary border-t-transparent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Alterando Idioma...</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes drawer-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-drawer-slide {
          animation: drawer-slide 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageSwitcherSheet } from '@/components/dashboard/LanguageSwitcherSheet';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { DashboardBanner } from '@/components/dashboard/DashboardBanner';
import { LessonPath } from '@/components/dashboard/LessonPath';
import { DashboardProgressFooter } from '@/components/dashboard/DashboardProgressFooter';
import { DashboardProductionCard } from '@/components/dashboard/DashboardProductionCard';
import { DashboardProfileDrawer } from '@/components/dashboard/DashboardProfileDrawer';
import { LanguageSwitchOverlay } from '@/components/dashboard/LanguageSwitchOverlay';
import { LANG_LABEL, THEME_COLORS } from '@/components/dashboard/constants';
import { EMPTY_LESSON_MODAL, type LessonModalState } from '@/components/dashboard/types';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useDashboardPregen } from '@/hooks/useDashboardPregen';
import { logOut } from '@/services/auth';
import { updateUser, syncUserProfile, logLesson, updateLessonStats, getUserVocabulary, getRecentLessonStats, getRecentSpontaneousSessionStats } from '@/services/firestore';
import { SkipLessonModal } from '@/components/ui/SkipLessonModal';
import type { LessonDefinition } from '@/types';
import { getLessonsForLanguage } from '@/lib/curriculum';
import { resolveFrontierLessonId } from '@/lib/curriculum/lessonProgress';
import {
  CurriculumSyncNoticeBanner,
  markCurriculumNoticeDismissed,
  shouldShowCurriculumNotice,
} from '@/components/dashboard/CurriculumSyncNotice';
import { getEffectiveStreak } from '@/lib/stats';
import { computeVocabCounts } from '@/utils/vocabPageHelpers';
import type { SpontaneousSessionStats } from '@/lib/productionStatsHelpers';
import { computeVocabRetentionComparison, type VocabRetentionComparison } from '@/lib/vocabRetentionStats';
import type { ProficiencyLevel, SupportedLanguage } from '@/types';

export default function DashboardPage() {
  const { profile, user, setProfile, reset, curriculumSyncNotice, setCurriculumSyncNotice } =
    useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useSoundEffects();
  const router = useRouter();

  const allLessons = useMemo(
    () => (profile ? getLessonsForLanguage(profile.currentTargetLanguage) : []),
    [profile],
  );
  const rawFrontierLessonId = profile?.lessonProgress?.[profile.currentTargetLanguage ?? 'fr'];
  const frontierLessonId = profile
    ? resolveFrontierLessonId(profile.currentTargetLanguage ?? 'fr', rawFrontierLessonId)
    : undefined;
  let frontierIndex = frontierLessonId
    ? allLessons.findIndex((l) => l.id === frontierLessonId)
    : 0;
  if (frontierIndex === -1) frontierIndex = 0;
  const activeLessonObj = allLessons[frontierIndex] || allLessons[0];

  const [showLangSheet, setShowLangSheet] = useState(false);
  const [switchingLang, setSwitchingLang] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(
    (allLessons[frontierIndex]?.level as ProficiencyLevel) ?? 'A1',
  );
  const [visibleThemeIdx, setVisibleThemeIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [modalState, setModalState] = useState<LessonModalState>(EMPTY_LESSON_MODAL);
  const [dueTodayCount, setDueTodayCount] = useState<number | undefined>();
  const [masteredCount, setMasteredCount] = useState<number | undefined>();
  const [lessonsLast7Days, setLessonsLast7Days] = useState<number | undefined>();
  const [averageScoreLast7Days, setAverageScoreLast7Days] = useState<number | undefined>();
  const [spontaneousSessionStats, setSpontaneousSessionStats] = useState<
    SpontaneousSessionStats | undefined
  >();
  const [vocabRetention, setVocabRetention] = useState<VocabRetentionComparison | undefined>();

  const currentLessonRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToCurrentRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useFocusTrap(popoverRef, modalState.isOpen);

  const closeModal = useCallback(() => setModalState(EMPTY_LESSON_MODAL), []);

  const handleNodeKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
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
    },
    [allLessons, frontierIndex],
  );

  const handleToggleModal = useCallback(
    (lesson: LessonDefinition, state: Omit<LessonModalState, 'isOpen'>) => {
      setModalState((prev) =>
        prev.isOpen && prev.lesson?.id === lesson.id
          ? EMPTY_LESSON_MODAL
          : { ...state, isOpen: true },
      );
    },
    [],
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;
    syncUserProfile(user.uid)
      .then((result) => {
        if (!result) return;
        setProfile(result.profile);
        if (result.notice && shouldShowCurriculumNotice(result.notice)) {
          setCurriculumSyncNotice(result.notice);
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useDashboardPregen(user, profile, activeLessonObj);

  useEffect(() => {
    if (!user || !profile?.currentTargetLanguage) return;
    let cancelled = false;

    Promise.all([
      getUserVocabulary(user.uid, profile.currentTargetLanguage),
      getRecentLessonStats(user.uid),
      getRecentSpontaneousSessionStats(user.uid),
    ])
      .then(([vocab, lessonStats, sessionStats]) => {
        if (cancelled) return;
        const counts = computeVocabCounts(vocab);
        setDueTodayCount(counts.dueTodayCount);
        setMasteredCount(counts.masteredCount);
        setLessonsLast7Days(lessonStats.lessonsLast7Days);
        setAverageScoreLast7Days(lessonStats.averageScoreLast7Days);
        setSpontaneousSessionStats(sessionStats);
        setVocabRetention(computeVocabRetentionComparison(vocab));
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [user?.uid, profile?.currentTargetLanguage]);

  useEffect(() => {
    setVisibleThemeIdx(null);
  }, [selectedLevel]);

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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileDrawer) setShowProfileDrawer(false);
        if (modalState.isOpen) closeModal();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showProfileDrawer, modalState.isOpen, closeModal]);

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/');
  }

  async function handleSwitchLanguage(lang: SupportedLanguage) {
    if (!user || !profile || lang === profile.currentTargetLanguage || switchingLang) return;
    setSwitchingLang(true);
    await updateUser(user.uid, { currentTargetLanguage: lang });
    setProfile({ ...profile, currentTargetLanguage: lang });
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

  useEffect(() => {
    if (!profile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleThemeIdx(Number(entry.target.getAttribute('data-theme-idx') || 0));
          }
        });
      },
      { rootMargin: '-140px 0px -50% 0px', threshold: 0.1 },
    );

    document.querySelectorAll('.theme-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [profile, selectedLevel, allLessons.length, frontierIndex]);

  if (!profile) return null;

  const lang = LANG_LABEL[profile.currentTargetLanguage];
  const currentStreak = getEffectiveStreak(profile);
  const completionPct = allLessons.length > 0
    ? Math.round((frontierIndex / allLessons.length) * 100)
    : 0;
  const firstName = profile.name?.split(' ')[0] ?? profile.name;
  const levelsWithLessons = new Set(allLessons.map((l) => l.level));
  const levelLessons = allLessons.filter((l) => l.level === selectedLevel);

  const themes: { title: string; lessons: typeof levelLessons }[] = [];
  for (const lesson of levelLessons) {
    const lastTheme = themes[themes.length - 1];
    if (lastTheme && lastTheme.title === lesson.theme) {
      lastTheme.lessons.push(lesson);
    } else {
      themes.push({ title: lesson.theme || `Nível ${selectedLevel}`, lessons: [lesson] });
    }
  }

  const initialThemeIdx = Math.max(
    0,
    themes.findIndex((t) =>
      t.lessons.some((l) => allLessons.findIndex((x) => x.id === l.id) >= frontierIndex),
    ),
  );

  const currentThemeIdx = visibleThemeIdx !== null ? visibleThemeIdx : initialThemeIdx;
  const currentBannerColors = THEME_COLORS[currentThemeIdx % THEME_COLORS.length];
  const activeThemeTitle = themes[currentThemeIdx]?.title ?? `Nível ${selectedLevel}`;
  const activeLessonTitle =
    activeLessonObj?.uiTitle || activeLessonObj?.grammarFocus?.split(' — ')[0] || 'Carregando...';

  function handleDismissCurriculumNotice() {
    if (curriculumSyncNotice) {
      markCurriculumNoticeDismissed(curriculumSyncNotice.reportVersion);
    }
    setCurriculumSyncNotice(null);
  }

  return (
    <div className="min-h-dvh animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="relative w-full max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl px-0 sm:px-4">
        <DashboardTopBar
          langName={lang.name}
          countryCode={lang.countryCode}
          currentStreak={currentStreak}
          totalLessonsCompleted={profile.totalLessonsCompleted}
          firstName={firstName}
          onOpenLanguageSheet={() => setShowLangSheet(true)}
          onOpenProfile={() => setShowProfileDrawer(true)}
        />

        {curriculumSyncNotice && (
          <div className="px-4 pt-3">
            <CurriculumSyncNoticeBanner
              notice={curriculumSyncNotice}
              onDismiss={handleDismissCurriculumNotice}
            />
          </div>
        )}

        <DashboardBanner
          language={profile.currentTargetLanguage as SupportedLanguage}
          selectedLevel={selectedLevel}
          activeThemeTitle={activeThemeTitle}
          activeLessonTitle={activeLessonTitle}
          bannerColors={currentBannerColors}
          levelsWithLessons={levelsWithLessons}
          switchingLang={switchingLang}
          onSelectLevel={setSelectedLevel}
          onOpenSkipModal={() => setShowSkipModal(true)}
        />

        <LessonPath
          themes={themes}
          allLessons={allLessons}
          frontierIndex={frontierIndex}
          isMobile={isMobile}
          langName={lang.name}
          selectedLevel={selectedLevel}
          modalState={modalState}
          currentLessonRef={currentLessonRef}
          popoverRef={popoverRef}
          onNodeKeyDown={handleNodeKeyDown}
          onToggleModal={handleToggleModal}
          onCloseModal={closeModal}
        />

        <DashboardProductionCard
          profile={profile}
          sessionStats={spontaneousSessionStats}
          vocabRetention={vocabRetention}
          nextLessonTag={activeLessonObj?.tag}
          onStartNextLesson={() => router.push(`/lesson?id=${activeLessonObj.id}`)}
        />

        <DashboardProgressFooter
          frontierIndex={frontierIndex}
          totalLessons={allLessons.length}
          completionPct={completionPct}
          dueTodayCount={dueTodayCount}
          masteredCount={masteredCount}
          lessonsLast7Days={lessonsLast7Days}
          averageScoreLast7Days={averageScoreLast7Days}
        />
      </div>

      {showLangSheet && (
        <LanguageSwitcherSheet
          currentTargetLanguage={profile.currentTargetLanguage!}
          switchingLang={switchingLang}
          onSwitchLanguage={handleSwitchLanguage}
          onClose={() => setShowLangSheet(false)}
        />
      )}

      <SkipLessonModal
        isOpen={showSkipModal}
        isLoading={isSkipping}
        lessonTitle={activeLessonTitle}
        onClose={() => setShowSkipModal(false)}
        onConfirm={handleConfirmSkip}
      />

      {modalState.isOpen && (
        <button
          type="button"
          aria-label="Fechar informações da lição"
          className="fixed inset-0 z-40 bg-transparent cursor-default focus:outline-none"
          onClick={closeModal}
        />
      )}

      <DashboardProfileDrawer
        isOpen={showProfileDrawer}
        drawerRef={drawerRef}
        profile={profile}
        user={user}
        firstName={firstName}
        currentStreak={currentStreak}
        theme={theme}
        isMuted={isMuted}
        onClose={() => setShowProfileDrawer(false)}
        onToggleTheme={toggleTheme}
        onToggleMute={toggleMute}
        onLogout={handleLogout}
      />

      {switchingLang && <LanguageSwitchOverlay />}

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
    </div>
  );
}

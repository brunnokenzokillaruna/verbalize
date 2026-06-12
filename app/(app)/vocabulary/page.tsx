'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, BookOpen, Clock, Sparkles, Trophy, X, ChevronRight, Zap, Brain, Search, LayoutGrid, List } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getUserVocabulary,
  updateVocabSrsAfterReview,
  updateVocabTranslation,
  updateVocabImage,
} from '@/services/firestore';
import { translateWordsBatch } from '@/app/actions/translateWord';
import { getVocabImage } from '@/app/actions/getVocabImage';
import { generateVocabReview } from '@/app/actions/generateVocabReview';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import { getLessonById, getNextLesson } from '@/lib/curriculum';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

import { StatChip } from '@/components/vocabulary/StatChip';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { ReviewModeSheet } from '@/components/vocabulary/ReviewModeSheet';
import { FlashcardReviewSession } from '@/components/vocabulary/FlashcardReviewSession';
import { ContextReviewSession } from '@/components/vocabulary/ContextReviewSession';
import { ContextReviewLoading } from '@/components/vocabulary/ContextReviewLoading';
import { VisualReviewSession } from '@/components/vocabulary/VisualReviewSession';
import type { ReviewResult } from '@/components/vocabulary/reviewTypes';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { SrsBar, SRS_BAR_COLOR, SRS_LABELS, formatNextReview } from '@/components/vocabulary/SrsBar';
import { VocabEnrichButton } from '@/components/vocabulary/VocabEnrichButton';
import { isMissingImage, isMissingTranslation } from '@/utils/vocabHelpers';
import { pickReviewSession, REVIEW_SESSION_SIZE } from '@/utils/reviewSession';

const LANG_LABEL: Record<SupportedLanguage, { label: string; flag: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷' },
  en: { label: 'Inglês', flag: '🇬🇧' },
};

// ── Compact List Row Component ───────────────────────────────────────────────

function VocabListRow({
  item,
  language,
  urgent = false,
  onEnrich,
  enriching = false,
}: {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
  onEnrich?: (word: string) => void;
  enriching?: boolean;
}) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const missingTranslation = isMissingTranslation(item);
  const missingImage = isMissingImage(item);
  const showEnrich = (missingTranslation || missingImage) && onEnrich;
  const reviewText = formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0]);
  const barColor = SRS_BAR_COLOR[level];

  return (
    <div
      className="flex items-center justify-between p-3.5 px-4 rounded-xl border transition-all duration-150 gap-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: urgent ? 'var(--color-error)' : 'var(--color-border)',
        boxShadow: urgent ? '0 0 0 2px var(--color-error-bg)' : undefined,
      }}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <AudioPlayerButton text={item.word} language={language} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-text-primary tracking-tight truncate">
              {item.word}
            </span>
            {urgent && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-error shrink-0 animate-pulse" />
            )}
          </div>
          <p
            className="text-xs truncate mt-0.5"
            style={{
              color: missingTranslation ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              fontStyle: missingTranslation ? 'italic' : 'normal',
            }}
          >
            {missingTranslation ? '—' : item.translation}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col gap-1 w-32 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span style={{ color: barColor }}>{SRS_LABELS[level]}</span>
          <span className="text-text-muted">Nível {level}/5</span>
        </div>
        <SrsBar level={level} />
      </div>

      <span
        className="sm:hidden text-[10px] font-bold rounded-full px-2 py-0.5"
        style={{ backgroundColor: `${barColor}15`, color: barColor }}
      >
        {SRS_LABELS[level]}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {showEnrich && (
          <VocabEnrichButton
            onClick={() => onEnrich!(item.word)}
            loading={enriching}
            missingTranslation={missingTranslation}
            missingImage={missingImage}
            variant="inline"
          />
        )}
        <div className="text-right min-w-[72px]">
          {reviewText ? (
            <p
              className="text-[11px] font-bold"
              style={{ color: urgent ? 'var(--color-error)' : 'var(--color-text-muted)' }}
            >
              {reviewText}
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-text-muted">Pronto</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VocabularyPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<UserVocabularyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [sessionItems, setSessionItems] = useState<UserVocabularyDocument[]>([]);
  const [flashcardPhase, setFlashcardPhase] = useState<'ready' | 'running' | 'done' | null>(null);
  const [visualPhase, setVisualPhase] = useState<'ready' | 'running' | 'done' | null>(null);
  const [contextPhase, setContextPhase] = useState<'running' | 'done' | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [reviewItems, setReviewItems] = useState<VocabReviewItem[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [savingResults, setSavingResults] = useState(false);

  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [srsFilter, setSrsFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [enrichingWords, setEnrichingWords] = useState<Set<string>>(new Set());

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const lang = LANG_LABEL[language];

  const loadVocabulary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const vocab = await getUserVocabulary(user.uid, language);
    setItems(vocab);
    setLoading(false);
  }, [user, language]);

  const handleImageLoaded = useCallback((word: string, imageUrl: string) => {
    setItems((prev) =>
      prev.map((item) => (item.word === word ? { ...item, imageUrl } : item)),
    );
  }, []);

  const handleEnrichItem = useCallback(
    async (word: string) => {
      if (!user || enrichingWords.has(word)) return;

      const item = items.find((v) => v.word === word);
      if (!item) return;

      const needsTranslation = isMissingTranslation(item);
      const needsImage = isMissingImage(item);
      if (!needsTranslation && !needsImage) return;

      setEnrichingWords((prev) => new Set(prev).add(word));

      try {
        let translation = item.translation;
        let imageUrl = item.imageUrl;

        if (needsTranslation) {
          const results = await translateWordsBatch([word], language);
          const match = results?.find((r) => r.word.toLowerCase() === word.toLowerCase());
          if (match?.translation && match.translation !== word) {
            translation = match.translation;
            await updateVocabTranslation(user.uid, word, language, translation);
          }
        }

        if (needsImage) {
          const context =
            translation && translation !== word ? translation : item.word;
          const imgResult = await getVocabImage(word, context, language);
          if (imgResult?.imageUrl) {
            imageUrl = imgResult.imageUrl;
            await updateVocabImage(user.uid, word, language, imageUrl);
          }
        }

        if (
          translation !== item.translation ||
          imageUrl !== item.imageUrl
        ) {
          setItems((prev) =>
            prev.map((v) =>
              v.word === word ? { ...v, translation, imageUrl } : v,
            ),
          );
        }
      } catch (err) {
        console.error('[handleEnrichItem] Failed for', word, err);
      } finally {
        setEnrichingWords((prev) => {
          const next = new Set(prev);
          next.delete(word);
          return next;
        });
      }
    },
    [user, items, language, enrichingWords],
  );

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (showPicker || flashcardPhase || contextPhase || visualPhase || contextLoading)) {
        closeAllReview();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showPicker, flashcardPhase, contextPhase, visualPhase, contextLoading]);

  const now = new Date();
  
  const rawDueToday = items.filter((item) => {
    const reviewDate =
      item.nextReview &&
      typeof (item.nextReview as { toDate?: () => Date }).toDate === 'function'
        ? (item.nextReview as { toDate: () => Date }).toDate()
        : null;
    return reviewDate && reviewDate <= now;
  });

  const totalCount = items.length;
  const newCount = items.filter((v) => (v.srsLevel ?? 0) <= 1).length;
  const learningCount = items.filter((v) => (v.srsLevel ?? 0) >= 2 && (v.srsLevel ?? 0) <= 4).length;
  const masteredCount = items.filter((v) => (v.srsLevel ?? 0) >= 5).length;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.translation && item.translation.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const level = item.srsLevel ?? 0;
    if (srsFilter === 'new') return level <= 1;
    if (srsFilter === 'learning') return level >= 2 && level <= 4;
    if (srsFilter === 'mastered') return level >= 5;

    return true;
  });

  const dueToday: UserVocabularyDocument[] = [];
  const learned: UserVocabularyDocument[] = [];

  for (const item of filteredItems) {
    const reviewDate =
      item.nextReview &&
      typeof (item.nextReview as { toDate?: () => Date }).toDate === 'function'
        ? (item.nextReview as { toDate: () => Date }).toDate()
        : null;
    if (reviewDate && reviewDate <= now) {
      dueToday.push(item);
    } else {
      learned.push(item);
    }
  }

  const focusWord = dueToday.length > 0 ? dueToday[0] : null;
  const remainingDueToday = dueToday.slice(1);

  const wordImageMap = Object.fromEntries(
    items.filter((v) => v.imageUrl).map((v) => [v.word, v.imageUrl!]),
  );

  function openReviewPicker() {
    if (!user || rawDueToday.length === 0) return;
    setSessionItems(pickReviewSession(rawDueToday));
    setResults([]);
    setShowPicker(true);
  }

  function closeAllReview() {
    setShowPicker(false);
    setFlashcardPhase(null);
    setContextPhase(null);
    setVisualPhase(null);
    setContextLoading(false);
    setReviewItems([]);
    setCardIdx(0);
    setAnswered(false);
    setLastCorrect(null);
    setResults([]);
  }

  function startFlashcardMode() {
    setShowPicker(false);
    setCardIdx(0);
    setResults([]);
    setFlashcardPhase('ready');
  }

  function beginFlashcardSession() {
    setFlashcardPhase('running');
  }

  function handleFlashcardAnswer(correct: boolean) {
    const item = sessionItems[cardIdx];
    if (cardIdx + 1 >= sessionItems.length) {
      setResults((prev) => [...prev, { word: item.word, correct }]);
      setFlashcardPhase('done');
    } else {
      setResults((prev) => [...prev, { word: item.word, correct }]);
      setCardIdx((i) => i + 1);
    }
  }

  async function finishFlashcardReview() {
    if (!user) return;
    setSavingResults(true);
    await Promise.all(
      results.map((r) => updateVocabSrsAfterReview(user.uid, r.word, language, r.correct)),
    );
    await loadVocabulary();
    setSavingResults(false);
    closeAllReview();
  }

  function startVisualMode() {
    setShowPicker(false);
    setCardIdx(0);
    setResults([]);
    setAnswered(false);
    setLastCorrect(null);
    setVisualPhase('ready');
  }

  function beginVisualSession() {
    setVisualPhase('running');
  }

  function handleVisualAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(correct);
  }

  function handleVisualContinue() {
    if (!answered || lastCorrect === null) return;
    const item = sessionItems[cardIdx];
    const newResults = [...results, { word: item.word, correct: lastCorrect }];
    setResults(newResults);
    if (cardIdx + 1 >= sessionItems.length) {
      setVisualPhase('done');
    } else {
      setCardIdx(cardIdx + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }

  async function finishVisualReview() {
    if (!user) return;
    setSavingResults(true);
    await Promise.all(
      results.map((r) => updateVocabSrsAfterReview(user.uid, r.word, language, r.correct)),
    );
    await loadVocabulary();
    setSavingResults(false);
    closeAllReview();
  }

  async function startContextMode() {
    if (!user) return;
    setShowPicker(false);
    setContextLoading(true);
    setCardIdx(0);
    setResults([]);
    setAnswered(false);
    setLastCorrect(null);

    const currentLessonId = profile?.lessonProgress?.[language];
    const currentLesson =
      (currentLessonId ? getLessonById(currentLessonId) : undefined) ??
      getNextLesson(language, undefined);
    const level = currentLesson?.level ?? 'A1';
    const knownVocabulary = items.map((v) => v.word);

    try {
      const generated = await generateVocabReview({
        words: sessionItems.map((v) => ({ word: v.word, translation: v.translation, imageUrl: v.imageUrl })),
        language,
        level,
        knownVocabulary,
      });

      if (!generated || generated.length === 0) {
        setContextLoading(false);
        return;
      }

      setReviewItems(generated);
      setContextPhase('running');
    } catch (err) {
      console.error('[startContextMode] Failed:', err);
    } finally {
      setContextLoading(false);
    }
  }

  function handleContextAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(correct);
  }

  function handleContextContinue() {
    if (!answered || lastCorrect === null) return;

    const currentItem = reviewItems[cardIdx];
    const newResults = [...results, { word: currentItem.word, correct: lastCorrect }];
    setResults(newResults);

    if (cardIdx + 1 >= reviewItems.length) {
      setContextPhase('done');
    } else {
      setCardIdx(cardIdx + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }

  async function finishContextReview() {
    if (!user) return;
    setSavingResults(true);
    await Promise.all(
      results.map((r) => updateVocabSrsAfterReview(user.uid, r.word, language, r.correct)),
    );
    await loadVocabulary();
    setSavingResults(false);
    closeAllReview();
  }

  if (loading) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl animate-pulse"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <BookOpen size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Carregando vocabulário…
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center pb-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary-light))',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <BookOpen size={36} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h2
            className="font-display text-2xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Nenhuma palavra ainda
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed max-w-xs mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Conclua sua primeira lição e as palavras que você aprender aparecerão aqui.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {[
            <BookOpen key="book" size={18} style={{ color: 'var(--color-primary)' }} />,
            <Brain key="brain" size={18} style={{ color: 'var(--color-verb)' }} />,
            <Sparkles key="sparkles" size={18} style={{ color: 'var(--color-warning)' }} />,
          ].map((icon, i) => (
            <span
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-xl animate-float"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const noMatches = filteredItems.length === 0;

  return (
    <>
      <div className="min-h-dvh pb-24 md:pb-10 animate-fade-in" style={{ backgroundColor: 'var(--color-bg)' }}>
        <header
          className="sticky top-0 z-10 px-5 pt-6 pb-4"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{lang.flag}</span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {lang.label}
                  </span>
                </div>
                <h1
                  className="font-display text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Meu Vocabulário
                </h1>
              </div>

            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <StatChip
                icon={<BookOpen size={13} />}
                label={`${items.length} palavra${items.length !== 1 ? 's' : ''}`}
                color="var(--color-primary)"
                bg="var(--color-primary-light)"
              />
              {rawDueToday.length > 0 && (
                <StatChip
                  icon={<Clock size={13} />}
                  label={`${rawDueToday.length} para revisar`}
                  color="var(--color-error)"
                  bg="var(--color-error-bg)"
                />
              )}
              {masteredCount > 0 && (
                <StatChip
                  icon={<Trophy size={13} />}
                  label={`${masteredCount} dominada${masteredCount !== 1 ? 's' : ''}`}
                  color="var(--color-success)"
                  bg="var(--color-success-bg)"
                />
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar palavra ou tradução..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex rounded-xl p-1 border border-border self-start sm:self-auto shrink-0" style={{ backgroundColor: 'var(--color-bg)' }}>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-surface text-text-primary shadow-sm border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Visualização em Grid"
                >
                  <LayoutGrid size={13} /> Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    layoutMode === 'list'
                      ? 'bg-surface text-text-primary shadow-sm border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Visualização em Lista Compacta"
                >
                  <List size={13} /> Lista
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setSrsFilter('all')}
                className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                  srsFilter === 'all'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
                }`}
              >
                Tudo <span className="text-[10px] opacity-75 font-extrabold">{totalCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setSrsFilter('new')}
                className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                  srsFilter === 'new'
                    ? 'bg-vocab text-white border-vocab shadow-sm'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
                }`}
              >
                Novas <span className="text-[10px] opacity-75 font-extrabold">{newCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setSrsFilter('learning')}
                className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                  srsFilter === 'learning'
                    ? 'bg-verb text-white border-verb shadow-sm'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
                }`}
              >
                Praticando <span className="text-[10px] opacity-75 font-extrabold">{learningCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setSrsFilter('mastered')}
                className={`duo-level-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                  srsFilter === 'mastered'
                    ? 'bg-success text-white border-success shadow-sm'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-raised'
                }`}
              >
                Dominadas <span className="text-[10px] opacity-75 font-extrabold">{masteredCount}</span>
              </button>
            </div>
          </div>

          {rawDueToday.length > 0 && (
            <div
              className="rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-5 animate-slide-up-spring border-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-error)',
                boxShadow: '0 4px 0 var(--color-error-bg), 0 8px 16px rgba(220, 38, 38, 0.05)',
              }}
            >
              <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: 'var(--color-error)',
                    color: '#fff',
                    boxShadow: '0 3px 0 #b91c1c'
                  }}
                >
                  <Zap size={22} className="animate-float" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    <span>Revisão Pendente</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-error-bg text-error">
                      {rawDueToday.length}
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {Math.min(rawDueToday.length, REVIEW_SESSION_SIZE)} palavras nesta sessão · escolha cartões ou frases em contexto
                  </p>
                </div>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0 shrink-0">
                <button
                  type="button"
                  onClick={openReviewPicker}
                  className="w-full md:w-auto flex justify-center items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 cursor-pointer bg-error text-white shadow-sm hover:brightness-105 active:translate-y-[2px]"
                  style={{
                    boxShadow: '0 3px 0 #b91c1c',
                  }}
                >
                  Revisar agora
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {noMatches && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border text-text-muted mb-4">
                <Search size={24} />
              </div>
              <h3 className="font-display text-xl font-bold text-text-primary">Nenhum resultado encontrado</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-xs leading-relaxed">
                Não encontramos nenhuma palavra correspondente a &ldquo;{searchQuery}&rdquo;. Tente outra busca ou limpe os filtros.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSrsFilter('all');
                }}
                className="mt-5 px-5 py-2.5 text-xs font-bold text-primary bg-primary-light hover:brightness-95 rounded-xl transition-all active:scale-95 cursor-pointer border border-primary/10"
              >
                Limpar busca e filtros
              </button>
            </div>
          )}

          {dueToday.length > 0 && (
            <section className="animate-slide-up-spring">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="flex h-2.5 w-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-error)' }}
                />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-error)' }}
                >
                  Para revisar hoje — {dueToday.length}
                </p>
              </div>

              {layoutMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {focusWord && (
                    <div
                      className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl overflow-hidden border-2 border-primary-light p-6 flex flex-col md:flex-row items-center gap-6 animate-slide-up-spring relative"
                      style={{
                        background: 'linear-gradient(to right, var(--color-surface), var(--color-surface-raised))',
                        boxShadow: '0 8px 24px rgba(29, 94, 212, 0.05)',
                      }}
                    >
                      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                      <div
                        className="relative w-full md:w-48 shrink-0 overflow-hidden rounded-xl border border-border shadow-sm"
                        style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-surface-raised)' }}
                      >
                        {focusWord.imageUrl ? (
                          <>
                            <Image
                              src={focusWord.imageUrl}
                              alt={focusWord.word}
                              fill
                              className="object-cover transition-transform duration-300 hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 200px"
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                              }}
                            />
                          </>
                        ) : (
                          <div
                            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 select-none"
                            style={{
                              background: `linear-gradient(90deg, transparent 31px, rgba(220, 38, 38, 0.15) 31px, rgba(220, 38, 38, 0.15) 32px, transparent 32px), 
                                           repeating-linear-gradient(var(--color-surface) 0px, var(--color-surface) 23px, var(--color-border) 23px, var(--color-border) 24px)`,
                              backgroundSize: '100% 100%, 100% 24px',
                            }}
                          >
                            <span className="text-primary animate-float">
                              <BookOpen size={36} style={{ color: 'var(--color-vocab)' }} />
                            </span>
                            {isMissingImage(focusWord) && (
                              <VocabEnrichButton
                                onClick={() => handleEnrichItem(focusWord.word)}
                                loading={enrichingWords.has(focusWord.word)}
                                missingTranslation={isMissingTranslation(focusWord)}
                                missingImage={isMissingImage(focusWord)}
                              />
                            )}
                          </div>
                        )}

                        <span className="absolute top-3 left-3 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-75 animate-ping" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
                        </span>

                        <span
                          className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
                          style={{
                            backgroundColor: focusWord.imageUrl ? 'rgba(0,0,0,0.6)' : 'var(--color-surface)',
                            color: focusWord.imageUrl ? '#fff' : 'var(--color-text-primary)',
                            backdropFilter: focusWord.imageUrl ? 'blur(4px)' : undefined,
                          }}
                        >
                          {SRS_LABELS[Math.min(focusWord.srsLevel ?? 0, 5)]}
                        </span>
                      </div>

                      <div className="flex-1 w-full flex flex-col md:items-start text-center md:text-left gap-3">
                        <div>
                          <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                            <h2 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
                              {focusWord.word}
                            </h2>
                            <AudioPlayerButton text={focusWord.word} language={language} size="md" />
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
                            <p
                              className="text-lg font-semibold"
                              style={{
                                color: isMissingTranslation(focusWord)
                                  ? 'var(--color-text-muted)'
                                  : 'var(--color-text-secondary)',
                                fontStyle: isMissingTranslation(focusWord) ? 'italic' : 'normal',
                              }}
                            >
                              {isMissingTranslation(focusWord) ? '—' : focusWord.translation}
                            </p>
                            {(isMissingTranslation(focusWord) || isMissingImage(focusWord)) && (
                              <VocabEnrichButton
                                onClick={() => handleEnrichItem(focusWord.word)}
                                loading={enrichingWords.has(focusWord.word)}
                                missingTranslation={isMissingTranslation(focusWord)}
                                missingImage={isMissingImage(focusWord)}
                                variant="inline"
                              />
                            )}
                          </div>
                        </div>

                        <div className="w-full max-w-sm mt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-text-muted mb-1.5">
                            <span>Progresso de Memorização</span>
                            <span>Estágio {Math.min(focusWord.srsLevel ?? 0, 5)} de 5</span>
                          </div>
                          <SrsBar level={Math.min(focusWord.srsLevel ?? 0, 5)} />
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5 text-xs text-text-muted font-medium">
                          <span className="flex items-center gap-1 font-bold text-error">
                            <Clock size={12} />
                            Revisão Pendente
                          </span>
                          <span>•</span>
                          <span>Estágio: {SRS_LABELS[Math.min(focusWord.srsLevel ?? 0, 5)]}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {remainingDueToday.map((item, idx) => (
                    <VocabCard
                      key={item.word}
                      item={item}
                      language={language}
                      urgent
                      animDelay={(idx + 1) * 45}
                      onImageLoaded={handleImageLoaded}
                      onEnrich={handleEnrichItem}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dueToday.map((item) => (
                    <VocabListRow
                      key={item.word}
                      item={item}
                      language={language}
                      urgent
                      onEnrich={handleEnrichItem}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {learned.length > 0 && (
            <section className="animate-slide-up-spring delay-75">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={13} style={{ color: 'var(--color-text-muted)' }} />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Aprendido — {learned.length}
                </p>
              </div>

              {layoutMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {learned.map((item, idx) => (
                    <VocabCard
                      key={item.word}
                      item={item}
                      language={language}
                      animDelay={idx * 35}
                      onImageLoaded={handleImageLoaded}
                      onEnrich={handleEnrichItem}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {learned.map((item) => (
                    <VocabListRow
                      key={item.word}
                      item={item}
                      language={language}
                      onEnrich={handleEnrichItem}
                      enriching={enrichingWords.has(item.word)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {showPicker && (
        <ReviewModeSheet
          sessionCount={sessionItems.length}
          totalDue={rawDueToday.length}
          onSelectFlashcard={startFlashcardMode}
          onSelectContext={startContextMode}
          onSelectVisual={startVisualMode}
          onClose={closeAllReview}
        />
      )}
      {contextLoading && (
        <ContextReviewLoading
          wordCount={sessionItems.length}
          onClose={closeAllReview}
        />
      )}
      {flashcardPhase && (
        <FlashcardReviewSession
          state={flashcardPhase}
          items={sessionItems}
          currentIdx={cardIdx}
          results={results}
          language={language}
          savingResults={savingResults}
          onStart={beginFlashcardSession}
          onAnswer={handleFlashcardAnswer}
          onFinish={finishFlashcardReview}
          onClose={closeAllReview}
        />
      )}
      {visualPhase && (
        <VisualReviewSession
          state={visualPhase}
          sessionItems={sessionItems}
          currentIdx={cardIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          savingResults={savingResults}
          onStart={beginVisualSession}
          onAnswer={handleVisualAnswer}
          onContinue={handleVisualContinue}
          onFinish={finishVisualReview}
          onClose={closeAllReview}
        />
      )}
      {contextPhase && (
        <ContextReviewSession
          state={contextPhase}
          items={reviewItems}
          sessionItems={sessionItems}
          currentIdx={cardIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          language={language}
          wordImageMap={wordImageMap}
          savingResults={savingResults}
          onAnswer={handleContextAnswer}
          onContinue={handleContextContinue}
          onFinish={finishContextReview}
          onClose={closeAllReview}
        />
      )}
    </>
  );
}

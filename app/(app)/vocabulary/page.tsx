'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, BookOpen, Clock, Sparkles, Trophy, X, ChevronRight, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getUserVocabulary,
  updateVocabTranslation,
  getCachedImage,
  updateVocabSrsAfterReview,
} from '@/services/firestore';
import { translateWord } from '@/app/actions/translateWord';
import { generateVocabReview } from '@/app/actions/generateVocabReview';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import { getLessonById, getNextLesson } from '@/lib/curriculum';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

import { StatChip } from '@/components/vocabulary/StatChip';
import { VocabCard } from '@/components/vocabulary/VocabCard';
import { ReviewOverlay, type ReviewResult } from '@/components/vocabulary/ReviewOverlay';

const LANG_LABEL: Record<SupportedLanguage, { label: string; flag: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷' },
  en: { label: 'Inglês', flag: '🇬🇧' },
};

type ReviewState = 'idle' | 'loading' | 'running' | 'done';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VocabularyPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<UserVocabularyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  // Review session state
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [reviewItems, setReviewItems] = useState<VocabReviewItem[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [savingResults, setSavingResults] = useState(false);

  const language = (profile?.currentTargetLanguage ?? 'fr') as SupportedLanguage;
  const lang = LANG_LABEL[language];

  const loadVocabulary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const vocab = await getUserVocabulary(user.uid, language);
    const cacheResults = await Promise.all(
      vocab.map((v) => getCachedImage(`${v.word}_${language}`)),
    );
    const enriched = vocab.map((v, i) => ({
      ...v,
      imageUrl: cacheResults[i]?.imageUrl ?? v.imageUrl,
    }));
    setItems(enriched);
    setLoading(false);

    const placeholders = vocab.filter((v) => v.translation === v.word || !v.translation);
    if (placeholders.length === 0) return;
    setEnriching(true);
    await Promise.all(
      placeholders.map(async (item) => {
        const result = await translateWord(item.word, '', language);
        if (result?.translation && result.translation !== item.word) {
          await updateVocabTranslation(user.uid, item.word, language, result.translation);
          setItems((prev) =>
            prev.map((v) =>
              v.word === item.word ? { ...v, translation: result.translation } : v,
            ),
          );
        }
      }),
    );
    setEnriching(false);
  }, [user, language]);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  // ── Split into due-today vs learned ──────────────────────────────────────────

  const now = new Date();
  const dueToday: UserVocabularyDocument[] = [];
  const learned: UserVocabularyDocument[] = [];

  for (const item of items) {
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

  const masteredCount = items.filter((v) => (v.srsLevel ?? 0) >= 5).length;

  // ── Image map for review overlay ──────────────────────────────────────────────

  const wordImageMap = Object.fromEntries(
    items.filter((v) => v.imageUrl).map((v) => [v.word, v.imageUrl!]),
  );

  // ── Review handlers ───────────────────────────────────────────────────────────

  async function startReview() {
    if (!user || dueToday.length === 0) return;
    setReviewState('loading');

    const currentLessonId = profile?.lessonProgress?.[language];
    const currentLesson =
      (currentLessonId ? getLessonById(currentLessonId) : undefined) ??
      getNextLesson(language, undefined);
    const level = currentLesson?.level ?? 'A1';
    const knownVocabulary = items.map((v) => v.word);

    const generated = await generateVocabReview({
      words: dueToday.map((v) => ({ word: v.word, translation: v.translation })),
      language,
      level,
      knownVocabulary,
    });

    if (!generated || generated.length === 0) {
      setReviewState('idle');
      return;
    }

    setReviewItems(generated);
    setReviewIdx(0);
    setAnswered(false);
    setLastCorrect(null);
    setResults([]);
    setReviewState('running');
  }

  function handleAnswer(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    setLastCorrect(correct);
  }

  function handleContinue() {
    if (!answered || lastCorrect === null) return;

    const currentItem = reviewItems[reviewIdx];
    const newResults = [...results, { word: currentItem.word, correct: lastCorrect }];
    setResults(newResults);

    if (reviewIdx + 1 >= reviewItems.length) {
      setReviewState('done');
    } else {
      setReviewIdx(reviewIdx + 1);
      setAnswered(false);
      setLastCorrect(null);
    }
  }

  async function finishReview() {
    if (!user) return;
    setSavingResults(true);
    await Promise.all(
      results.map((r) => updateVocabSrsAfterReview(user.uid, r.word, language, r.correct)),
    );
    await loadVocabulary();
    setSavingResults(false);
    setReviewState('idle');
  }

  function closeReview() {
    setReviewState('idle');
    setReviewItems([]);
    setResults([]);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

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

  // ── Empty state ───────────────────────────────────────────────────────────────

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
          {['📚', '🧠', '✨'].map((e, i) => (
            <span
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg animate-float"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-dvh pb-24 md:pb-10" style={{ backgroundColor: 'var(--color-bg)' }}>

        {/* ── Sticky header ── */}
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

              {enriching && (
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 mt-1"
                  style={{ backgroundColor: 'var(--color-surface-raised)' }}
                >
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Traduzindo…
                  </span>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <StatChip
                icon={<BookOpen size={13} />}
                label={`${items.length} palavra${items.length !== 1 ? 's' : ''}`}
                color="var(--color-primary)"
                bg="var(--color-primary-light)"
              />
              {dueToday.length > 0 && (
                <StatChip
                  icon={<Clock size={13} />}
                  label={`${dueToday.length} para revisar`}
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

        {/* ── Content ── */}
        <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-6 flex flex-col gap-8">

          {/* ── Review CTA banner ── */}
          {dueToday.length > 0 && (
            <div
              className="rounded-2xl p-4 flex items-center gap-4 animate-slide-up-spring"
              style={{
                background: 'linear-gradient(135deg, var(--color-error-bg) 0%, var(--color-primary-light) 100%)',
                border: '1.5px solid var(--color-error)',
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
              >
                <Zap size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {dueToday.length} palavra{dueToday.length !== 1 ? 's' : ''} para revisar hoje
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Pratique agora para não perder o progresso
                </p>
              </div>
              <button
                type="button"
                onClick={startReview}
                disabled={reviewState === 'loading'}
                className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-error)',
                  color: '#fff',
                  cursor: reviewState === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {reviewState === 'loading' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    Revisar
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Due today */}
          {dueToday.length > 0 && (
            <section className="animate-slide-up-spring">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="flex h-2 w-2 rounded-full animate-ping"
                  style={{ backgroundColor: 'var(--color-error)' }}
                />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-error)' }}
                >
                  Para revisar hoje — {dueToday.length}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {dueToday.map((item, idx) => (
                  <VocabCard
                    key={item.word}
                    item={item}
                    language={language}
                    urgent
                    animDelay={idx * 50}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Learned */}
          {learned.length > 0 && (
            <section className="animate-slide-up-spring delay-150">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={13} style={{ color: 'var(--color-text-muted)' }} />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Aprendido — {learned.length}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {learned.map((item, idx) => (
                  <VocabCard
                    key={item.word}
                    item={item}
                    language={language}
                    animDelay={idx * 40}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ── Review Session Overlay ── */}
      {(reviewState === 'running' || reviewState === 'done') && (
        <ReviewOverlay
          state={reviewState}
          items={reviewItems}
          currentIdx={reviewIdx}
          answered={answered}
          lastCorrect={lastCorrect}
          results={results}
          language={language}
          wordImageMap={wordImageMap}
          savingResults={savingResults}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
          onFinish={finishReview}
          onClose={closeReview}
        />
      )}
    </>
  );
}

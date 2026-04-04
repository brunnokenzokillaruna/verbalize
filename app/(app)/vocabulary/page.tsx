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
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';
import { getLessonById, getNextLesson } from '@/lib/curriculum';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';

// ── SRS config ────────────────────────────────────────────────────────────────

const SRS_LABELS = ['Iniciante', 'Básico', 'Aprendendo', 'Bom', 'Ótimo', 'Dominado'];

const SRS_BAR_COLOR = [
  '#ef4444', // 0 — red
  '#f97316', // 1 — orange
  '#eab308', // 2 — yellow
  '#3b82f6', // 3 — blue
  '#10b981', // 4 — emerald
  '#059669', // 5 — green
];

const LANG_LABEL: Record<SupportedLanguage, { label: string; flag: string }> = {
  fr: { label: 'Francês', flag: '🇫🇷' },
  en: { label: 'Inglês', flag: '🇬🇧' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNextReview(ts: { toDate?: () => Date } | Date | null | undefined): string {
  if (!ts) return '';
  const date =
    typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : ts instanceof Date
        ? ts
        : new Date();
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Para revisar hoje';
  if (diffDays === 1) return 'Amanhã';
  return `Em ${diffDays} dias`;
}

// ── SRS progress bar (5 segments) ────────────────────────────────────────────

function SrsBar({ level }: { level: number }) {
  const color = SRS_BAR_COLOR[Math.min(level, 5)];
  return (
    <div className="flex gap-0.5" role="progressbar" aria-valuenow={level} aria-valuemax={5}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ backgroundColor: i < level ? color : 'var(--color-border)' }}
        />
      ))}
    </div>
  );
}

// ── Review session types ──────────────────────────────────────────────────────

type ReviewState = 'idle' | 'loading' | 'running' | 'done';

interface ReviewResult {
  word: string;
  correct: boolean;
}

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

// ── StatChip ──────────────────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: bg, color }}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

// ── VocabCard ─────────────────────────────────────────────────────────────────

function VocabCard({
  item,
  language,
  urgent = false,
  animDelay = 0,
}: {
  item: UserVocabularyDocument;
  language: SupportedLanguage;
  urgent?: boolean;
  animDelay?: number;
}) {
  const level = Math.min(Math.max(item.srsLevel ?? 0, 0), 5);
  const isPlaceholder = item.translation === item.word || !item.translation;
  const reviewText = formatNextReview(item.nextReview as Parameters<typeof formatNextReview>[0]);
  const barColor = SRS_BAR_COLOR[level];

  return (
    <div
      className="card-lift group flex flex-col rounded-2xl overflow-hidden animate-slide-up"
      style={{
        animationDelay: `${animDelay}ms`,
        animationFillMode: 'both',
        backgroundColor: 'var(--color-surface)',
        border: `1.5px solid ${urgent ? 'var(--color-error)' : 'var(--color-border)'}`,
        boxShadow: urgent ? '0 0 0 3px var(--color-error-bg)' : undefined,
      }}
    >
      {/* Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {item.imageUrl ? (
          <>
            <Image
              src={item.imageUrl}
              alt={item.word}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
              }}
            />
            <p
              className="absolute bottom-2 left-2.5 font-display text-lg font-bold leading-tight drop-shadow-sm"
              style={{ color: '#fff' }}
            >
              {item.word}
            </p>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3">
            <span className="text-3xl opacity-20">📖</span>
            <p
              className="font-display text-base font-bold text-center leading-tight"
              style={{ color: 'var(--color-vocab)' }}
            >
              {item.word}
            </p>
          </div>
        )}

        {/* SRS badge top-right */}
        <span
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
          style={{
            backgroundColor: item.imageUrl ? 'rgba(0,0,0,0.55)' : 'var(--color-surface)',
            color: item.imageUrl ? '#fff' : barColor,
            backdropFilter: item.imageUrl ? 'blur(4px)' : undefined,
            border: item.imageUrl ? undefined : `1px solid ${barColor}30`,
          }}
        >
          {SRS_LABELS[level]}
        </span>

        {/* Urgent pulse dot */}
        {urgent && (
          <span className="absolute top-2 left-2 flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: 'var(--color-error)' }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: 'var(--color-error)' }}
            />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <p
          className="text-sm leading-tight"
          style={{
            color: isPlaceholder ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            fontStyle: isPlaceholder ? 'italic' : 'normal',
          }}
        >
          {isPlaceholder ? 'traduzindo…' : item.translation}
        </p>
        <SrsBar level={level} />
        <div className="flex items-center justify-between mt-0.5">
          {reviewText ? (
            <p
              className="text-[11px] font-medium truncate"
              style={{ color: urgent ? 'var(--color-error)' : 'var(--color-text-muted)' }}
            >
              {reviewText}
            </p>
          ) : (
            <span />
          )}
          <AudioPlayerButton text={item.word} language={language} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ── ReviewOverlay ─────────────────────────────────────────────────────────────

interface ReviewOverlayProps {
  state: 'running' | 'done';
  items: VocabReviewItem[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  wordImageMap: Record<string, string>;
  savingResults: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
}

function ReviewOverlay({
  state,
  items,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  wordImageMap,
  savingResults,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
}: ReviewOverlayProps) {
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (state === 'done') {
    const correctCount = results.filter((r) => r.correct).length;
    const incorrectCount = results.length - correctCount;
    const pct = Math.round((correctCount / results.length) * 100);

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <X size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Sessão concluída
          </span>
          <span className="w-9" />
        </div>

        {/* Results content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 text-center mx-auto max-w-sm w-full">
          {/* Score circle */}
          <div
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{
              background: pct >= 70
                ? 'linear-gradient(135deg, var(--color-success-bg), #d1fae5)'
                : 'linear-gradient(135deg, var(--color-error-bg), #fee2e2)',
              border: `3px solid ${pct >= 70 ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          >
            <span
              className="font-display text-3xl font-bold"
              style={{ color: pct >= 70 ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {pct}%
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              acertos
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Os níveis de memória foram atualizados.
            </p>
          </div>

          {/* Per-word results */}
          <div className="w-full flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={r.word}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{
                  backgroundColor: r.correct ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${r.correct ? 'var(--color-success)' : 'var(--color-error)'}20`,
                }}
              >
                {r.correct ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                )}
                <span
                  className="text-sm font-semibold flex-1 text-left"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.word}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {r.correct ? 'Correto' : 'Errado'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finish button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onFinish}
            disabled={savingResults}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 4px 16px rgba(29, 94, 212, 0.3)',
              cursor: savingResults ? 'wait' : 'pointer',
            }}
          >
            {savingResults ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Concluir revisão
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Running screen ────────────────────────────────────────────────────────────
  if (!currentItem) return null;

  const exercise = currentItem.exercise;
  const wordImage = wordImageMap[currentItem.word];
  const progress = ((currentIdx) / total) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <X size={18} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            {/* Progress bar */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
            <span
              className="text-xs font-semibold tabular-nums shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {currentIdx + 1} / {total}
            </span>
          </div>
        </div>
      </div>

      {/* ── Exercise content ── */}
      <div className="flex-1 px-5 pb-8 mx-auto max-w-lg w-full">

        {/* Word context chip — hidden for context-choice to avoid giving away the answer */}
        {exercise.type !== 'context-choice' && <div
          className="flex items-center gap-3 rounded-2xl p-3 mb-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          {wordImage ? (
            <div
              className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <Image
                src={wordImage}
                alt={currentItem.word}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              📖
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Revisando
            </p>
            <p
              className="font-display text-lg font-bold truncate"
              style={{ color: 'var(--color-vocab)' }}
            >
              {currentItem.word}
            </p>
          </div>
          <AudioPlayerButton text={currentItem.word} language={language} size="sm" />
        </div>}

        {/* Exercise */}
        {exercise.type === 'context-choice' && (
          <ContextChoiceExercise
            data={exercise.data}
            onAnswer={onAnswer}
            answered={answered}
          />
        )}

        {exercise.type === 'reverse-translation' && (
          <ReverseTranslationInput
            data={exercise.data}
            language={language}
            onAnswer={onAnswer}
            answered={answered}
          />
        )}
      </div>

      {/* ── Bottom feedback + continue ── */}
      <div
        className="sticky bottom-0"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Feedback banner */}
        {answered && (
          <div
            className="flex items-start gap-3 px-5 py-3"
            style={{
              backgroundColor: lastCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              borderTop: `2px solid ${lastCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          >
            {lastCorrect ? (
              <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
            ) : (
              <XCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
            )}
            <p
              className="text-sm font-semibold"
              style={{ color: lastCorrect ? 'var(--color-success)' : 'var(--color-error)' }}
            >
              {lastCorrect ? 'Correto! Nível de memória aumentou.' : 'Incorreto. Continue praticando!'}
            </p>
          </div>
        )}

        {/* Continue button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            disabled={!answered}
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: !answered
                ? 'var(--color-surface-raised)'
                : lastCorrect
                  ? 'var(--color-success)'
                  : 'var(--color-error)',
              color: !answered ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
              boxShadow: answered
                ? `0 4px 16px ${lastCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'}`
                : 'none',
              cursor: answered ? 'pointer' : 'not-allowed',
            }}
          >
            {currentIdx + 1 < total ? (
              <>
                Continuar
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                Ver resultados
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

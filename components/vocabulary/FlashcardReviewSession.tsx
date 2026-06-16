'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { useAudio } from '@/hooks/useAudio';
import { useReviewSoundFeedback } from '@/hooks/useReviewSoundFeedback';
import { getStudioVoiceName } from '@/lib/voiceConfig';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { REVIEW_THEMES } from './reviewThemes';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';
import { isMissingTranslation } from '@/utils/vocabHelpers';

type CardDirection = 'fr-to-pt' | 'pt-to-fr';
type CardExit = 'none' | 'left' | 'right';

const FLIP_DURATION_MS = 480;
const EXIT_DURATION_MS = 320;
const THEME = REVIEW_THEMES.flashcard;

interface FlashcardReviewSessionProps {
  state: 'ready' | 'running' | 'done';
  items: UserVocabularyDocument[];
  currentIdx: number;
  results: ReviewResult[];
  language: SupportedLanguage;
  savingResults: boolean;
  hasMoreDue?: boolean;
  onStart: () => void;
  onAnswer: (correct: boolean) => void;
  onFinish: () => void;
  onClose: () => void;
}

function pickDirection(item: UserVocabularyDocument): CardDirection {
  const canPtToFr = !isMissingTranslation(item);
  if (!canPtToFr) return 'fr-to-pt';
  return Math.random() < 0.5 ? 'fr-to-pt' : 'pt-to-fr';
}

export function FlashcardReviewSession({
  state,
  items,
  currentIdx,
  results,
  language,
  savingResults,
  hasMoreDue,
  onStart,
  onAnswer,
  onFinish,
  onClose,
}: FlashcardReviewSessionProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardExit, setCardExit] = useState<CardExit>('none');
  const [streak, setStreak] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { speak, stop: stopAudio } = useAudio(getStudioVoiceName(language));
  const { playAnswer, playCombo, playTap } = useReviewSoundFeedback();
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;

  const directions = useMemo(
    () => items.map((item) => pickDirection(item)),
    [items],
  );

  useEffect(() => {
    setIsFlipped(false);
    setIsAnimating(false);
    setCardExit('none');
    stopAudio();
  }, [currentIdx, state, stopAudio]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      stopAudio();
    };
  }, [stopAudio]);

  if (state === 'done') {
    return (
      <ReviewResultsScreen
        theme={THEME}
        results={results}
        sessionItems={items}
        savingResults={savingResults}
        hasMoreDue={hasMoreDue}
        correctLabel="Lembrei"
        incorrectLabel="Esqueci"
        onFinish={onFinish}
        onClose={onClose}
      />
    );
  }

  if (state === 'ready') {
    return (
      <ReviewSessionShell theme={THEME} current={0} total={total} onCloseRequest={onClose}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mx-auto max-w-lg w-full text-center gap-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Baralho pronto
            </h2>
            <p className="text-sm mt-2 text-text-secondary">
              {total} cartões · vire, ouça e avalie sua memória
            </p>
          </div>

          <div className="relative w-full max-w-[220px] aspect-[3/4]">
            {[2, 1, 0].map((layer) => (
              <div
                key={layer}
                className="absolute inset-0 rounded-2xl border-2 border-primary/20"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  transform: `translateY(${layer * -6}px) rotate(${layer * -2}deg)`,
                  zIndex: layer,
                  boxShadow: layer === 0 ? '0 12px 32px rgba(29,94,212,0.12)' : undefined,
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-2xl px-6 py-4 text-base font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: THEME.accent,
              boxShadow: `0 3px 0 ${THEME.accentDark}`,
            }}
          >
            Virar primeiro cartão
          </button>
        </div>
      </ReviewSessionShell>
    );
  }

  if (!currentItem) return null;

  const direction = directions[currentIdx];
  const promptText =
    direction === 'fr-to-pt' ? 'Qual é a tradução?' : 'Como se diz no idioma alvo?';
  const frontText = direction === 'fr-to-pt' ? currentItem.word : currentItem.translation;

  function advanceAfterExit(correct: boolean) {
    exitTimerRef.current = setTimeout(() => {
      setCardExit('none');
      setIsAnimating(false);
      onAnswer(correct);
    }, EXIT_DURATION_MS);
  }

  function handleAnswer(correct: boolean) {
    if (isAnimating || cardExit !== 'none') return;

    stopAudio();
    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      playAnswer(true);
      if (nextStreak >= 2) playCombo(nextStreak);
    } else {
      setStreak(0);
      playAnswer(false);
    }

    setIsAnimating(true);
    setCardExit(correct ? 'right' : 'left');

    if (isFlipped) {
      setIsFlipped(false);
      flipTimerRef.current = setTimeout(() => {
        advanceAfterExit(correct);
      }, FLIP_DURATION_MS);
      return;
    }

    advanceAfterExit(correct);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!isFlipped) return;
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isFlipped || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) handleAnswer(true);
    else if (delta < -50) handleAnswer(false);
    touchStartX.current = null;
  }

  function handleFlip() {
    if (isFlipped || isAnimating || cardExit !== 'none') return;
    playTap();
    setIsFlipped(true);
    speak(currentItem.word, language).catch(() => {});
  }

  const exitTransform =
    cardExit === 'left'
      ? 'translateX(-120%) rotate(-12deg)'
      : cardExit === 'right'
        ? 'translateX(120%) rotate(12deg)'
        : 'translateX(0) rotate(0)';

  const canAnswer = isFlipped && !isAnimating && cardExit === 'none';

  return (
    <ReviewSessionShell
      theme={THEME}
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3 mx-auto max-w-lg w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {streak >= 2 && (
          <div
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-scale-in"
            style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
          >
            <Flame size={13} fill="currentColor" />
            {streak} seguidos
          </div>
        )}

        <div className="relative w-full max-w-sm overflow-hidden">
          {/* Deck stack behind */}
          <div
            className="absolute inset-0 rounded-3xl border border-border translate-y-3 scale-[0.96] opacity-50"
            style={{ backgroundColor: 'var(--color-surface)' }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-3xl border border-border translate-y-1.5 scale-[0.98] opacity-70"
            style={{ backgroundColor: 'var(--color-surface)' }}
            aria-hidden
          />

          <div
            className="relative w-full aspect-[3/4] max-h-[min(58dvh,calc(100dvh-15rem))] transition-transform duration-300 ease-out outline-none"
            style={{
              perspective: '1100px',
              transform: exitTransform,
              transitionDuration: cardExit !== 'none' ? `${EXIT_DURATION_MS}ms` : undefined,
              cursor: !isFlipped && !isAnimating && cardExit === 'none' ? 'pointer' : 'default',
            }}
            tabIndex={isFlipped && cardExit === 'none' ? 0 : -1}
            onKeyDown={(e) => {
              if (!isFlipped || isAnimating || cardExit !== 'none') return;
              if (e.key === 'ArrowLeft') handleAnswer(false);
              if (e.key === 'ArrowRight') handleAnswer(true);
            }}
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col rounded-3xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `2px solid ${THEME.accent}`,
                boxShadow: '0 16px 40px rgba(29, 94, 212, 0.18)',
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <div
                className="flex items-center justify-end px-4 py-2.5 border-b border-border"
                style={{ backgroundColor: THEME.accentLight }}
              >
                <span className="text-[10px] font-bold text-text-muted">
                  {currentIdx + 1} de {total}
                </span>
              </div>

              {currentItem.imageUrl && (
                <div className="relative w-full h-[42%] shrink-0">
                  <Image
                    src={currentItem.imageUrl}
                    alt={currentItem.word}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)' }}
                  />
                </div>
              )}

              <div className="flex flex-col items-center justify-center flex-1 p-6 gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  {promptText}
                </p>
                <p className="font-display text-[clamp(1.75rem,7vw,2.25rem)] font-bold text-center break-words w-full text-text-primary">
                  {frontText}
                </p>
                {direction === 'fr-to-pt' && (
                  <AudioPlayerButton text={currentItem.word} language={language} size="lg" />
                )}
              </div>

              {!isFlipped && (
                <div className="flex justify-center pb-5">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: THEME.accentLight }}
                  >
                    <RotateCw size={14} className="text-primary" />
                    <span className="text-xs font-bold text-primary">Toque para revelar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-5 sm:p-8 rounded-3xl"
              style={{
                background: `linear-gradient(160deg, var(--color-surface) 0%, ${THEME.accentLight} 100%)`,
                border: `2px solid ${THEME.accent}`,
                boxShadow: '0 12px 32px rgba(29, 94, 212, 0.12)',
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                transition: `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <p className="font-display text-base sm:text-lg font-bold text-text-muted">{currentItem.word}</p>
              <div className="w-10 h-0.5 rounded-full my-3 bg-border" />
              <p className="font-display text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-center text-vocab px-2">
                {currentItem.translation}
              </p>
              <div className="mt-5">
                <AudioPlayerButton text={currentItem.word} language={language} size="md" />
              </div>
              <div className="mt-6 px-6 text-center">
                <p className="text-[11px] font-bold text-text-secondary leading-snug">
                  ← Esqueci · Lembrei →
                </p>
                <p className="text-[10px] mt-1 font-medium text-text-muted leading-relaxed">
                  Toque nas laterais, deslize o cartão ou use as setas do teclado
                </p>
              </div>
            </div>

            {canAnswer && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(false);
                  }}
                  className="absolute inset-y-0 left-0 z-20 flex w-[42%] items-center justify-start rounded-l-3xl pl-3 transition-transform active:scale-[0.98] cursor-pointer"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(239, 68, 68, 0.24) 0%, rgba(239, 68, 68, 0.08) 55%, transparent 100%)',
                  }}
                  aria-label="Esqueci"
                >
                  <div className="flex flex-col items-center gap-1.5 animate-swipe-hint-left pointer-events-none">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border-2"
                      style={{
                        backgroundColor: 'var(--color-error-bg)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        boxShadow: '0 3px 0 rgba(220, 38, 38, 0.18)',
                      }}
                    >
                      <ArrowLeft size={18} strokeWidth={2.5} className="text-error" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-error max-[380px]:hidden">
                      Esqueci
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(true);
                  }}
                  className="absolute inset-y-0 right-0 z-20 flex w-[42%] items-center justify-end rounded-r-3xl pr-3 transition-transform active:scale-[0.98] cursor-pointer"
                  style={{
                    background:
                      'linear-gradient(270deg, rgba(16, 185, 129, 0.24) 0%, rgba(16, 185, 129, 0.08) 55%, transparent 100%)',
                  }}
                  aria-label="Lembrei"
                >
                  <div className="flex flex-col items-center gap-1.5 animate-swipe-hint-right pointer-events-none">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        boxShadow: '0 3px 0 #047857',
                      }}
                    >
                      <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-success max-[380px]:hidden">
                      Lembrei
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </ReviewSessionShell>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Frame, Eye } from 'lucide-react';
import { ImageMatchExercise } from '@/components/lesson/ImageMatchExercise';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { ReviewActionFooter } from './ReviewActionFooter';
import { buildImageMatchFromReviewWords, MIN_VISUAL_REVIEW_ITEMS } from '@/utils/imageMatchBuilder';
import { REVIEW_THEMES } from './reviewThemes';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';

const THEME = REVIEW_THEMES.visual;

interface VisualReviewSessionProps {
  state: 'ready' | 'running' | 'done';
  sessionItems: UserVocabularyDocument[];
  imagePool: Array<{ word: string; translation: string; imageUrl?: string }>;
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  savingResults: boolean;
  hasMoreDue?: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onSkipUnavailable: () => void;
  onFinish: () => void;
  onClose: () => void;
  onStart: () => void;
}

export function VisualReviewSession({
  state,
  sessionItems,
  imagePool,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  savingResults,
  hasMoreDue,
  onAnswer,
  onContinue,
  onSkipUnavailable,
  onFinish,
  onClose,
  onStart,
}: VisualReviewSessionProps) {
  const total = sessionItems.length;
  const currentItem = state === 'running' ? sessionItems[currentIdx] : null;
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);
  const skipHandledRef = useRef<number | null>(null);

  useEffect(() => {
    skipHandledRef.current = null;
    setIsExerciseReady(false);
    setSubmitTrigger(0);
  }, [currentIdx]);

  const exercise =
    state === 'running' && currentItem
      ? buildImageMatchFromReviewWords(currentItem.word, imagePool)
      : null;

  useEffect(() => {
    if (state !== 'running' || exercise || !currentItem) return;
    if (skipHandledRef.current === currentIdx) return;
    skipHandledRef.current = currentIdx;
    onSkipUnavailable();
  }, [state, exercise, currentItem, currentIdx, onSkipUnavailable]);

  if (state === 'done') {
    return (
      <ReviewResultsScreen
        theme={THEME}
        results={results}
        sessionItems={sessionItems}
        savingResults={savingResults}
        hasMoreDue={hasMoreDue}
        onFinish={onFinish}
        onClose={onClose}
      />
    );
  }

  if (state === 'ready') {
    const playableCount = sessionItems.length;
    const canStart = playableCount >= MIN_VISUAL_REVIEW_ITEMS;
    return (
      <ReviewSessionShell theme={THEME} current={0} total={playableCount || 1} onCloseRequest={onClose}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mx-auto max-w-lg w-full text-center gap-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: THEME.accentBg, color: THEME.accent }}
          >
            <Frame size={30} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Galeria visual
            </h2>
            <p className="text-sm mt-2 text-text-secondary leading-relaxed">
              Associe cada palavra à imagem certa. {playableCount} palavras prontas nesta sessão.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="w-full rounded-2xl px-6 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: THEME.accent,
              boxShadow: canStart ? `0 3px 0 ${THEME.accentDark}` : 'none',
            }}
          >
            {canStart
              ? 'Abrir galeria'
              : `Precisa de pelo menos ${MIN_VISUAL_REVIEW_ITEMS} palavras com imagens distintas`}
          </button>
        </div>
      </ReviewSessionShell>
    );
  }

  if (!currentItem) return null;

  const footer = (
    <ReviewActionFooter
      theme={THEME}
      answered={answered}
      lastCorrect={lastCorrect}
      isExerciseReady={isExerciseReady}
      isLast={currentIdx + 1 >= total}
      feedbackCorrect="Associação correta! A imagem fixou na memória."
      feedbackWrong="Observe a imagem certa: reforça o vínculo visual."
      onSubmit={() => setSubmitTrigger((t) => t + 1)}
      onContinue={onContinue}
    />
  );

  if (!exercise || exercise.type !== 'image-match') {
    return (
      <ReviewSessionShell
        theme={THEME}
        current={currentIdx + 1}
        total={total}
        onCloseRequest={onClose}
      >
        <p className="text-center text-sm p-6 text-text-muted">
          Preparando próxima palavra…
        </p>
      </ReviewSessionShell>
    );
  }

  return (
    <ReviewSessionShell
      theme={THEME}
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
      footer={footer}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide px-5 py-3 mx-auto max-w-lg w-full gap-4 sm:gap-5 animate-slide-up pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Curator challenge header */}
        <div
          className="rounded-2xl border-2 overflow-hidden"
          style={{ borderColor: THEME.accent, backgroundColor: 'var(--color-surface)' }}
        >
          <div
            className="px-4 py-2 flex items-center gap-2"
            style={{ backgroundColor: THEME.accentBg }}
          >
            <Eye size={14} style={{ color: THEME.accent }} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              Desafio do curador
            </span>
          </div>
          <div className="p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
              Qual imagem representa
            </p>
            <p className="font-display text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-text-primary break-words">
              {exercise.data.targetWord}
            </p>
            <p className="text-sm text-text-secondary italic mt-1">
              {exercise.data.translation}
            </p>
            <div className="flex justify-center mt-3">
              <AudioPlayerButton text={exercise.data.targetWord} language={language} size="md" />
            </div>
          </div>
        </div>

        <ImageMatchExercise
          key={currentIdx}
          data={exercise.data}
          onAnswer={onAnswer}
          answered={answered}
          setIsExerciseReady={setIsExerciseReady}
          submitTrigger={submitTrigger}
          variant="gallery"
          hidePrompt
          accentColor={THEME.accent}
        />
      </div>
    </ReviewSessionShell>
  );
}

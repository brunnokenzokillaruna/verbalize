'use client';

import { useEffect, useState } from 'react';
import { Frame, Eye } from 'lucide-react';
import { ImageMatchExercise } from '@/components/lesson/ImageMatchExercise';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { ReviewActionFooter } from './ReviewActionFooter';
import { buildImageMatchFromReviewWords } from '@/utils/imageMatchBuilder';
import { REVIEW_THEMES } from './reviewThemes';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';

const THEME = REVIEW_THEMES.visual;

interface VisualReviewSessionProps {
  state: 'ready' | 'running' | 'done';
  sessionItems: UserVocabularyDocument[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  savingResults: boolean;
  hasMoreDue?: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
  onStart: () => void;
}

export function VisualReviewSession({
  state,
  sessionItems,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  savingResults,
  hasMoreDue,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
  onStart,
}: VisualReviewSessionProps) {
  const total = sessionItems.length;
  const currentItem = state === 'running' ? sessionItems[currentIdx] : null;
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  useEffect(() => {
    setIsExerciseReady(false);
    setSubmitTrigger(0);
  }, [currentIdx]);

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
    const withImages = sessionItems.filter((i) => i.imageUrl).length;
    return (
      <ReviewSessionShell theme={THEME} current={0} total={total} onCloseRequest={onClose}>
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
              Associe cada palavra à imagem certa. {withImages} palavras com foto nesta sessão.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={withImages < 3}
            className="w-full rounded-2xl px-6 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: THEME.accent,
              boxShadow: withImages >= 3 ? `0 3px 0 ${THEME.accentDark}` : 'none',
            }}
          >
            {withImages >= 3 ? 'Abrir galeria' : 'Precisa de pelo menos 3 palavras com imagem'}
          </button>
        </div>
      </ReviewSessionShell>
    );
  }

  if (!currentItem) return null;

  const exercise = buildImageMatchFromReviewWords(
    currentItem.word,
    sessionItems.map((i) => ({
      word: i.word,
      translation: i.translation,
      imageUrl: i.imageUrl,
    })),
  );

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
        footer={footer}
      >
        <p className="text-center text-sm p-6 text-text-muted">
          Sem imagens suficientes. Avançando…
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
      <div className="flex-1 px-5 py-4 mx-auto max-w-lg w-full flex flex-col gap-5 animate-slide-up">
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
            <p className="font-display text-3xl font-bold text-text-primary">
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

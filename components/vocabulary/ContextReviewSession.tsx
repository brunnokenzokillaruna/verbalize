'use client';

import { useEffect, useState } from 'react';
import { ContextChoiceExercise } from '@/components/lesson/ContextChoiceExercise';
import { ReverseTranslationInput } from '@/components/lesson/ReverseTranslationInput';
import { WordBankTranslation } from '@/components/lesson/WordBankTranslation';
import { ReviewSessionShell } from './ReviewSessionShell';
import { ReviewResultsScreen } from './ReviewResultsScreen';
import { ReviewActionFooter } from './ReviewActionFooter';
import { VocabReviewExerciseFrame } from './VocabReviewExerciseFrame';
import { REVIEW_THEMES } from './reviewThemes';
import type { VocabReviewItem } from '@/app/actions/generateVocabReview';
import type { UserVocabularyDocument, SupportedLanguage } from '@/types';
import type { ReviewResult } from './reviewTypes';

const THEME = REVIEW_THEMES.context;

interface ContextReviewSessionProps {
  state: 'running' | 'done';
  items: VocabReviewItem[];
  sessionItems: UserVocabularyDocument[];
  currentIdx: number;
  answered: boolean;
  lastCorrect: boolean | null;
  results: ReviewResult[];
  language: SupportedLanguage;
  wordImageMap: Record<string, string>;
  savingResults: boolean;
  hasMoreDue?: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export function ContextReviewSession({
  state,
  items,
  sessionItems,
  currentIdx,
  answered,
  lastCorrect,
  results,
  language,
  wordImageMap,
  savingResults,
  hasMoreDue,
  onAnswer,
  onContinue,
  onFinish,
  onClose,
}: ContextReviewSessionProps) {
  const total = items.length;
  const currentItem = state === 'running' ? items[currentIdx] : null;
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  const sessionWord = sessionItems.find((s) => s.word === currentItem?.word);

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

  if (!currentItem) return null;

  const exercise = currentItem.exercise;
  const wordImage = wordImageMap[currentItem.word];
  const exerciseType =
    exercise.type === 'context-choice' ||
    exercise.type === 'reverse-translation' ||
    exercise.type === 'word-bank-translation'
      ? exercise.type
      : 'context-choice';

  const footer = (
    <ReviewActionFooter
      theme={THEME}
      answered={answered}
      lastCorrect={lastCorrect}
      isExerciseReady={isExerciseReady}
      isLast={currentIdx + 1 >= total}
      feedbackCorrect="Ótimo! Você usou a palavra no contexto certo."
      feedbackWrong={
        sessionWord?.translation
          ? `A resposta era ligada a "${sessionWord.word}" (${sessionWord.translation}).`
          : 'Revise a frase e tente na próxima.'
      }
      onSubmit={() => setSubmitTrigger((t) => t + 1)}
      onContinue={onContinue}
    />
  );

  return (
    <ReviewSessionShell
      theme={THEME}
      current={currentIdx + 1}
      total={total}
      onCloseRequest={onClose}
      footer={footer}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide px-5 pt-3 mx-auto max-w-lg w-full animate-slide-up pb-[max(1rem,env(safe-area-inset-bottom))]">
        <VocabReviewExerciseFrame
          theme={THEME}
          exerciseType={exerciseType}
          word={currentItem.word}
          translation={sessionWord?.translation}
          wordImage={wordImage}
          language={language}
        >
          {exercise.type === 'context-choice' && (
            <ContextChoiceExercise
              data={exercise.data}
              onAnswer={onAnswer}
              answered={answered}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          )}

          {exercise.type === 'reverse-translation' && (
            <ReverseTranslationInput
              data={exercise.data}
              language={language}
              onAnswer={onAnswer}
              answered={answered}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          )}

          {exercise.type === 'word-bank-translation' && (
            <WordBankTranslation
              data={exercise.data}
              onAnswer={onAnswer}
              answered={answered}
              setIsExerciseReady={setIsExerciseReady}
              submitTrigger={submitTrigger}
            />
          )}
        </VocabReviewExerciseFrame>
      </div>
    </ReviewSessionShell>
  );
}

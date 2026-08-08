'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { buildGrammarSteps } from '@/lib/grammarBridgeSteps';
import { GrammarStepProgress } from './GrammarStepProgress';
import { GrammarStepRenderer } from './GrammarStepRenderer';
import { useGrammarSwipe } from './useGrammarSwipe';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { devLog } from '@/lib/devLog';
import type { GrammarBridgeResult, LessonTag, SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../ClickableWord';

interface GrammarBridgeFlowProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
  tag?: LessonTag;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  onComplete?: (complete: boolean) => void;
  onAdvanceToPractice?: () => void;
  onQuizCorrect?: (correct: boolean) => void;
  previewMode?: boolean;
  /** True while practice exercises are still generating in the background. */
  isPreparingPractice?: boolean;
  /** True when the user already tapped advance and we're awaiting the session. */
  isAdvancingToPractice?: boolean;
  /** True when prefetch settled with a usable exercise set. */
  exercisesReady?: boolean;
}

export function GrammarBridgeFlow({
  bridge,
  language,
  tag,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  onComplete,
  onAdvanceToPractice,
  onQuizCorrect,
  previewMode = false,
  isPreparingPractice = false,
  isAdvancingToPractice = false,
  exercisesReady = false,
}: GrammarBridgeFlowProps) {
  const { play } = useSoundEffects();

  const steps = useMemo(
    () => buildGrammarSteps(bridge, language, tag),
    [bridge, language, tag],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const currentStep = steps[currentIndex];
  const isLastStep = currentIndex >= steps.length - 1;
  const isFirstStep = currentIndex === 0;
  const isQuizStep = currentStep?.type === 'quiz';
  const canContinue = previewMode || !isQuizStep || quizAnswered;
  const readyForPractice = isLastStep && canContinue;
  const showPreparingCta =
    readyForPractice && (isPreparingPractice || isAdvancingToPractice) && !previewMode;
  const practiceCtaDisabled =
    isAdvancingToPractice || (isPreparingPractice && !exercisesReady);

  useEffect(() => {
    if (steps.length === 0) {
      onComplete?.(true);
    }
  }, [steps.length, onComplete]);

  useEffect(() => {
    onComplete?.(readyForPractice);
  }, [readyForPractice, onComplete]);

  useEffect(() => {
    setQuizAnswered(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!readyForPractice || previewMode) return;
    if (isPreparingPractice || isAdvancingToPractice) {
      devLog(
        `[GrammarBridge] Último passo — exercícios preparando (ready=${exercisesReady}, advancing=${isAdvancingToPractice})`,
      );
    } else if (exercisesReady) {
      devLog('[GrammarBridge] Último passo — exercícios prontos (prefetch ready)');
    }
  }, [
    readyForPractice,
    isPreparingPractice,
    isAdvancingToPractice,
    exercisesReady,
    previewMode,
  ]);

  const goNext = useCallback(() => {
    if (!canContinue || isLastStep) return;
    setSlideDirection('left');
    setCurrentIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [canContinue, isLastStep, steps.length]);

  const goPrev = useCallback(() => {
    if (isFirstStep) return;
    setSlideDirection('right');
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, [isFirstStep]);

  const { onTouchStart, onTouchEnd } = useGrammarSwipe(
    goPrev,
    goNext,
    !isFirstStep,
    !isLastStep && canContinue,
  );

  const handlePrimaryAction = useCallback(() => {
    if (readyForPractice && onAdvanceToPractice) {
      onAdvanceToPractice();
      return;
    }
    goNext();
  }, [readyForPractice, onAdvanceToPractice, goNext]);

  const handleAdvanceToPractice = useCallback(() => {
    play('tap');
    onAdvanceToPractice?.();
  }, [play, onAdvanceToPractice]);

  const handlePlaySound = useCallback(
    (type: 'correct' | 'incorrect') => {
      play(type);
    },
    [play],
  );

  if (steps.length === 0 || !currentStep) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationClass = prefersReducedMotion ? '' : 'animate-slide-up-spring';

  return (
    <div
      className="group/card relative rounded-2xl sm:rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-md flex flex-col"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex flex-col p-4 sm:p-5 gap-4 sm:gap-5">
        <GrammarStepProgress
          step={currentStep}
          allSteps={steps}
          currentIndex={currentIndex}
        />

        <div
          key={currentStep.id}
          className={['flex w-full items-start justify-center', animationClass].join(' ')}
          onAnimationEnd={() => setSlideDirection(null)}
        >
          <GrammarStepRenderer
            step={currentStep}
            language={language}
            newVocabulary={newVocabulary}
            newVerbs={newVerbs}
            onWordClick={onWordClick}
            onQuizAnswered={(correct) => {
              setQuizAnswered(true);
              onQuizCorrect?.(correct);
            }}
            onPlaySound={handlePlaySound}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 sm:pt-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirstStep}
            className={[
              'flex items-center gap-1 rounded-xl px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border transition-all min-h-[44px]',
              isFirstStep
                ? 'opacity-0 pointer-events-none border-transparent'
                : 'border-border text-text-secondary hover:bg-surface-raised',
            ].join(' ')}
            aria-label="Voltar"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>

          {readyForPractice && onAdvanceToPractice && !previewMode ? (
            <button
              type="button"
              onClick={handleAdvanceToPractice}
              disabled={practiceCtaDisabled}
              aria-busy={showPreparingCta}
              className={[
                'flex items-center gap-1.5 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black transition-all min-h-[44px]',
                practiceCtaDisabled
                  ? 'bg-surface-raised text-text-secondary border border-border cursor-wait'
                  : 'bg-primary text-white border border-b-[3px] border-primary-dark active:translate-y-[1px] active:border-b-[1px]',
              ].join(' ')}
            >
              {showPreparingCta ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  Preparando exercícios…
                </>
              ) : (
                <>Praticar agora 💪</>
              )}
            </button>
          ) : !isLastStep ? (
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={!canContinue}
              className={[
                'flex items-center gap-1 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black transition-all min-h-[44px]',
                canContinue
                  ? 'bg-primary text-white border border-b-[3px] border-primary-dark active:translate-y-[1px] active:border-b-[1px]'
                  : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed',
              ].join(' ')}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <span className="text-xs font-semibold text-text-muted text-center flex-1">
              {canContinue ? 'Pronto para praticar!' : 'Responda o teste para continuar'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

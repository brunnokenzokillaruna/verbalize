'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateFreeResponse } from '@/app/actions/evaluateFreeResponse';
import type { EvaluateFreeResponseParams } from '@/lib/evaluateFreeResponse/types';
import type { ProductionStatKind } from '@/lib/practiceExercises/productionTypes';
import { incrementProductionStats } from '@/services/firestore';
import { markSpontaneousProductionAccepted } from '@/lib/sessionProductionTracking';
import { useAuthStore } from '@/store/authStore';

export type FreeWrittenPhase = 'idle' | 'evaluating' | 'correct' | 'retry' | 'answered';

interface UseFreeWrittenProductionOptions {
  buildEvaluateParams: (text: string) => Omit<EvaluateFreeResponseParams, 'transcript'>;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
  statsKind?: ProductionStatKind;
  exerciseType?: string;
  minLength?: number;
}

export function useFreeWrittenProduction({
  buildEvaluateParams,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
  statsKind = 'freeWrite',
  exerciseType,
  minLength = 2,
}: UseFreeWrittenProductionOptions) {
  const { user } = useAuthStore();
  const statsLoggedRef = useRef(false);
  const initialSubmitTriggerRef = useRef(submitTrigger);

  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<FreeWrittenPhase>(answered ? 'answered' : 'idle');
  const [feedback, setFeedback] = useState('');
  const [suggested, setSuggested] = useState('');

  const trimmed = input.trim();
  const isBusy = phase === 'evaluating';
  const isLocked = answered || phase === 'answered' || isBusy;

  useEffect(() => {
    if (answered || phase === 'answered') {
      setIsExerciseReady(false);
      return;
    }
    setIsExerciseReady(trimmed.length >= minLength && !isBusy);
  }, [trimmed, minLength, isBusy, answered, phase, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger === initialSubmitTriggerRef.current) return;
    if (answered || phase === 'answered' || isBusy) return;
    if (trimmed.length >= minLength) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const logStats = useCallback(
    (accepted: boolean) => {
      if (!user || statsLoggedRef.current) return;
      statsLoggedRef.current = true;
      incrementProductionStats(user.uid, statsKind, accepted).catch(console.error);
      if (accepted) {
        markSpontaneousProductionAccepted(statsKind, exerciseType);
      }
    },
    [user, statsKind, exerciseType],
  );

  const finish = useCallback(
    (accepted: boolean) => {
      setPhase('answered');
      logStats(accepted);
      onAnswer(accepted);
    },
    [logStats, onAnswer],
  );

  const submit = useCallback(async () => {
    if (trimmed.length < minLength || isLocked) return;

    setPhase('evaluating');
    setFeedback('');
    setSuggested('');

    const result = await evaluateFreeResponse({
      ...buildEvaluateParams(trimmed),
      transcript: trimmed,
    });

    if (result.error) {
      setPhase('idle');
      setFeedback(result.feedback);
      return;
    }

    setFeedback(result.feedback);
    setSuggested(result.correctedSentence || '');

    if (result.isCorrect) {
      setPhase('correct');
      finish(true);
    } else {
      setPhase('retry');
    }
  }, [trimmed, minLength, isLocked, buildEvaluateParams, finish]);

  const continueAnyway = useCallback(() => {
    finish(false);
  }, [finish]);

  const retry = useCallback(() => {
    setPhase('idle');
    setFeedback('');
    setSuggested('');
    statsLoggedRef.current = false;
  }, []);

  return {
    input,
    setInput,
    phase,
    feedback,
    suggested,
    isBusy,
    isLocked,
    submit,
    continueAnyway,
    retry,
  };
}

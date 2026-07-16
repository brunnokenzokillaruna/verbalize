'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeSpeech } from '@/app/actions/transcribeSpeech';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { formatProductionPolishHint } from '@/lib/elaborationHints';
import { incrementProductionStats } from '@/services/firestore';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { markSpontaneousProductionAccepted } from '@/lib/sessionProductionTracking';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import type { EvaluateFreeResponseResult } from '@/lib/evaluateFreeResponse/types';
import type { ProductionStatKind } from '@/lib/practiceExercises/productionTypes';
import type { SupportedLanguage } from '@/types';

export type OralProductionPhase =
  | 'idle'
  | 'requesting-mic'
  | 'recording'
  | 'transcribing'
  | 'evaluating'
  | 'review-correct'
  | 'review-retry'
  | 'answered';

export interface UseOralProductionOptions {
  language: SupportedLanguage;
  transcriptionPrompt?: string;
  evaluate: (transcript: string) => Promise<EvaluateFreeResponseResult>;
  onComplete?: (accepted: boolean, transcript: string) => void;
  statsKind?: ProductionStatKind;
  initialPhase?: OralProductionPhase;
  initialTranscript?: string;
}

export interface UseOralProductionReturn {
  phase: OralProductionPhase;
  transcript: string;
  recordError: string;
  evalFeedback: string;
  evalCorrected: string;
  evaluator: EvaluateFreeResponseResult['evaluator'];
  hasSpeechAPI: boolean;
  isBusy: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  retry: () => void;
  confirm: () => void;
  skip: () => void;
}

export function useOralProduction({
  language,
  transcriptionPrompt = '',
  evaluate,
  onComplete,
  statsKind = 'oralSpontaneous',
  initialPhase = 'idle',
  initialTranscript = '',
}: UseOralProductionOptions): UseOralProductionReturn {
  const { user } = useAuthStore();
  const recorder = useVoiceRecorder();
  const statsLoggedRef = useRef(false);
  const outcomeLoggedRef = useRef(false);

  const [phase, setPhase] = useState<OralProductionPhase>(initialPhase);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [recordError, setRecordError] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalCorrected, setEvalCorrected] = useState('');
  const [evaluator, setEvaluator] = useState<EvaluateFreeResponseResult['evaluator']>();

  const hasSpeechAPI = recorder.isSupported;
  const isBusy =
    phase === 'requesting-mic' ||
    phase === 'recording' ||
    phase === 'transcribing' ||
    phase === 'evaluating';

  const logStats = useCallback(
    (accepted: boolean) => {
      if (!user || statsLoggedRef.current) return;
      statsLoggedRef.current = true;
      incrementProductionStats(user.uid, statsKind, accepted).catch(console.error);
      if (accepted) {
        markSpontaneousProductionAccepted(statsKind);
      }
    },
    [user, statsKind],
  );

  const logOutcome = useCallback(
    (outcome: 'completed' | 'skipped') => {
      if (!user || outcomeLoggedRef.current) return;
      outcomeLoggedRef.current = true;
      recordOralExerciseOutcome(user.uid, outcome);
    },
    [user],
  );

  const finish = useCallback(
    (accepted: boolean, finalTranscript: string, outcome: 'completed' | 'skipped' = 'completed') => {
      if (accepted && outcome === 'completed') {
        const polishHint = formatProductionPolishHint(finalTranscript, evalCorrected);
        useLessonStore.getState().setLastProductionPolishHint(polishHint);
      } else {
        useLessonStore.getState().setLastProductionPolishHint(null);
      }
      setPhase('answered');
      logStats(accepted);
      logOutcome(outcome);
      onComplete?.(accepted, finalTranscript);
    },
    [logStats, logOutcome, onComplete, evalCorrected],
  );

  const startRecording = useCallback(async () => {
    if (isBusy || phase === 'answered') return;
    setRecordError('');
    setTranscript('');
    setEvalFeedback('');
    setEvalCorrected('');
    setEvaluator(undefined);
    statsLoggedRef.current = false;
    outcomeLoggedRef.current = false;
    setPhase('requesting-mic');

    await recorder.start();
    if (recorder.error) {
      setPhase('idle');
      setRecordError(recorder.error);
      return;
    }
    setPhase('recording');
  }, [isBusy, phase, recorder]);

  const stopRecording = useCallback(async () => {
    if (phase !== 'recording') return;
    setPhase('transcribing');

    const blob = await recorder.stop();
    if (!blob) {
      setPhase('idle');
      setRecordError(recorder.error || 'Nenhuma fala detectada. Tente de novo.');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', blob, 'utterance.webm');
      form.append('language', language);
      if (transcriptionPrompt) {
        form.append('prompt', transcriptionPrompt);
      }

      const result = await transcribeSpeech(form);
      if ('error' in result) {
        setPhase('idle');
        setRecordError(result.error);
        return;
      }

      const said = result.text.trim();
      setTranscript(said);
      setPhase('evaluating');

      const evalResult = await evaluate(said);
      if (evalResult.error) {
        setPhase('idle');
        setRecordError(evalResult.feedback);
        return;
      }

      setEvalFeedback(evalResult.feedback);
      setEvalCorrected(evalResult.correctedSentence || '');
      setEvaluator(evalResult.evaluator);
      setPhase(evalResult.isCorrect ? 'review-correct' : 'review-retry');
    } catch (err) {
      console.error('[useOralProduction] pipeline failed:', err);
      setPhase('idle');
      setRecordError('Erro ao processar sua fala. Tente de novo.');
    }
  }, [phase, recorder, language, transcriptionPrompt, evaluate]);

  const retry = useCallback(() => {
    void startRecording();
  }, [startRecording]);

  const confirm = useCallback(() => {
    const accepted = phase === 'review-correct';
    finish(accepted, transcript);
  }, [phase, finish, transcript]);

  const skip = useCallback(() => {
    finish(true, transcript, 'skipped');
  }, [finish, transcript]);

  useEffect(() => {
    if (initialPhase === 'answered') {
      statsLoggedRef.current = true;
      outcomeLoggedRef.current = true;
    }
  }, [initialPhase]);

  return {
    phase,
    transcript,
    recordError,
    evalFeedback,
    evalCorrected,
    evaluator,
    hasSpeechAPI,
    isBusy,
    startRecording,
    stopRecording,
    retry,
    confirm,
    skip,
  };
}

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Ear, Volume2 } from 'lucide-react';
import { evaluateFreeResponse } from '@/app/actions/evaluateFreeResponse';
import { OralProductionShell } from '@/components/lesson/OralProductionShell';
import { useDialoguePlayback } from '@/hooks/useDialoguePlayback';
import { useOralProduction } from '@/hooks/useOralProduction';
import { sanitizeListenAndRespondFields } from '@/lib/listenAndRespondAudio';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { useAuthStore } from '@/store/authStore';
import type { ListenAndRespondData, ProficiencyLevel, SupportedLanguage } from '@/types';

interface ListenAndRespondExerciseProps {
  data: ListenAndRespondData;
  language: SupportedLanguage;
  level?: ProficiencyLevel;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
  /** Lesson hook dialogue — used to avoid replaying it as the exercise audio. */
  lessonDialogue?: string;
}

export function ListenAndRespondExercise({
  data,
  language,
  level = 'A1',
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
  lessonDialogue,
}: ListenAndRespondExerciseProps) {
  const { user } = useAuthStore();

  const playbackAudio = useMemo(
    () =>
      sanitizeListenAndRespondFields({
        dialogueAudio: data.dialogueAudio,
        promptLine: data.promptLine,
        lessonDialogue,
      }).dialogueAudio,
    [data.dialogueAudio, data.promptLine, lessonDialogue],
  );

  const dialogue = useDialoguePlayback({
    dialogueAudio: playbackAudio,
    language,
    level,
  });

  const evaluate = useCallback(
    (transcript: string) =>
      evaluateFreeResponse({
        transcript,
        intent: data.contextPt,
        language,
        previousContext: dialogue.lines.slice(0, -1),
        expectedLine: data.exampleResponse,
        promptLine: data.promptLine,
        evaluationCriteria: data.evaluationCriteria,
        acceptableThemes: data.acceptableThemes,
      }),
    [data, language, dialogue.lines],
  );

  const oral = useOralProduction({
    language,
    transcriptionPrompt: data.promptLine,
    evaluate,
    statsKind: 'oralSpontaneous',
    initialPhase: answered ? 'answered' : 'idle',
    onComplete: (accepted) => onAnswer(accepted),
  });

  const initialSubmitTriggerRef = useRef(submitTrigger);

  useEffect(() => {
    if (answered) {
      setIsExerciseReady(false);
      return;
    }

    const inReview =
      oral.phase === 'review-correct' || oral.phase === 'review-retry';
    const canSkipWithoutMic = !oral.hasSpeechAPI && dialogue.hasListened;

    setIsExerciseReady(
      dialogue.hasListened && (inReview || canSkipWithoutMic || !!oral.recordError),
    );
  }, [
    answered,
    dialogue.hasListened,
    oral.phase,
    oral.hasSpeechAPI,
    oral.recordError,
    setIsExerciseReady,
  ]);

  useEffect(() => {
    if (submitTrigger === initialSubmitTriggerRef.current) return;
    if (answered || oral.phase === 'answered') return;
    if (oral.phase === 'review-correct' || oral.phase === 'review-retry') {
      oral.confirm();
    } else {
      recordOralExerciseOutcome(user?.uid, 'skipped');
      onAnswer(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 p-5 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-60">
          Situação
        </p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] leading-relaxed">
          {data.contextPt}
        </p>
      </div>

      <button
        type="button"
        onClick={dialogue.handlePlay}
        disabled={dialogue.isLoadingAudio || answered}
        className="flex items-center justify-center gap-2 rounded-xl border border-b-[3px] border-border bg-surface px-4 py-4 text-sm font-bold transition-all active:translate-y-[2px] disabled:opacity-60"
      >
        <Volume2
          size={18}
          className={dialogue.isPlaying ? 'text-primary animate-pulse' : ''}
        />
        {dialogue.isLoadingAudio
          ? 'Carregando áudio…'
          : dialogue.isPlaying
            ? 'Reproduzindo…'
            : 'Ouvir o interlocutor'}
      </button>

      {!dialogue.hasListened && (
        <p className="flex items-center justify-center gap-2 text-xs text-center text-text-muted">
          <Ear size={14} />
          Ouça o que a outra pessoa diz — depois responda em voz alta. O texto fica oculto de propósito.
        </p>
      )}

      {dialogue.hasListened && !answered && (
        <div className="animate-slide-up">
          <OralProductionShell
            state={oral}
            recordLabel="Gravar minha resposta"
            evaluatingLabel="Analisando adequação da resposta…"
            onContinueWithoutMic={() => {
              recordOralExerciseOutcome(user?.uid, 'skipped');
              onAnswer(true);
            }}
          >
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
              Responda em voz alta como você falaria nesta situação.
            </p>
          </OralProductionShell>
        </div>
      )}

      <span className="sr-only">{playbackAudio}</span>
    </div>
  );
}

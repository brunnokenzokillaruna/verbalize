'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ListChecks, Mic, Podcast } from 'lucide-react';
import { evaluateFreeResponse } from '@/app/actions/evaluateFreeResponse';
import { OralProductionShell } from '@/components/lesson/OralProductionShell';
import { useOralProduction } from '@/hooks/useOralProduction';
import { recordOralExerciseOutcome } from '@/lib/oralExerciseTracking';
import { useAuthStore } from '@/store/authStore';
import type { PromptedMonologueData, SupportedLanguage } from '@/types';

interface PromptedMonologueExerciseProps {
  data: PromptedMonologueData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

const MIN_MONOLOGUE_WORDS = 6;

export function PromptedMonologueExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: PromptedMonologueExerciseProps) {
  const { user } = useAuthStore();
  const evaluate = useCallback(
    async (transcript: string) => {
      const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_MONOLOGUE_WORDS) {
        return {
          isCorrect: false,
          feedback: `Monólogo muito curto (${wordCount} palavras). Fale por mais tempo — pelo menos ${MIN_MONOLOGUE_WORDS} palavras.`,
          evaluator: 'local' as const,
        };
      }

      return evaluateFreeResponse({
        transcript,
        intent: `${data.contextPt} ${data.promptPt} ${data.speakingGoalPt}`,
        language,
        previousContext: [],
        expectedLine: data.exampleMonologue,
        evaluationCriteria: data.evaluationCriteria,
        acceptableThemes: data.acceptableThemes,
      });
    },
    [data, language],
  );

  const oral = useOralProduction({
    language,
    transcriptionPrompt: data.exampleMonologue,
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

    setIsExerciseReady(inReview || !oral.hasSpeechAPI || !!oral.recordError);
  }, [answered, oral.phase, oral.hasSpeechAPI, oral.recordError, setIsExerciseReady]);

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
      <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{
          backgroundColor: 'rgba(225, 29, 72, 0.08)',
          borderColor: 'rgba(225, 29, 72, 0.25)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(225, 29, 72, 0.15)', color: '#e11d48' }}
        >
          <Podcast size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#e11d48] mb-1">
            Mini-monólogo
          </p>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
            {data.contextPt}
          </p>
        </div>
      </div>

      <div className="rounded-xl p-5 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)] space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
          Tema
        </p>
        <p className="text-lg font-bold leading-relaxed text-[var(--color-text-primary)]">
          {data.promptPt}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
          <Mic size={14} className="text-[#e11d48] shrink-0" />
          {data.speakingGoalPt}
        </p>
      </div>

      {data.keyPoints && data.keyPoints.length > 0 && (
        <div
          className="rounded-xl p-4 border border-dashed"
          style={{
            backgroundColor: 'rgba(225, 29, 72, 0.04)',
            borderColor: 'rgba(225, 29, 72, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={14} className="text-[#e11d48]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
              Pontos para abordar
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 pl-1">
            {data.keyPoints.map((point) => (
              <li
                key={point}
                className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex gap-2"
              >
                <span className="text-[#e11d48] font-bold">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!answered && (
        <OralProductionShell
          state={oral}
          recordLabel="Gravar meu monólogo"
          evaluatingLabel="Analisando coerência e conteúdo…"
          onContinueWithoutMic={() => {
            recordOralExerciseOutcome(user?.uid, 'skipped');
            onAnswer(true);
          }}
        >
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
            Fale de forma espontânea — não precisa memorizar frases prontas.
          </p>
        </OralProductionShell>
      )}

      {answered && oral.transcript && (
        <div className="rounded-xl p-4 bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
            Sua fala registrada
          </p>
          <p className="text-sm font-semibold italic leading-relaxed text-[var(--color-text-primary)]">
            &ldquo;{oral.transcript}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

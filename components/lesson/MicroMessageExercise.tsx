'use client';

import { useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { FreeWrittenProductionField } from '@/components/lesson/FreeWrittenProductionField';
import { useFreeWrittenProduction } from '@/hooks/useFreeWrittenProduction';
import type { MicroMessageData, SupportedLanguage } from '@/types';

interface MicroMessageExerciseProps {
  data: MicroMessageData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function MicroMessageExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: MicroMessageExerciseProps) {
  const buildEvaluateParams = useCallback(
    () => ({
      intent: `${data.context} Responda à mensagem recebida.`,
      language,
      previousContext: [data.incomingMessage],
      expectedLine: data.exampleResponse,
      promptLine: data.incomingMessage,
      evaluationCriteria: data.evaluationCriteria,
      acceptableThemes: [],
    }),
    [data, language],
  );

  const production = useFreeWrittenProduction({
    buildEvaluateParams,
    onAnswer,
    answered,
    setIsExerciseReady,
    submitTrigger,
    statsKind: 'freeWrite',
    exerciseType: 'micro-message',
    minLength: 2,
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
          <MessageCircle size={14} className="text-[var(--color-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Contexto</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed italic">
          {data.context}
        </p>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-lg border border-[var(--color-border)]">
          📩
        </div>
        <div className="flex flex-col gap-1 max-w-[88%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
            Mensagem recebida
          </span>
          <div
            className="rounded-2xl rounded-tl-none px-4 py-3 border border-[var(--color-border)]"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {data.incomingMessage}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2 italic border-t border-[var(--color-border)] pt-2">
              {data.translation}
            </p>
          </div>
        </div>
      </div>

      <FreeWrittenProductionField
        input={production.input}
        onInputChange={production.setInput}
        phase={production.phase}
        feedback={production.feedback}
        suggested={production.suggested}
        isBusy={production.isBusy}
        isLocked={production.isLocked}
        placeholder="Digite sua resposta curta…"
        helperLabel="Sua resposta"
        onSubmit={() => void production.submit()}
        onContinueAnyway={production.continueAnyway}
        onRetry={production.retry}
        language={language}
      />
    </div>
  );
}

'use client';

import { useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import { FreeWrittenProductionField } from '@/components/lesson/FreeWrittenProductionField';
import { RoleplayScenarioCard } from '@/components/lesson/RoleplayScenarioCard';
import { useFreeWrittenProduction } from '@/hooks/useFreeWrittenProduction';
import type { FreeRoleplayData, SupportedLanguage } from '@/types';

interface FreeRoleplayExerciseProps {
  data: FreeRoleplayData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function FreeRoleplayExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: FreeRoleplayExerciseProps) {
  const buildEvaluateParams = useCallback(
    () => ({
      intent: data.context,
      language,
      previousContext: [data.promptLine],
      expectedLine: data.exampleResponse,
      promptLine: data.promptLine,
      evaluationCriteria: data.evaluationCriteria,
      acceptableThemes: data.acceptableThemes,
      openEnded: true,
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
    exerciseType: 'free-roleplay',
    minLength: 3,
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RoleplayScenarioCard context={data.context} promptLine={data.promptLine} />

      <FreeWrittenProductionField
        input={production.input}
        onInputChange={production.setInput}
        phase={production.phase}
        feedback={production.feedback}
        suggested={production.suggested}
        isBusy={production.isBusy}
        isLocked={production.isLocked}
        placeholder="Escreva como você responderia…"
        helperLabel="Escreva sua resposta"
        onSubmit={() => void production.submit()}
        onContinueAnyway={production.continueAnyway}
        onRetry={production.retry}
        language={language}
      />

      {answered && (
        <div
          className="rounded-xl p-4.5 border-l-4 border-[var(--color-primary)]"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Uma resposta modelo
            </span>
          </div>
          {/* The sentence must be shown, because the explanation below comments on
              it — not on what the learner wrote. */}
          <p className="text-sm font-semibold italic leading-relaxed text-[var(--color-text-primary)]">
            {data.exampleResponse}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {data.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

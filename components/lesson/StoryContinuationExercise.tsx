'use client';

import { useCallback, useState } from 'react';
import { BookOpen, ChevronDown, Lightbulb } from 'lucide-react';
import { FreeWrittenProductionField } from '@/components/lesson/FreeWrittenProductionField';
import { useFreeWrittenProduction } from '@/hooks/useFreeWrittenProduction';
import type { StoryContinuationData, SupportedLanguage } from '@/types';

interface StoryContinuationExerciseProps {
  data: StoryContinuationData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function StoryContinuationExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: StoryContinuationExerciseProps) {
  const [translationOpen, setTranslationOpen] = useState(false);

  const buildEvaluateParams = useCallback(
    () => ({
      intent: `${data.contextPt} ${data.promptPt}`,
      language,
      previousContext: [data.storyOpening],
      expectedLine: data.exampleContinuation,
      promptLine: data.storyOpening,
      evaluationCriteria: data.evaluationCriteria,
      acceptableThemes: data.acceptableThemes,
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
    exerciseType: 'story-continuation',
    minLength: 8,
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{
          backgroundColor: 'rgba(180, 83, 9, 0.08)',
          borderColor: 'rgba(180, 83, 9, 0.25)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(180, 83, 9, 0.15)', color: '#b45309' }}
        >
          <BookOpen size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#b45309] mb-1">
            Micro-história
          </p>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-primary)]">
            {data.contextPt}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-5 border border-dashed"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'rgba(180, 83, 9, 0.25)',
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          Início da história
        </p>
        <p className="text-base font-semibold leading-relaxed text-[var(--color-text-primary)] whitespace-pre-line">
          {data.storyOpening}
        </p>

        <button
          type="button"
          onClick={() => setTranslationOpen((o) => !o)}
          className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[#b45309] transition-colors uppercase tracking-widest"
        >
          <div className={`transition-transform duration-300 ${translationOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
          {translationOpen ? 'Esconder tradução' : 'Ver tradução'}
        </button>
        {translationOpen && (
          <p className="mt-3 text-sm italic leading-relaxed text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3">
            {data.storyTranslation}
          </p>
        )}
      </div>

      <div
        className="rounded-xl px-4 py-3 border-l-4"
        style={{
          backgroundColor: 'rgba(180, 83, 9, 0.06)',
          borderColor: '#b45309',
        }}
      >
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{data.promptPt}</p>
      </div>

      <FreeWrittenProductionField
        input={production.input}
        onInputChange={production.setInput}
        phase={production.phase}
        feedback={production.feedback}
        suggested={production.suggested}
        isBusy={production.isBusy}
        isLocked={production.isLocked}
        placeholder="Escreva 1–2 frases continuando a história…"
        helperLabel="Sua continuação"
        onSubmit={() => void production.submit()}
        onContinueAnyway={production.continueAnyway}
        onRetry={production.retry}
        language={language}
      />

      {answered && (
        <div
          className="rounded-xl p-4.5 border-l-4 border-[#b45309]"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} className="text-[#b45309]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Por que funciona
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)] mb-3">
            {data.explanationPt}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">
            Exemplo de continuação
          </p>
          <p className="text-sm font-semibold italic text-[var(--color-text-primary)]">
            {data.exampleContinuation}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useMemo } from 'react';
import { AlertTriangle, Lightbulb, MapPin, UserCog } from 'lucide-react';
import { FreeWrittenProductionField } from '@/components/lesson/FreeWrittenProductionField';
import { useFreeWrittenProduction } from '@/hooks/useFreeWrittenProduction';
import type { SpotTheRegisterData, SupportedLanguage } from '@/types';

interface SpotTheRegisterExerciseProps {
  data: SpotTheRegisterData;
  language: SupportedLanguage;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

export function SpotTheRegisterExercise({
  data,
  language,
  onAnswer,
  answered,
  setIsExerciseReady,
  submitTrigger,
}: SpotTheRegisterExerciseProps) {
  const wrongLine = data.dialogueLines[data.wrongLineIndex] ?? '';
  const contextLines = useMemo(
    () => data.dialogueLines.filter((_, i) => i !== data.wrongLineIndex),
    [data.dialogueLines, data.wrongLineIndex],
  );

  const buildEvaluateParams = useCallback(
    () => ({
      intent: `${data.context} Problema: ${data.registerIssuePt}. Registro esperado: ${data.targetRegisterPt}. Reescreva a fala mantendo a mesma intenção.`,
      language,
      previousContext: contextLines,
      expectedLine: data.correctedLine,
      promptLine: wrongLine,
      evaluationCriteria: data.evaluationCriteria,
      acceptableThemes: data.acceptableThemes,
    }),
    [data, language, contextLines, wrongLine],
  );

  const production = useFreeWrittenProduction({
    buildEvaluateParams,
    onAnswer,
    answered,
    setIsExerciseReady,
    submitTrigger,
    statsKind: 'freeWrite',
    exerciseType: 'spot-the-register',
    minLength: 3,
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <MapPin size={14} className="text-[var(--color-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Cenário</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed italic">
          {data.context}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
          Diálogo
        </p>
        {data.dialogueLines.map((line, index) => {
          const isWrong = index === data.wrongLineIndex;
          return (
            <div
              key={index}
              className="rounded-xl px-4 py-3 border transition-colors"
              style={
                isWrong
                  ? {
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      borderColor: 'rgba(124, 58, 237, 0.35)',
                    }
                  : {
                      backgroundColor: 'var(--color-surface-raised)',
                      borderColor: 'var(--color-border)',
                    }
              }
            >
              <div className="flex items-start gap-2">
                <span
                  className="text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5"
                  style={{ color: isWrong ? '#7c3aed' : 'var(--color-text-muted)' }}
                >
                  {index + 1}.
                </span>
                <p
                  className="text-sm font-semibold leading-relaxed"
                  style={{ color: isWrong ? '#5b21b6' : 'var(--color-text-primary)' }}
                >
                  {line}
                </p>
              </div>
              {isWrong && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">
                  <AlertTriangle size={12} />
                  Registro inadequado
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          borderColor: 'rgba(124, 58, 237, 0.25)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed' }}
        >
          <UserCog size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed] mb-1">
            O que corrigir
          </p>
          <p className="text-sm text-[var(--color-text-primary)] mb-1">{data.registerIssuePt}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Registro esperado: <span className="font-semibold">{data.targetRegisterPt}</span>
          </p>
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
        placeholder="Reescreva a fala destacada…"
        helperLabel="Sua correção"
        onSubmit={() => void production.submit()}
        onContinueAnyway={production.continueAnyway}
        onRetry={production.retry}
        language={language}
      />

      {answered && (
        <div
          className="rounded-xl p-4.5 border-l-4 border-[#7c3aed]"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} className="text-[#7c3aed]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Uma correção modelo
            </span>
          </div>
          {/* Sentence before explanation: the text below comments on this line,
              not on what the learner wrote. */}
          <p className="text-sm font-semibold italic text-[var(--color-text-primary)]">
            {data.correctedLine}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {data.explanationPt}
          </p>
        </div>
      )}
    </div>
  );
}

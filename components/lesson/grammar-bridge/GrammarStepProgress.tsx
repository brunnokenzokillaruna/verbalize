'use client';

import {
  GRAMMAR_PHASE_LABELS,
  type GrammarStep,
} from '@/lib/grammarBridgeSteps';

interface GrammarStepProgressProps {
  step: GrammarStep;
  allSteps: GrammarStep[];
  /** 0-based index of the step currently on screen */
  currentIndex: number;
}

/**
 * Progress trail aligned to actual journey steps (not phase buckets).
 * Each segment = one card the learner will see; filled = visited or current.
 */
export function GrammarStepProgress({
  step,
  allSteps,
  currentIndex,
}: GrammarStepProgressProps) {
  if (allSteps.length <= 1) return null;

  const phaseLabel = GRAMMAR_PHASE_LABELS[step.phase];
  const stepNumber = Math.min(currentIndex + 1, allSteps.length);
  const total = allSteps.length;
  const remaining = Math.max(total - stepNumber, 0);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {phaseLabel} · {stepNumber} de {total}
          {remaining > 0 ? (
            <span className="font-medium normal-case tracking-normal text-text-muted/80">
              {' '}
              · {remaining === 1 ? '1 restante' : `${remaining} restantes`}
            </span>
          ) : null}
        </p>
        <span className="text-xs font-bold text-primary truncate sm:max-w-[50%] sm:text-right">
          {step.label}
        </span>
      </div>

      <div
        className="flex gap-1 sm:gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={stepNumber}
        aria-label={`Etapa ${stepNumber} de ${total}`}
      >
        {allSteps.map((s, i) => {
          const isReached = i <= currentIndex;

          return (
            <div key={s.id} className="flex-1 min-w-0">
              <div className="relative h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className={[
                    'absolute left-0 top-0 h-full w-full bg-gradient-to-r from-primary to-[#2563eb] transition-opacity duration-300 ease-out',
                    isReached ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import {
  GRAMMAR_PHASE_LABELS,
  type GrammarPhase,
  type GrammarStep,
} from '@/lib/grammarBridgeSteps';

interface GrammarStepProgressProps {
  step: GrammarStep;
  allSteps: GrammarStep[];
}

const PHASE_ORDER: GrammarPhase[] = [
  'compreender',
  'evitar_erro',
  'estruturar',
  'aplicar',
  'fixar',
];

export function GrammarStepProgress({ step, allSteps }: GrammarStepProgressProps) {
  if (allSteps.length <= 1) return null;

  const activePhases = PHASE_ORDER.filter((p) => allSteps.some((s) => s.phase === p));
  const phaseLabel = GRAMMAR_PHASE_LABELS[step.phase];

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {phaseLabel} · {step.phaseIndex} de {step.phaseTotal}
        </p>
        <span className="text-xs font-bold text-primary truncate sm:max-w-[50%] sm:text-right">
          {step.label}
        </span>
      </div>

      <div className="flex gap-1 sm:gap-1.5">
        {activePhases.map((phase) => {
          const isActive = step.phase === phase;
          const isPast =
            activePhases.indexOf(phase) < activePhases.indexOf(step.phase);

          return (
            <div key={phase} className="flex-1">
              <div className="relative h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-[#2563eb] transition-all duration-500 ease-out"
                  style={{
                    width: isPast
                      ? '100%'
                      : isActive
                        ? `${(step.phaseIndex / step.phaseTotal) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

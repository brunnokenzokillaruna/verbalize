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
    <div className="flex flex-col gap-3 px-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
          {phaseLabel} · {step.phaseIndex} de {step.phaseTotal}
        </p>
        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wide truncate max-w-[45%]">
          {step.label}
        </span>
      </div>

      <div className="flex gap-1">
        {activePhases.map((phase) => {
          const phaseSteps = allSteps.filter((s) => s.phase === phase);
          const isActive = step.phase === phase;
          const isPast =
            activePhases.indexOf(phase) < activePhases.indexOf(step.phase);

          return (
            <div key={phase} className="flex-1 flex flex-col gap-1">
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--color-primary)] to-[#2563eb] transition-all duration-500 ease-out"
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

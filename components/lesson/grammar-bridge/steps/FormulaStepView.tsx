'use client';

import { FormulaRenderer } from '../shared';
import type { FormulaStep } from '@/lib/grammarBridgeSteps';

export function FormulaStepView({ step }: { step: FormulaStep }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Fórmula da Estrutura
      </span>
      <FormulaRenderer
        structureFormula={step.data.structureFormula}
        structureFormulas={step.data.structureFormulas}
      />
    </div>
  );
}

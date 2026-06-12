'use client';

import { FormulaRenderer } from '../shared';
import type { FormulaStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface FormulaStepViewProps {
  step: FormulaStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function FormulaStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: FormulaStepViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Fórmula da Estrutura
      </span>
      <FormulaRenderer
        structureFormula={step.data.structureFormula}
        structureFormulas={step.data.structureFormulas}
        formulaExample={step.data.formulaExample}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
      />
    </div>
  );
}

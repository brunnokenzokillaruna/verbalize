'use client';

import { FormulaLine } from '../shared';
import type { SynthesisStep } from '@/lib/grammarBridgeSteps';

export function SynthesisStepView({ step }: { step: SynthesisStep }) {
  const { survivalTip, formula, formulas, insight, trap } = step.data;
  const formulaItems = formulas?.length ? formulas : formula ? [{ formula }] : [];
  // Legacy cached bridges may still carry insight/trap — ignore them for the anchor UI.
  void insight;
  void trap;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
      <div className="text-center">
        <span className="grammar-step-label">Âncora — o que levar daqui</span>
      </div>

      {survivalTip && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
          <span className="text-sm shrink-0">🛡️</span>
          <p className="grammar-body font-semibold text-text-primary leading-relaxed">
            {survivalTip}
          </p>
        </div>
      )}

      {formulaItems.length > 0 && (
        <div className="flex flex-col gap-3 items-center w-full">
          <span className="grammar-step-label">Lembre a forma</span>
          {formulaItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 items-center w-full">
              {item.label && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide text-center">
                  {item.label}
                </span>
              )}
              <FormulaLine formula={item.formula} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

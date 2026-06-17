'use client';

import { FormulaLine } from '../shared';
import type { SynthesisStep } from '@/lib/grammarBridgeSteps';

export function SynthesisStepView({ step }: { step: SynthesisStep }) {
  const { insight, survivalTip, formula, formulas, trap } = step.data;
  const formulaItems = formulas?.length ? formulas : formula ? [{ formula }] : [];

  return (
    <div className="flex flex-col gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
      <div className="text-center">
        <span className="grammar-step-label">Síntese — o que ficar na cabeça</span>
      </div>

      {insight && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
          <p className="grammar-secondary font-semibold text-text-primary text-center leading-snug">
            {insight}
          </p>
        </div>
      )}

      {formulaItems.length > 0 && (
        <div className="flex flex-col gap-3 items-center w-full">
          <span className="grammar-step-label">
            {formulaItems.length > 1 ? 'Fórmulas' : 'Fórmula'}
          </span>
          {formulaItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 items-center w-full">
              {item.label && formulaItems.length > 1 && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide text-center">
                  {item.label}
                </span>
              )}
              {item.hint && (
                <p className="text-xs text-text-muted text-center max-w-sm leading-relaxed">
                  {item.hint}
                </p>
              )}
              <FormulaLine formula={item.formula} />
            </div>
          ))}
        </div>
      )}

      {trap && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5">
            <span className="text-xs font-bold text-red-500 uppercase">❌ Evite</span>
            <p className="grammar-secondary font-bold text-text-secondary mt-1.5 line-clamp-3">
              &ldquo;{trap.wrong}&rdquo;
            </p>
            {trap.wrongPortuguese && (
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{trap.wrongPortuguese}</p>
            )}
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
            <span className="text-xs font-bold text-emerald-500 uppercase">✅ Use</span>
            <p className="grammar-body font-bold text-text-primary mt-1.5 line-clamp-3">
              &ldquo;{trap.right}&rdquo;
            </p>
            {trap.rightPortuguese && (
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{trap.rightPortuguese}</p>
            )}
          </div>
        </div>
      )}

      {survivalTip && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
          <span className="text-sm shrink-0">🛡️</span>
          <p className="grammar-body font-semibold text-text-primary leading-relaxed">
            {survivalTip}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { FormulaLine } from '../shared';
import type { SynthesisStep } from '@/lib/grammarBridgeSteps';

export function SynthesisStepView({ step }: { step: SynthesisStep }) {
  const { insight, survivalTip, formula, trap } = step.data;

  return (
    <div className="flex flex-col gap-4 px-2 w-full max-w-md mx-auto">
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Síntese — o que ficar na cabeça
        </span>
      </div>

      {insight && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)]/20 to-transparent border border-[var(--color-primary)]/10">
          <p className="font-display text-sm font-bold leading-snug text-[var(--color-text-primary)] text-center">
            {insight}
          </p>
        </div>
      )}

      {formula && (
        <div className="flex flex-col gap-2 items-center">
          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
            Fórmula
          </span>
          <FormulaLine formula={formula} />
        </div>
      )}

      {trap && (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2.5 rounded-xl border border-red-500/10 bg-red-500/5">
            <span className="font-black text-red-500 uppercase">❌ Evite</span>
            <p className="font-bold text-[var(--color-text-secondary)] italic mt-1 line-clamp-2">
              &ldquo;{trap.wrong}&rdquo;
            </p>
            {trap.wrongPortuguese && (
              <p className="text-[9px] italic text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                {trap.wrongPortuguese}
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
            <span className="font-black text-emerald-500 uppercase">✅ Use</span>
            <p className="font-bold text-[var(--color-text-primary)] mt-1 line-clamp-2">
              &ldquo;{trap.right}&rdquo;
            </p>
            {trap.rightPortuguese && (
              <p className="text-[9px] italic text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                {trap.rightPortuguese}
              </p>
            )}
          </div>
        </div>
      )}

      {survivalTip && (
        <div className="p-3 rounded-xl bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/10 flex items-start gap-2">
          <span className="text-sm shrink-0">🛡️</span>
          <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-relaxed">
            {survivalTip}
          </p>
        </div>
      )}
    </div>
  );
}

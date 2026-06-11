'use client';

import type { CuidadoStep } from '@/lib/grammarBridgeSteps';

export function CuidadoStepView({ step }: { step: CuidadoStep }) {
  const { trap, survivalTip } = step.data;
  const trapSubtitle = trap.subtitle ?? 'Evite a tradução direta do português';

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg border border-amber-500/20"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
        >
          ⚠️
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: '#f59e0b' }}>
            Radar de Erro
          </span>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{trapSubtitle}</span>
        </div>
      </div>

      {trap.wrong && trap.right && (
        <div className="grid grid-cols-1 gap-3 w-full">
          <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
              ❌ Como a gente pensa
            </span>
            <p className="text-sm font-bold text-[var(--color-text-secondary)] italic">
              &ldquo;{trap.wrong}&rdquo;
            </p>
            {trap.wrongPortuguese && (
              <p className="text-xs italic text-[var(--color-text-muted)]">
                {trap.wrongPortuguese}
              </p>
            )}
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">
              ✅ Como o nativo fala
            </span>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              &ldquo;{trap.right}&rdquo;
            </p>
            {trap.rightPortuguese && (
              <p className="text-xs italic text-[var(--color-text-muted)]">
                {trap.rightPortuguese}
              </p>
            )}
          </div>
        </div>
      )}

      {trap.explanation && (
        <p className="text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)] text-center">
          {trap.explanation}
        </p>
      )}

      {survivalTip && (
        <div className="w-full p-3 rounded-xl bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/10 flex items-start gap-3">
          <span className="text-base shrink-0">🛡️</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-primary)]">
              Dica de Sobrevivência
            </span>
            <p className="text-sm font-semibold leading-relaxed text-[var(--color-text-primary)]">
              {survivalTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import type { CuidadoStep } from '@/lib/grammarBridgeSteps';

export function CuidadoStepView({ step }: { step: CuidadoStep }) {
  const { trap, survivalTip } = step.data;
  const trapSubtitle = trap.subtitle ?? 'Evite a tradução direta do português';

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-5 px-1 w-full max-w-lg mx-auto">
      <div className="flex items-center gap-3 w-full">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg border border-amber-500/20"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
        >
          ⚠️
        </div>
        <div className="flex flex-col min-w-0">
          <span className="grammar-step-label" style={{ color: '#f59e0b' }}>
            Radar de Erro
          </span>
          <span className="grammar-secondary text-text-muted">{trapSubtitle}</span>
        </div>
      </div>

      {trap.wrong && trap.right && (
        <div className="grid grid-cols-1 gap-3 w-full">
          <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/5 flex flex-col gap-1.5">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
              ❌ Como a gente pensa
            </span>
            <p className="grammar-body font-bold text-text-secondary">
              &ldquo;{trap.wrong}&rdquo;
            </p>
            {trap.wrongPortuguese && (
              <p className="grammar-secondary text-text-muted">{trap.wrongPortuguese}</p>
            )}
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 flex flex-col gap-1.5">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">
              ✅ Como o nativo fala
            </span>
            <p className="grammar-body font-bold text-text-primary">
              &ldquo;{trap.right}&rdquo;
            </p>
            {trap.rightPortuguese && (
              <p className="grammar-secondary text-text-muted">{trap.rightPortuguese}</p>
            )}
          </div>
        </div>
      )}

      {trap.explanation && (
        <div className="w-full p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 flex items-start gap-3">
          <span className="text-base shrink-0">💡</span>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="grammar-step-label" style={{ color: '#f59e0b' }}>
              Por quê?
            </span>
            <p className="grammar-secondary font-medium text-text-primary leading-relaxed text-left">
              {trap.explanation}
            </p>
          </div>
        </div>
      )}

      {survivalTip && (
        <div className="w-full p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
          <span className="text-base shrink-0">🛡️</span>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="grammar-step-label text-primary">Dica de Sobrevivência</span>
            <p className="grammar-body font-semibold text-text-primary">{survivalTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

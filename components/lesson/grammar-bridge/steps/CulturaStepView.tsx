'use client';

import type { CulturaStep } from '@/lib/grammarBridgeSteps';

export function CulturaStepView({ step }: { step: CulturaStep }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 text-center max-w-md mx-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-success-light)]/30 text-2xl">
        🌍
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-success)]">
        Toque Cultural
      </span>
      <p className="text-sm font-semibold leading-relaxed text-[var(--color-text-primary)]">
        {step.data.culturalNote}
      </p>
    </div>
  );
}

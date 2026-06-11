'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import type { IdiomaticStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

export function IdiomaticStepView({
  step,
  language,
}: {
  step: IdiomaticStep;
  language: SupportedLanguage;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Expressões Fixas — {step.data.infinitive}
      </span>
      <div className="flex flex-col gap-2 w-full">
        {step.data.expressions.map((expr, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-[var(--color-surface)] border border-[var(--color-border)]/60"
          >
            <div className="flex flex-col gap-0.5 min-w-0 text-left">
              <p className="text-sm font-bold italic text-[var(--color-text-primary)]">{expr.target}</p>
              <p className="text-xs text-[var(--color-text-muted)] italic">{expr.portuguese}</p>
            </div>
            <AudioPlayerButton text={expr.target} language={language} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

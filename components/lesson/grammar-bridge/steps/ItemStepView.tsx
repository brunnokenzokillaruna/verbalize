'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { LanguageFlag } from '@/components/LanguageFlag';
import type { ItemStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

export function ItemStepView({
  step,
  language,
}: {
  step: ItemStep;
  language: SupportedLanguage;
}) {
  const { target, portuguese, logic, index, total } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Expressão {index} de {total}
      </span>
      <div className="w-full flex flex-col overflow-hidden rounded-2xl bg-[var(--color-surface-raised)]/20 border border-[var(--color-border)]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 text-[10px] font-black tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-light)]/30 px-1.5 py-0.5 rounded uppercase">
            <LanguageFlag language={language} size="xs" />
            </span>
            <p className="font-display text-base font-bold tracking-tight text-[var(--color-text-primary)]">
              {target}
            </p>
          </div>
          <AudioPlayerButton text={target} language={language} size="sm" />
        </div>
        <div className="flex items-center gap-4 px-5 py-3 bg-[var(--color-surface-raised)]/40 border-t border-[var(--color-border)]/50">
          <span className="shrink-0 text-[10px] font-black tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-1.5 py-0.5 rounded uppercase">
            PT
          </span>
          <p className="text-sm italic text-[var(--color-text-secondary)]">{portuguese}</p>
        </div>
        {logic && (
          <p className="px-5 py-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]/50">
            {logic}
          </p>
        )}
      </div>
    </div>
  );
}

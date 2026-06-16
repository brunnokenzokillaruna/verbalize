'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { GrammarFlagAvatar } from '../shared';
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
    <div className="flex flex-col items-center justify-center gap-4 px-1 w-full max-w-lg mx-auto">
      <span className="grammar-step-label">
        Expressão {index} de {total}
      </span>
      <div className="w-full flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised/20">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <GrammarFlagAvatar variant="target" language={language} className="h-8 w-8" />
            <p className="grammar-body font-bold text-text-primary truncate">{target}</p>
          </div>
          <AudioPlayerButton text={target} language={language} size="sm" />
        </div>
        <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5 bg-surface-raised/40 border-t border-border/50">
          <GrammarFlagAvatar variant="pt-br" className="h-8 w-8 shrink-0" />
          <p className="grammar-secondary flex-1">{portuguese}</p>
        </div>
        {logic && (
          <p className="grammar-secondary px-4 py-3 sm:px-5 border-t border-border/50 text-text-muted">
            {logic}
          </p>
        )}
      </div>
    </div>
  );
}

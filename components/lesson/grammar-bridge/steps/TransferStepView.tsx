'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { TargetPhrase } from '../shared';
import { LanguageFlag } from '@/components/LanguageFlag';
import type { TransferStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface TransferStepViewProps {
  step: TransferStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function TransferStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: TransferStepViewProps) {
  const { target, portuguese } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Generalize
        </span>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto">
          A mesma regra vale com outras palavras — veja como soa na prática:
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-end gap-2.5 self-start max-w-[90%]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-sm shrink-0 overflow-hidden">
            <LanguageFlag language={language} size="sm" className="h-full w-full rounded-none object-cover" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-[var(--color-primary-light)]/20 px-4 py-3 border border-[var(--color-primary)]/10 shadow-sm min-w-0">
            <TargetPhrase
              text={target}
              language={language}
              newVocabulary={newVocabulary}
              newVerbs={newVerbs}
              onWordClick={onWordClick}
              className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed"
            />
            <AudioPlayerButton text={target} language={language} size="sm" />
          </div>
        </div>
        <div className="flex items-end gap-2.5 self-end max-w-[90%]">
          <div className="rounded-2xl rounded-br-none bg-[var(--color-surface)] px-4 py-3 border border-[var(--color-border)]/80 shadow-sm">
            <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">{portuguese}</p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] shrink-0">
            PT
          </div>
        </div>
      </div>
    </div>
  );
}

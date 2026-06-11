'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { TargetPhrase } from '../shared';
import type { DialogueStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface DialogueStepViewProps {
  step: DialogueStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function DialogueStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: DialogueStepViewProps) {
  const { target, portuguese } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto text-center">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Frase Real do Diálogo
        </span>
        <p className="text-[10px] text-[var(--color-text-muted)] italic">
          Do diálogo que você acabou de ouvir
        </p>
      </div>
      <div className="w-full rounded-2xl bg-[var(--color-surface-raised)]/20 p-5 border border-[var(--color-border)]/80 shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <TargetPhrase
            text={`"${target}"`}
            language={language}
            newVocabulary={newVocabulary}
            newVerbs={newVerbs}
            onWordClick={onWordClick}
            className="text-lg font-bold italic tracking-tight text-[var(--color-text-primary)] leading-relaxed"
          />
          <p className="text-sm font-medium italic text-[var(--color-text-muted)]">{portuguese}</p>
          <AudioPlayerButton text={target} language={language} size="sm" />
        </div>
      </div>
    </div>
  );
}

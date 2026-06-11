'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { HighlightedText, stripHighlights, TargetPhrase } from '../shared';
import type { PatternStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface PatternStepViewProps {
  step: PatternStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

export function PatternStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: PatternStepViewProps) {
  const { label, target, portuguese } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Padrão de Uso — {label}
      </span>
      <div className="w-full p-5 rounded-2xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/60 flex flex-col gap-3 items-center text-center">
        <AudioPlayerButton text={stripHighlights(target)} language={language} size="sm" />
        <TargetPhrase
          text={target}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          className="text-lg font-black text-[var(--color-text-primary)]"
          highlightClassName="bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded"
        />
        <p className="text-sm italic text-[var(--color-text-secondary)]">
          <HighlightedText
            text={portuguese}
            className="text-[var(--color-text-primary)] font-bold not-italic"
          />
        </p>
      </div>
    </div>
  );
}

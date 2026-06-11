'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { HighlightedText, stripHighlights, TargetPhrase } from '../shared';
import type { CompareStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../../ClickableWord';

interface CompareStepViewProps {
  step: CompareStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}

function CompareSide({
  side,
  language,
  newVocabulary,
  newVerbs,
  onWordClick,
}: {
  side: { label: string; target: string; portuguese: string };
  language: SupportedLanguage;
  newVocabulary: string[];
  newVerbs: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/60 flex-1 min-w-0">
      <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider text-center">
        {side.label}
      </span>
      <div className="flex justify-center">
        <AudioPlayerButton text={stripHighlights(side.target)} language={language} size="sm" />
      </div>
      <TargetPhrase
        text={side.target}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className="text-sm font-black text-[var(--color-text-primary)] text-center leading-snug"
        highlightClassName="bg-[var(--color-primary)] text-white px-1 py-0.5 rounded font-bold"
      />
      <p className="text-[11px] italic text-[var(--color-text-secondary)] text-center">
        <HighlightedText
          text={side.portuguese}
          className="text-[var(--color-text-primary)] font-bold not-italic"
        />
      </p>
    </div>
  );
}

export function CompareStepView({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: CompareStepViewProps) {
  const { left, right, changeHint } = step.data;

  return (
    <div className="flex flex-col gap-3 px-1 w-full max-w-lg mx-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] text-center">
        Compare os padrões
      </span>
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <CompareSide
          side={left}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
        <CompareSide
          side={right}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      </div>
      {changeHint && (
        <p className="text-[11px] text-center text-[var(--color-text-secondary)] font-medium px-2">
          <span className="text-[var(--color-primary)] font-bold">O que muda: </span>
          {changeHint}
        </p>
      )}
    </div>
  );
}

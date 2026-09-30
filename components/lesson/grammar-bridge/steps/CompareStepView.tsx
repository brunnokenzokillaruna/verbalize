'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { ClickableSentence } from '../../ClickableSentence';
import { HighlightedText, normalizeHighlightMarkers, stripHighlights, TargetPhrase } from '../shared';
import { useGrammarReveal } from '../reveal';
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

function SpotSentence({
  text,
  language,
  newVocabulary,
  newVerbs,
  onWordClick,
  onSpot,
}: {
  text: string;
  language: SupportedLanguage;
  newVocabulary: string[];
  newVerbs: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  onSpot: () => void;
}) {
  const normalized = normalizeHighlightMarkers(text);
  if (!normalized.includes('^^')) {
    return (
      <TargetPhrase
        text={text}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className="text-sm sm:text-base font-black text-text-primary text-center leading-snug"
        highlightClassName="bg-[var(--color-primary)] text-white px-1 py-0.5 rounded font-bold"
      />
    );
  }

  const parts = normalized.split(/\^\^/g);
  return (
    <div className="text-sm sm:text-base font-black text-text-primary text-center leading-snug">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <button
            key={index}
            type="button"
            onClick={onSpot}
            className="rounded bg-[var(--color-primary)] px-1 py-0.5 font-bold text-white"
            aria-label="É aqui que muda"
          >
            {part}
          </button>
        ) : (
          <ClickableSentence
            key={index}
            as="span"
            text={part}
            newVocabulary={newVocabulary}
            newVerbs={newVerbs}
            onWordClick={onWordClick}
            className="inline"
          />
        ),
      )}
    </div>
  );
}

function CompareSide({
  side,
  language,
  newVocabulary,
  newVerbs,
  onWordClick,
  onSpot,
}: {
  side: { label: string; target: string; portuguese: string };
  language: SupportedLanguage;
  newVocabulary: string[];
  newVerbs: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  onSpot: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--color-surface-raised)]/30 border border-[var(--color-border)]/60 flex-1 min-w-0">
      <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider text-center">
        {side.label}
      </span>
      <div className="flex justify-center">
        <AudioPlayerButton text={stripHighlights(side.target)} language={language} size="sm" />
      </div>
      <SpotSentence
        text={side.target}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        onSpot={onSpot}
      />
      <p className="grammar-secondary text-center">
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
  const { isOpen, open } = useGrammarReveal(`${step.id}-hint`);
  const hasMark = left.target.includes('^^') || right.target.includes('^^');

  return (
    <div className="flex flex-col gap-3 px-1 w-full max-w-lg mx-auto">
      <span className="grammar-step-label text-center block">Compare os padrões</span>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <CompareSide
          side={left}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          onSpot={open}
        />
        <CompareSide
          side={right}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          onSpot={open}
        />
      </div>
      {!isOpen && hasMark && (
        <p className="text-[11px] text-center text-text-muted font-medium">Toque na palavra destacada</p>
      )}
      {!isOpen && !hasMark && changeHint && (
        <button
          type="button"
          onClick={open}
          className="self-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary min-h-[44px]"
        >
          O que muda?
        </button>
      )}
      {isOpen && changeHint && (
        <p className="text-[11px] text-center text-[var(--color-text-secondary)] font-medium px-2 motion-safe:animate-slide-up-spring">
          <span className="text-[var(--color-primary)] font-bold">O que muda: </span>
          {changeHint}
        </p>
      )}
    </div>
  );
}

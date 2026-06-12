'use client';

import { useState } from 'react';
import { AudioPlayerButton } from '../AudioPlayerButton';
import { ClickableSentence } from '../ClickableSentence';
import type { WordClickPayload } from '../ClickableWord';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';

export const LANG_LABEL: Record<SupportedLanguage, string> = {
  fr: 'FR',
  en: 'EN',
};

export function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '');
}

export function HighlightedText({ text, className }: { text: string; className: string }) {
  const parts = text.split(/\^\^/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function TargetPhrase({
  text,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  className = '',
  highlightClassName,
}: {
  text: string;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  className?: string;
  highlightClassName?: string;
}) {
  const clean = stripHighlights(text);
  const hasHighlights = text.includes('^^');

  if (onWordClick) {
    return (
      <ClickableSentence
        text={clean}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className={className}
      />
    );
  }

  if (hasHighlights && highlightClassName) {
    return (
      <p className={className}>
        <HighlightedText text={text} className={highlightClassName} />
      </p>
    );
  }

  return <p className={className}>{clean}</p>;
}

export function FormulaLine({ formula }: { formula: string }) {
  const parts = formula.split(/\s*\+\s*/);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {parts.map((part, i) => {
        const trimmedPart = part.trim();
        const isVar = trimmedPart.startsWith('[') && trimmedPart.endsWith(']');
        const cleanPart = isVar ? trimmedPart.slice(1, -1) : trimmedPart;

        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                isVar
                  ? 'bg-[var(--color-primary-light)]/20 text-[var(--color-primary-dark)] border border-[var(--color-primary)]/15'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              {cleanPart}
            </span>
            {i < parts.length - 1 && (
              <span className="text-[var(--color-text-muted)] font-black text-xs px-0.5">+</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseFormulaBranches(formula: string): Array<{ label?: string; formula: string }> {
  const branches = formula.split(/\s+(?:ou|\|)\s+/i).map((b) => b.trim()).filter(Boolean);
  if (branches.length <= 1) return [{ formula: formula.trim() }];
  return branches.map((b, i) => ({
    label: `Opção ${String.fromCharCode(65 + i)}`,
    formula: b,
  }));
}

type FormulaBranch = {
  label?: string;
  formula: string;
  example?: { target: string; portuguese: string };
};

export function FormulaExampleCard({
  example,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: {
  example: { target: string; portuguese: string };
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  const cleanTarget = stripHighlights(example.target);

  return (
    <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-raised)]/25 border border-[var(--color-border)]/60 p-4 flex flex-col gap-2.5 items-center text-center">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        Exemplo na prática
      </span>
      <AudioPlayerButton text={cleanTarget} language={language} size="sm" />
      <TargetPhrase
        text={cleanTarget}
        language={language}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className="text-base font-bold text-[var(--color-text-primary)] leading-relaxed"
        highlightClassName="bg-[var(--color-primary)] text-white px-1 py-0.5 rounded"
      />
      <p className="text-sm italic text-[var(--color-text-secondary)]">
        <HighlightedText
          text={example.portuguese}
          className="text-[var(--color-text-primary)] font-semibold not-italic"
        />
      </p>
    </div>
  );
}

export function FormulaRenderer({
  structureFormula,
  structureFormulas,
  formulaExample,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
}: {
  structureFormula?: string | null;
  structureFormulas?: Array<{
    label: string;
    formula: string;
    example?: { target: string; portuguese: string };
  }> | null;
  formulaExample?: { target: string; portuguese: string } | null;
  language?: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  const branches: FormulaBranch[] =
    structureFormulas && structureFormulas.length > 0
      ? structureFormulas
      : structureFormula
        ? parseFormulaBranches(structureFormula).map((branch) => ({
            ...branch,
            example: formulaExample ?? undefined,
          }))
        : [];

  if (branches.length === 0) return null;

  const showExamples = Boolean(language);

  return (
    <div className="flex flex-col gap-5 items-center w-full">
      {branches.map((branch, i) => (
        <div key={i} className="flex flex-col gap-3 items-center w-full">
          {branch.label && branches.length > 1 && (
            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wide">
              {branch.label}
            </span>
          )}
          <FormulaLine formula={branch.formula} />
          {showExamples && branch.example && (
            <FormulaExampleCard
              example={branch.example}
              language={language!}
              newVocabulary={newVocabulary}
              newVerbs={newVerbs}
              onWordClick={onWordClick}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function RetentionCheckCard({
  check,
  onAnswered,
  onPlaySound,
  feedback,
}: {
  check: NonNullable<GrammarBridgeResult['retentionCheck']>;
  onAnswered?: (correct: boolean) => void;
  onPlaySound?: (type: 'correct' | 'incorrect') => void;
  feedback?: { survivalTip?: string; trapExplanation?: string };
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    setSelected(i);
    const correct = i === check.correctIndex;
    onAnswered?.(correct);
    onPlaySound?.(correct ? 'correct' : 'incorrect');
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm font-semibold text-center text-[var(--color-text-primary)]">
        {check.question}
      </p>
      <div className="flex flex-col gap-2">
        {check.options.map((opt, i) => {
          const isCorrect = i === check.correctIndex;
          const showResult = selected !== null;
          const wasPicked = selected === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={[
                'rounded-xl px-4 py-3 text-left text-sm font-medium border transition-colors',
                showResult && isCorrect
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-[var(--color-text-primary)]'
                  : showResult && wasPicked && !isCorrect
                    ? 'border-red-500/30 bg-red-500/5 text-[var(--color-text-secondary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30',
              ].join(' ')}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className="text-xs text-center text-[var(--color-text-muted)]">
          {selected === check.correctIndex ? (
            <>Isso mesmo! Use isso na próxima conversa real — soa natural para o nativo.</>
          ) : (
            <>
              Quase!{' '}
              {feedback?.survivalTip ??
                feedback?.trapExplanation ??
                'Releia a síntese ou o radar de erro acima.'}
            </>
          )}
        </p>
      )}
    </div>
  );
}

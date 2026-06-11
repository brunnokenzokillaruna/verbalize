'use client';

import { useState } from 'react';
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

export function FormulaRenderer({
  structureFormula,
  structureFormulas,
}: {
  structureFormula?: string | null;
  structureFormulas?: Array<{ label: string; formula: string }> | null;
}) {
  const branches =
    structureFormulas && structureFormulas.length > 0
      ? structureFormulas
      : structureFormula
        ? parseFormulaBranches(structureFormula)
        : [];

  if (branches.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 items-center">
      {branches.map((branch, i) => (
        <div key={i} className="flex flex-col gap-2 items-center w-full">
          {branch.label && branches.length > 1 && (
            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wide">
              {branch.label}
            </span>
          )}
          <FormulaLine formula={branch.formula} />
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
  onAnswered?: (answered: boolean) => void;
  onPlaySound?: (type: 'correct' | 'incorrect') => void;
  feedback?: { survivalTip?: string; trapExplanation?: string };
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    setSelected(i);
    const correct = i === check.correctIndex;
    onAnswered?.(true);
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

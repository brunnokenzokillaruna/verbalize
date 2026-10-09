'use client';

import { useEffect, useState } from 'react';
import { AudioPlayerButton } from '../AudioPlayerButton';
import { ClickableSentence } from '../ClickableSentence';
import { ClickableWord } from '../ClickableWord';
import { BrazilFlag, LanguageFlag } from '@/components/LanguageFlag';
import type { WordClickPayload } from '../ClickableWord';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import {
  chipLabel,
  colorizeExample,
  formulaParts,
  matchChipInExample,
  segmentExample,
  slotRole,
  type SlotRole,
} from '@/lib/grammarBridge/formulaSlots';

const SLOT_TEXT: Record<SlotRole, string> = {
  subject: 'rounded px-1 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]',
  verb: 'rounded px-1 bg-[var(--color-vocab-bg)] text-[var(--color-vocab)]',
  complement: 'rounded px-1 bg-[var(--color-success-bg)] text-[var(--color-success)]',
};

const SLOT_CLASS: Record<SlotRole, string> = {
  subject:
    'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border border-[var(--color-primary)]/25',
  verb: 'bg-[var(--color-vocab-bg)] text-[var(--color-vocab)] border border-[var(--color-vocab)]/35',
  complement:
    'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30',
};

export function GrammarFlagAvatar({
  variant,
  language,
  className = '',
}: {
  variant: 'target' | 'pt-br';
  language?: SupportedLanguage;
  className?: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border bg-surface shadow-sm ${className}`}
    >
      {variant === 'pt-br' ? (
        <BrazilFlag size="lg" className="h-full w-full rounded-none object-cover" />
      ) : (
        <LanguageFlag
          language={language!}
          size="lg"
          className="h-full w-full rounded-none object-cover"
        />
      )}
    </div>
  );
}

export function stripHighlights(text: string): string {
  return text.replace(/\^\^/g, '');
}

/** Collapses stray spaces around ^^ markers (e.g. "^^Eu^^ , acho" → "^^Eu^^, acho") while preserving spaces outside markers. */
export function normalizeHighlightMarkers(text: string): string {
  if (!text) return '';
  return text
    .replace(/\^\^([^\^]+?)\^\^[\s\u00a0]+([,.!?;:])/g, (_, inner, punc) => `^^${inner}^^${punc}`)
    .replace(/\^\^([^\^]+?)\^\^/g, (_, inner) => `^^${inner.trim()}^^`);
}

export function HighlightedText({ text, className }: { text: string; className: string }) {
  const parts = normalizeHighlightMarkers(text).split(/\^\^/g);
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
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  className = '',
  highlightClassName,
  emphasis,
}: {
  text: string;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  className?: string;
  highlightClassName?: string;
  emphasis?: string | null;
}) {
  const clean = stripHighlights(text);
  const hasHighlights = text.includes('^^');
  const emphasisIndex = emphasis ? clean.toLowerCase().indexOf(emphasis.toLowerCase()) : -1;
  const emphasisRange =
    emphasis && emphasisIndex >= 0
      ? { start: emphasisIndex, end: emphasisIndex + emphasis.length }
      : null;

  if (onWordClick) {
    return (
      <ClickableSentence
        text={clean}
        newVocabulary={newVocabulary}
        newVerbs={newVerbs}
        onWordClick={onWordClick}
        className={className}
        emphasisRange={emphasisRange}
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

export function FormulaLine({
  formula,
  activeIndex = null,
  onSelect,
}: {
  formula: string;
  activeIndex?: number | null;
  onSelect?: (index: number) => void;
}) {
  const parts = formulaParts(formula);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {parts.map((part, i) => {
        const role = slotRole(i, parts.length);
        const selected = activeIndex === i;
        const className = [
          'px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm',
          SLOT_CLASS[role],
          selected ? 'ring-2 ring-offset-1 ring-[var(--color-primary)]' : '',
        ].join(' ');
        const label = chipLabel(part);

        return (
          <div key={i} className="flex items-center gap-2">
            {onSelect ? (
              <button type="button" onClick={() => onSelect(i)} className={className} aria-pressed={selected}>
                {label}
              </button>
            ) : (
              <span className={className}>{label}</span>
            )}
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
  hint?: string;
  example?: { target: string; portuguese: string };
};

function ColoredExample({
  chunks,
  onWordClick,
}: {
  chunks: ReturnType<typeof colorizeExample>;
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  if (!chunks) return null;

  return (
    <p className="text-base font-bold leading-relaxed text-[var(--color-text-primary)]">
      {chunks.map((chunk, index) => (
        <span key={index}>
          {index > 0 ? ' ' : null}
          <span className={SLOT_TEXT[chunk.role]}>
            {chunk.text.split(/(\s+)/).map((token, tokenIndex) =>
              token.trim() ? (
                <ClickableWord key={tokenIndex} word={token} onWordClick={onWordClick} />
              ) : (
                token
              ),
            )}
          </span>
        </span>
      ))}
    </p>
  );
}

export function FormulaExampleCard({
  example,
  formula,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  emphasis,
}: {
  example: { target: string; portuguese: string };
  formula?: string;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  emphasis?: string | null;
}) {
  const cleanTarget = stripHighlights(example.target);
  const chunks = formula ? colorizeExample(formula, cleanTarget) : null;

  return (
    <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-raised)]/25 border border-[var(--color-border)]/60 p-4 flex flex-col gap-2.5 items-center text-center">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        Exemplo na prática
      </span>
      <AudioPlayerButton text={cleanTarget} language={language} size="sm" />
      {chunks ? (
        <ColoredExample chunks={chunks} onWordClick={onWordClick} />
      ) : (
        <TargetPhrase
          text={cleanTarget}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          emphasis={emphasis}
          className="text-base font-bold text-[var(--color-text-primary)] leading-relaxed"
          highlightClassName="bg-[var(--color-primary)] text-white px-1 py-0.5 rounded"
        />
      )}
      <p className="text-sm italic text-[var(--color-text-secondary)]">
        <HighlightedText
          text={example.portuguese}
          className="text-[var(--color-text-primary)] font-semibold not-italic"
        />
      </p>
    </div>
  );
}

function shuffleChips<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function FormulaBuild({ formula, portuguese }: { formula: string; portuguese: string }) {
  const parts = formulaParts(formula);
  const [order, setOrder] = useState<number[] | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'ok' | 'retry'>('idle');

  useEffect(() => {
    const nextParts = formulaParts(formula);
    setOrder(shuffleChips(nextParts.map((_, index) => index)));
    setPicked([]);
    setStatus('idle');
  }, [formula]);

  if (!order) return null;

  const tap = (originalIndex: number) => {
    if (status === 'ok' || picked.includes(originalIndex)) return;
    const next = [...picked, originalIndex];
    if (originalIndex !== next.length - 1) {
      setPicked([]);
      setStatus('retry');
      return;
    }
    setPicked(next);
    setStatus(next.length === parts.length ? 'ok' : 'idle');
  };

  const remaining = order.filter((index) => !picked.includes(index));

  return (
    <div className="w-full max-w-md flex flex-col gap-3 items-center">
      <span className="grammar-step-label">Monte a fórmula</span>
      <p className="text-sm text-center text-text-secondary">{portuguese}</p>
      <div className="flex flex-wrap justify-center gap-2 min-h-[44px]">
        {picked.map((index) => (
          <span key={index} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${SLOT_CLASS[slotRole(index, parts.length)]}`}>
            {chipLabel(parts[index])}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => tap(index)}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold min-h-[44px] ${SLOT_CLASS[slotRole(index, parts.length)]}`}
          >
            {chipLabel(parts[index])}
          </button>
        ))}
      </div>
      {status === 'ok' && (
        <p className="text-sm font-semibold text-[var(--color-success)] text-center">Nessa ordem.</p>
      )}
      {status === 'retry' && (
        <p className="text-sm font-medium text-text-secondary text-center">
          A ordem é a da fórmula. Tenta de novo.
        </p>
      )}
    </div>
  );
}

function FormulaBranchBlock({
  branch,
  showLabel,
  language,
  newVocabulary,
  newVerbs,
  onWordClick,
}: {
  branch: FormulaBranch;
  showLabel: boolean;
  language?: SupportedLanguage;
  newVocabulary: string[];
  newVerbs: string[];
  onWordClick?: (payload: WordClickPayload) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const parts = formulaParts(branch.formula);
  const exampleTarget = branch.example?.target ?? '';
  const emphasis =
    activeIndex !== null && exampleTarget
      ? matchChipInExample(parts[activeIndex] ?? '', exampleTarget)
      : null;
  const canBuild = Boolean(branch.example && segmentExample(branch.formula, exampleTarget));

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      {((showLabel && branch.label) || branch.hint) && (
        <div className="flex flex-col gap-1 items-center">
          {showLabel && branch.label && (
            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wide text-center">
              {branch.label}
            </span>
          )}
          {branch.hint && (
            <p className="text-xs text-[var(--color-text-muted)] text-center max-w-sm leading-relaxed">
              {branch.hint}
            </p>
          )}
        </div>
      )}
      <FormulaLine
        formula={branch.formula}
        activeIndex={activeIndex}
        onSelect={(index) => setActiveIndex((current) => (current === index ? null : index))}
      />
      {language && branch.example && (
          <FormulaExampleCard
            example={branch.example}
            formula={branch.formula}
            language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
          emphasis={emphasis}
        />
      )}
      {canBuild && branch.example && (
        <FormulaBuild formula={branch.formula} portuguese={branch.example.portuguese} />
      )}
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
    hint?: string;
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

  return (
    <div className="flex flex-col gap-5 items-center w-full">
      {branches.map((branch, i) => (
        <FormulaBranchBlock
          key={i}
          branch={branch}
          showLabel={branches.length > 1}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
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
      <p className="grammar-body font-semibold text-center text-text-primary">
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

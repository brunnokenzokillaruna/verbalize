'use client';

import type { GrammarCorrection } from '@/features/roleplay-chat/types';

export function GrammarHint({
  grammar,
  loading,
}: {
  grammar?: GrammarCorrection | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="mt-1.5 text-[11px] text-text-muted animate-pulse">
        Analisando gramática…
      </p>
    );
  }

  if (!grammar) return null;

  return (
    <div
      className="mt-2 rounded-xl px-2.5 py-2 text-left"
      style={{
        backgroundColor: grammar.hasIssues
          ? 'color-mix(in srgb, var(--color-warning, #eab308) 12%, transparent)'
          : 'color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)',
        border: '1px solid var(--color-border)',
      }}
    >
      {grammar.issueTags && grammar.issueTags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {grammar.issueTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-raised)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {grammar.hasIssues && grammar.correctedSentence && (
        <p className="text-xs font-semibold text-text-primary leading-snug">
          <span className="text-text-muted font-medium">Melhor: </span>
          <span style={{ color: 'var(--color-primary)' }}>{grammar.correctedSentence}</span>
        </p>
      )}
      <p className="mt-0.5 text-[11px] text-text-secondary leading-snug">{grammar.feedbackPt}</p>
    </div>
  );
}

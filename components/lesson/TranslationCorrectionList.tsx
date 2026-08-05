import React from 'react';
import type { TranslationCorrection } from '@/lib/reverseTranslationCorrections';

interface TranslationCorrectionListProps {
  corrections: TranslationCorrection[];
}

/**
 * One row per difference between the learner's sentence and the correction, so
 * no mistake is left unmentioned — including the ones the prose analysis skips.
 */
export function TranslationCorrectionList({ corrections }: TranslationCorrectionListProps) {
  if (corrections.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2.5">
      {corrections.map((correction, index) => (
        <li key={`${correction.learner}-${correction.correct}-${index}`} className="flex flex-col gap-0.5">
          <p className="text-sm leading-relaxed">
            {correction.learner ? (
              <span className="font-semibold text-[var(--color-error)] line-through decoration-[var(--color-error)]/50">
                {correction.learner}
              </span>
            ) : (
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                faltou
              </span>
            )}
            <span className="mx-1.5 text-[var(--color-text-muted)]" aria-hidden>
              →
            </span>
            {correction.correct ? (
              <span className="font-bold text-[var(--color-text-primary)]">
                {correction.correct}
              </span>
            ) : (
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                remova
              </span>
            )}
          </p>
          {correction.why && (
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {correction.why}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

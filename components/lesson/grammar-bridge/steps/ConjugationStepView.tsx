'use client';

import { AudioPlayerButton } from '../../AudioPlayerButton';
import { getConjugationAudioText } from '@/utils/conjugationHelper';
import type { ConjugationStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';

export function ConjugationStepView({
  step,
  language,
}: {
  step: ConjugationStep;
  language: SupportedLanguage;
}) {
  const { infinitive, forms, partLabel } = step.data;

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 w-full max-w-md mx-auto">
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Conjugação — Presente
        </span>
        {partLabel && (
          <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase mt-1">
            {partLabel}
          </p>
        )}
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{infinitive}</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-2">
        {forms.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]"
          >
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase w-10 shrink-0 truncate">
              {c.pronoun}
            </span>
            <span className="flex-1 font-display text-xs font-bold text-[var(--color-primary-dark)] truncate">
              {c.form}
            </span>
            <AudioPlayerButton
              text={getConjugationAudioText(c.pronoun, c.form, language)}
              language={language}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
